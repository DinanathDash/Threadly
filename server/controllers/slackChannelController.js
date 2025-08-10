import { 
  getChannelMessages as fetchChannelMessages,
  getChannelInfo as fetchChannelInfo,
  getChannelMembers as fetchChannelMembers
} from '../services/slackChannelService.js';

// Get messages from a channel
export const getChannelMessages = async (req, res, next) => {
  try {
    const { channelId } = req.params;
    const { userId, cursor, limit } = req.query;
    
    if (!channelId) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'Channel ID is required' 
      });
    }
    
    if (!userId) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'User ID is required' 
      });
    }
    
    console.log(`Fetching messages for channel ${channelId} for user ${userId}`);
    
    try {
      const limitNum = limit ? parseInt(limit) : 50;
      const messagesData = await fetchChannelMessages(userId, channelId, cursor, limitNum);
      
      res.status(200).json({
        status: 'success',
        data: messagesData
      });
    } catch (slackError) {
      console.error(`Error fetching channel messages from Slack for channel ${channelId}:`, slackError);
      
      // Check for specific errors
      if (slackError.message && slackError.message.includes('missing_scope')) {
        return res.status(403).json({
          status: 'error',
          message: 'Additional permissions needed to fetch channel messages',
          details: slackError.message
        });
      }
      
      return res.status(500).json({
        status: 'error',
        message: `Error fetching channel messages: ${slackError.message}`,
        details: slackError.toString()
      });
    }
  } catch (error) {
    console.error('Server error in getChannelMessages controller:', error);
    next(error);
  }
};

// Get channel information
export const getChannelInfo = async (req, res, next) => {
  try {
    const { channelId } = req.params;
    const { userId } = req.query;
    
    if (!channelId) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'Channel ID is required' 
      });
    }
    
    if (!userId) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'User ID is required' 
      });
    }
    
    console.log(`Fetching channel info for channel ${channelId} for user ${userId}`);
    
    try {
      const channelInfo = await fetchChannelInfo(userId, channelId);
      
      res.status(200).json({
        status: 'success',
        data: channelInfo
      });
    } catch (slackError) {
      console.error(`Error fetching channel info from Slack for channel ${channelId}:`, slackError);
      
      return res.status(500).json({
        status: 'error',
        message: `Error fetching channel info: ${slackError.message}`,
        details: slackError.toString()
      });
    }
  } catch (error) {
    console.error('Server error in getChannelInfo controller:', error);
    next(error);
  }
};

// Get channel members
export const getChannelMembers = async (req, res, next) => {
  try {
    const { channelId } = req.params;
    const { userId, cursor, limit } = req.query;
    
    if (!channelId) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'Channel ID is required' 
      });
    }
    
    if (!userId) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'User ID is required' 
      });
    }
    
    console.log(`Fetching members for channel ${channelId} for user ${userId}`);
    
    try {
      const limitNum = limit ? parseInt(limit) : 100;
      const membersData = await fetchChannelMembers(userId, channelId, cursor, limitNum);
      
      res.status(200).json({
        status: 'success',
        data: membersData
      });
    } catch (slackError) {
      console.error(`Error fetching channel members from Slack for channel ${channelId}:`, slackError);
      
      return res.status(500).json({
        status: 'error',
        message: `Error fetching channel members: ${slackError.message}`,
        details: slackError.toString()
      });
    }
  } catch (error) {
    console.error('Server error in getChannelMembers controller:', error);
    next(error);
  }
};
