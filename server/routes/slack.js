import express from 'express';
import * as slackController from '../controllers/slackController.js';
import * as slackTestController from '../controllers/slackTestController.js';

const router = express.Router();

// OAuth routes
router.post('/oauth', slackController.handleOAuth);
router.post('/disconnect', slackController.disconnect);
router.post('/test-oauth', slackTestController.testOAuth);

// Messaging routes
router.post('/send-message', slackController.sendImmediateMessage);
router.post('/schedule-message', slackController.scheduleMessage);
router.post('/cancel-message', slackController.cancelMessage);

// Channel routes
router.get('/channels', slackController.getChannels);

export default router;
