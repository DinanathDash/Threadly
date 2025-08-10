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
    
    // Validate required fields
    if (!userId) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'Missing required field: userId' 
      });
    }
    
    if (!channelId) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'Missing required field: channelId' 
      });
    }
    
    if (!message) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'Missing required field: message' 
      });
    }
    
    console.log(`Processing send message request for user ${userId} to channel ${channelId}`);
    
    try {
      const result = await sendSlackMsg(userId, channelId, message);
      
      console.log('Message sent successfully:', result);
      
      return res.status(200).json({
        status: 'success',
        data: result
      });
    } catch (sendError) {
      console.error('Error in sendSlackMsg:', sendError);
      return res.status(500).json({
        status: 'error',
        message: `Failed to send message: ${sendError.message}`
      });
    }
  } catch (error) {
    console.error('Unexpected error in sendImmediateMessage controller:', error);
    return res.status(500).json({
      status: 'error',
      message: 'An unexpected error occurred while processing your request'
    });
  }
};

// Schedule a message
export const scheduleMessage = async (req, res, next) => {
  try {
    const { userId, channelId, message, scheduledTime, messageId } = req.body;
    
    console.log(`Schedule message request received:`, {
      userId,
      channelId,
      message: message ? message.substring(0, 20) + '...' : null,
      scheduledTime,
      messageId
    });
    
    // Validate all required fields
    if (!userId) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'Missing required field: userId' 
      });
    }
    
    if (!channelId) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'Missing required field: channelId' 
      });
    }
    
    if (!message) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'Missing required field: message' 
      });
    }
    
    if (!scheduledTime) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'Missing required field: scheduledTime' 
      });
    }
    
    if (!messageId) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'Missing required field: messageId' 
      });
    }
    
    try {
      const scheduledDate = new Date(scheduledTime);
      if (isNaN(scheduledDate.getTime())) {
        return res.status(400).json({
          status: 'error',
          message: 'Invalid scheduledTime format'
        });
      }
      
      const result = await scheduleSlackMsg(
        userId,
        channelId,
        message,
        scheduledDate,
        messageId
      );
      
      console.log(`Schedule message success for ${messageId}:`, result);
      
      res.status(200).json({
        status: 'success',
        data: result
      });
    } catch (processError) {
      console.error('Error in scheduleSlackMsg:', processError);
      res.status(500).json({
        status: 'error',
        message: `Failed to schedule message: ${processError.message}`
      });
    }
  } catch (error) {
    console.error('Unexpected error in scheduleMessage controller:', error);
    res.status(500).json({
      status: 'error',
      message: 'An unexpected error occurred while scheduling the message'
    });
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
    
    console.log(`Attempting to get channels for user: ${userId}`);
    
    try {
      const channels = await getSlackChannels(userId);
      
      console.log(`Successfully retrieved ${channels.length} channels for user: ${userId}`);
      
      res.status(200).json({
        status: 'success',
        channels
      });
    } catch (slackError) {
      console.error(`Error getting channels from Slack for user ${userId}:`, slackError);
      
      // Create a more helpful error message for the frontend
      let details = slackError.toString();
      let message = `Error fetching channels: ${slackError.message}`;
      
      // Special handling for missing_scope errors
      if (slackError.message && slackError.message.includes('missing_scope')) {
        message = 'Additional Slack permissions are needed to access channels';
        details = `${slackError.message}. Please reconnect your Slack account with the additional permissions.`;
      }
      
      return res.status(500).json({
        status: 'error',
        message: message,
        details: details
      });
    }
  } catch (error) {
    console.error('Server error in getChannels controller:', error);
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
