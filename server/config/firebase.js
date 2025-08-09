import admin from 'firebase-admin';
import { fileURLToPath } from 'url';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Firebase Admin
// Try to initialize with environment variables directly instead of a file path
try {
  // Check if we have the necessary environment variables for service account
  if (process.env.FIREBASE_PROJECT_ID && 
      process.env.FIREBASE_PRIVATE_KEY && 
      process.env.FIREBASE_CLIENT_EMAIL) {
    
    // Use environment variables to create service account credential
    const serviceAccount = {
      projectId: process.env.FIREBASE_PROJECT_ID,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL
    };
    
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: process.env.FIREBASE_DATABASE_URL
    });
    
    console.log('Firebase Admin initialized with environment variables');
  } else {
    // Try application default credentials as fallback
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      databaseURL: process.env.FIREBASE_DATABASE_URL
    });
    
    console.log('Firebase Admin initialized with application default credentials');
  }
} catch (error) {
  console.error('Error initializing Firebase Admin:', error);
  throw error;
}

const db = admin.firestore();

// Configure Firestore settings
db.settings({
  ignoreUndefinedProperties: true // This will ignore undefined values in documents
});

export { admin, db };
