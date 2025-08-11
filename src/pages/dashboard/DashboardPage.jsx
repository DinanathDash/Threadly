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
import { MessageCircle, Calendar as CalendarIcon, Clock, ArrowRight, Loader2, Hash } from 'lucide-react';
import InlineLoader from '@/components/ui/inline-loader';

// Import dashboard scrolling fix
import '@/styles/dashboard-scrolling-fix.css';

export default function DashboardPage() {
  const { isConnected, slackWorkspace, isLoading, channels } = useSlack();
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
    <div className="relative overflow-y-auto pb-6 dashboard-container">
      {/* Slack Connection Overlay */}
      {!isConnected && !isLoading && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-[450px] border border-slate-100 rounded-xl shadow-lg">
            <CardHeader className="pb-4">
              <CardTitle className="text-center text-lg sm:text-xl text-slate-800">Connect with Slack</CardTitle>
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
        <div className="w-full flex flex-col justify-center items-center py-10 sm:py-16 space-y-4">
          <div className="text-indigo-600">
            <InlineLoader color="#4338CA" size="50px" />
          </div>
          <p className="text-slate-500 text-sm font-medium">Loading your dashboard...</p>
        </div>
      ) : (
        <>
          {/* Stats Overview Section */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-slate-800 mb-4">Overview</h2>
            <div className="grid gap-4 sm:gap-6 grid-cols-2 md:grid-cols-4">
              <Card className="-py-4 bg-gradient-to-br from-indigo-50 to-white border border-slate-100 shadow-sm">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-500">Messages Sent</span>
                    <div className="bg-indigo-100 p-2 rounded-full text-indigo-600">
                      <MessageCircle className="h-5 w-5" strokeWidth={1.5} />
                    </div>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-2xl font-semibold text-indigo-700">{Math.floor(Math.random() * 100)}</span>
                    <div className="text-xs text-green-600 flex items-center mt-1">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="mr-1">
                        <path d="M7 17L17 7M17 7H8M17 7V16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <span>8% this week</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="-py-4 bg-gradient-to-br from-purple-50 to-white border border-slate-100 shadow-sm">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-500">Scheduled</span>
                    <div className="bg-purple-100 p-2 rounded-full text-purple-600">
                      <CalendarIcon className="h-5 w-5" strokeWidth={1.5} />
                    </div>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-2xl font-semibold text-purple-700">{scheduledMessages.length}</span>
                    <div className="text-xs text-slate-500 flex items-center mt-1">
                      <span>Upcoming messages</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="-py-4 bg-gradient-to-br from-blue-50 to-white border border-slate-100 shadow-sm">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-500">Channels</span>
                    <div className="bg-blue-100 p-2 rounded-full text-blue-600">
                      <Hash className="h-5 w-5" strokeWidth={1.5} />
                    </div>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-2xl font-semibold text-blue-700">{channels ? channels.length : 0}</span>
                    <div className="text-xs text-blue-600 flex items-center mt-1">
                      <span>Active channels</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="-py-4 bg-gradient-to-br from-emerald-50 to-white border border-slate-100 shadow-sm">
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-500">Efficiency</span>
                    <div className="bg-emerald-100 p-2 rounded-full text-emerald-600">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
                      </svg>
                    </div>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-2xl font-semibold text-emerald-700">93%</span>
                    <div className="text-xs text-emerald-600 flex items-center mt-1">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="mr-1">
                        <path d="M7 17L17 7M17 7H8M17 7V16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <span>5% improvement</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
          
          {/* Quick Actions Section */}
          <h2 className="text-xl font-semibold text-slate-800 mb-4">Quick Actions</h2>
          <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
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

          {/* Grid layout for activities and tips */}
          <div className="mt-10 grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left column - Upcoming Messages */}
            <div className="lg:col-span-2">
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
                  {isConnected && scheduledMessages.length > 0 ? (
                    scheduledMessages.slice(0, 5).map(message => (
                      <div key={message.id} className="p-3 sm:p-4 hover:bg-slate-50 transition-colors">
                        <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0 mb-2">
                          <div className="flex items-center">
                            <div className="w-2 h-2 bg-indigo-500 rounded-full mr-2"></div>
                            <h3 className="text-sm font-medium text-slate-800 truncate-mobile">
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
                    ))
                  ) : (
                    <div className="p-8 text-center">
                      <p className="text-slate-500">No upcoming scheduled messages</p>
                      <Button 
                        className="mt-4 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 hover:text-indigo-700" 
                        variant="ghost"
                        onClick={() => navigate('/send-message?schedule=true')}
                      >
                        Schedule Your First Message
                      </Button>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Recent Activity Feed */}
              <div className="mt-6">
                <h2 className="text-lg font-semibold text-slate-800 mb-4">Recent Activity</h2>
                <div className="bg-white border border-slate-100 rounded-xl shadow-sm overflow-hidden">
                  <div className="p-4 space-y-6">
                    {/* Activity timeline */}
                    <div className="relative pl-6 border-l-2 border-slate-200">
                      <div className="absolute w-3 h-3 bg-green-500 rounded-full -left-[7px] top-1"></div>
                      <div className="mb-1 flex justify-between items-center">
                        <p className="text-sm font-medium">Message sent successfully</p>
                        <span className="text-xs text-slate-500">Just now</span>
                      </div>
                      <p className="text-xs text-slate-500">Your message to #general was delivered</p>
                    </div>
                    
                    <div className="relative pl-6 border-l-2 border-slate-200">
                      <div className="absolute w-3 h-3 bg-blue-500 rounded-full -left-[7px] top-1"></div>
                      <div className="mb-1 flex justify-between items-center">
                        <p className="text-sm font-medium">Message scheduled</p>
                        <span className="text-xs text-slate-500">2 hours ago</span>
                      </div>
                      <p className="text-xs text-slate-500">You scheduled a message for tomorrow at 9:00 AM</p>
                    </div>
                    
                    <div className="relative pl-6 border-l-2 border-slate-200">
                      <div className="absolute w-3 h-3 bg-purple-500 rounded-full -left-[7px] top-1"></div>
                      <div className="mb-1 flex justify-between items-center">
                        <p className="text-sm font-medium">Slack workspace connected</p>
                        <span className="text-xs text-slate-500">Yesterday</span>
                      </div>
                      <p className="text-xs text-slate-500">Successfully connected to your Slack workspace</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Right column - Tips and info */}
            <div className="space-y-6">
              {/* Tips Card */}
              <Card className="bg-gradient-to-br from-indigo-50 to-white border border-slate-100 overflow-hidden">
                <CardHeader className="border-b border-indigo-100/50">
                  <CardTitle className="text-lg font-medium text-indigo-800 -mb-4">Threadly Tips</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex gap-3">
                      <div className="bg-indigo-100 text-indigo-700 rounded-full p-1 h-fit w-fit">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-indigo-900">Schedule Recurring Messages</h3>
                        <p className="text-xs text-indigo-700 mt-1">Set up daily or weekly messages for team updates</p>
                      </div>
                    </div>
                    
                    <div className="flex gap-3">
                      <div className="bg-indigo-100 text-indigo-700 rounded-full p-1 h-fit w-fit">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-indigo-900">Use Message Templates</h3>
                        <p className="text-xs text-indigo-700 mt-1">Save time with reusable message formats</p>
                      </div>
                    </div>
                    
                    <div className="flex gap-3">
                      <div className="bg-indigo-100 text-indigo-700 rounded-full p-1 h-fit w-fit">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-indigo-900">Optimize Send Times</h3>
                        <p className="text-xs text-indigo-700 mt-1">Schedule messages when your team is most active</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Usage Stats */}
              <Card className="bg-white border border-slate-100">
                <CardHeader>
                  <CardTitle className="text-lg font-medium text-slate-800 -mb-4">Usage Stats</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium text-slate-700">Messages Quota</span>
                        <span className="text-slate-500">65%</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2">
                        <div className="bg-indigo-600 h-2 rounded-full" style={{ width: '65%' }}></div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium text-slate-700">API Requests</span>
                        <span className="text-slate-500">32%</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2">
                        <div className="bg-green-500 h-2 rounded-full" style={{ width: '32%' }}></div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium text-slate-700">Storage</span>
                        <span className="text-slate-500">8%</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2">
                        <div className="bg-blue-500 h-2 rounded-full" style={{ width: '8%' }}></div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
