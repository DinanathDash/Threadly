import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useSlack } from '@/context/SlackContext';
import { useAuth } from '@/context/AuthContext';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import LoadingScreen from '@/components/LoadingScreen';
import { toast } from 'sonner';

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
    
    if (errorParam) {
      toast.error('Authorization denied', {
        description: 'Slack authorization was denied: ' + errorParam,
      });
      setError('Authorization was denied: ' + errorParam);
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
      console.log(`Code ${code.substring(0, 5)}... has already been processed in this component`);
      return;
    }
    
    console.log(`OAuth callback received with code: ${code.substring(0, 5)}...`);
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
      
      console.log(`Processing OAuth callback with code: ${code.substring(0, 5)}... for user: ${userId}`);
      
      // Process the OAuth callback with a fresh code and userId
      handleOAuthCallback(code, userId)
        .then(() => {
          // On successful OAuth handling, navigate to dashboard
          console.log('OAuth successful, navigating to dashboard');
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
            err.message.includes('showLoading') // Handle the previous showLoading error
          )) {
            console.warn('Third-party script or non-critical error detected - this may be unrelated to our application');
            // We don't set an error for third-party script issues as they're not critical to our flow
            
            // Continue with the auth flow if it's just a third-party script error
            console.log('Ignoring non-critical error and navigating to dashboard');
            navigate('/dashboard');
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

  // Redirect to home if there's an error
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        navigate('/');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, navigate]);
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-4">
      {error ? (
        <Alert variant="destructive" className="max-w-md w-full">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {error}
            <div className="mt-2 text-sm">
              Redirecting to home page in 5 seconds...
            </div>
          </AlertDescription>
        </Alert>
      ) : (
        <LoadingScreen message="Connecting to Slack..." />
      )}
    </div>
  );
}
