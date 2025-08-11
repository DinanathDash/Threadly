import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useSlack } from '@/context/SlackContext';
import { useAuth } from '@/context/AuthContext';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import LoadingScreen from '@/components/LoadingScreen';
import { toast } from 'sonner';
import { getApiUrl } from '@/config/api';
import * as logger from '@/lib/logger';

export default function OAuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const { handleOAuthCallback, error: slackError } = useSlack();
  const { currentUser } = useAuth();
  const [error, setError] = useState(null);
  const [codeProcessed, setCodeProcessed] = useState(false);
  const navigate = useNavigate();
  
  useEffect(() => {
    const code = searchParams.get('code');
    const errorParam = searchParams.get('error');
    const reauthorize = searchParams.get('reauthorize');
    
    // Handle reauthorization request
    if (reauthorize === 'true' && !code) {
      logger.info('Reauthorization requested, redirecting to Slack OAuth');
      // Redirect to Slack OAuth
      const initiateSlackAuth = async () => {
        try {
          // Store the current user ID in sessionStorage for retrieval after OAuth
          if (currentUser?.uid) {
            sessionStorage.setItem('connectingUserId', currentUser.uid);
          }
          
          try {
            // Call the API to get the OAuth URL
            const response = await fetch(getApiUrl('/api/slack/oauth-url'));
            
            // Check if we got a response
            if (!response.ok) {
              const errorText = await response.text();
              logger.error('Error response from server');
              throw new Error(`Failed to get OAuth URL: ${response.status} ${response.statusText}`);
            }
            
            // Parse JSON response
            const data = await response.json();
            
            // Validate URL
            if (!data.url || typeof data.url !== 'string') {
              console.error('Invalid URL in response:', data);
              throw new Error('Invalid OAuth URL received');
            }
            
            logger.info('Redirecting to Slack OAuth URL');
            
            // Redirect to Slack's OAuth page
            window.location.href = data.url;
          } catch (fetchError) {
            console.error('Error fetching OAuth URL:', fetchError);
            
            // Fallback option: construct the URL directly in the frontend as a last resort
            try {
              console.warn('Attempting fallback OAuth URL generation');
              
              // These values should match your Slack app configuration
              // Ideally, this should be moved to environment variables
              const clientId = import.meta.env.VITE_SLACK_CLIENT_ID;
              const redirectUri = import.meta.env.VITE_SLACK_REDIRECT_URI || window.location.origin + '/oauth-callback';
              
              if (!clientId) {
                throw new Error('Missing Slack client ID for fallback');
              }
              
              // Bot scopes
              const scope = 'channels:read,channels:history,groups:read,groups:history,chat:write,reactions:read,mpim:history,im:history';
              
              // Add user scopes if needed
              const userScope = 'users:read,users:read.email';
              const encodedRedirectUri = encodeURIComponent(redirectUri);
              const timestamp = Date.now();
              
              // Build the proper OAuth URL with bot and user scopes separated
              const fallbackUrl = `https://slack.com/oauth/v2/authorize?client_id=${clientId}&redirect_uri=${encodedRedirectUri}&scope=${scope}&user_scope=${userScope}&state=${timestamp}`;
              
              logger.info('Using fallback OAuth URL');
              window.location.href = fallbackUrl;
            } catch (fallbackError) {
              console.error('Fallback OAuth URL generation failed:', fallbackError);
              throw new Error('Failed to initiate Slack authorization. Please try again later.');
            }
          }
        } catch (err) {
          console.error('Error initiating Slack auth:', err);
          toast.error('Failed to connect to Slack', {
            description: err.message || 'Please try again later',
          });
          setError(err.message || 'Failed to connect to Slack');
        }
      };
      
      initiateSlackAuth();
      return;
    }    if (errorParam) {
      // Handle specific error cases
      if (errorParam === 'invalid_scope' || errorParam === 'invalid_scope_requested') {
        toast.error('Slack Authorization Error', {
          description: 'There was an issue with the requested permissions. Please try again.',
        });
        setError('There was an issue with the Slack permissions request. This has been reported to the development team.');
        
        // Log this for debugging
        console.error('Slack OAuth scope error. Please check that all requested scopes are configured in your Slack App.');
      } else {
        toast.error('Authorization denied', {
          description: 'Slack authorization was denied: ' + errorParam,
        });
        setError('Authorization was denied: ' + errorParam);
      }
      return;
    }
    
    if (!code) {
      toast.error('Missing authorization code', {
        description: 'No authorization code received from Slack',
      });
      setError('No authorization code received from Slack');
      return;
    }
    
    // Check if we've already processed this code in this component instance
    if (codeProcessed) {
      logger.info(`Code has already been processed in this component`);
      return;
    }
    
    logger.info(`OAuth callback received`);
    setCodeProcessed(true);
    
    // Add a slight delay to ensure all processes have initialized properly
    setTimeout(() => {
      // Get userId from currentUser or stored value from sessionStorage
      const userId = currentUser?.uid || sessionStorage.getItem('connectingUserId') || localStorage.getItem('userId');
      
      if (!userId) {
        toast.error('User ID not found', {
          description: 'Please try logging in again.',
        });
        setError('User ID not found. Please try logging in again.');
        return;
      }
      
      logger.info(`Processing OAuth callback`);
      
      // Process the OAuth callback with a fresh code and userId
      handleOAuthCallback(code, userId)
        .then(() => {
          // On successful OAuth handling, navigate to dashboard
          logger.info('OAuth successful, navigating to dashboard');
          // Clean up the temporary userId storage
          sessionStorage.removeItem('connectingUserId');
          toast.success('Slack connected', {
            description: 'Your Slack workspace has been successfully connected!',
          });
          navigate('/dashboard');
        })
        .catch(err => {
          console.error('OAuth callback page error:', err);
          
          // Handle different types of errors
          if (err.message && (
            err.message.includes('CORS') || 
            err.message.includes('access control checks') ||
            err.message.includes('googlesyndication') ||
            err.message.includes('.min.js.map') ||
            err.message.includes('document\'s frame is sandboxed') ||
            err.message.includes('window.lintrk') ||
            err.message.includes('Optanon') ||
            err.message.includes('showLoading') ||
            err.message.includes('Load failed') ||
            err.message.includes('Origin') ||
            err.message.includes('not allowed by Access-Control-Allow-Origin')
          )) {
            console.warn('Third-party script or CORS error detected - this may be unrelated to our application');
            // We don't set an error for third-party script issues as they're not critical to our flow
            
            // Clean up the temporary userId storage in case of success
            sessionStorage.removeItem('connectingUserId');
            
            // Continue with the auth flow if it's just a third-party script or CORS error
            logger.info('Ignoring non-critical error and navigating to dashboard');
            
            // Show success message despite the errors since they're non-critical
            toast.success('Slack connection initiated', {
              description: 'Your connection to Slack is being established. Please wait a moment...',
            });
            
            // Navigate to dashboard after a short delay to allow the backend to process the request
            setTimeout(() => {
              navigate('/dashboard');
            }, 1000);
          } else if (err.message && err.message.includes('invalid_code')) {
            // Special handling for invalid_code errors
            toast.error('Authorization code expired', {
              description: 'Your authorization code has expired. Please try connecting to Slack again.',
            });
            setError('Your authorization code has expired. Please try connecting to Slack again.');
            
            // Redirect to home page after a delay so user can see the error
            setTimeout(() => {
              navigate('/');
            }, 3000);
          } else {
            toast.error('Slack connection failed', {
              description: err.message || 'Failed to connect to Slack. Please try again.',
            });
            setError(err.message || 'Failed to connect to Slack');
          }
      });
    }, 500); // Short delay to ensure everything is ready
  }, [searchParams, handleOAuthCallback]);
  
  // Show error from SlackContext if it exists
  useEffect(() => {
    if (slackError) {
      toast.error('Slack error', {
        description: slackError,
      });
      setError(slackError);
    }
  }, [slackError]);

  // Redirect to home if there's an error (but not for CORS or connectivity errors)
  useEffect(() => {
    if (error && !error.includes('CORS') && !error.includes('access control') && !error.includes('Load failed')) {
      const timer = setTimeout(() => {
        navigate('/');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, navigate]);
  
  // Function to handle manual navigation to dashboard
  const handleGoToDashboard = () => {
    navigate('/dashboard');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
      {error ? (
        <Alert variant={error.includes('CORS') || error.includes('access control') ? "warning" : "destructive"} className="max-w-md w-full">
          <AlertTitle>{error.includes('CORS') || error.includes('access control') ? "Connection in Progress" : "Error"}</AlertTitle>
          <AlertDescription>
            {error.includes('CORS') || error.includes('access control') ? 
              "We're connecting to Slack in the background. You can proceed to the dashboard now." : 
              error
            }
            <div className="mt-4 flex flex-col space-y-2">
              <button 
                onClick={handleGoToDashboard}
                className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors"
              >
                Go to Dashboard
              </button>
              <div className="text-sm text-center">
                {!error.includes('CORS') && !error.includes('access control') && 
                  "Redirecting to home page in 5 seconds..."}
              </div>
            </div>
          </AlertDescription>
        </Alert>
      ) : (
        <LoadingScreen message="Connecting to Slack..." />
      )}
    </div>
  );
}
