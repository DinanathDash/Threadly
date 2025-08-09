import cron from 'node-cron';
import { db } from '../config/firebase.js';
import { refreshAccessToken } from '../services/slackTokenService.js';

// Schedule to run every hour
export const startTokenRefreshScheduler = () => {
  console.log('Starting Slack token refresh scheduler');
  
  // Schedule job to run every hour
  cron.schedule('0 * * * *', async () => {
    try {
      console.log('Running scheduled token refresh check...');
      
      // Get tokens that expire in the next 24 hours
      const now = new Date();
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      
      console.log(`Looking for tokens that expire before: ${tomorrow.toISOString()}`);
      
      try {
        // Query Firestore for tokens that need refreshing
        const tokenSnapshot = await db.collection('users')
          .where('slackTokens.expiresAt', '<=', tomorrow)
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
      } catch (error) {
        console.error('Error querying tokens for refresh:', error);
      }
    } catch (error) {
      console.error('Unexpected error in token refresh scheduler:', error);
    }
  });
  
  console.log('Token refresh scheduler started');
};
