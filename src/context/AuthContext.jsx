import { createContext, useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut as firebaseSignOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
  getAuth
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import LoadingScreen from '@/components/LoadingScreen';
import * as logger from '../lib/logger';

// Create the authentication context
const AuthContext = createContext();

// Create a provider component
export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profileImageError, setProfileImageError] = useState(false);
  const navigate = useNavigate();
  
  // Helper function to get safe profile image URL
  const getSafeProfileImageUrl = (user) => {
    // If there's no user or no photoURL, return null
    if (!user || !user.photoURL) return null;
    
    // If we've previously had an error with this profile image, return null
    if (profileImageError && user.uid === currentUser?.uid) return null;
    
    // Check if it's a Google profile image (which might be rate limited)
    const isGoogleImage = user.photoURL.includes('googleusercontent.com');
    
    // Use a local storage flag to detect repeated rate limiting issues
    const rateLimitKey = `image_rate_limited_${user.uid}`;
    const isRateLimited = localStorage.getItem(rateLimitKey) === 'true';
    
    // If we've detected rate limiting for this user before, don't even try to load the image
    if (isRateLimited) {
      logger.info('Using fallback for rate-limited profile image');
      return null;
    }
    
    if (isGoogleImage) {
      try {
        // Try to modify the Google image URL to get a much smaller size
        // to avoid rate limits (s96-c -> s24-c)
        const url = new URL(user.photoURL);
        
        // Force a small image size
        return user.photoURL.replace('s96-c', 's24-c').replace('s128', 's24');
      } catch (error) {
        logger.warn('Error parsing profile image URL:', error);
        return null;
      }
    }
    
    return user.photoURL;
  };
  
  // Function to clear rate limit flags (to be called periodically)
  const clearRateLimitFlags = () => {
    if (!currentUser) return;
    
    const rateLimitKey = `image_rate_limited_${currentUser.uid}`;
    localStorage.removeItem(rateLimitKey);
    setProfileImageError(false);
    logger.info('Cleared rate limit flags for profile images');
  };

  // Sign in with Google
  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Store user data in Firestore
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        displayName: user.displayName,
        email: user.email,
        photoURL: user.photoURL,
        lastLogin: serverTimestamp(),
        createdAt: serverTimestamp(),
      }, { merge: true });

      return user;
    } catch (error) {
      console.error('Error signing in with Google:', error);
      throw error;
    }
  };

  // Sign in with Email and Password
  const signInWithEmail = async (email, password) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      return result.user;
    } catch (error) {
      console.error('Error signing in with email:', error);
      throw error;
    }
  };

  // Sign up with Email and Password
  const signUpWithEmail = async (email, password, displayName) => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      const user = result.user;
      
      // Update profile with display name
      await updateProfile(user, { displayName });
      
      // Store user data in Firestore
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        displayName: displayName,
        email: user.email,
        photoURL: null,
        lastLogin: serverTimestamp(),
        createdAt: serverTimestamp(),
      });
      
      return user;
    } catch (error) {
      console.error('Error signing up with email:', error);
      throw error;
    }
  };

  // Reset Password
  const resetPassword = async (email) => {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error) {
      console.error('Error resetting password:', error);
      throw error;
    }
  };

  // Sign out
  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      // The redirection will be handled by the AuthProvider useEffect
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  // Check if user exists in database
  const getUserData = async (uid) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        return userDoc.data();
      }
      return null;
    } catch (error) {
      console.error('Error getting user data:', error);
      return null;
    }
  };

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        logger.info('User authenticated');
        // Store userId in localStorage for API calls
        localStorage.setItem('userId', user.uid);
        
        // Get additional user data from Firestore
        const userData = await getUserData(user.uid);
        setCurrentUser({ ...user, ...userData });
      } else {
        logger.info('User signed out');
        setCurrentUser(null);
        // Clear userId from localStorage
        localStorage.removeItem('userId');
        // Redirect to login page if not authenticated
        navigate('/');
      }
      setLoading(false);
    });

    return unsubscribe;
  }, [navigate]);

  // Effect to periodically clear rate limit flags (once every hour)
  useEffect(() => {
    if (!currentUser) return;
    
    // Clear rate limit flags on initial load
    clearRateLimitFlags();
    
    // Set up interval to clear rate limit flags every hour
    const interval = setInterval(clearRateLimitFlags, 60 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, [currentUser]);

  const value = {
    currentUser,
    loading,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    resetPassword,
    signOut,
    getUserData,
    getSafeProfileImageUrl,
    setProfileImageError,
    clearRateLimitFlags,
  };

  return (
    <AuthContext.Provider value={value}>
      {loading ? <LoadingScreen message="Authenticating..." /> : children}
    </AuthContext.Provider>
  );
}

// Create a custom hook to use the auth context
export function useAuth() {
  return useContext(AuthContext);
}
