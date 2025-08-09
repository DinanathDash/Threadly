// Service to interact with our backend which in turn interacts with Slack API
export const getSlackChannels = async (userId) => {
  try {
    const response = await fetch(`/api/slack/channels?userId=${userId}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch channels');
    }
    
    const data = await response.json();
    return data.channels;
  } catch (error) {
    console.error('Error fetching Slack channels:', error);
    throw error;
  }
};

// Generate the Slack OAuth URL to start the authorization flow
export const getSlackOAuthUrl = async () => {
  const clientId = import.meta.env.VITE_SLACK_CLIENT_ID;
  
  // Use the redirect URI from environment variables
  const redirectUri = import.meta.env.VITE_SLACK_REDIRECT_URI;
  const scope = 'channels:read,chat:write'; // Add other required scopes
  
  // Make sure the redirect URI is properly encoded
  const encodedRedirectUri = encodeURIComponent(redirectUri);
  
  console.log('Using Slack OAuth URL with redirect URI:', redirectUri);
  
  // We're using the team parameter with a value of "open" which can often
  // trigger the standard login flow rather than the workspace-specific flow
  const url = `https://slack.com/oauth/v2/authorize?client_id=${clientId}&redirect_uri=${encodedRedirectUri}&scope=${scope}&team=open&nonce=${Date.now()}`;
  
  try {
    // Verify that we can make a connection before redirecting the user
    const response = await fetch('https://slack.com/api/api.test', { 
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });
    
    if (!response.ok) {
      console.warn('Slack API test failed, connection issues might occur:', await response.text());
    } else {
      console.log('Slack API test successful, proceeding with OAuth flow');
    }
  } catch (error) {
    console.error('Error testing Slack API connection:', error);
    // We continue anyway, as this is just a diagnostic check
  }
  
  return url;
};
