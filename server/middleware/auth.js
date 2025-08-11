import { admin } from '../config/firebase.js';
import logger from '../utils/logger.js';

// Middleware to verify Firebase Authentication tokens
export const verifyToken = async (req, res, next) => {
  try {
    // Get the authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        status: 'error',
        message: 'Unauthorized: No token provided'
      });
    }
    
    // Extract the token
    const token = authHeader.split('Bearer ')[1];
    
    if (!token) {
      return res.status(401).json({
        status: 'error',
        message: 'Unauthorized: Invalid token format'
      });
    }
    
    // Verify the token
    const decodedToken = await admin.auth().verifyIdToken(token);
    
    // Add the user information to the request object
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      emailVerified: decodedToken.email_verified,
      displayName: decodedToken.name
    };
    
    // Continue to the next middleware/route handler
    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    
    return res.status(401).json({
      status: 'error',
      message: 'Unauthorized: Invalid token'
    });
  }
};
