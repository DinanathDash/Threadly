import { createContext, useState, useContext, useEffect, useRef } from 'react';
import { db } from '../services/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { setupCorsProxy } from '../services/corsProxy';
import { useAuth } from './AuthContext';
import { useGlobalLoading } from './GlobalLoadingContext';
import { getSlackChannels as fetchSlackChannels } from '../services/slackService';
import logger from '../lib/logger';
import { getApiUrl } from '../config/api';

const SlackContext = createContext();

export function useSlack() {
  return useContext(SlackContext);
}

export function SlackProvider({ children }) {
  const [slackWorkspace, setSlackWorkspace] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [channels, setChannels] = useState([]);
  const [loadingChannels, setLoadingChannels] = useState(false);
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
          logger.info("Slack connection detected from database");
        } else {
          logger.info("No Slack connection found in database");
          setIsConnected(false);
        }
      } catch (err) {
        logger.error("Error checking Slack connection:", err);
        setError(err.message);
        setIsConnected(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkSlackConnection();
  }, [currentUser]); // Added currentUser dependency to re-check when user changes

  // Flag to track if an OAuth request is in progress
  const [isOAuthInProgress, setIsOAuthInProgress] = useState(false);
  
  // Keep track of processed codes to prevent duplicate processing
  const processedCodes = useRef(new Set());
  
  // Handle the OAuth callback
  const handleOAuthCallback = async (code, providedUserId = null) => {
    try {
      // Use provided userId first, then try to get from currentUser
      const uid = providedUserId || currentUser?.uid || localStorage.getItem('userId');
      
      if (!uid) {
        console.error('No user ID available for OAuth callback');
        throw new Error('User ID not found. Please try logging in again.');
      }
      
      // Prevent duplicate code exchanges
      if (processedCodes.current.has(code)) {
        logger.info(`Code ${code.substring(0, 5)}... has already been processed, skipping.`);
        return;
      }
      
      // Prevent multiple simultaneous requests
      if (isOAuthInProgress) {
        logger.info("OAuth request already in progress, skipping duplicate request");
        return;
      }
      
      setIsOAuthInProgress(true);
      setIsLoading(true);
      setError(null);
      globalLoading.showLoading("Connecting to Slack workspace...");
      
      // Add this code to the processed set
      processedCodes.current.add(code);
      
      // Add a timestamp parameter to ensure the code is always treated as fresh
      // This helps prevent "invalid_code" errors caused by cached responses
      const timestamp = Date.now();
      logger.info(`Exchanging code for tokens with timestamp: ${timestamp}...`);
      
      // Check if this is a valid code before proceeding
      if (!code || typeof code !== 'string' || code.trim() === '') {
        throw new Error('Invalid authorization code received');
      }
      
            // Exchange code for tokens with our backend
      const response = await fetch(getApiUrl(`/api/slack/oauth?_=${timestamp}`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          code, 
          userId: uid
        })
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
      logger.info('Successfully connected to Slack workspace');
      
      // Store the user ID for future reference
      localStorage.setItem('userId', data.userId);
      
      // Log success with workspace details
      logger.info('Successfully connected to Slack workspace:', data.workspace);
      
      // Update the local state
      setSlackWorkspace(data.workspace);
      setIsConnected(true);
      
      // Clear any previous errors
      setError(null);
      globalLoading.hideLoading();
      
      // Navigate to dashboard
      navigate('/dashboard');
    } catch (err) {
      console.error('OAuth callback error:', err);
      setError(err.message || 'An unknown error occurred');
      
      // Hide the loading indicator
      if (globalLoading && typeof globalLoading.hideLoading === 'function') {
        globalLoading.hideLoading();
      }
      
      // Third-party CORS errors won't affect our flow, so we log them but continue
      if (err.message && (
        err.message.includes('CORS') ||
        err.message.includes('third-party') ||
        err.message.includes('googlesyndication') ||
        err.message.includes('showLoading')
      )) {
        console.warn('Non-critical error detected in Slack OAuth flow - this is likely from third-party services');
        // Don't rethrow non-critical errors so the flow can continue
        return;
      }
      
      // Rethrow the error so it can be handled by the calling component
      throw err;
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
      
      // Show loading indicator
      if (globalLoading && typeof globalLoading.showLoading === 'function') {
        globalLoading.showLoading();
      }
      
      const userId = currentUser?.uid || localStorage.getItem('userId');
      
      if (userId) {
        logger.info('Disconnecting Slack for user:', userId);
        
        // Call backend to revoke tokens
        const response = await fetch('/api/slack/disconnect', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userId }),
        });
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Failed to disconnect from Slack');
        }

        // Update local state
        localStorage.removeItem('userId');
        setSlackWorkspace(null);
        setIsConnected(false);
        logger.info('Successfully disconnected from Slack');
        navigate('/');
      }
    } catch (err) {
      setError(err.message);
    }
  };

  // Function to fetch channels
  const fetchChannels = async () => {
    if (!isConnected || !currentUser) return;
    
    try {
      setLoadingChannels(true);
      setError(null);
      
      const channelsData = await fetchSlackChannels(currentUser.uid);
      setChannels(channelsData || []);
    } catch (err) {
      console.error('Error fetching channels:', err);
      setError(err.message);
    } finally {
      setLoadingChannels(false);
    }
  };

  // Fetch channels when connected
  useEffect(() => {
    if (isConnected && !isLoading) {
      fetchChannels();
    }
  }, [isConnected, isLoading]);

  const value = {
    slackWorkspace,
    isConnected,
    isLoading,
    error,
    channels,
    loadingChannels,
    fetchChannels,
    handleOAuthCallback,
    disconnectSlack
  };

  return (
    <SlackContext.Provider value={value}>
      {children}
    </SlackContext.Provider>
  );
}
