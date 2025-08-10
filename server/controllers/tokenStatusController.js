import { db } from '../config/firebase.js';
import { migrateTokensToRotationModel } from '../services/tokenRefreshService.js';

// Get token status for all users
export const getTokenStatus = async (req, res) => {
  try {
    // Check for admin authorization
    // In production, you should implement proper authentication here
    
    console.log('Getting token status for all users');
    
    const usersRef = db.collection('users');
    const snapshot = await usersRef.get();
    
    if (snapshot.empty) {
      return res.json({ message: 'No users found', users: [] });
    }
    
    const users = [];
    
    for (const doc of snapshot.docs) {
      const userData = doc.data();
      const userId = doc.id;
      
      // Only include users with slack tokens
      if (userData.slackTokens) {
        const accessToken = userData.slackTokens.accessToken || 'missing';
        const tokenPrefix = accessToken.substring(0, 4);
        
        let expiresAt = 'N/A';
        let timeRemaining = 'N/A';
        
        if (userData.slackTokens.expiresAt) {
          try {
            const expDate = userData.slackTokens.expiresAt.toDate 
              ? userData.slackTokens.expiresAt.toDate() 
              : new Date(userData.slackTokens.expiresAt);
              
            expiresAt = expDate.toISOString();
            
            // Calculate time remaining
            const now = new Date();
            const diffMs = expDate - now;
            const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
            const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
            
            timeRemaining = `${diffHrs}h ${diffMins}m`;
          } catch (e) {
            expiresAt = 'Invalid date';
          }
        }
        
        users.push({
          userId,
          workspace: userData.slackWorkspace?.name || 'Unknown',
          tokenPrefix,
          hasRefreshToken: !!userData.slackTokens.refreshToken,
          expiresAt,
          timeRemaining,
          lastRefreshed: userData.slackTokens.lastRefreshed 
            ? (userData.slackTokens.lastRefreshed.toDate 
              ? userData.slackTokens.lastRefreshed.toDate().toISOString()
              : new Date(userData.slackTokens.lastRefreshed).toISOString())
            : 'Never'
        });
      }
    }
    
    return res.json({
      message: `Found ${users.length} users with Slack tokens`,
      users
    });
    
  } catch (error) {
    console.error('Error getting token status:', error);
    return res.status(500).json({ error: 'Failed to get token status' });
  }
};

// Force migrate tokens to rotation model
export const forceTokenMigration = async (req, res) => {
  try {
    // Check for admin authorization
    // In production, you should implement proper authentication here
    
    console.log('Force migrating tokens to rotation model');
    
    const result = await migrateTokensToRotationModel();
    
    return res.json({
      message: 'Migration completed',
      result
    });
    
  } catch (error) {
    console.error('Error migrating tokens:', error);
    return res.status(500).json({ error: 'Failed to migrate tokens' });
  }
};
