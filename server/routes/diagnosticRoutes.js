import express from 'express';
import diagnosticController from '../controllers/diagnosticController.js';

const router = express.Router();

// Test OAuth configuration
router.post('/test-oauth', diagnosticController.testOAuthConfig);

export default router;
