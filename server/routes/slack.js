import express from 'express';
import * as slackController from '../controllers/slackController.js';
import * as slackTestController from '../controllers/slackTestController.js';

const router = express.Router();

// OAuth routes
router.post('/oauth', slackController.handleOAuth);
router.post('/disconnect', slackController.disconnect);
router.post('/test-oauth', slackTestController.testOAuth);
router.get('/oauth-url', slackController.getOAuthUrl);

// Messaging routes
router.post('/send-message', slackController.sendImmediateMessage);
router.post('/schedule-message', slackController.scheduleMessage);
router.post('/cancel-message', slackController.cancelMessage);

// Channel routes
router.get('/channels', slackController.getChannels);

// Direct OAuth URL endpoint - for client-side generation
router.get('/oauth-url', (req, res) => {
  try {
    // Get the client ID from environment variables
    const clientId = process.env.SLACK_CLIENT_ID;
    
    // Get the redirect URI - prefer ngrok URL if available
    let redirectUri = process.env.NGROK_URL 
      ? `${process.env.NGROK_URL}/oauth/callback`
      : process.env.SLACK_REDIRECT_URI || 'https://localhost:3443/oauth/callback';
    
    console.log('Generating OAuth URL with:', { clientId: clientId ? 'present' : 'missing', redirectUri });
    
    // Use the client ID or provide a meaningful error
    if (!clientId) {
      return res.status(500).json({
        status: 'error',
        message: 'Missing Slack client ID in server configuration'
      });
    }
    
    // Bot scopes - actions the app can perform
    const scope = 'channels:read,channels:history,groups:read,groups:history,chat:write,reactions:read,mpim:history,im:history,users:read,users:read.email,users.profile:read';
    
    // User scopes - actions on behalf of the user
    const userScope = 'users:read,users:read.email,users.profile:read';
    
    // Encode the redirect URI
    const encodedRedirectUri = encodeURIComponent(redirectUri);
    
    // Generate the URL with a timestamp as state parameter for security
    const timestamp = Date.now();
    const url = `https://slack.com/oauth/v2/authorize?client_id=${clientId}&redirect_uri=${encodedRedirectUri}&scope=${scope}&user_scope=${userScope}&state=${timestamp}`;
    
    console.log(`Generated OAuth URL with redirect to: ${redirectUri}`);
    
    return res.status(200).json({
      status: 'success',
      url: url
    });
  } catch (error) {
    console.error('Error generating OAuth URL:', error);
    return res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
});

export default router;
