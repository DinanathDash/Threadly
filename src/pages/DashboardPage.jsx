import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSlack } from '@/context/SlackContext';
import { useAuth } from '@/context/AuthContext';
import { getScheduledMessages } from '@/services/messageService';
import { getSlackOAuthUrl } from '@/services/slackService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from "sonner";
import { format } from 'date-fns';
import { MessageCircle, Calendar as CalendarIcon, Clock, ArrowRight, Loader2 } from 'lucide-react';
import InlineLoader from '@/components/ui/inline-loader';

export default function DashboardPage() {
  const { isConnected, slackWorkspace, isLoading } = useSlack();
  const { currentUser } = useAuth();
  const [scheduledMessages, setScheduledMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [connectingSlack, setConnectingSlack] = useState(false);
  const navigate = useNavigate();

  // Fetch scheduled messages
  useEffect(() => {
    const fetchMessages = async () => {
      if (isConnected) {
        try {
          const userId = localStorage.getItem('userId');
          const messages = await getScheduledMessages(userId);
          
          // Filter to only include upcoming messages (status is 'scheduled' or 'confirmed')
          const upcomingMessages = messages.filter(
            msg => msg.status === 'scheduled' || msg.status === 'confirmed'
          );
          
          // Sort by scheduled time (earliest first)
          upcomingMessages.sort((a, b) => a.scheduledTime - b.scheduledTime);
          
          setScheduledMessages(upcomingMessages);
        } catch (error) {
          console.error('Error fetching scheduled messages:', error);
          toast.error("Failed to fetch scheduled messages", {
            description: "There was an error loading your messages. Please refresh the page.",
            duration: 5000,
          });
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    fetchMessages();
  }, [isConnected]);

  const handleConnect = async () => {
    try {
      setConnectingSlack(true);
      
      // Check if we have a userId before proceeding
      const userId = localStorage.getItem('userId');
      if (!userId) {
        throw new Error('User ID not found. Please try logging in again.');
      }
      
      console.log('Starting Slack OAuth flow with userId:', userId);
      const slackOAuthUrl = await getSlackOAuthUrl();
      
      // Store current userId in sessionStorage to ensure it's available after OAuth redirect
      sessionStorage.setItem('connectingUserId', userId);
      
      window.location.href = slackOAuthUrl;
    } catch (error) {
      console.error('Error starting Slack OAuth flow:', error);
      toast.error(`Failed to connect to Slack: ${error.message || 'Please try again.'}`, {
        description: "Check your network connection and try again.",
        duration: 5000,
      });
      setConnectingSlack(false);
    }
  };

  return (
    <div className="relative">
      {/* Slack Connection Overlay */}
      {!isConnected && !isLoading && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50">
          <Card className="w-[450px] border border-slate-100 rounded-xl shadow-lg">
            <CardHeader className="pb-4">
              <CardTitle className="text-center text-xl text-slate-800">Connect with Slack</CardTitle>
              <CardDescription className="text-center text-slate-500">
                You need to connect your Slack account to continue
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col items-center justify-center pb-8">
              <div className="rounded-full bg-slate-100 p-5 mb-6">
                <svg width="65" height="65" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <g clipPath="url(#clip0_19_2)">
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
              <p className="text-center text-slate-600 mb-8 max-w-sm">
                Connect your Slack workspace to send and schedule messages directly from Threadly
              </p>
              <Button
                id="connect-button"
                className="bg-indigo-600 hover:bg-indigo-700 px-6 py-5 h-auto text-base font-medium shadow-md shadow-indigo-200 transition-all"
                onClick={handleConnect}
                disabled={connectingSlack}
              >
                {connectingSlack ? 
                  <div className="flex items-center">
                    <span className="animate-spin mr-2"><Loader2 className="h-4 w-4" /></span>
                    Connecting...
                  </div> : 
                  'Connect with Slack'
                }
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {loading ? (
        <div className="w-full flex flex-col justify-center items-center py-16 space-y-4">
          <div className="text-indigo-600">
            <InlineLoader color="#4338CA" size="60px" />
          </div>
          <p className="text-slate-500 text-sm font-medium">Loading your dashboard...</p>
        </div>
      ) : (
        <>
          <div className="grid gap-6 md:grid-cols-3">
            <Card className="bg-white border border-slate-100 shadow-sm hover:shadow transition-all">
              <CardHeader className="-mb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <MessageCircle className="h-5 w-5 text-indigo-600" strokeWidth={1.5} />
                  <span>Send Message</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-500">
                  Send a message to any channel in your Slack workspace.
                </p>
              </CardContent>
              <CardFooter>
                <Button className="bg-indigo-600 hover:bg-indigo-700 w-full" onClick={() => navigate('/send-message')}>
                  <span>New Message</span>
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </CardFooter>
            </Card>

            <Card className="bg-white border border-slate-100 shadow-sm hover:shadow transition-all">
              <CardHeader className="-mb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5 text-indigo-600" strokeWidth={1.5} />
                  <span>Schedule Message</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-500">
                  Schedule a message to be delivered at a specific date and time.
                </p>
              </CardContent>
              <CardFooter>
                <Button className="bg-indigo-600 hover:bg-indigo-700 w-full" onClick={() => navigate('/send-message?schedule=true')}>
                  <span>Schedule Message</span>
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </CardFooter>
            </Card>
            
            <Card className="bg-white border border-slate-100 shadow-sm hover:shadow transition-all">
              <CardHeader className="-mb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="h-5 w-5 text-indigo-600" strokeWidth={1.5} />
                  <span>Scheduled Messages</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-500">
                  View and manage all your scheduled messages in one place.
                </p>
              </CardContent>
              <CardFooter>
                <Button className="bg-indigo-600 hover:bg-indigo-700 w-full" onClick={() => navigate('/scheduled')}>
                  <span>View Scheduled</span>
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </CardFooter>
            </Card>
          </div>

          {isConnected && scheduledMessages.length > 0 && (
            <div className="mt-10">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-slate-800">Upcoming Messages</h2>
                <Button 
                  variant="outline" 
                  onClick={() => navigate('/scheduled')} 
                  className="text-sm text-indigo-600 border-indigo-200 hover:bg-indigo-50 hover:border-indigo-300"
                >
                  View All
                </Button>
              </div>

              <div className="bg-white border border-slate-100 rounded-xl shadow-sm overflow-hidden">
                <div className="divide-y divide-slate-100">
                  {scheduledMessages.slice(0, 5).map(message => (
                    <div key={message.id} className="p-4 hover:bg-slate-50 transition-colors">
                      <div className="flex justify-between mb-2">
                        <div className="flex items-center">
                          <div className="w-2 h-2 bg-indigo-500 rounded-full mr-2"></div>
                          <h3 className="text-sm font-medium text-slate-800">
                            #{message.channelId}
                          </h3>
                        </div>
                        <span className="text-xs text-slate-500 flex items-center">
                          <Clock className="h-3 w-3 mr-1" strokeWidth={1.5} />
                          {format(message.scheduledTime, 'MMM d, yyyy h:mm a')}
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 truncate">{message.message}</p>
                    </div>
                  ))}

                  {scheduledMessages.length === 0 && (
                    <div className="p-8 text-center">
                      <p className="text-slate-500">No upcoming scheduled messages</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
