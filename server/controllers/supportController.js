import nodemailer from 'nodemailer';
import logger from '../utils/logger.js';
import { db, admin } from '../config/firebase.js';

// Create a controller to handle support tickets
export const submitTicket = async (req, res, next) => {
  try {
    const { userId, subject, message, priority, email, name } = req.body;
    
    if (!subject || !message) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'Subject and message are required' 
      });
    }
    
    if (!userId) {
      return res.status(400).json({
        status: 'error',
        message: 'User ID is required'
      });
    }
    
    // Generate a ticket ID with format TKT-XXXX
    const ticketNumber = Math.floor(1000 + Math.random() * 9000);
    const ticketId = `TKT-${ticketNumber}`;
    
    // Store ticket in database
    const ticketRef = await db.collection('supportTickets').doc(ticketId).set({
      ticketId,
      userId,
      subject,
      message,
      priority: priority || 'normal',
      email,
      name,
      status: 'open',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      responses: []
    });
    
    logger.info(`Support ticket ${ticketId} created for user ${userId}`);
    
    // Send email notifications
    await sendTicketEmails(email, name, subject, message, priority);
    
    res.status(200).json({
      status: 'success',
      message: 'Support ticket submitted successfully',
      ticketId
    });
  } catch (error) {
    logger.error('Error submitting support ticket:', error);
    next(error);
  }
};

// Get user's support tickets
export const getTickets = async (req, res, next) => {
  try {
    const { userId } = req.query;
    
    if (!userId) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'User ID is required' 
      });
    }
    
    // Get tickets from database
    const ticketsSnapshot = await db.collection('supportTickets')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .get();
    
    if (ticketsSnapshot.empty) {
      logger.info(`No tickets found for user ${userId}`);
      return res.status(200).json({
        status: 'success',
        tickets: []
      });
    }
    
    // Convert Firestore documents to plain objects
    const tickets = ticketsSnapshot.docs.map(doc => {
      const data = doc.data();
      
      // Convert Firestore Timestamp to ISO string if it exists
      if (data.createdAt) {
        data.createdAt = data.createdAt.toDate().toISOString();
      }
      
      if (data.updatedAt) {
        data.updatedAt = data.updatedAt.toDate().toISOString();
      }
      
      return {
        id: data.ticketId || doc.id,
        ...data
      };
    });
    
    logger.info(`Retrieved ${tickets.length} tickets for user ${userId}`);
    
    res.status(200).json({
      status: 'success',
      tickets
    });
  } catch (error) {
    logger.error('Error fetching support tickets:', error);
    next(error);
  }
};

// Function to send email notifications for new support tickets
const sendTicketEmails = async (userEmail, userName, subject, message, priority) => {
  try {
    // Check if email configuration exists in environment variables
    if (!process.env.EMAIL_HOST || !process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      logger.warn('Email configuration not found in environment variables. Using test account.');
    }
    
    // Create a transporter object using environment variables or fallback to test account
    let transporter;
    
    if (process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      // Use environment variables for production
      transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: parseInt(process.env.EMAIL_PORT || '587'),
        secure: process.env.EMAIL_SECURE === 'true',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        },
        // Additional options for Gmail
        tls: {
          rejectUnauthorized: false
        }
      });
    } else {
      // Create a test account for development
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass
        }
      });
    }
    
    // Log transporter ready state
    logger.info('Transporter created and ready to send emails');
    
    // Verify SMTP connection configuration
    await new Promise((resolve, reject) => {
      transporter.verify(function (error, success) {
        if (error) {
          logger.error('SMTP connection verification failed:', error);
          reject(error);
        } else {
          logger.info('SMTP connection verified, server is ready to send emails');
          resolve(success);
        }
      });
    });
    
    // Email to the user who submitted the ticket
    const userEmailResult = await transporter.sendMail({
      from: `"${process.env.EMAIL_FROM_NAME || 'Threadly Support'}" <${process.env.EMAIL_FROM_ADDRESS || 'support@threadly.app'}>`,
      to: userEmail,
      subject: `[Threadly Support] Ticket Received: ${subject}`,
      html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #4f46e5; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0;">Threadly Support</h1>
        </div>
        <div style="padding: 20px; border: 1px solid #e5e7eb; border-top: none;">
          <h2>Support Ticket Received</h2>
          <p>Hello ${userName || 'there'},</p>
          <p>Thank you for contacting Threadly Support. We have received your ticket and will respond as soon as possible.</p>
          <div style="background-color: #f9fafb; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Ticket Details:</h3>
            <p><strong>Subject:</strong> ${subject}</p>
            <p><strong>Priority:</strong> ${priority}</p>
            <p><strong>Your message:</strong></p>
            <p style="white-space: pre-line;">${message}</p>
          </div>
          <p>If you have any additional information to add, please reply to this email.</p>
          <p>Best regards,<br>The Threadly Support Team</p>
        </div>
        <div style="text-align: center; padding: 10px; font-size: 12px; color: #6b7280;">
          &copy; ${new Date().getFullYear()} Threadly. All rights reserved.
        </div>
      </div>
      `
    });
    
    logger.info('User notification email sent successfully');
    
    // Email to the support team (admin)
    const adminEmailResult = await transporter.sendMail({
      from: `"${process.env.EMAIL_SYSTEM_NAME || 'Threadly Support System'}" <${process.env.EMAIL_NOREPLY_ADDRESS || 'noreply@threadly.app'}>`,
      to: process.env.ADMIN_EMAIL || process.env.SUPPORT_EMAIL || process.env.EMAIL_ADMIN_ADDRESS || 'admin@threadly.app',
      subject: `[New Support Ticket] ${priority.toUpperCase()}: ${subject}`,
      html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: ${priority === 'high' ? '#ef4444' : '#4f46e5'}; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0;">New Support Ticket</h1>
          <p style="margin: 5px 0 0 0;">${priority.toUpperCase()} PRIORITY</p>
        </div>
        <div style="padding: 20px; border: 1px solid #e5e7eb; border-top: none;">
          <h2>Ticket Details</h2>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>From:</strong></td>
              <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${userName} (${userEmail})</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Subject:</strong></td>
              <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${subject}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Priority:</strong></td>
              <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${priority}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;"><strong>Time:</strong></td>
              <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">${new Date().toLocaleString()}</td>
            </tr>
          </table>
          <div style="background-color: #f9fafb; padding: 15px; border-radius: 5px;">
            <h3 style="margin-top: 0;">Message:</h3>
            <p style="white-space: pre-line;">${message}</p>
          </div>
          <div style="margin-top: 20px;">
            <p>Please log in to the admin dashboard to respond to this ticket.</p>
          </div>
        </div>
      </div>
      `
    });
    
    logger.info('Admin notification email sent successfully');
    return true;
  } catch (error) {
    logger.error('Error sending support ticket emails:', error);
    return false;
  }
};

// Get a specific ticket by ID
export const getTicketById = async (req, res, next) => {
  try {
    const { ticketId } = req.params;
    
    if (!ticketId) {
      return res.status(400).json({
        status: 'error',
        message: 'Ticket ID is required'
      });
    }
    
    // Get ticket from database
    const ticketDoc = await db.collection('supportTickets').doc(ticketId).get();
    
    if (!ticketDoc.exists) {
      logger.info(`Ticket ${ticketId} not found`);
      return res.status(404).json({
        status: 'error',
        message: 'Ticket not found'
      });
    }
    
    const ticketData = ticketDoc.data();
    
    // Ensure the requesting user has access to this ticket
    // Only allow access if the user is the ticket creator or an admin
    if (req.user && req.user.uid !== ticketData.userId && !req.user.isAdmin) {
      logger.warn(`Unauthorized access attempt for ticket ${ticketId} by user ${req.user.uid}`);
      return res.status(403).json({
        status: 'error',
        message: 'You do not have permission to view this ticket'
      });
    }
    
    // Convert Firestore Timestamp to ISO string if it exists
    if (ticketData.createdAt) {
      ticketData.createdAt = ticketData.createdAt.toDate().toISOString();
    }
    
    if (ticketData.updatedAt) {
      ticketData.updatedAt = ticketData.updatedAt.toDate().toISOString();
    }
    
    // Process response timestamps if they exist
    if (ticketData.responses && Array.isArray(ticketData.responses)) {
      ticketData.responses = ticketData.responses.map(response => {
        if (response.createdAt && typeof response.createdAt.toDate === 'function') {
          return {
            ...response,
            createdAt: response.createdAt.toDate().toISOString()
          };
        }
        return response;
      });
    }
    
    const ticket = {
      id: ticketData.ticketId || ticketDoc.id,
      ...ticketData
    };
    
    logger.info(`Retrieved ticket details for ticket ${ticketId}`);
    
    res.status(200).json({
      status: 'success',
      ticket
    });
  } catch (error) {
    logger.error('Error fetching ticket details:', error);
    next(error);
  }
};

// Add a response to a ticket
export const addTicketResponse = async (req, res, next) => {
  try {
    const { ticketId } = req.params;
    const { message, isAdmin, name } = req.body;
    
    if (!ticketId || !message) {
      return res.status(400).json({
        status: 'error',
        message: 'Ticket ID and message are required'
      });
    }
    
    // Get ticket from database
    const ticketRef = db.collection('supportTickets').doc(ticketId);
    const ticketDoc = await ticketRef.get();
    
    if (!ticketDoc.exists) {
      logger.info(`Ticket ${ticketId} not found for adding response`);
      return res.status(404).json({
        status: 'error',
        message: 'Ticket not found'
      });
    }
    
    const ticketData = ticketDoc.data();
    
    // Create response object with current timestamp instead of serverTimestamp()
    const now = new Date();
    const response = {
      message,
      isAdmin: !!isAdmin,
      name: name || (isAdmin ? 'Support Agent' : 'User'),
      createdAt: now.toISOString()  // Use an ISO string instead of serverTimestamp()
    };
    
    // Update ticket with new response
    const responses = ticketData.responses || [];
    responses.push(response);
    
    await ticketRef.update({
      responses,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      status: isAdmin ? 'in-progress' : ticketData.status
    });
    
    // Send email notification if it's a response from support
    if (isAdmin && ticketData.email) {
      const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST || 'smtp.ethereal.email',
        port: parseInt(process.env.EMAIL_PORT || '587'),
        secure: process.env.EMAIL_SECURE === 'true',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      });
      
      await transporter.sendMail({
        from: `"${process.env.EMAIL_FROM_NAME || 'Threadly Support'}" <${process.env.EMAIL_FROM_ADDRESS || 'support@threadly.app'}>`,
        to: ticketData.email,
        subject: `[Threadly Support] Update on Ticket: ${ticketData.subject}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background-color: #4f46e5; color: white; padding: 20px; text-align: center;">
              <h1 style="margin: 0;">Threadly Support</h1>
            </div>
            <div style="padding: 20px; border: 1px solid #e5e7eb; border-top: none;">
              <h2>New Response to Your Support Ticket</h2>
              <p>Hello ${ticketData.name || 'there'},</p>
              <p>We've added a response to your support ticket regarding "${ticketData.subject}".</p>
              <div style="background-color: #f9fafb; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <h3 style="margin-top: 0;">Response:</h3>
                <p style="white-space: pre-line;">${message}</p>
              </div>
              <p>If you have any additional questions, please reply to this email or log into your account to respond.</p>
              <p>Best regards,<br>The Threadly Support Team</p>
            </div>
            <div style="text-align: center; padding: 10px; font-size: 12px; color: #6b7280;">
              &copy; ${new Date().getFullYear()} Threadly. All rights reserved.
            </div>
          </div>
        `
      });
    }
    
    logger.info(`Response added to ticket ${ticketId}`);
    
    res.status(200).json({
      status: 'success',
      message: 'Response added successfully',
      ticketId
    });
  } catch (error) {
    logger.error('Error adding ticket response:', error);
    next(error);
  }
};

// Update ticket status
export const updateTicketStatus = async (req, res, next) => {
  try {
    const { ticketId } = req.params;
    const { status } = req.body;
    
    if (!ticketId || !status) {
      return res.status(400).json({
        status: 'error',
        message: 'Ticket ID and status are required'
      });
    }
    
    // Validate status
    const validStatuses = ['open', 'in-progress', 'resolved', 'closed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid status. Must be one of: open, in-progress, resolved, closed'
      });
    }
    
    // Get ticket from database
    const ticketRef = db.collection('supportTickets').doc(ticketId);
    const ticketDoc = await ticketRef.get();
    
    if (!ticketDoc.exists) {
      logger.info(`Ticket ${ticketId} not found for status update`);
      return res.status(404).json({
        status: 'error',
        message: 'Ticket not found'
      });
    }
    
    // Update status
    await ticketRef.update({
      status,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // Send email notification if ticket is resolved or closed
    const ticketData = ticketDoc.data();
    if ((status === 'resolved' || status === 'closed') && ticketData.email) {
      const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST || 'smtp.ethereal.email',
        port: parseInt(process.env.EMAIL_PORT || '587'),
        secure: process.env.EMAIL_SECURE === 'true',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      });
      
      await transporter.sendMail({
        from: `"${process.env.EMAIL_FROM_NAME || 'Threadly Support'}" <${process.env.EMAIL_FROM_ADDRESS || 'support@threadly.app'}>`,
        to: ticketData.email,
        subject: `[Threadly Support] Ticket ${status === 'resolved' ? 'Resolved' : 'Closed'}: ${ticketData.subject}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background-color: #4f46e5; color: white; padding: 20px; text-align: center;">
              <h1 style="margin: 0;">Threadly Support</h1>
            </div>
            <div style="padding: 20px; border: 1px solid #e5e7eb; border-top: none;">
              <h2>Support Ticket ${status === 'resolved' ? 'Resolved' : 'Closed'}</h2>
              <p>Hello ${ticketData.name || 'there'},</p>
              <p>Your support ticket regarding "${ticketData.subject}" has been marked as ${status}.</p>
              <div style="background-color: #f9fafb; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <p>If you feel that your issue has not been fully addressed, please reply to this email or create a new ticket.</p>
              </div>
              <p>Thank you for using Threadly!</p>
              <p>Best regards,<br>The Threadly Support Team</p>
            </div>
            <div style="text-align: center; padding: 10px; font-size: 12px; color: #6b7280;">
              &copy; ${new Date().getFullYear()} Threadly. All rights reserved.
            </div>
          </div>
        `
      });
    }
    
    logger.info(`Ticket ${ticketId} status updated to ${status}`);
    
    res.status(200).json({
      status: 'success',
      message: `Ticket status updated to ${status}`,
      ticketId
    });
  } catch (error) {
    logger.error('Error updating ticket status:', error);
    next(error);
  }
};

export default {
  submitTicket,
  getTickets,
  getTicketById,
  addTicketResponse,
  updateTicketStatus
};
