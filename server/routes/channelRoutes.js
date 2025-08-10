import express from 'express';
import * as slackController from '../controllers/slackController.js';
import * as slackChannelController from '../controllers/slackChannelController.js';

const router = express.Router();

// Channel routes
router.get('/channels', slackController.getChannels);
router.get('/channels/:channelId/messages', slackChannelController.getChannelMessages);
router.get('/channels/:channelId/info', slackChannelController.getChannelInfo);
router.get('/channels/:channelId/members', slackChannelController.getChannelMembers);

export default router;
