import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSlack } from '@/context/SlackContext';
import { getScheduledMessages } from '@/services/messageService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { MessageCircle, Calendar, Clock } from 'lucide-react';

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
    <div className="container mx-auto max-w-6xl space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        {isConnected && (
          <p className="text-muted-foreground">
            Connected to <span className="font-medium text-foreground">{slackWorkspace?.name}</span>
          </p>
        )}
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="border-none shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="pb-2 bg-blue-50 dark:bg-slate-800/50 rounded-t-lg">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-blue-500" strokeWidth={1.5} />
              Send a Message
            </CardTitle>
            <CardDescription>Send a message to any channel immediately</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="h-20 bg-white dark:bg-slate-900/50 rounded-md p-4 border border-slate-200 dark:border-slate-800">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Send instant messages to any channel in your Slack workspace.
              </p>
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              className="w-full"
              onClick={() => navigate('/send-message')}
            >
              Send Message
            </Button>
          </CardFooter>
        </Card>
        
        <Card className="border-none shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="pb-2 bg-indigo-50 dark:bg-slate-800/50 rounded-t-lg">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Calendar className="h-5 w-5 text-indigo-500" strokeWidth={1.5} />
              Schedule a Message
            </CardTitle>
            <CardDescription>Schedule a message for future delivery</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="h-20 bg-white dark:bg-slate-900/50 rounded-md p-4 border border-slate-200 dark:border-slate-800">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Set up messages to be sent at specific times in the future.
              </p>
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              className="w-full"
              onClick={() => navigate('/send-message?schedule=true')}
            >
              Schedule Message
            </Button>
          </CardFooter>
        </Card>
        
        <Card className="border-none shadow-md hover:shadow-lg transition-shadow">
          <CardHeader className="pb-2 bg-green-50 dark:bg-slate-800/50 rounded-t-lg">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Clock className="h-5 w-5 text-green-500" strokeWidth={1.5} />
              Scheduled Messages
            </CardTitle>
            <CardDescription>Manage your scheduled messages</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="flex items-center justify-center h-20 bg-white dark:bg-slate-900/50 rounded-md border border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-green-100 dark:bg-green-900/20 w-12 h-12 flex items-center justify-center">
                  <span className="text-xl font-bold text-green-600 dark:text-green-400">{scheduledMessages.length}</span>
                </div>
                <span className="text-sm text-slate-600 dark:text-slate-400">
                  {scheduledMessages.length === 1 ? 'Message' : 'Messages'} scheduled
                </span>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              className="w-full"
              onClick={() => navigate('/scheduled')}
              variant="outline"
            >
              View All
            </Button>
          </CardFooter>
        </Card>
      </div>
      
      {scheduledMessages.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Upcoming Messages</h2>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate('/scheduled')}
              className="text-blue-500 hover:text-blue-600 hover:bg-blue-50 -mr-2"
            >
              View All
            </Button>
          </div>
          
          <div className="bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            {scheduledMessages
              .sort((a, b) => a.scheduledTime - b.scheduledTime)
              .slice(0, 3)
              .map((message, index) => (
                <div 
                  key={message.id} 
                  className={`p-4 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors ${
                    index !== 0 ? "border-t border-slate-200 dark:border-slate-800" : ""
                  }`}
                >
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 mt-1">
                      <div className="w-9 h-9 rounded bg-blue-100 dark:bg-slate-700 flex items-center justify-center text-blue-600 dark:text-blue-400">
                        <Calendar className="h-5 w-5" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-1">
                        <div>
                          <p className="font-medium text-slate-900 dark:text-slate-200">
                            #{message.channelId}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            Scheduled for {format(message.scheduledTime, "PPP 'at' p")}
                          </p>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => navigate(`/scheduled/${message.id}`)}
                          className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700"
                        >
                          Edit
                        </Button>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-800/60 rounded p-3 mt-2">
                        <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap break-words">
                          {message.message}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {scheduledMessages.length === 0 && (
                <div className="p-8 text-center">
                  <p className="text-slate-500 dark:text-slate-400">No upcoming scheduled messages</p>
                </div>
              )}
          </div>
        </div>
      )}
    </div>
  );
}
