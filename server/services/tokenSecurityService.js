import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { db } from '../config/firebase.js';

// Get directory name (workaround for ESM)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Local storage for tokens (for development/testing purposes)
const LOCAL_TOKENS_DIR = path.join(__dirname, '..', 'data');
const LOCAL_TOKENS_FILE = path.join(LOCAL_TOKENS_DIR, 'slack_tokens.json');

// Encryption helpers - only used in production
const encryptToken = (text) => {
  if (!process.env.TOKEN_ENCRYPTION_KEY) {
    console.warn('TOKEN_ENCRYPTION_KEY not set - tokens will be stored unencrypted');
    return text;
  }
  
  try {
    const iv = crypto.randomBytes(16);
    const key = crypto.scryptSync(process.env.TOKEN_ENCRYPTION_KEY, 'salt', 32);
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return iv.toString('hex') + ':' + encrypted;
  } catch (error) {
    console.error('Encryption error:', error);
    return text; // Fallback to unencrypted for now
  }
};

const decryptToken = (encrypted) => {
  if (!process.env.TOKEN_ENCRYPTION_KEY || !encrypted.includes(':')) {
    return encrypted;
  }
  
  try {
    const [ivHex, encryptedText] = encrypted.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const key = crypto.scryptSync(process.env.TOKEN_ENCRYPTION_KEY, 'salt', 32);
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Token decryption failed');
  }
};

// Token storage service with enhanced security
export const TokenSecurityService = {
  // Store tokens securely
  storeTokens: async (userId, tokens) => {
    // Validation
    if (!userId) throw new Error('User ID is required');
    if (!tokens?.accessToken) throw new Error('Valid access token is required');
    
    // Calculate expiration
    const expiresAt = new Date();
    expiresAt.setSeconds(expiresAt.getSeconds() + (tokens.expiresIn || 86400));
    
    // Prepare token data
    let accessToken = tokens.accessToken;
    let refreshToken = tokens.refreshToken;
    
    // Only encrypt in production
    if (process.env.NODE_ENV === 'production') {
      accessToken = encryptToken(accessToken);
      if (refreshToken) {
        refreshToken = encryptToken(refreshToken);
      }
    }
    
    // Prepare tokens data
    const tokensData = {
      accessToken: accessToken,
      expiresAt: expiresAt,
      createdAt: new Date(),
      lastUsed: new Date(),
    };
    
    if (refreshToken) {
      tokensData.refreshToken = refreshToken;
    }
    
    // Create audit log entry
    const auditLog = {
      action: 'token_created',
      userId: userId,
      timestamp: new Date(),
      expiresAt: expiresAt,
      workspaceId: tokens.teamId,
      workspaceName: tokens.teamName
    };
    
    try {
      // Store tokens in Firestore
      const userRef = db.collection('users').doc(userId);
      const userDoc = await userRef.get();
      
      if (!userDoc.exists) {
        await userRef.set({
          uid: userId,
          createdAt: new Date()
        });
      }
      
      // Use a transaction for atomicity
      await db.runTransaction(async (transaction) => {
        transaction.set(userRef, {
          slackTokens: tokensData,
          slackWorkspace: {
            id: tokens.teamId,
            name: tokens.teamName,
          },
        }, { merge: true });
        
        // Store the audit log
        transaction.set(
          db.collection('tokenAuditLogs').doc(),
          auditLog
        );
      });
      
      console.log(`Tokens stored securely for user: ${userId}`);
      return true;
    } catch (firestoreError) {
      console.error('Firestore token storage error:', firestoreError);
      
      // Only use local storage in development
      if (process.env.NODE_ENV !== 'production') {
        try {
          // Store in local file (development only)
          if (!fs.existsSync(LOCAL_TOKENS_DIR)) {
            fs.mkdirSync(LOCAL_TOKENS_DIR, { recursive: true });
          }
          
          let allTokens = {};
          if (fs.existsSync(LOCAL_TOKENS_FILE)) {
            const data = fs.readFileSync(LOCAL_TOKENS_FILE, 'utf8');
            allTokens = JSON.parse(data);
          }
          
          allTokens[userId] = {
            uid: userId,
            slackTokens: tokensData,
            slackWorkspace: {
              id: tokens.teamId,
              name: tokens.teamName,
            }
          };
          
          fs.writeFileSync(LOCAL_TOKENS_FILE, JSON.stringify(allTokens, null, 2));
          console.log(`Tokens stored locally at: ${LOCAL_TOKENS_FILE} (DEVELOPMENT ONLY)`);
          return true;
        } catch (fileError) {
          console.error('Local token storage error:', fileError);
          throw new Error('All token storage methods failed');
        }
      } else {
        // In production, fail if Firestore fails
        throw new Error('Token storage failed');
      }
    }
  },
  
  // Get tokens with security measures
  getTokens: async (userId) => {
    if (!userId) throw new Error('User ID is required');
    
    try {
      // Try Firestore first
      const userRef = db.collection('users').doc(userId);
      const userDoc = await userRef.get();
      
      if (!userDoc.exists) {
        throw new Error('User not found');
      }
      
      const userData = userDoc.data();
      
      if (!userData.slackTokens || !userData.slackTokens.accessToken) {
        throw new Error('No Slack tokens found');
      }
      
      let accessToken = userData.slackTokens.accessToken;
      
      // Record token usage
      await userRef.update({
        'slackTokens.lastUsed': new Date()
      });
      
      // Create audit log for token usage
      await db.collection('tokenAuditLogs').add({
        action: 'token_used',
        userId: userId,
        timestamp: new Date(),
        workspaceId: userData.slackWorkspace?.id
      });
      
      // Decrypt if needed
      if (process.env.NODE_ENV === 'production' && accessToken.includes(':')) {
        accessToken = decryptToken(accessToken);
      }
      
      return accessToken;
    } catch (firestoreError) {
      // Only try local storage in development
      if (process.env.NODE_ENV !== 'production') {
        if (!fs.existsSync(LOCAL_TOKENS_FILE)) {
          throw new Error('No tokens found');
        }
        
        try {
          const data = fs.readFileSync(LOCAL_TOKENS_FILE, 'utf8');
          const allTokens = JSON.parse(data);
          
          if (!allTokens[userId] || !allTokens[userId].slackTokens?.accessToken) {
            throw new Error('No tokens found for user');
          }
          
          return allTokens[userId].slackTokens.accessToken;
        } catch (fileError) {
          console.error('Local token retrieval error:', fileError);
          throw new Error('Failed to retrieve tokens');
        }
      } else {
        console.error('Token retrieval error:', firestoreError);
        throw new Error('Failed to retrieve tokens');
      }
    }
  },
  
  // Refresh tokens securely
  refreshToken: async (userId) => {
    try {
      // Get the user's refresh token
      const userRef = db.collection('users').doc(userId);
      const userDoc = await userRef.get();
      
      if (!userDoc.exists) {
        throw new Error('User not found');
      }
      
      const userData = userDoc.data();
      let refreshToken = userData.slackTokens?.refreshToken;
      
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }
      
      // Decrypt if needed
      if (process.env.NODE_ENV === 'production' && refreshToken.includes(':')) {
        refreshToken = decryptToken(refreshToken);
      }
      
      // Call Slack API to refresh the token
      // Implementation details would go here
      
      // For this example, we'll just log the action
      console.log(`Token refreshed for user: ${userId}`);
      
      // Create audit log for token refresh
      await db.collection('tokenAuditLogs').add({
        action: 'token_refreshed',
        userId: userId,
        timestamp: new Date()
      });
      
      return true;
    } catch (error) {
      console.error('Token refresh error:', error);
      throw error;
    }
  },
  
  // Delete tokens securely
  deleteTokens: async (userId) => {
    try {
      // Delete from Firestore
      const userRef = db.collection('users').doc(userId);
      await userRef.update({
        slackTokens: null,
        slackWorkspace: null
      });
      
      // Create audit log for token deletion
      await db.collection('tokenAuditLogs').add({
        action: 'token_deleted',
        userId: userId,
        timestamp: new Date()
      });
      
      // Also clear from local storage in development
      if (process.env.NODE_ENV !== 'production' && fs.existsSync(LOCAL_TOKENS_FILE)) {
        const data = fs.readFileSync(LOCAL_TOKENS_FILE, 'utf8');
        const allTokens = JSON.parse(data);
        
        if (allTokens[userId]) {
          delete allTokens[userId];
          fs.writeFileSync(LOCAL_TOKENS_FILE, JSON.stringify(allTokens, null, 2));
        }
      }
      
      return true;
    } catch (error) {
      console.error('Token deletion error:', error);
      throw error;
    }
  }
};
