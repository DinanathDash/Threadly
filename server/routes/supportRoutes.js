import express from 'express';
import supportController from '../controllers/supportController.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// Submit a new support ticket
router.post('/ticket', verifyToken, supportController.submitTicket);

// Get user's support tickets
router.get('/tickets', verifyToken, supportController.getTickets);

// Get a specific ticket by ID
router.get('/ticket/:ticketId', verifyToken, supportController.getTicketById);

// Add a response to a ticket
router.post('/ticket/:ticketId/response', verifyToken, supportController.addTicketResponse);

// Update a ticket's status
router.patch('/ticket/:ticketId/status', verifyToken, supportController.updateTicketStatus);

export default router;
