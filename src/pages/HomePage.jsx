import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSlack } from '@/context/SlackContext';
import { useAuth } from '@/context/AuthContext';
import { getSlackOAuthUrl } from '@/services/slackService';
import { Button } from '@/components/ui/button';

export default function HomePage() {
  const { isConnected, isLoading } = useSlack();
  const { currentUser, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // If user is authenticated and connected to Slack, go to dashboard
    if (isConnected && !isLoading && currentUser) {
      navigate('/dashboard');
    }
    // If user is authenticated but not connected to Slack, stay on this page
    // If user is not authenticated, redirect to login
    else if (!currentUser && !authLoading) {
      navigate('/login');
    }
  }, [isConnected, isLoading, currentUser, authLoading, navigate]);

  const handleConnect = async () => {
    try {
      // Show loading state
      const button = document.querySelector('#connect-button');
      if (button) {
        button.textContent = 'Connecting...';
        button.disabled = true;
      }
      
      // Get the OAuth URL (async now)
      const slackOAuthUrl = await getSlackOAuthUrl();
      
      // Redirect to Slack
      window.location.href = slackOAuthUrl;
    } catch (error) {
      console.error('Error starting Slack OAuth flow:', error);
      alert('Failed to connect to Slack. Please try again.');
      
      // Reset button state
      const button = document.querySelector('#connect-button');
      if (button) {
        button.textContent = 'Connect with Slack';
        button.disabled = false;
      }
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background">
      <div className="container max-w-[800px] mx-auto px-4 py-12">
        <div className="flex flex-col gap-8 items-center text-center">
          <div className="space-y-4">
            <div className='flex items-center justify-center'>
              <svg width="60" height="60" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <g clip-path="url(#clip0_19_2)">
                  <path d="M3.40686 10.0899C3.40686 11.0061 2.65961 11.7545 1.74324 11.7545C0.82686 11.7545 0.0787354 11.0061 0.0787354 10.0899C0.0787354 9.17364 0.82711 8.42526 1.74336 8.42526H3.40699L3.40686 10.0899ZM4.24549 10.0899C4.24549 9.17364 4.99386 8.42526 5.91011 8.42526C6.82636 8.42526 7.57474 9.17351 7.57474 10.0899V14.2568C7.57474 15.173 6.82648 15.9214 5.91011 15.9214C4.99386 15.9214 4.24549 15.173 4.24549 14.2568V10.0899Z" fill="#DE1C59" />
                  <path d="M5.91011 3.40686C4.99386 3.40686 4.24549 2.65961 4.24549 1.74324C4.24549 0.82686 4.99386 0.0787354 5.91011 0.0787354C6.82636 0.0787354 7.57474 0.82711 7.57474 1.74336V3.40699L5.91011 3.40686ZM5.91011 4.24549C6.82636 4.24549 7.57474 4.99386 7.57474 5.91011C7.57474 6.82636 6.82648 7.57474 5.91011 7.57474H1.74324C0.826985 7.57474 0.0787354 6.82648 0.0787354 5.91011C0.0787354 4.99386 0.82711 4.24549 1.74336 4.24549H5.91011Z" fill="#35C5F0" />
                  <path d="M12.5931 5.91011C12.5931 4.99386 13.3404 4.24549 14.2568 4.24549C15.1731 4.24549 15.9214 4.99386 15.9214 5.91011C15.9214 6.82636 15.173 7.57474 14.2568 7.57474H12.5931V5.91011ZM11.7545 5.91011C11.7545 6.82636 11.0061 7.57474 10.0899 7.57474C9.17364 7.57474 8.42526 6.82648 8.42526 5.91011V1.74324C8.42526 0.826985 9.17351 0.0787354 10.0899 0.0787354C11.0061 0.0787354 11.7545 0.82711 11.7545 1.74336V5.91011Z" fill="#2EB57D" />
                  <path d="M10.0899 12.5931C11.0061 12.5931 11.7545 13.3404 11.7545 14.2568C11.7545 15.1731 11.0061 15.9214 10.0899 15.9214C9.17364 15.9214 8.42526 15.173 8.42526 14.2568V12.5931H10.0899ZM10.0899 11.7545C9.17364 11.7545 8.42526 11.0061 8.42526 10.0899C8.42526 9.17364 9.17351 8.42526 10.0899 8.42526H14.2568C15.173 8.42526 15.9214 9.17351 15.9214 10.0899C15.9214 11.0061 15.173 11.7545 14.2568 11.7545H10.0899Z" fill="#EBB02E" />
                </g>
                <defs>
                  <clipPath id="clip0_19_2">
                    <rect width="16" height="16" fill="white" />
                  </clipPath>
                </defs>
              </svg>
            </div>
            <h1 className="text-4xl font-bold">Slack Connect</h1>
            <p className="text-xl text-muted-foreground">
              Connect your Slack workspace to send messages instantly or schedule them for later.
            </p>
          </div>

          <div className="grid gap-6 w-full max-w-sm">
            <div className="grid gap-3">
              <Button id="connect-button" onClick={handleConnect} size="lg" className="bg-[#4A154B] hover:bg-[#3F0E3F]">
                <svg width="60" height="60" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <g clip-path="url(#clip0_19_2)">
                    <path d="M3.40686 10.0899C3.40686 11.0061 2.65961 11.7545 1.74324 11.7545C0.82686 11.7545 0.0787354 11.0061 0.0787354 10.0899C0.0787354 9.17364 0.82711 8.42526 1.74336 8.42526H3.40699L3.40686 10.0899ZM4.24549 10.0899C4.24549 9.17364 4.99386 8.42526 5.91011 8.42526C6.82636 8.42526 7.57474 9.17351 7.57474 10.0899V14.2568C7.57474 15.173 6.82648 15.9214 5.91011 15.9214C4.99386 15.9214 4.24549 15.173 4.24549 14.2568V10.0899Z" fill="#DE1C59" />
                    <path d="M5.91011 3.40686C4.99386 3.40686 4.24549 2.65961 4.24549 1.74324C4.24549 0.82686 4.99386 0.0787354 5.91011 0.0787354C6.82636 0.0787354 7.57474 0.82711 7.57474 1.74336V3.40699L5.91011 3.40686ZM5.91011 4.24549C6.82636 4.24549 7.57474 4.99386 7.57474 5.91011C7.57474 6.82636 6.82648 7.57474 5.91011 7.57474H1.74324C0.826985 7.57474 0.0787354 6.82648 0.0787354 5.91011C0.0787354 4.99386 0.82711 4.24549 1.74336 4.24549H5.91011Z" fill="#35C5F0" />
                    <path d="M12.5931 5.91011C12.5931 4.99386 13.3404 4.24549 14.2568 4.24549C15.1731 4.24549 15.9214 4.99386 15.9214 5.91011C15.9214 6.82636 15.173 7.57474 14.2568 7.57474H12.5931V5.91011ZM11.7545 5.91011C11.7545 6.82636 11.0061 7.57474 10.0899 7.57474C9.17364 7.57474 8.42526 6.82648 8.42526 5.91011V1.74324C8.42526 0.826985 9.17351 0.0787354 10.0899 0.0787354C11.0061 0.0787354 11.7545 0.82711 11.7545 1.74336V5.91011Z" fill="#2EB57D" />
                    <path d="M10.0899 12.5931C11.0061 12.5931 11.7545 13.3404 11.7545 14.2568C11.7545 15.1731 11.0061 15.9214 10.0899 15.9214C9.17364 15.9214 8.42526 15.173 8.42526 14.2568V12.5931H10.0899ZM10.0899 11.7545C9.17364 11.7545 8.42526 11.0061 8.42526 10.0899C8.42526 9.17364 9.17351 8.42526 10.0899 8.42526H14.2568C15.173 8.42526 15.9214 9.17351 15.9214 10.0899C15.9214 11.0061 15.173 11.7545 14.2568 11.7545H10.0899Z" fill="#EBB02E" />
                  </g>
                  <defs>
                    <clipPath id="clip0_19_2">
                      <rect width="16" height="16" fill="white" />
                    </clipPath>
                  </defs>
                </svg>
                Connect with Slack
              </Button>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 bg-accent rounded-lg">
              <h3 className="font-medium text-lg mb-2">Send Messages</h3>
              <p className="text-sm text-muted-foreground">Send messages to any channel in your workspace instantly.</p>
            </div>
            <div className="p-6 bg-accent rounded-lg">
              <h3 className="font-medium text-lg mb-2">Schedule for Later</h3>
              <p className="text-sm text-muted-foreground">Schedule messages to be delivered at specific dates and times.</p>
            </div>
            <div className="p-6 bg-accent rounded-lg">
              <h3 className="font-medium text-lg mb-2">Manage Scheduled</h3>
              <p className="text-sm text-muted-foreground">View and cancel scheduled messages before they're sent.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
