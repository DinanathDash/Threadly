import { createContext, useState, useContext, useEffect, useRef } from 'react';
import { db } from '../services/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { setupCorsProxy } from '../services/corsProxy';
import { useAuth } from './AuthContext';
import { useGlobalLoading } from './GlobalLoadingContext';

const SlackContext = createContext();

export function useSlack() {
  return useContext(SlackContext);
}

export function SlackProvider({ children }) {
  const [slackWorkspace, setSlackWorkspace] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const globalLoading = useGlobalLoading();

  // Setup CORS proxy handler and check if user has connected Slack workspace
  useEffect(() => {
    // Setup CORS proxy to handle Slack tracking errors
    setupCorsProxy();
    const checkSlackConnection = async () => {
      try {
        // Check if user is authenticated
        if (!currentUser) {
          setIsConnected(false);
          setIsLoading(false);
          return;
        }
        
        const userRef = doc(db, 'users', currentUser.uid);
        const userDoc = await getDoc(userRef);
        
        if (userDoc.exists() && userDoc.data().slackTokens) {
          setSlackWorkspace(userDoc.data().slackWorkspace);
          setIsConnected(true);
        } else {
          setIsConnected(false);
        }
      } catch (err) {
        setError(err.message);
        setIsConnected(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkSlackConnection();
  }, []);

  // Flag to track if an OAuth request is in progress
  const [isOAuthInProgress, setIsOAuthInProgress] = useState(false);
  
  // Keep track of processed codes to prevent duplicate processing
  const processedCodes = useRef(new Set());
  
  // Handle the OAuth callback
  const handleOAuthCallback = async (code) => {
    try {
      // Ensure user is authenticated first
      if (!currentUser) {
        throw new Error('You must be logged in to connect your Slack workspace');
      }
      
      // Prevent duplicate code exchanges
      if (processedCodes.current.has(code)) {
        console.log(`Code ${code.substring(0, 5)}... has already been processed, skipping.`);
        return;
      }
      
      // Prevent multiple simultaneous requests
      if (isOAuthInProgress) {
        console.log("OAuth request already in progress, skipping duplicate request");
        return;
      }
      
      setIsOAuthInProgress(true);
      setIsLoading(true);
      setError(null);
      globalLoading.showLoading("Connecting to Slack...");
      showLoading('Connecting to Slack workspace...');
      
      // Add this code to the processed set
      processedCodes.current.add(code);
      
      // Add a timestamp parameter to ensure the code is always treated as fresh
      // This helps prevent "invalid_code" errors caused by cached responses
      const timestamp = Date.now();
      console.log(`Exchanging code for tokens with timestamp: ${timestamp}...`);
      
      // Check if this is a valid code before proceeding
      if (!code || typeof code !== 'string' || code.trim() === '') {
        throw new Error('Invalid authorization code received');
      }
      
      // Exchange code for tokens with our backend
      const response = await fetch(`/api/slack/oauth?_=${timestamp}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store',
          'Pragma': 'no-cache'
        },
        body: JSON.stringify({ 
          code,
          userId: currentUser.uid // Pass the Firebase user ID
        }),
      });

      if (!response.ok) {
        // Try to get the error message from the response
        let errorMessage = 'Failed to connect to Slack';
        try {
          const errorData = await response.json();
          if (errorData && errorData.message) {
            errorMessage = errorData.message;
          }
        } catch (e) {
          // If parsing JSON fails, use the status text
          errorMessage = `Failed to connect to Slack: ${response.status} ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log('Successfully connected to Slack workspace');
      
      // Store the user ID for future reference
      localStorage.setItem('userId', data.userId);
      
      setSlackWorkspace(data.workspace);
      setIsConnected(true);
      navigate('/dashboard');
    } catch (err) {
      console.error('OAuth callback error:', err);
      setError(err.message || 'An unknown error occurred');
      
      // Third-party CORS errors won't affect our flow, so we log them but continue
      if (err.message && err.message.includes('CORS')) {
        console.warn('CORS error detected in Slack OAuth flow - this is likely from third-party services and not critical');
      }
    } finally {
      setIsLoading(false);
      setIsOAuthInProgress(false);
      globalLoading.hideLoading();
      
      // Clear processed codes after 30 seconds to allow retries
      setTimeout(() => {
        processedCodes.current.clear();
      }, 30000);
    }
  };

  // Disconnect from Slack
  const disconnectSlack = async () => {
    try {
      if (!currentUser) {
        throw new Error('You must be logged in to disconnect your Slack workspace');
      }
      
      if (userId) {
        // Call backend to revoke tokens
        await fetch('/api/slack/disconnect', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userId }),
        });

        // Update local state
        localStorage.removeItem('userId');
        setSlackWorkspace(null);
        setIsConnected(false);
        navigate('/');
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const value = {
    slackWorkspace,
    isConnected,
    isLoading,
    error,
    handleOAuthCallback,
    disconnectSlack
  };

  return (
    <SlackContext.Provider value={value}>
      {children}
    </SlackContext.Provider>
  );
}
