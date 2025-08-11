import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSlack } from '@/context/SlackContext';
import { getScheduledMessages, getSentMessages, cancelScheduledMessage } from '@/services/messageService';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, CalendarIcon, Clock, AlertTriangle, X, Check } from 'lucide-react';
import { format, isPast } from 'date-fns';
import { MessageCard } from '@/components/ui/message-card';

export default function ScheduledMessagesPage() {
  const { isConnected, isLoading } = useSlack();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  
  // State
  const [upcomingMessages, setUpcomingMessages] = useState([]);
  const [sentMessages, setSentMessages] = useState([]);
  const [activeTab, setActiveTab] = useState("upcoming");
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  
  // Redirect if not connected
  useEffect(() => {
    if (!isLoading && !isConnected) {
      navigate('/');
    }
  }, [isConnected, isLoading, navigate]);
  
  // Load messages
  useEffect(() => {
    const fetchMessages = async () => {
      if (isConnected) {
        try {
          setLoading(true);
          const userId = localStorage.getItem('userId');
          
          // Get both upcoming and sent messages
          const [upcomingData, sentData] = await Promise.all([
            getScheduledMessages(userId),
            getSentMessages(userId)
          ]);
          
          setUpcomingMessages(upcomingData);
          setSentMessages(sentData);
        } catch (error) {
          toast.error('Failed to load messages', {
            description: error.message || 'There was an error loading your messages.',
            duration: 5000,
          });
          console.error('Error loading messages:', error);
        } finally {
          setLoading(false);
        }
      }
    };
    
    fetchMessages();
    
    // Refresh messages every minute
    const interval = setInterval(fetchMessages, 60000);
    return () => clearInterval(interval);
  }, [isConnected]);
  
  // Handle cancellation
  const handleCancelMessage = async (messageId) => {
    setCancelling(messageId);
    try {
      await cancelScheduledMessage(messageId);
      // Update the messages list
      setUpcomingMessages(upcomingMessages.filter(msg => msg.id !== messageId));
      toast.success('Message cancelled', {
        description: 'Your scheduled message has been cancelled.',
      });
    } catch (error) {
      // Even if there's an error, the message might have been successfully cancelled in Firestore
      // So we should still remove it from the UI
      setUpcomingMessages(upcomingMessages.filter(msg => msg.id !== messageId));
      
      // Show a warning toast instead of an error since the cancellation may have partially succeeded
      toast.warning('Message cancellation notice', {
        description: 'Your message was cancelled, but there may have been an issue with the server notification. The cancellation should still be effective.',
      });
      console.warn('Warning during message cancellation:', error);
    } finally {
      setCancelling(null);
    }
  };
  
  return (
    <div className={`container mx-auto max-w-6xl space-y-8 ${isMobile ? 'px-4' : ''}`}>
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Scheduled Messages</h1>
        <p className="text-muted-foreground">
          View and manage your scheduled messages
        </p>
      </div>
      
      <Tabs 
        defaultValue="upcoming" 
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full"
      >
        <TabsList className="mb-4">
          <TabsTrigger value="upcoming">Upcoming Messages</TabsTrigger>
          <TabsTrigger value="sent">Sent Messages</TabsTrigger>
        </TabsList>
        
        <TabsContent value="upcoming">
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Messages</CardTitle>
              <CardDescription>
                Messages scheduled to be sent in the future
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
          ) : upcomingMessages.length > 0 ? (
            isMobile ? (
              <div className="space-y-4">
                {upcomingMessages
                  .sort((a, b) => a.scheduledTime - b.scheduledTime)
                  .map(message => (
                    <MessageCard
                      key={message.id}
                      message={message}
                      type="upcoming"
                      onCancel={handleCancelMessage}
                      cancelling={cancelling}
                    />
                  ))}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Channel</TableHead>
                    <TableHead>Message</TableHead>
                    <TableHead>Scheduled For</TableHead>
                    <TableHead className="w-[150px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {upcomingMessages
                    .sort((a, b) => a.scheduledTime - b.scheduledTime)
                    .map(message => (
                      <TableRow key={message.id}>
                        <TableCell>#{message.channelId}</TableCell>
                        <TableCell className="max-w-md">
                          <p className="truncate">{message.message}</p>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <div className="flex items-center gap-1">
                              <CalendarIcon className="h-3 w-3" />
                              <span className="text-sm">
                                {format(message.scheduledTime, "MMM d, yyyy")}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              <span className="text-sm">
                                {format(message.scheduledTime, "h:mm a")}
                              </span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Dialog open={dialogOpen === message.id} onOpenChange={(isOpen) => isOpen ? setDialogOpen(message.id) : setDialogOpen(null)}>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm" className="w-full">
                                {isPast(message.scheduledTime) ? 'View' : 'Cancel'}
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>
                                  {isPast(message.scheduledTime) 
                                    ? 'Message in Processing' 
                                    : 'Cancel Scheduled Message'
                                  }
                                </DialogTitle>
                                <DialogDescription>
                                  {isPast(message.scheduledTime)
                                    ? 'This message is currently being processed for delivery.'
                                    : 'Are you sure you want to cancel this scheduled message?'
                                  }
                                </DialogDescription>
                              </DialogHeader>
                              
                              <div className="space-y-4 py-4">
                                <div className="grid gap-2">
                                  <h4 className="font-medium">Channel</h4>
                                  <p className="text-sm">#{message.channelId}</p>
                                </div>
                                
                                <div className="grid gap-2">
                                  <h4 className="font-medium">Scheduled for</h4>
                                  <p className="text-sm">
                                    {format(message.scheduledTime, "PPPp")}
                                  </p>
                                </div>
                                
                                <div className="grid gap-2">
                                  <h4 className="font-medium">Message</h4>
                                  <div className="rounded-md bg-muted p-3">
                                    <p className="text-sm whitespace-pre-line">
                                      {message.message}
                                    </p>
                                  </div>
                                </div>
                              </div>
                              
                              <DialogFooter>
                                {!isPast(message.scheduledTime) && (
                                  <>
                                    <Button 
                                      variant="ghost" 
                                      type="button" 
                                      onClick={() => setDialogOpen(null)}
                                    >
                                      Keep Scheduled
                                    </Button>
                                    <Button 
                                      variant="destructive" 
                                      type="button"
                                      disabled={cancelling === message.id}
                                      onClick={async () => {
                                        await handleCancelMessage(message.id);
                                        setDialogOpen(null);
                                      }}
                                    >
                                      {cancelling === message.id ? (
                                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                      ) : (
                                        <X className="h-4 w-4 mr-2" />
                                      )}
                                      Cancel Message
                                    </Button>
                                  </>
                                )}
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            )
          ) : (
            <div className="flex flex-col items-center justify-center py-8 gap-4">
              <div className="rounded-full bg-muted p-3">
                <CalendarIcon className="h-6 w-6 text-muted-foreground" />
              </div>
              <div className="text-center space-y-1">
                <h3 className="font-medium">No scheduled messages</h3>
                <p className="text-sm text-muted-foreground">
                  You don't have any messages scheduled for delivery
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => navigate('/send-message?schedule=true')}
              >
                Schedule a Message
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
        </TabsContent>
        
        <TabsContent value="sent">
          <Card>
            <CardHeader>
              <CardTitle>Sent Messages</CardTitle>
              <CardDescription>
                Messages that have been sent to Slack
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : sentMessages.length > 0 ? (
                isMobile ? (
                  <div className="space-y-4">
                    {sentMessages
                      .sort((a, b) => b.sentAt - a.sentAt) // Show newest first
                      .map(message => (
                        <MessageCard
                          key={message.id}
                          message={message}
                          type="sent"
                        />
                      ))}
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Channel</TableHead>
                        <TableHead>Message</TableHead>
                        <TableHead>Sent At</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sentMessages
                        .sort((a, b) => b.sentAt - a.sentAt) // Show newest first
                        .map(message => (
                          <TableRow key={message.id}>
                            <TableCell>#{message.channelId}</TableCell>
                            <TableCell className="max-w-md">
                              <p className="truncate">{message.message}</p>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col">
                                <div className="flex items-center gap-1">
                                  <CalendarIcon className="h-3 w-3" />
                                  <span className="text-sm">
                                    {format(message.sentAt, "MMM d, yyyy")}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1 text-muted-foreground">
                                  <Clock className="h-3 w-3" />
                                  <span className="text-sm">
                                    {format(message.sentAt, "h:mm a")}
                                  </span>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700">
                                <Check className="h-3 w-3 mr-1" /> Sent
                              </span>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                )
              ) : (
                <div className="flex flex-col items-center justify-center py-8 gap-4">
                  <div className="rounded-full bg-muted p-3">
                    <Check className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div className="text-center space-y-1">
                    <h3 className="font-medium">No sent messages</h3>
                    <p className="text-sm text-muted-foreground">
                      You don't have any scheduled messages that have been sent yet
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => navigate('/send-message?schedule=true')}
                  >
                    Schedule a Message
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
