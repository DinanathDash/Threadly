import { getApiUrl } from '../config/api';
import logger from '../lib/logger';

// Submit a new support ticket
export const submitSupportTicket = async (ticketData) => {
  try {
    if (!ticketData.userId || !ticketData.subject || !ticketData.message) {
      throw new Error('User ID, subject and message are required.');
    }
    
    // Ensure we have the user's email and name
    if (!ticketData.email) {
      logger.warn('Email not provided in ticket data, may affect notifications');
    }
    
    logger.info('Submitting support ticket for user:', ticketData.userId);
    
    const response = await fetch(getApiUrl('/api/support/ticket'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
      },
      body: JSON.stringify(ticketData),
    });
    
    if (!response.ok) {
      try {
        const errorData = await response.json();
        throw new Error(`Failed to submit ticket: ${errorData.message || response.statusText}`);
      } catch (jsonError) {
        throw new Error(`Failed to submit ticket: ${response.status} ${response.statusText}`);
      }
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    logger.error('Error submitting support ticket:', error);
    throw error;
  }
};

// Get user's support tickets
export const getSupportTickets = async (userId) => {
  try {
    if (!userId) {
      throw new Error('User ID is required.');
    }
    
    logger.info('Fetching support tickets for user:', userId);
    
    const response = await fetch(getApiUrl(`/api/support/tickets?userId=${userId}`), {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
      }
    });
    
    if (!response.ok) {
      try {
        const errorData = await response.json();
        throw new Error(`Failed to fetch tickets: ${errorData.message || response.statusText}`);
      } catch (jsonError) {
        throw new Error(`Failed to fetch tickets: ${response.status} ${response.statusText}`);
      }
    }
    
    const data = await response.json();
    return data.tickets || [];
  } catch (error) {
    logger.error('Error fetching support tickets:', error);
    throw error;
  }
};

// Get a specific ticket by ID
export const getTicketById = async (ticketId) => {
  try {
    if (!ticketId) {
      throw new Error('Ticket ID is required.');
    }
    
    logger.info('Fetching ticket details for:', ticketId);
    
    const response = await fetch(getApiUrl(`/api/support/ticket/${ticketId}`), {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
      }
    });
    
    if (!response.ok) {
      try {
        const errorData = await response.json();
        throw new Error(`Failed to fetch ticket: ${errorData.message || response.statusText}`);
      } catch (jsonError) {
        throw new Error(`Failed to fetch ticket: ${response.status} ${response.statusText}`);
      }
    }
    
    const data = await response.json();
    return data.ticket;
  } catch (error) {
    logger.error('Error fetching ticket details:', error);
    throw error;
  }
};

// Add a response to an existing ticket
export const addTicketResponse = async (ticketId, responseData) => {
  try {
    if (!ticketId || !responseData.message) {
      throw new Error('Ticket ID and response message are required.');
    }
    
    logger.info('Adding response to ticket:', ticketId);
    
    const response = await fetch(getApiUrl(`/api/support/ticket/${ticketId}/response`), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
      },
      body: JSON.stringify(responseData),
    });
    
    if (!response.ok) {
      try {
        const errorData = await response.json();
        throw new Error(`Failed to add response: ${errorData.message || response.statusText}`);
      } catch (jsonError) {
        throw new Error(`Failed to add response: ${response.status} ${response.statusText}`);
      }
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    logger.error('Error adding ticket response:', error);
    throw error;
  }
};
