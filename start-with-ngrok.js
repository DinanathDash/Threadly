import { spawn, execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import readline from 'readline';

// Load environment variables
dotenv.config();

// Get __dirname equivalent in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define server port
const PORT = process.env.PORT || 3001;

// Path to .env file
const envPath = path.join(__dirname, '.env');

// Function to update .env file
function updateEnvFile(publicUrl) {
  try {
    // Read current .env file
    const envContent = fs.readFileSync(envPath, 'utf8');
    
    // Create new lines for ngrok URL
    const ngrokEnvVars = [
      `# ngrok public URL (updated ${new Date().toISOString()})`,
      `NGROK_URL=${publicUrl}`,
      `VITE_SLACK_REDIRECT_URI=${publicUrl}/oauth/callback`,
    ].join('\n');
    
    // Check if NGROK_URL already exists in the file
    if (envContent.includes('NGROK_URL=')) {
      // Replace existing NGROK_URL and VITE_SLACK_REDIRECT_URI
      const updatedContent = envContent
        .replace(/NGROK_URL=.*/g, `NGROK_URL=${publicUrl}`)
        .replace(/VITE_SLACK_REDIRECT_URI=.*/g, `VITE_SLACK_REDIRECT_URI=${publicUrl}/oauth/callback`);
      
      fs.writeFileSync(envPath, updatedContent, 'utf8');
    } else {
      // Append ngrok URL to the end of the file
      fs.writeFileSync(envPath, `${envContent}\n${ngrokEnvVars}`, 'utf8');
    }
    
    console.log(`\n🔄 Updated .env with ngrok URL: ${publicUrl}`);
    console.log(`🔄 Updated Slack redirect URI to: ${publicUrl}/oauth/callback`);
    
    // Print instructions for Slack OAuth configuration
    console.log('\n📢 IMPORTANT: Update your Slack OAuth settings:');
    console.log('1. Go to https://api.slack.com/apps');
    console.log('2. Select your Slack app');
    console.log('3. Go to "OAuth & Permissions"');
    console.log(`4. Update the Redirect URL to: ${publicUrl}/oauth/callback`);
    console.log('5. Save changes and reinstall the app if needed');
    
    // Print browser URL for testing
    console.log('\n🌐 Test Slack OAuth with this URL:');
    console.log(`${publicUrl}\n`);
  } catch (err) {
    console.error('Error updating .env file:', err);
  }
}

// Check if GOOGLE_APPLICATION_CREDENTIALS path is valid
const googleCredentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
if (!googleCredentialsPath || googleCredentialsPath === 'path/to/service-account-key.json') {
  console.log('⚠️  GOOGLE_APPLICATION_CREDENTIALS not properly configured');
  console.log('📝 Updating .env file with correct service account path...');
  
  // Read current .env file
  const envContent = fs.readFileSync(envPath, 'utf8');
  
  // Service account path
  const serviceAccountPath = path.join(__dirname, 'server', 'config', 'keys', 'service-account.json');
  
  // Replace the placeholder with the actual path
  const updatedContent = envContent.replace(
    /GOOGLE_APPLICATION_CREDENTIALS=.*/g, 
    `GOOGLE_APPLICATION_CREDENTIALS=${serviceAccountPath}`
  );
  
  fs.writeFileSync(envPath, updatedContent, 'utf8');
  console.log(`✅ Updated GOOGLE_APPLICATION_CREDENTIALS in .env to: ${serviceAccountPath}`);
}

// Start the server in a child process
console.log('🚀 Starting server...');
const server = spawn('npm', ['run', 'dev:server'], { stdio: 'inherit' });

// Start ngrok in a separate process
console.log('🚇 Starting ngrok tunnel...');

try {
  // Get public URL from ngrok
  const ngrokOutput = execSync(`ngrok http ${PORT} --log=stdout`, { encoding: 'utf8' });
  console.log(ngrokOutput);
} catch (err) {
  // ngrok command will keep running, so we'll get here immediately
  // That's expected and not an error
  
  // Create readline interface to listen for ngrok URL
  console.log('🔍 Waiting for ngrok tunnel URL...');
  
  // Wait a moment for ngrok to start
  setTimeout(() => {
    try {
      // Get ngrok tunnel URL using the API
      const tunnelInfo = JSON.parse(execSync('curl -s http://localhost:4040/api/tunnels', { encoding: 'utf8' }));
      const publicUrl = tunnelInfo.tunnels.find(t => t.proto === 'https')?.public_url;
      
      if (publicUrl) {
        console.log(`\n✅ ngrok tunnel established at: ${publicUrl}`);
        updateEnvFile(publicUrl);
      } else {
        console.log('❌ Could not find ngrok https URL');
      }
    } catch (tunnelErr) {
      console.error('Error getting ngrok tunnel info:', tunnelErr.message);
      console.log('\n⚠️ Could not automatically detect ngrok URL.');
      console.log('📋 Please check the ngrok web interface at http://localhost:4040');
      console.log('📋 Then manually update your .env file with the ngrok URL.');
    }
  }, 2000);
}

// Graceful shutdown
const cleanup = () => {
  console.log('\n🛑 Shutting down...');
  server.kill();
  process.exit(0);
};

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
