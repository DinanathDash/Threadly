import axios from 'axios';
import { db } from '../config/firebase.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Get directory name (workaround for ESM)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Local storage for tokens (for development/testing purposes)
const LOCAL_TOKENS_DIR = path.join(__dirname, '..', 'data');
const LOCAL_TOKENS_FILE = path.join(LOCAL_TOKENS_DIR, 'slack_tokens.json');

// Default token from environment variable (if available)
const DEFAULT_SLACK_TOKEN = process.env.SLACK_TOKEN;

// Handle the OAuth exchange
const exchangeCodeForToken = async (code) => {
  try {
    // Validate code parameter
    if (!code || typeof code !== 'string' || code.trim() === '') {
      throw new Error('Invalid authorization code provided');
    }
    
    console.log('Exchanging code for token with Slack API...');
    // Use ngrok URL if available, otherwise fall back to localhost
    const redirectUri = process.env.NGROK_URL 
      ? `${process.env.NGROK_URL}/oauth/callback`
      : 'https://localhost:3443/oauth/callback';
    console.log(`Using redirect URI: ${redirectUri}`);
    
    // Add timestamp to prevent any caching issues
    const timestamp = Date.now();
    
    // Set timeout to 10 seconds to avoid hanging requests
    const response = await axios.post('https://slack.com/api/oauth.v2.access', null, {
      params: {
        code: code.trim(), // Make sure the code is trimmed
        client_id: process.env.SLACK_CLIENT_ID,
        client_secret: process.env.SLACK_CLIENT_SECRET,
        redirect_uri: redirectUri, // Must match the URI used in the authorization request
        _: timestamp, // Add timestamp to avoid caching
      },
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cache-Control': 'no-cache, no-store',
        'Pragma': 'no-cache'
      },
      timeout: 10000 // 10 second timeout
    });
    
    const data = response.data;
    console.log('Slack API response:', JSON.stringify(data, null, 2));
    
    if (!data.ok) {
      console.error('Slack API error:', data.error);
      throw new Error(data.error || 'Failed to exchange code for token');
    }
    
    // Validate required fields before returning
    if (!data.access_token) {
      throw new Error('No access token received from Slack API');
    }

    if (!data.team || !data.team.id || !data.team.name) {
      throw new Error('No team information received from Slack API');
    }

    if (!data.authed_user || !data.authed_user.id) {
      throw new Error('No user information received from Slack API');
    }
    
    // Return with default values for optional fields
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token || null, // Handle missing refresh token
      expiresIn: data.expires_in || 86400, // Typically 86400 seconds (24 hours)
      teamId: data.team.id,
      teamName: data.team.name,
      userId: data.authed_user.id,
      scope: data.scope || '',
      botUserId: data.bot_user_id || null
    };
  } catch (error) {
    console.error('Error exchanging code for token:', error);
    throw error;
  }
};

// Store tokens locally and in Firestore (with fallback to local only)
const storeTokens = async (userId, tokens) => {
  try {
    // Validate inputs
    if (!userId) {
      throw new Error('User ID is required to store tokens');
    }
    
    if (!tokens || !tokens.accessToken) {
      throw new Error('Valid tokens object with accessToken is required');
    }
    
    // Log the user ID that we're using (for debugging)
    console.log(`Storing tokens for user: ${userId}`);
    
    // Calculate when the token will expire
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + (tokens.expiresIn || 86400));
    
    // Prepare tokens data
    const tokensData = {
      accessToken: tokens.accessToken,
      expiresAt: expiresAt.toISOString(),
      createdAt: new Date().toISOString(),
    };
    
    if (tokens.refreshToken !== null && tokens.refreshToken !== undefined) {
      tokensData.refreshToken = tokens.refreshToken;
    }
    
    const userData = {
      uid: userId,
      slackTokens: tokensData,
      slackWorkspace: {
        id: tokens.teamId,
        name: tokens.teamName,
      }
    };
    
    // Try to store in Firestore first
    try {
      const userRef = db.collection('users').doc(userId);
      const userDoc = await userRef.get();
      
      if (!userDoc.exists) {
        console.log(`User ${userId} does not exist in Firestore, creating user document`);
        await userRef.set({
          uid: userId,
          createdAt: new Date()
        });
      }
      
      // Log the data we're about to store
      console.log('Storing the following data to Firestore:', {
        slackTokens: {
          ...tokensData,
          accessToken: tokensData.accessToken ? `${tokensData.accessToken.substring(0, 5)}...` : 'missing'
        },
        slackWorkspace: {
          id: tokens.teamId,
          name: tokens.teamName
        }
      });

      // Set the data with merge option to avoid overwriting other user data
      await userRef.set({
        slackTokens: tokensData,
        slackWorkspace: {
          id: tokens.teamId,
          name: tokens.teamName,
        },
        lastUpdated: new Date() // Add timestamp to track updates
      }, { merge: true });
      
      // Verify the write by reading it back
      const verifyDoc = await userRef.get();
      const verifyData = verifyDoc.data();
      
      if (verifyData?.slackTokens?.accessToken) {
        console.log('Successfully verified tokens in Firestore');
      } else {
        console.warn('Write verification failed: Tokens may not have been stored correctly');
      }
    } catch (firestoreError) {
      console.warn('Failed to store tokens in Firestore, falling back to local storage:', firestoreError.message);
      
      // Ensure the directory exists
      if (!fs.existsSync(LOCAL_TOKENS_DIR)) {
        fs.mkdirSync(LOCAL_TOKENS_DIR, { recursive: true });
      }
      
      // Read existing tokens or create empty object
      let allTokens = {};
      if (fs.existsSync(LOCAL_TOKENS_FILE)) {
        try {
          const data = fs.readFileSync(LOCAL_TOKENS_FILE, 'utf8');
          allTokens = JSON.parse(data);
        } catch (readError) {
          console.warn('Error reading tokens file, creating new one:', readError.message);
        }
      }
      
      // Add/update tokens for this user
      allTokens[userId] = userData;
      
      // Save back to file
      fs.writeFileSync(LOCAL_TOKENS_FILE, JSON.stringify(allTokens, null, 2));
      console.log(`Successfully stored tokens locally at: ${LOCAL_TOKENS_FILE}`);
    }
    
    return userId;
  } catch (error) {
    console.error('Error storing tokens:', error);
    throw error;
  }
};

// Refresh the access token when it expires
const refreshAccessToken = async (userId) => {
  try {
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      throw new Error('User not found');
    }
    
    const userData = userDoc.data();
    const refreshToken = userData.slackTokens?.refreshToken;
    
    if (!refreshToken) {
      throw new Error('No refresh token found');
    }
    
    const response = await axios.post('https://slack.com/api/oauth.v2.access', null, {
      params: {
        grant_type: 'refresh_token',
        client_id: process.env.SLACK_CLIENT_ID,
        client_secret: process.env.SLACK_CLIENT_SECRET,
        refresh_token: refreshToken,
      },
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    
    const data = response.data;
    
    if (!data.ok) {
      throw new Error(data.error || 'Failed to refresh token');
    }
    
    // Calculate when the new token will expire
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + data.expires_in);
    
    // Update the tokens
    await userRef.update({
      'slackTokens.accessToken': data.access_token,
      'slackTokens.refreshToken': data.refresh_token,
      'slackTokens.expiresAt': expiresAt,
      'slackTokens.lastRefreshed': new Date(),
    });
    
    return data.access_token;
  } catch (error) {
    console.error('Error refreshing token:', error);
    throw error;
  }
};

// Get a valid access token for a user
const getValidAccessToken = async (userId) => {
  try {
    console.log(`Getting valid access token for user: ${userId}`);
    
    if (!userId) {
      console.error('No userId provided to getValidAccessToken');
      throw new Error('User ID is required to get access token');
    }
    
    // Try Firestore first
    try {
      console.log('Attempting to get token from Firestore');
      const userRef = db.collection('users').doc(userId);
      const userDoc = await userRef.get();
      
      if (userDoc.exists) {
        console.log('User document found in Firestore');
        const userData = userDoc.data();
        const tokens = userData.slackTokens;
        
        if (tokens && tokens.accessToken) {
          console.log('Slack tokens found in user document');
          
          // Check if token is expired or about to expire in the next 5 minutes
          const now = new Date();
          let expiresAt;
          
          try {
            expiresAt = tokens.expiresAt.toDate();
          } catch (dateError) {
            console.log('expiresAt is not a Firebase timestamp, trying as ISO string');
            expiresAt = new Date(tokens.expiresAt);
          }
          
          const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);
          
          if (expiresAt <= fiveMinutesFromNow) {
            console.log('Token is expired or about to expire, refreshing...');
            // Token is expired or about to expire, refresh it
            return await refreshAccessToken(userId);
          }
          
          console.log('Using valid token from Firestore');
          // Token is still valid
          return tokens.accessToken;
        }
      }
    } catch (firestoreError) {
      console.warn('Firestore access error:', firestoreError.message);
    }
    
    // If Firestore fails or has no token, try local file (development only)
    if (process.env.NODE_ENV !== 'production') {
      console.log('Attempting to get token from local file storage');
      try {
        if (fs.existsSync(LOCAL_TOKENS_FILE)) {
          const data = fs.readFileSync(LOCAL_TOKENS_FILE, 'utf8');
          const allTokens = JSON.parse(data);
          
          console.log(`Local tokens file found. Contains data for users: ${Object.keys(allTokens).join(', ')}`);
          
          if (allTokens[userId]?.slackTokens?.accessToken) {
            console.log('Found valid token in local storage');
            
            // Check if token is expired
            const now = new Date();
            const expiresAt = new Date(allTokens[userId].slackTokens.expiresAt);
            
            if (expiresAt <= now) {
              console.log('Token from local storage is expired');
              // We'll fall through to the next option
            } else {
              console.log('Using valid token from local storage');
              return allTokens[userId].slackTokens.accessToken;
            }
          } else {
            console.log(`No token found for user ${userId} in local storage`);
          }
        } else {
          console.log('Local tokens file does not exist');
        }
      } catch (fileError) {
        console.warn('Local file access error:', fileError.message);
      }
    }
    
    // As a final fallback, use environment variable
    if (DEFAULT_SLACK_TOKEN) {
      console.log('Using default token from environment variable');
      return DEFAULT_SLACK_TOKEN;
    }
    
    // If all attempts fail, throw error
    console.error('No valid Slack token found after trying all sources');
    throw new Error('No valid Slack token found for user');
  } catch (error) {
    console.error('Error getting valid access token:', error);
    throw error;
  }
};

export {
  exchangeCodeForToken,
  storeTokens,
  refreshAccessToken,
  getValidAccessToken,
};
