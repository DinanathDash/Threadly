import axios from 'axios';
import { getValidAccessToken } from './slackTokenService.js';
import { db, admin } from '../config/firebase.js';

// Send a message to a Slack channel
const sendSlackMessage = async (userId, channelId, message) => {
  try {
    // Get a valid access token
    const accessToken = await getValidAccessToken(userId);
    
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
      }
    );
    
    if (!response.data.ok) {
      throw new Error(response.data.error || 'Failed to send message');
    }
    
    return {
      ts: response.data.ts,
      channel: response.data.channel,
    };
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
};

// Schedule a message using Firestore and Node scheduler
const scheduleSlackMessage = async (userId, channelId, message, scheduledTime, messageId) => {
  try {
    // Get the message document from Firestore
    const messageRef = db.collection('scheduledMessages').doc(messageId);
    const messageDoc = await messageRef.get();
    
    if (!messageDoc.exists) {
      throw new Error('Scheduled message not found');
    }
    
    // Update the message with additional information
    await messageRef.update({
      status: 'confirmed',
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    
    return {
      id: messageId,
      status: 'scheduled',
    };
  } catch (error) {
    console.error('Error scheduling message:', error);
    throw error;
  }
};

// Get all slack channels for a user
const getSlackChannels = async (userId) => {
  try {
    // Get a valid access token
    const accessToken = await getValidAccessToken(userId);
    
    // Get the list of channels using Slack's Web API
    const response = await axios.get('https://slack.com/api/conversations.list', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      params: {
        types: 'public_channel,private_channel',
        exclude_archived: true,
      },
    });
    
    if (!response.data.ok) {
      throw new Error(response.data.error || 'Failed to get channels');
    }
    
    // Format the channels
    const channels = response.data.channels.map(channel => ({
      id: channel.id,
      name: channel.name,
      isPrivate: channel.is_private,
    }));
    
    return channels;
  } catch (error) {
    console.error('Error getting channels:', error);
    throw error;
  }
};

// Process scheduled messages that are due to be sent
const processScheduledMessages = async () => {
  try {
    const now = admin.firestore.Timestamp.now();
    
    // Query for messages that are scheduled to be sent now or in the past
    const messagesSnapshot = await db.collection('scheduledMessages')
      .where('status', '==', 'scheduled')
      .where('scheduledTime', '<=', now)
      .get();
    
    if (messagesSnapshot.empty) {
      console.log('No messages to process');
      return;
    }
    
    console.log(`Processing ${messagesSnapshot.size} scheduled messages`);
    
    // Process each message
    const promises = messagesSnapshot.docs.map(async (doc) => {
      const message = doc.data();
      const messageRef = doc.ref;
      
      try {
        // Send the message
        const result = await sendMessage(message.userId, message.channelId, message.message);
        
        // Update the message status
        await messageRef.update({
          status: 'sent',
          sentAt: admin.firestore.FieldValue.serverTimestamp(),
          slackTs: result.ts,
        });
        
        console.log(`Sent scheduled message: ${doc.id}`);
      } catch (error) {
        console.error(`Error sending scheduled message ${doc.id}:`, error);
        
        // Update the message status to failed
        await messageRef.update({
          status: 'failed',
          error: error.message,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
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
  // Process messages every minute
  setInterval(processScheduledMessages, 60000);
  
  // Also process messages once at startup
  processScheduledMessages();
};

export {
  sendSlackMessage as sendMessage,
  scheduleSlackMessage as scheduleMessage,
  getSlackChannels as getChannels,
  cancelSlackScheduledMessage as cancelScheduledMessage,
  processScheduledMessages,
  initializeScheduler,
};
