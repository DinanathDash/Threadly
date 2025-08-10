import express from 'express';
import { getTokenStatus, forceTokenMigration } from '../controllers/tokenStatusController.js';

const router = express.Router();

// Get token status for all users
router.get('/status', getTokenStatus);

// Force migrate tokens to rotation model
router.post('/migrate', forceTokenMigration);

export default router;
