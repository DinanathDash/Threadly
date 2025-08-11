import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import http from 'http';
import https from 'https';
import { fileURLToPath } from 'url';
import logger from './utils/logger.js';

// Import routes
import slackRoutes from './routes/slack.js';
import diagnosticRoutes from './routes/diagnosticRoutes.js';
import tokenRoutes from './routes/tokenRoutes.js';
import channelRoutes from './routes/channelRoutes.js';
import supportRoutes from './routes/supportRoutes.js';

// Import token refresh scheduler for production
import { startTokenRefreshScheduler } from './services/tokenRefreshService.js';
import { initializeScheduler } from './services/slackMessageService.js';

// Configure dotenv
dotenv.config();

// Get __dirname equivalent in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Express app
const app = express();

// Middleware
app.use(cors({
  origin: ['https://threadly.web.app', 'http://localhost:5173', 'https://threadly-32ln.onrender.com'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Define routes
app.use('/api/slack', slackRoutes);
app.use('/api/diagnostic', diagnosticRoutes);
app.use('/api/tokens', tokenRoutes);
app.use('/api/channels', channelRoutes);
app.use('/api/support', supportRoutes);

// OAuth callback route that redirects to the frontend
app.get('/oauth/callback', (req, res) => {
  const { code, error } = req.query;
  const redirectUrl = new URL('/oauth-callback', process.env.FRONTEND_URL);
  
  logger.info('OAuth callback received:');
  logger.info('Code:', code ? `Present (length: ${code.length})` : 'Not present');
  logger.info('Error:', error || 'None');
  logger.info('FRONTEND_URL:', process.env.FRONTEND_URL);
  
  if (code) {
    // Add timestamp to prevent code reuse issues
    redirectUrl.searchParams.append('code', code);
    redirectUrl.searchParams.append('_ts', Date.now());
  }
  if (error) {
    redirectUrl.searchParams.append('error', error);
  }
  
  logger.info('Redirecting to:', redirectUrl.toString());
  
  // Add error handling for the redirect
  try {
    res.redirect(redirectUrl.toString());
  } catch (redirectError) {
    logger.error('Error during redirect:', redirectError);
    res.status(500).send(`Redirect error: ${redirectError.message}. Please contact support.`);
  }
});

// Health check route for SSL verification
app.get('/ssl-verify', (req, res) => {
  res.json({ 
    status: 'ok',
    timestamp: new Date().toISOString(),
    ssl: true,
    message: 'SSL certificate is working properly' 
  });
});

// Serve static files from the React app in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../dist')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist', 'index.html'));
  });
}

// Error handler
app.use((err, req, res, next) => {
  logger.error(err.stack);
  res.status(500).json({
    status: 'error',
    message: err.message || 'Something went wrong on the server',
  });
});

// Start HTTP server
const PORT = process.env.PORT || 3001; // Changed port from 3000 to 3001
const httpServer = http.createServer(app);
httpServer.listen(PORT, () => {
  logger.info(`HTTP Server running on port ${PORT}`);
  
  // Start token refresh scheduler in production
  if (process.env.NODE_ENV === 'production') {
    startTokenRefreshScheduler();
    logger.info('Token refresh scheduler started successfully');
  }
  
  // Initialize the message scheduler to process scheduled messages
  initializeScheduler();
  logger.info('Message scheduler initialized successfully');
});

// Start HTTPS server for local development
if (process.env.NODE_ENV === 'development') {
  try {
    const privateKey = fs.readFileSync(path.join(__dirname, 'cert', 'key.pem'), 'utf8');
    const certificate = fs.readFileSync(path.join(__dirname, 'cert', 'cert.pem'), 'utf8');
    const credentials = { key: privateKey, cert: certificate };
    
    const HTTPS_PORT = process.env.HTTPS_PORT || 3443;
    const httpsServer = https.createServer(credentials, app);
    httpsServer.listen(HTTPS_PORT, () => {
      logger.info(`HTTPS Server running on port ${HTTPS_PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start HTTPS server:', error);
  }
}
