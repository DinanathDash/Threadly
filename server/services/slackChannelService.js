import axios from 'axios';
import { getValidAccessToken } from './slackTokenService.js';

// Get messages from a specific channel
export const getChannelMessages = async (userId, channelId, cursor = null, limit = 50) => {
  try {
    if (!userId) {
      throw new Error('User ID is required to fetch channel messages');
    }
    
    if (!channelId) {
      throw new Error('Channel ID is required to fetch messages');
    }
    
    console.log(`Getting messages from channel ${channelId} for user ${userId}`);
    
    // Get a valid access token
    const accessToken = await getValidAccessToken(userId);
    
    if (!accessToken) {
      throw new Error('Failed to obtain a valid Slack access token');
    }
    
    // Prepare request parameters
    const params = {
      channel: channelId,
      limit: limit
    };
    
    // Add cursor for pagination if provided
    if (cursor) {
      params.cursor = cursor;
    }
    
    // Fetch messages using Slack's conversations.history API
    const response = await axios.get('https://slack.com/api/conversations.history', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      params,
      timeout: 10000 // 10 second timeout
    });
    
    if (!response.data.ok) {
      console.error('Slack API error response:', response.data);
      
      // Handle missing_scope error specifically
      if (response.data.error === 'missing_scope') {
        const neededScopes = response.data.needed || 'additional permissions';
        const error = new Error(`missing_scope: You need ${neededScopes} to access channel messages`);
        error.slackError = response.data.error;
        error.needed = response.data.needed;
        error.provided = response.data.provided;
        throw error;
      }
      
      throw new Error(response.data.error || 'Failed to get channel messages from Slack API');
    }
    
    // Fetch user info for all messages to add user details
    const userIds = new Set();
    response.data.messages.forEach(msg => {
      if (msg.user) userIds.add(msg.user);
    });
    
    // Get user information for each unique user ID
    const userDetails = {};
    if (userIds.size > 0) {
      await Promise.all([...userIds].map(async (userId) => {
        try {
          console.log(`Fetching user details for ID: ${userId}`);
          const userResponse = await axios.get('https://slack.com/api/users.info', {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
            params: {
              user: userId,
              include_locale: true
            }
          });
          
          if (userResponse.data.ok) {
            console.log(`User info success for ${userId}:`, userResponse.data.user.real_name);
            userDetails[userId] = {
              name: userResponse.data.user.real_name || userResponse.data.user.name || 'Unknown User',
              avatar: userResponse.data.user.profile.image_72 || userResponse.data.user.profile.image_48,
              isBot: userResponse.data.user.is_bot
            };
          } else {
            console.error(`User info API error for ${userId}:`, userResponse.data.error);
          }
        } catch (error) {
          console.error(`Failed to get user info for ${userId}:`, error);
        }
      }));
    }
    
    // Format the response
    return {
      messages: response.data.messages.map(msg => {
        // Check if this is a bot message with custom username
        const isBot = msg.subtype === 'bot_message';
        const botName = msg.username;
        
        // For bot messages, create a synthetic user detail
        let messageUserDetails = userDetails[msg.user] || null;
        
        if (isBot && botName && !messageUserDetails) {
          messageUserDetails = {
            name: botName,
            isBot: true,
            // Default bot icon if none provided
            avatar: msg.icons?.image_48 || null
          };
        }
        
        return {
          id: msg.ts,
          text: msg.text,
          user: msg.user,
          userDetails: messageUserDetails,
          isBot: isBot,
          botName: botName,
          timestamp: msg.ts,
          formattedDate: new Date(parseInt(msg.ts.split('.')[0]) * 1000).toLocaleString(),
          reactions: msg.reactions || [],
          threadTs: msg.thread_ts,
          replyCount: msg.reply_count || 0,
          attachments: msg.attachments || []
        };
      }),
      hasMore: response.data.has_more,
      nextCursor: response.data.response_metadata?.next_cursor
    };
  } catch (error) {
    console.error('Error getting channel messages:', error);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
    throw error;
  }
};

// Get information about a specific channel
export const getChannelInfo = async (userId, channelId) => {
  try {
    if (!userId) {
      throw new Error('User ID is required to fetch channel info');
    }
    
    if (!channelId) {
      throw new Error('Channel ID is required to fetch channel info');
    }
    
    console.log(`Getting channel info for ${channelId} for user ${userId}`);
    
    // Get a valid access token
    const accessToken = await getValidAccessToken(userId);
    
    if (!accessToken) {
      throw new Error('Failed to obtain a valid Slack access token');
    }
    
    // Fetch channel info using Slack's conversations.info API
    const response = await axios.get('https://slack.com/api/conversations.info', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      params: {
        channel: channelId
      },
      timeout: 10000 // 10 second timeout
    });
    
    if (!response.data.ok) {
      console.error('Slack API error response:', response.data);
      throw new Error(response.data.error || 'Failed to get channel info from Slack API');
    }
    
    // Return formatted channel info
    return {
      id: response.data.channel.id,
      name: response.data.channel.name,
      topic: response.data.channel.topic?.value || '',
      purpose: response.data.channel.purpose?.value || '',
      isPrivate: response.data.channel.is_private,
      memberCount: response.data.channel.num_members,
      created: new Date(response.data.channel.created * 1000).toLocaleString(),
      creator: response.data.channel.creator
    };
  } catch (error) {
    console.error('Error getting channel info:', error);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
    throw error;
  }
};

// Get channel members
export const getChannelMembers = async (userId, channelId, cursor = null, limit = 100) => {
  try {
    if (!userId) {
      throw new Error('User ID is required to fetch channel members');
    }
    
    if (!channelId) {
      throw new Error('Channel ID is required to fetch members');
    }
    
    // Get a valid access token
    const accessToken = await getValidAccessToken(userId);
    
    if (!accessToken) {
      throw new Error('Failed to obtain a valid Slack access token');
    }
    
    // Prepare request parameters
    const params = {
      channel: channelId,
      limit: limit
    };
    
    // Add cursor for pagination if provided
    if (cursor) {
      params.cursor = cursor;
    }
    
    // Fetch members using Slack's conversations.members API
    const response = await axios.get('https://slack.com/api/conversations.members', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      params,
      timeout: 10000 // 10 second timeout
    });
    
    if (!response.data.ok) {
      console.error('Slack API error response:', response.data);
      throw new Error(response.data.error || 'Failed to get channel members from Slack API');
    }
    
    // Get user information for each member
    const members = [];
    const chunkSize = 30; // Process in chunks to avoid rate limiting
    
    for (let i = 0; i < response.data.members.length; i += chunkSize) {
      const chunk = response.data.members.slice(i, i + chunkSize);
      await Promise.all(chunk.map(async (memberId) => {
        try {
          const userResponse = await axios.get('https://slack.com/api/users.info', {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
            params: {
              user: memberId
            }
          });
          
          if (userResponse.data.ok) {
            members.push({
              id: memberId,
              name: userResponse.data.user.real_name || userResponse.data.user.name,
              username: userResponse.data.user.name,
              avatar: userResponse.data.user.profile.image_72,
              isBot: userResponse.data.user.is_bot
            });
          }
        } catch (error) {
          console.error(`Failed to get user info for ${memberId}:`, error);
        }
      }));
    }
    
    return {
      members,
      hasMore: response.data.response_metadata?.next_cursor ? true : false,
      nextCursor: response.data.response_metadata?.next_cursor
    };
  } catch (error) {
    console.error('Error getting channel members:', error);
    throw error;
  }
};
