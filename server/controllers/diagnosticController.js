import axios from 'axios';

// Test the OAuth configuration
export const testOAuthConfig = async (req, res, next) => {
  try {
    const { redirectUri } = req.body;
    
    // Log the environment variables (but mask sensitive parts)
    const clientId = process.env.SLACK_CLIENT_ID || 'not-set';
    const clientSecret = process.env.SLACK_CLIENT_SECRET || 'not-set';
    
    console.log(`Testing OAuth configuration with redirect URI: ${redirectUri}`);
    console.log(`Client ID: ${clientId.substring(0, 3)}...${clientId.substring(clientId.length - 3)}`);
    console.log(`Client Secret: ${clientSecret ? `${clientSecret.substring(0, 3)}...` : 'not-set'}`);
    
    // Test the Slack API connection with a simple API call
    const apiTestResponse = await axios.post('https://slack.com/api/api.test', null, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      }
    });
    
    // Return diagnostic information
    res.status(200).json({
      status: 'success',
      config: {
        redirectUri,
        clientIdConfigured: !!process.env.SLACK_CLIENT_ID,
        clientSecretConfigured: !!process.env.SLACK_CLIENT_SECRET,
      },
      slackApiTest: apiTestResponse.data,
      environment: {
        nodeEnv: process.env.NODE_ENV,
        port: process.env.PORT || '3001',
        httpsPort: process.env.HTTPS_PORT || '3443'
      }
    });
  } catch (error) {
    console.error('Error testing OAuth configuration:', error);
    next(error);
  }
};

export default {
  testOAuthConfig
};
