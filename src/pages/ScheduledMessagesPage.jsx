import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSlack } from '@/context/SlackContext';
import { getScheduledMessages, cancelScheduledMessage } from '@/services/messageService';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, CalendarIcon, Clock, AlertTriangle, X, Check } from 'lucide-react';
import { format, isPast } from 'date-fns';

export default function ScheduledMessagesPage() {
  const { isConnected, isLoading } = useSlack();
  const navigate = useNavigate();
  
  // State
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(null);
  const [error, setError] = useState(null);
  
  // Redirect if not connected
  useEffect(() => {
    if (!isLoading && !isConnected) {
      navigate('/');
    }
  }, [isConnected, isLoading, navigate]);
  
  // Load scheduled messages
  useEffect(() => {
    const fetchMessages = async () => {
      if (isConnected) {
        try {
          const userId = localStorage.getItem('userId');
          const messagesData = await getScheduledMessages(userId);
          setMessages(messagesData);
        } catch (error) {
          setError('Failed to load scheduled messages');
          console.error('Error loading scheduled messages:', error);
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
      setMessages(messages.filter(msg => msg.id !== messageId));
    } catch (error) {
      setError('Failed to cancel message');
      console.error('Error cancelling message:', error);
    } finally {
      setCancelling(null);
    }
  };
  
  return (
    <div className="container mx-auto max-w-6xl space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Scheduled Messages</h1>
        <p className="text-muted-foreground">
          View and manage your scheduled messages
        </p>
      </div>
      
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
          ) : messages.length > 0 ? (
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
                {messages
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
                        <Dialog>
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
                                  <Button variant="ghost" type="button">
                                    Keep Scheduled
                                  </Button>
                                  <Button 
                                    variant="destructive" 
                                    type="button"
                                    disabled={cancelling === message.id}
                                    onClick={() => handleCancelMessage(message.id)}
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
          
          {error && (
            <div className="mt-4 p-4 bg-destructive/10 rounded-md flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <p className="text-sm font-medium text-destructive">{error}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
