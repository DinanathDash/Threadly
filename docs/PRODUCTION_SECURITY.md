# Production Security for Slack Tokens

This document outlines the proper security practices for token storage in production environments.

## Current Implementation

The application currently has a hybrid token storage approach:
- Primary storage in Firebase Firestore
- Fallback to local file storage for development

## Production Security Requirements

For a production environment, implement the following:

1. **Disable local file storage fallback**:
   - Set `NODE_ENV=production` to disable the fallback mechanism
   - Ensure proper error handling if token storage fails

2. **Encrypt sensitive tokens**:
   - Use a library like `crypto` to encrypt tokens before storage
   - Store encryption keys in a secure key management service (like AWS KMS, GCP KMS, or HashiCorp Vault)
   - Never store encryption keys in code or environment variables directly

3. **Configure proper Firebase security rules**:
   ```javascript
   // Example Firestore security rules
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       // User documents with tokens
       match /users/{userId} {
         // Only allow access to the user's own document
         allow read, write: if request.auth.uid == userId;
       }
     }
   }
   ```

4. **Implement token rotation**:
   - Refresh tokens before they expire
   - Implement a scheduled job to check token expiration
   - Our current code has the refresh logic but needs scheduled checks

5. **Audit logging**:
   - Log all token-related operations (creation, refresh, usage)
   - Store logs in a secure, tamper-proof location
   - Include only non-sensitive information in logs

## Implementation Guidelines

1. Add token encryption to the `storeTokens` function:
   ```javascript
   // Example encryption approach (for illustration)
   const encryptToken = (token) => {
     const cipher = crypto.createCipher('aes-256-cbc', process.env.ENCRYPTION_KEY);
     let encrypted = cipher.update(token, 'utf8', 'hex');
     encrypted += cipher.final('hex');
     return encrypted;
   };
   
   const decryptToken = (encryptedToken) => {
     const decipher = crypto.createDecipher('aes-256-cbc', process.env.ENCRYPTION_KEY);
     let decrypted = decipher.update(encryptedToken, 'hex', 'utf8');
     decrypted += decipher.final('utf8');
     return decrypted;
   };
   ```

2. Create a token refresh scheduler:
   ```javascript
   // Example scheduled task (for illustration)
   const scheduleTokenRefresh = () => {
     // Check for tokens nearing expiration every hour
     setInterval(async () => {
       // Get all tokens that expire in the next 24 hours
       const tokenSnapshot = await db.collection('users')
         .where('slackTokens.expiresAt', '<=', new Date(Date.now() + 86400000))
         .get();
       
       // Refresh each token
       for (const doc of tokenSnapshot.docs) {
         try {
           await refreshAccessToken(doc.id);
           console.log(`Auto-refreshed token for user ${doc.id}`);
         } catch (error) {
           console.error(`Failed to refresh token for user ${doc.id}:`, error);
         }
       }
     }, 3600000); // 1 hour
   };
   ```

3. Implement proper environment validation:
   ```javascript
   // Add to your server startup code
   if (process.env.NODE_ENV === 'production') {
     // Validate all required security configurations
     if (!process.env.ENCRYPTION_KEY) {
       throw new Error('ENCRYPTION_KEY must be set in production');
     }
     
     // Start the token refresh scheduler
     scheduleTokenRefresh();
   }
   ```

## References

1. [OWASP Secure Storage Guidelines](https://owasp.org/www-project-cheat-sheets/cheatsheets/Cryptographic_Storage_Cheat_Sheet.html)
2. [Firebase Security Best Practices](https://firebase.google.com/docs/rules/basics)
3. [Slack Token Security Guidelines](https://api.slack.com/authentication/best-practices)
