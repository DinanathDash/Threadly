# Production Security Setup Guide

This guide explains how to set up the production environment for secure token management.

## Environment Variables

Add the following environment variables to your production environment:

```bash
# Production indicator
NODE_ENV=production

# Token encryption key (generate a strong random key)
TOKEN_ENCRYPTION_KEY=your-secure-random-key-at-least-32-chars

# Firebase Admin SDK configuration
# These should be set via your hosting provider's environment variables
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY=your-private-key
FIREBASE_CLIENT_EMAIL=your-client-email
FIREBASE_DATABASE_URL=https://your-project.firebaseio.com
```

## Generate Secure Encryption Key

To generate a secure random key:

```bash
# On macOS/Linux
openssl rand -base64 32

# On Windows (PowerShell)
$bytes = New-Object Byte[] 32
$rng = [System.Security.Cryptography.RNGCryptoServiceProvider]::new()
$rng.GetBytes($bytes)
[System.Convert]::ToBase64String($bytes)
```

## Firestore Security Rules

Set up the following Firestore security rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // User documents with tokens
    match /users/{userId} {
      // Only allow access to the user's own document
      allow read: if request.auth.uid == userId;
      allow write: if request.auth.uid == userId;
    }
    
    // Token audit logs - only writable by server, readable by admins
    match /tokenAuditLogs/{logId} {
      allow read: if request.auth.token.admin == true;
      allow write: if false; // Only allow writes from server-side code
    }
  }
}
```

## Token Refresh Monitoring

Set up monitoring to ensure the token refresh service is running:

1. Create alerts for failed token refreshes
2. Monitor token usage and expiration patterns
3. Set up error reporting for token-related operations

## Security Best Practices

1. **Rotate encryption keys**: Periodically rotate your encryption keys
2. **Review audit logs**: Regularly review token usage logs
3. **Implement rate limiting**: Limit token usage to prevent abuse
4. **Isolate token storage**: Keep token storage separate from other user data
5. **Implement MFA**: Require multi-factor authentication for user accounts

## Testing Token Security

Run the following tests before deploying:

1. Verify token encryption/decryption works correctly
2. Confirm tokens are properly refreshed before expiration
3. Test token revocation flow
4. Validate audit logging captures all token events
5. Verify only authorized users can access tokens

## Emergency Response

If tokens are compromised:

1. Revoke all affected tokens immediately
2. Rotate encryption keys
3. Force users to re-authenticate
4. Review audit logs for suspicious activity
5. Notify affected users if necessary
