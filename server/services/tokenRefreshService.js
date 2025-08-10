import cron from 'node-cron';
import { db } from '../config/firebase.js';
import { refreshAccessToken, exchangeLongLivedToken } from './slackTokenService.js';
import axios from 'axios';

// Check for tokens that need to be migrated to the rotation model
export const migrateTokensToRotationModel = async () => {
  try {
    console.log('Checking for tokens that need migration to rotation model...');
    
    // Query for users without refresh tokens
    const usersWithoutRefreshToken = await db.collection('users')
      .where('slackTokens.refreshToken', '==', null)
      .get();
      
    console.log(`Found ${usersWithoutRefreshToken.size} tokens without refresh tokens`);
    
    let migratedCount = 0;
    let errorCount = 0;
    
    // Process each token
    for (const doc of usersWithoutRefreshToken.docs) {
      try {
        const userData = doc.data();
        
        // Skip if no access token exists
        if (!userData.slackTokens?.accessToken) {
          continue;
        }
        
        console.log(`Migrating token for user: ${doc.id}`);
        await exchangeLongLivedToken(doc.id);
        console.log(`Successfully migrated token for user: ${doc.id}`);
        migratedCount++;
      } catch (error) {
        console.error(`Failed to migrate token for user ${doc.id}:`, error);
        errorCount++;
      }
    }
    
    console.log(`Migration complete. Migrated: ${migratedCount}, Errors: ${errorCount}`);
    return { migratedCount, errorCount };
  } catch (error) {
    console.error('Error migrating tokens:', error);
    throw error;
  }
};

// Schedule to run every hour
export const startTokenRefreshScheduler = () => {
  console.log('Starting Slack token refresh scheduler with rotation support');
  
  // Run migration check on startup
  migrateTokensToRotationModel().catch(error => {
    console.error('Error running initial token migration:', error);
  });
  
  // Schedule job to run every hour (for token rotation, more frequent checks are needed)
  // Slack tokens now expire after 12 hours instead of having no expiration
  cron.schedule('0 */2 * * *', async () => {
    try {
      console.log('Running scheduled token refresh check...');
      
      // Get tokens that expire in the next 4 hours
      // We use a shorter window now since tokens expire faster with rotation
      const now = new Date();
      const fourHoursFromNow = new Date(now.getTime() + 4 * 60 * 60 * 1000);
      
      console.log(`Looking for tokens that expire before: ${fourHoursFromNow.toISOString()}`);
      
      try {
        // Query Firestore for tokens that need refreshing
        const tokenSnapshot = await db.collection('users')
          .where('slackTokens.expiresAt', '<=', fourHoursFromNow)
          .get();
          
        console.log(`Found ${tokenSnapshot.size} tokens that need refreshing`);
        
        // Process each token
        for (const doc of tokenSnapshot.docs) {
          try {
            console.log(`Refreshing token for user: ${doc.id}`);
            await refreshAccessToken(doc.id);
            console.log(`Successfully refreshed token for user: ${doc.id}`);
          } catch (error) {
            console.error(`Failed to refresh token for user ${doc.id}:`, error);
          }
        }
        
        // Also check for any tokens that need migration
        await migrateTokensToRotationModel();
        
      } catch (error) {
        console.error('Error querying tokens for refresh:', error);
      }
    } catch (error) {
      console.error('Unexpected error in token refresh scheduler:', error);
    }
  });
  
  console.log('Token refresh scheduler started with rotation support');
};
