// Service to interact with our backend which in turn interacts with Slack API
import logger from '../lib/logger';
import { getApiUrl } from '../config/api';

export const getSlackChannels = async (userId) => {
  try {
    if (!userId) {
      throw new Error('User ID is missing. Please log in again.');
    }
    
    logger.info('Fetching channels for user ID:', userId);
    const response = await fetch(getApiUrl(`/api/slack/channels?userId=${userId}`));
    
    if (!response.ok) {
      // Try to get more details from the response
      try {
        const errorData = await response.json();
        
        // Check for missing permissions error
        if (errorData.details && errorData.details.includes('missing_scope')) {
          throw new Error('Additional Slack permissions are needed to access private channels');
        }
        
        throw new Error(`Failed to fetch channels: ${errorData.message || response.statusText}`);
      } catch (jsonError) {
        throw new Error(`Failed to fetch channels: ${response.status} ${response.statusText}`);
      }
    }
    
    const data = await response.json();
    return data.channels;
  } catch (error) {
    logger.error('Error fetching Slack channels:', error);
    throw error;
  }
};

// Generate the Slack OAuth URL to start the authorization flow
export const getSlackOAuthUrl = async () => {
  const clientId = import.meta.env.VITE_SLACK_CLIENT_ID;
  
  // Use the redirect URI from environment variables
  const redirectUri = import.meta.env.VITE_SLACK_REDIRECT_URI;
  
  // Bot scopes - actions the app can perform
  const scope = 'channels:read,channels:history,groups:read,groups:history,chat:write,reactions:read,mpim:history,im:history,users:read,users:read.email,users.profile:read';
  
  // User scopes - actions on behalf of the user
  const userScope = 'users:read,users:read.email,users.profile:read';
  
  // Make sure the redirect URI is properly encoded
  const encodedRedirectUri = encodeURIComponent(redirectUri);
  
  logger.info('Using Slack OAuth URL with redirect URI:', redirectUri);
  
  // We're using the team parameter with a value of "open" which can often
  // trigger the standard login flow rather than the workspace-specific flow
  const url = `https://slack.com/oauth/v2/authorize?client_id=${clientId}&redirect_uri=${encodedRedirectUri}&scope=${scope}&user_scope=${userScope}&state=${Date.now()}`;
  
  try {
    // Verify that we can make a connection before redirecting the user
    const response = await fetch('https://slack.com/api/api.test', { 
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });
    
    if (!response.ok) {
      console.warn('Slack API test failed, connection issues might occur:', await response.text());
    } else {
      logger.info('Slack API test successful, proceeding with OAuth flow');
    }
  } catch (error) {
    console.error('Error testing Slack API connection:', error);
    // We continue anyway, as this is just a diagnostic check
  }
  
  return url;
};
