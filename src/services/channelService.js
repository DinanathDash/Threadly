// Channel service for handling Slack channel data
import { db } from './firebase';
import { doc, getDoc } from 'firebase/firestore';

// Get all channels for the current user
export const getChannels = async (userId) => {
  try {
    if (!userId) {
      throw new Error('User ID is missing. Please log in again.');
    }
    
    console.log('Fetching channels for user ID:', userId);
    const response = await fetch(`/api/channels/channels?userId=${userId}`);
    
    if (!response.ok) {
      try {
        const errorData = await response.json();
        
        // Check for missing permissions error
        if (errorData.details && errorData.details.includes('missing_scope')) {
          throw new Error('Additional Slack permissions are needed to access channels');
        }
        
        throw new Error(`Failed to fetch channels: ${errorData.message || response.statusText}`);
      } catch (jsonError) {
        throw new Error(`Failed to fetch channels: ${response.status} ${response.statusText}`);
      }
    }
    
    const data = await response.json();
    return data.channels;
  } catch (error) {
    console.error('Error fetching Slack channels:', error);
    throw error;
  }
};

// Get channel messages
export const getChannelMessages = async (userId, channelId, cursor = null, limit = 50) => {
  try {
    if (!userId || !channelId) {
      throw new Error('User ID and Channel ID are required.');
    }
    
    let url = `/api/channels/channels/${channelId}/messages?userId=${userId}`;
    if (cursor) url += `&cursor=${cursor}`;
    if (limit) url += `&limit=${limit}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      try {
        const errorData = await response.json();
        throw new Error(`Failed to fetch messages: ${errorData.message || response.statusText}`);
      } catch (jsonError) {
        throw new Error(`Failed to fetch messages: ${response.status} ${response.statusText}`);
      }
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error fetching channel messages:', error);
    throw error;
  }
};

// Get channel info
export const getChannelInfo = async (userId, channelId) => {
  try {
    if (!userId || !channelId) {
      throw new Error('User ID and Channel ID are required.');
    }
    
    const response = await fetch(`/api/channels/channels/${channelId}/info?userId=${userId}`);
    
    if (!response.ok) {
      try {
        const errorData = await response.json();
        throw new Error(`Failed to fetch channel info: ${errorData.message || response.statusText}`);
      } catch (jsonError) {
        throw new Error(`Failed to fetch channel info: ${response.status} ${response.statusText}`);
      }
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error fetching channel info:', error);
    throw error;
  }
};

// Get channel members
export const getChannelMembers = async (userId, channelId, cursor = null, limit = 100) => {
  try {
    if (!userId || !channelId) {
      throw new Error('User ID and Channel ID are required.');
    }
    
    let url = `/api/channels/channels/${channelId}/members?userId=${userId}`;
    if (cursor) url += `&cursor=${cursor}`;
    if (limit) url += `&limit=${limit}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      try {
        const errorData = await response.json();
        throw new Error(`Failed to fetch members: ${errorData.message || response.statusText}`);
      } catch (jsonError) {
        throw new Error(`Failed to fetch members: ${response.status} ${response.statusText}`);
      }
    }
    
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error('Error fetching channel members:', error);
    throw error;
  }
};

// Send message to a channel
export const sendChannelMessage = async (userId, channelId, message) => {
  try {
    if (!userId || !channelId || !message) {
      throw new Error('User ID, Channel ID, and message are required.');
    }
    
    const response = await fetch('/api/slack/send-message', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        channelId, // Changed from channel to channelId to match backend expectation
        message,
      }),
    });
    
    if (!response.ok) {
      try {
        const errorData = await response.json();
        throw new Error(`Failed to send message: ${errorData.message || response.statusText}`);
      } catch (jsonError) {
        throw new Error(`Failed to send message: ${response.status} ${response.statusText}`);
      }
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error sending message to channel:', error);
    throw error;
  }
};
