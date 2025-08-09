import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useSlack } from '@/context/SlackContext';
import { useAuth } from '@/context/AuthContext';
import { Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

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
      setError('Authorization was denied: ' + errorParam);
      return;
    }
    
    if (!code) {
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
      // Process the OAuth callback with a fresh code
      handleOAuthCallback(code).catch(err => {
        console.error('OAuth callback page error:', err);
        
        // Handle different types of errors
        if (err.message && (
          err.message.includes('CORS') || 
          err.message.includes('access control checks') ||
          err.message.includes('googlesyndication') ||
          err.message.includes('.min.js.map') ||
          err.message.includes('document\'s frame is sandboxed') ||
          err.message.includes('window.lintrk') ||
          err.message.includes('Optanon')
        )) {
          console.warn('Third-party script error detected - this may be unrelated to our application');
          // We don't set an error for third-party script issues as they're not critical to our flow
          
          // Continue with the auth flow if it's just a third-party script error
          console.log('Ignoring third-party script error and continuing with the authentication flow');
        } else if (err.message && err.message.includes('invalid_code')) {
          // Special handling for invalid_code errors
          setError('Your authorization code has expired. Please try connecting to Slack again.');
          
          // Redirect to home page after a delay so user can see the error
          setTimeout(() => {
            navigate('/');
          }, 3000);
        } else {
          setError(err.message || 'Failed to connect to Slack');
        }
      });
    }, 500); // Short delay to ensure everything is ready
  }, [searchParams, handleOAuthCallback]);
  
  // Show error from SlackContext if it exists
  useEffect(() => {
    if (slackError) {
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
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-xl">Connecting to Slack...</p>
        </div>
      )}
    </div>
  );
}
