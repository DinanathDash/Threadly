import { 
  exchangeCodeForToken, 
  storeTokens 
} from '../services/slackTokenService.js';

import {
  sendMessage as sendSlackMsg,
  scheduleMessage as scheduleSlackMsg,
  getChannels as getSlackChannels,
  cancelScheduledMessage as cancelSlackMsg
} from '../services/slackMessageService.js';// Handle OAuth callback
export const handleOAuth = async (req, res, next) => {
  try {
    const { code, userId } = req.body;
    
    if (!code) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'No authorization code provided' 
      });
    }
    
    if (!userId) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'No user ID provided' 
      });
    }
    
    console.log(`Processing OAuth code: ${code.substring(0, 5)}... for user: ${userId}`);
    
    try {
      // Exchange the code for tokens
      const tokens = await exchangeCodeForToken(code);
      
      // Validate the tokens
      if (!tokens || !tokens.accessToken || !tokens.teamId) {
        throw new Error('Received incomplete token data from Slack');
      }
      
      try {
        // Store the tokens using the Firebase user ID
        // Our storeTokens function now has fallback to local storage if Firestore fails
        await storeTokens(userId, tokens);
        
        // Return success response with minimal data
        return res.status(200).json({
          status: 'success',
          userId: userId,
          workspace: {
            id: tokens.teamId,
            name: tokens.teamName,
          }
        });
      } catch (storageError) {
        console.error('Error storing tokens:', storageError);
        return res.status(500).json({
          status: 'error',
          message: 'Authentication succeeded but we could not store your credentials. Please try again.'
        });
      }
    } catch (slackError) {
      console.error('Slack API error:', slackError);
      return res.status(400).json({
        status: 'error',
        message: slackError.message || 'Failed to authenticate with Slack'
      });
    }
  } catch (error) {
    next(error);
  }
};

// Disconnect from Slack
export const disconnect = async (req, res, next) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'No user ID provided' 
      });
    }
    
    // In a real implementation, you would revoke the tokens with Slack
    // and then remove them from your database
    
    res.status(200).json({
      status: 'success',
      message: 'Disconnected from Slack'
    });
  } catch (error) {
    next(error);
  }
};

// Send an immediate message
export const sendImmediateMessage = async (req, res, next) => {
  try {
    const { userId, channelId, message } = req.body;
    
    if (!userId || !channelId || !message) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'Missing required fields' 
      });
    }
    
    const result = await sendSlackMsg(userId, channelId, message);
    
    res.status(200).json({
      status: 'success',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

// Schedule a message
export const scheduleMessage = async (req, res, next) => {
  try {
    const { userId, channelId, message, scheduledTime, messageId } = req.body;
    
    if (!userId || !channelId || !message || !scheduledTime || !messageId) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'Missing required fields' 
      });
    }
    
    const result = await scheduleSlackMsg(
      userId,
      channelId,
      message,
      new Date(scheduledTime),
      messageId
    );
    
    res.status(200).json({
      status: 'success',
      data: result
    });
  } catch (error) {
    next(error);
  }
};

// Get channels
export const getChannels = async (req, res, next) => {
  try {
    const { userId } = req.query;
    
    if (!userId) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'No user ID provided' 
      });
    }
    
    const channels = await getSlackChannels(userId);
    
    res.status(200).json({
      status: 'success',
      channels
    });
  } catch (error) {
    next(error);
  }
};

// Cancel a scheduled message
export const cancelMessage = async (req, res, next) => {
  try {
    const { messageId } = req.body;
    
    if (!messageId) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'No message ID provided' 
      });
    }
    
    const result = await cancelSlackMsg(messageId);
    
    res.status(200).json({
      status: 'success',
      data: result
    });
  } catch (error) {
    next(error);
  }
};
