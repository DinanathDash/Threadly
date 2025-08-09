import { db } from './firebase';
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, query, where, Timestamp } from 'firebase/firestore';

// Sends an immediate message to Slack
export const sendImmediateMessage = async (userId, channelId, message) => {
  try {
    const response = await fetch('/api/slack/send-message', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        channelId,
        message,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to send message');
    }

    return await response.json();
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
};

// Schedules a message to be sent later
export const scheduleMessage = async (userId, channelId, message, scheduledTime) => {
  try {
    // Store the scheduled message in Firestore
    const scheduledMessage = {
      userId,
      channelId,
      message,
      scheduledTime: Timestamp.fromDate(new Date(scheduledTime)),
      status: 'scheduled',
      createdAt: Timestamp.now()
    };

    const docRef = await addDoc(collection(db, 'scheduledMessages'), scheduledMessage);
    
    // Also tell our backend about it to schedule the actual job
    const response = await fetch('/api/slack/schedule-message', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        channelId,
        message,
        scheduledTime,
        messageId: docRef.id
      }),
    });

    if (!response.ok) {
      // If backend scheduling fails, update status to failed
      await updateDoc(doc(db, 'scheduledMessages', docRef.id), {
        status: 'failed'
      });
      throw new Error('Failed to schedule message with server');
    }

    return docRef.id;
  } catch (error) {
    console.error('Error scheduling message:', error);
    throw error;
  }
};

// Gets all scheduled messages for a user
export const getScheduledMessages = async (userId) => {
  try {
    const q = query(
      collection(db, 'scheduledMessages'),
      where('userId', '==', userId),
      where('status', '==', 'scheduled')
    );
    
    const querySnapshot = await getDocs(q);
    
    const messages = [];
    querySnapshot.forEach(doc => {
      messages.push({
        id: doc.id,
        ...doc.data(),
        // Convert Firestore Timestamp to JS Date
        scheduledTime: doc.data().scheduledTime.toDate(),
        createdAt: doc.data().createdAt.toDate()
      });
    });
    
    return messages;
  } catch (error) {
    console.error('Error fetching scheduled messages:', error);
    throw error;
  }
};

// Cancels a scheduled message
export const cancelScheduledMessage = async (messageId) => {
  try {
    // Get the message first to verify it exists and get its details
    const messageRef = doc(db, 'scheduledMessages', messageId);
    
    // Update the message status in Firestore
    await updateDoc(messageRef, {
      status: 'cancelled',
      cancelledAt: Timestamp.now()
    });
    
    // Also tell our backend to cancel the job
    const response = await fetch('/api/slack/cancel-message', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ messageId }),
    });

    if (!response.ok) {
      throw new Error('Failed to cancel scheduled message with server');
    }

    return true;
  } catch (error) {
    console.error('Error cancelling message:', error);
    throw error;
  }
};
