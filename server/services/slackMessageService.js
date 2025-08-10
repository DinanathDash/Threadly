import axios from 'axios';
import { getValidAccessToken } from './slackTokenService.js';
import { db, admin } from '../config/firebase.js';

// Send a message to a Slack channel
const sendSlackMessage = async (userId, channelId, message) => {
  try {
    if (!userId) {
      throw new Error('User ID is required to send a message');
    }
    
    if (!channelId) {
      throw new Error('Channel ID is required to send a message');
    }
    
    if (!message || message.trim() === '') {
      throw new Error('Message content cannot be empty');
    }
    
    console.log(`Sending message to channel ${channelId} for user ${userId}`);
    
    // Get a valid access token
    const accessToken = await getValidAccessToken(userId);
    
    if (!accessToken) {
      throw new Error('Failed to obtain a valid Slack access token');
    }
    
    console.log('Token obtained, sending message to Slack API...');
    
    // Send the message using Slack's Web API
    const response = await axios.post(
      'https://slack.com/api/chat.postMessage',
      {
        channel: channelId,
        text: message,
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        timeout: 10000, // 10 second timeout
      }
    );
    
    console.log('Slack API response:', response.data);
    
    // Check if the error is "not_in_channel" and attempt to join the channel
    if (!response.data.ok && response.data.error === 'not_in_channel') {
      console.log(`Bot is not in channel ${channelId}, attempting to join...`);
      
      try {
        // Join the channel using conversations.join
        const joinResponse = await axios.post(
          'https://slack.com/api/conversations.join',
          {
            channel: channelId,
          },
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
          }
        );
        
        console.log('Join channel response:', joinResponse.data);
        
        if (!joinResponse.data.ok) {
          console.error('Failed to join channel:', joinResponse.data);
          throw new Error(`Bot could not join the channel: ${joinResponse.data.error}. Please add the bot to the channel manually.`);
        }
        
        // Try sending the message again
        console.log('Joined channel, retrying message send...');
        const retryResponse = await axios.post(
          'https://slack.com/api/chat.postMessage',
          {
            channel: channelId,
            text: message,
          },
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
          }
        );
        
        if (!retryResponse.data.ok) {
          throw new Error(retryResponse.data.error || 'Failed to send message after joining channel');
        }
        
        return {
          ts: retryResponse.data.ts,
          channel: retryResponse.data.channel,
        };
      } catch (joinError) {
        console.error('Error joining channel:', joinError);
        throw new Error(`Failed to send message: The bot is not in this channel and could not join automatically. Please add the bot to the channel first.`);
      }
    } else if (!response.data.ok) {
      console.error('Slack API returned an error:', response.data);
      throw new Error(response.data.error || 'Failed to send message');
    }
    
    return {
      ts: response.data.ts,
      channel: response.data.channel,
    };
  } catch (error) {
    console.error('Error sending message:', error);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
      throw new Error(`Failed to send message: ${error.response.status} - ${JSON.stringify(error.response.data)}`);
    } else if (error.request) {
      console.error('No response received:', error.request);
      throw new Error('Failed to send message: No response from Slack API');
    } else {
      throw new Error(`Failed to send message: ${error.message}`);
    }
  }
};

// Schedule a message using Firestore and Node scheduler
const scheduleSlackMessage = async (userId, channelId, message, scheduledTime, messageId) => {
  try {
    console.log(`[${new Date().toISOString()}] Processing schedule request for message ${messageId}`);
    console.log(`Channel: ${channelId}, User: ${userId}, Scheduled time: ${scheduledTime}`);
    
    // Get the message document from Firestore
    const messageRef = db.collection('scheduledMessages').doc(messageId);
    const messageDoc = await messageRef.get();
    
    if (!messageDoc.exists) {
      console.error(`[${new Date().toISOString()}] Message ${messageId} not found in database`);
      throw new Error('Scheduled message not found');
    }
    
    // Update the message with additional information
    await messageRef.update({
      status: 'confirmed',
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    
    console.log(`[${new Date().toISOString()}] Successfully confirmed message ${messageId} for scheduling`);
    
    // Check if the message should be sent immediately
    const now = new Date();
    if (scheduledTime <= now) {
      console.log(`[${new Date().toISOString()}] Message ${messageId} is scheduled for now or the past, processing immediately`);
      // Trigger the scheduler to check immediately
      processScheduledMessages();
    } else {
      console.log(`[${new Date().toISOString()}] Message ${messageId} scheduled for ${scheduledTime.toISOString()}, will be sent by the scheduler when due`);
    }
    
    return {
      id: messageId,
      status: 'confirmed',
      scheduledTime: scheduledTime.toISOString()
    };
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error scheduling message:`, error);
    throw error;
  }
};

// Get all slack channels for a user
const getSlackChannels = async (userId) => {
  try {
    console.log(`Getting valid access token for user: ${userId}`);
    
    // Get a valid access token
    const accessToken = await getValidAccessToken(userId);
    
    if (!accessToken) {
      throw new Error('Could not obtain a valid access token');
    }
    
    console.log(`Successfully got token for user ${userId}. Token starts with: ${accessToken.substring(0, 5)}...`);
    
    // Get the list of channels using Slack's Web API
    console.log('Making request to Slack API: conversations.list');
    const response = await axios.get('https://slack.com/api/conversations.list', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      params: {
        types: 'public_channel,private_channel',
        exclude_archived: true,
      },
      timeout: 10000 // 10 second timeout
    });
    
    if (!response.data.ok) {
      console.error('Slack API error response:', response.data);
      
      // Handle missing_scope error specifically
      if (response.data.error === 'missing_scope') {
        const errorMessage = `missing_scope: Missing required Slack permissions. Need: ${response.data.needed}, Have: ${response.data.provided}`;
        console.error(errorMessage);
        
        // Create a more informative error object
        const error = new Error(errorMessage);
        error.slackError = response.data.error;
        error.needed = response.data.needed;
        error.provided = response.data.provided;
        throw error;
      } else {
        throw new Error(response.data.error || 'Failed to get channels from Slack API');
      }
    }
    
    if (!response.data.channels || !Array.isArray(response.data.channels)) {
      console.error('Unexpected response format from Slack API:', response.data);
      throw new Error('Invalid channel data format received from Slack');
    }
    
    // Format the channels
    const channels = response.data.channels.map(channel => ({
      id: channel.id,
      name: channel.name,
      isPrivate: channel.is_private,
    }));
    
    console.log(`Successfully retrieved ${channels.length} channels`);
    return channels;
  } catch (error) {
    console.error('Error getting channels:', error);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
      console.error('Response headers:', error.response.headers);
    } else if (error.request) {
      console.error('No response received:', error.request);
    }
    throw error;
  }
};

// Process scheduled messages that are due to be sent
const processScheduledMessages = async () => {
  try {
    const now = admin.firestore.Timestamp.now();
    
    // Query for messages that are scheduled to be sent now or in the past
    // Include both 'scheduled' and 'confirmed' status
    const messagesSnapshot = await db.collection('scheduledMessages')
      .where('status', 'in', ['scheduled', 'confirmed'])
      .where('scheduledTime', '<=', now)
      .get();
    
    if (messagesSnapshot.empty) {
      console.log(`[${new Date().toISOString()}] No messages to process at this time`);
      return;
    }
    
    console.log(`[${new Date().toISOString()}] Processing ${messagesSnapshot.size} scheduled messages`);
    
    // Log the messages being processed
    messagesSnapshot.forEach(doc => {
      const message = doc.data();
      console.log(`Message ID: ${doc.id}, Status: ${message.status}, Scheduled: ${message.scheduledTime.toDate().toISOString()}, Channel: ${message.channelId}`);
    });
    
    // Process each message
    const promises = messagesSnapshot.docs.map(async (doc) => {
      const message = doc.data();
      const messageRef = doc.ref;
      
      try {
        // Send the message
        console.log(`[${new Date().toISOString()}] Sending scheduled message ${doc.id} to channel ${message.channelId}`);
        const result = await sendSlackMessage(message.userId, message.channelId, message.message);
        
        // Update the message status
        await messageRef.update({
          status: 'sent',
          sentAt: admin.firestore.FieldValue.serverTimestamp(),
          slackTs: result.ts,
        });
        
        console.log(`[${new Date().toISOString()}] Successfully sent scheduled message: ${doc.id} to channel ${message.channelId}`);
      } catch (error) {
        console.error(`[${new Date().toISOString()}] Error sending scheduled message ${doc.id} to channel ${message.channelId}:`, error);
        
        // Update the message status to failed
        await messageRef.update({
          status: 'failed',
          error: error.message,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        
        console.log(`[${new Date().toISOString()}] Updated message ${doc.id} status to 'failed'`);
      }
    });
    
    await Promise.all(promises);
  } catch (error) {
    console.error('Error processing scheduled messages:', error);
  }
};

// Cancel a scheduled message
const cancelSlackScheduledMessage = async (messageId) => {
  try {
    const messageRef = db.collection('scheduledMessages').doc(messageId);
    const messageDoc = await messageRef.get();
    
    if (!messageDoc.exists) {
      throw new Error('Scheduled message not found');
    }
    
    const message = messageDoc.data();
    
    // Check if the message is already sent
    if (message.status !== 'scheduled') {
      throw new Error(`Cannot cancel message with status: ${message.status}`);
    }
    
    // Update the message status
    await messageRef.update({
      status: 'cancelled',
      cancelledAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    
    return { id: messageId, status: 'cancelled' };
  } catch (error) {
    console.error('Error cancelling scheduled message:', error);
    throw error;
  }
};

// Set up a function to run periodically to send scheduled messages
const initializeScheduler = () => {
  console.log(`[${new Date().toISOString()}] Initializing message scheduler`);
  
  // Process messages every minute
  const interval = setInterval(() => {
    console.log(`[${new Date().toISOString()}] Running scheduled message check`);
    processScheduledMessages();
  }, 60000);
  
  // Also process messages once at startup
  console.log(`[${new Date().toISOString()}] Running initial message check at startup`);
  processScheduledMessages();
  
  return interval;
};

export {
  sendSlackMessage as sendMessage,
  scheduleSlackMessage as scheduleMessage,
  getSlackChannels as getChannels,
  cancelSlackScheduledMessage as cancelScheduledMessage,
  processScheduledMessages,
  initializeScheduler,
};
