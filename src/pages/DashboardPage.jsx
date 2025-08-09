import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSlack } from '@/context/SlackContext';
import { getScheduledMessages } from '@/services/messageService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { MessageCircle, Calendar, Clock, ArrowRight } from 'lucide-react';
import InlineLoader from '@/components/ui/inline-loader';

export default function DashboardPage() {
  const { isConnected, slackWorkspace, isLoading } = useSlack();
  const [scheduledMessages, setScheduledMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  
  // Redirect to home if not connected
  useEffect(() => {
    if (!isLoading && !isConnected) {
      navigate('/');
    }
  }, [isConnected, isLoading, navigate]);
  
  // Fetch scheduled messages
  useEffect(() => {
    const fetchMessages = async () => {
      if (isConnected) {
        try {
          const userId = localStorage.getItem('userId');
          const messages = await getScheduledMessages(userId);
          setScheduledMessages(messages);
        } catch (error) {
          console.error('Error fetching scheduled messages:', error);
        } finally {
          setLoading(false);
        }
      }
    };
    
    fetchMessages();
  }, [isConnected]);
  
  return (
    <div>
      <header className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        {isConnected && (
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Connected to <span className="font-medium text-slate-700 dark:text-slate-300">{slackWorkspace?.name}</span>
          </p>
        )}
      </header>
      
      {loading ? (
        <div className="w-full flex justify-center py-10">
          <InlineLoader color="#4338CA" />
        </div>
      ) : (
        <>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card className="bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <MessageCircle className="h-5 w-5 text-indigo-700" />
                  Send Message
                </CardTitle>
                <CardDescription>Send a message to any channel</CardDescription>
              </CardHeader>
              <CardContent className="pb-3 pt-0">
                <p className="text-sm text-slate-500">
                  Quickly send a message to any channel in your Slack workspace.
                </p>
              </CardContent>
              <CardFooter>
                <Button className="bg-indigo-700 hover:bg-indigo-800 w-full" onClick={() => navigate('/send-message')}>
                  <span>New Message</span>
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </CardFooter>
            </Card>

            <Card className="bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-indigo-700" />
                  Schedule Message
                </CardTitle>
                <CardDescription>Schedule a message for later</CardDescription>
              </CardHeader>
              <CardContent className="pb-3 pt-0">
                <p className="text-sm text-slate-500">
                  Create a message that will be sent at a specific time in the future.
                </p>
              </CardContent>
              <CardFooter>
                <Button className="bg-indigo-700 hover:bg-indigo-800 w-full" onClick={() => navigate('/send-message?schedule=true')}>
                  <span>Schedule Message</span>
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </CardFooter>
            </Card>

            <Card className="bg-white border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="h-5 w-5 text-indigo-700" />
                  Scheduled Messages
                </CardTitle>
                <CardDescription>View your scheduled messages</CardDescription>
              </CardHeader>
              <CardContent className="pb-3 pt-0">
                <p className="text-sm text-slate-500">
                  Manage all your scheduled messages in one place.
                </p>
              </CardContent>
              <CardFooter>
                <Button className="bg-indigo-700 hover:bg-indigo-800 w-full" onClick={() => navigate('/scheduled')}>
                  <span>View Scheduled</span>
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </CardFooter>
            </Card>
          </div>
          
          {scheduledMessages.length > 0 && (
            <div className="mt-10 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-medium">Upcoming Messages</h2>
                <Button variant="outline" onClick={() => navigate('/scheduled')} className="text-sm">
                  View All
                </Button>
              </div>
              
              <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md shadow-sm overflow-hidden">
                <div className="divide-y divide-slate-200 dark:divide-slate-700">
                  {scheduledMessages.slice(0, 5).map(message => (
                    <div key={message.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                      <div className="flex justify-between mb-1">
                        <h3 className="text-sm font-medium">
                          #{message.channelName}
                        </h3>
                        <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {format(new Date(message.scheduledTime), 'MMM d, yyyy h:mm a')}
                        </span>
                      </div>
                      <p className="text-sm text-slate-500 dark:text-slate-400 truncate">{message.text}</p>
                    </div>
                  ))}
                  
                  {scheduledMessages.length === 0 && (
                    <div className="p-8 text-center">
                      <p className="text-slate-500 dark:text-slate-400">No upcoming scheduled messages</p>
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
