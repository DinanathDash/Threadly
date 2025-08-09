// Test route for OAuth token exchange
export const testOAuth = async (req, res) => {
  try {
    const { code, redirectUri } = req.body;
    
    // Log the received parameters
    console.log('Test OAuth received:');
    console.log('Code:', code ? 'Present (not shown for security)' : 'Not present');
    console.log('Redirect URI:', redirectUri);
    
    // Return a structured response with all the relevant information
    res.status(200).json({
      status: 'success',
      message: 'This is a test response (no actual API call made)',
      receivedParams: {
        code: code ? '[REDACTED]' : null,
        redirectUri: redirectUri || 'Not provided',
      },
      slackConfig: {
        clientId: process.env.SLACK_CLIENT_ID.slice(0, 5) + '...',
        redirectUriFromEnv: process.env.VITE_SLACK_REDIRECT_URI || 'Not set',
      }
    });
  } catch (error) {
    console.error('Error in test OAuth route:', error);
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};
