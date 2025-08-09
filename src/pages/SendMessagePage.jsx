import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSlack } from '@/context/SlackContext';
import { getSlackChannels } from '@/services/slackService';
import { sendImmediateMessage, scheduleMessage } from '@/services/messageService';
import InlineLoader from '@/components/ui/inline-loader';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { CalendarIcon, Clock, SendIcon } from 'lucide-react';
import { format, addDays, isBefore, addMinutes, set } from 'date-fns';

export default function SendMessagePage() {
  const [searchParams] = useSearchParams();
  const { isConnected, isLoading } = useSlack();
  const navigate = useNavigate();
  
  const defaultSchedule = searchParams.get('schedule') === 'true';
  
  // State
  const [channels, setChannels] = useState([]);
  const [selectedChannel, setSelectedChannel] = useState('');
  const [message, setMessage] = useState('');
  const [isScheduled, setIsScheduled] = useState(defaultSchedule);
  const [date, setDate] = useState(addDays(new Date(), 1));
  const [time, setTime] = useState('09:00');
  const [loadingChannels, setLoadingChannels] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // Redirect if not connected
  useEffect(() => {
    if (!isLoading && !isConnected) {
      navigate('/');
    }
  }, [isConnected, isLoading, navigate]);
  
  // Load channels
  useEffect(() => {
    const fetchChannels = async () => {
      if (isConnected) {
        try {
          const userId = localStorage.getItem('userId');
          const channelsData = await getSlackChannels(userId);
          setChannels(channelsData);
        } catch (error) {
          setError('Failed to load channels');
          console.error('Error loading channels:', error);
        } finally {
          setLoadingChannels(false);
        }
      }
    };
    
    fetchChannels();
  }, [isConnected]);
  
  // Calculate the scheduled time
  const getScheduledTime = () => {
    const [hours, minutes] = time.split(':').map(Number);
    return set(date, { hours, minutes, seconds: 0, milliseconds: 0 });
  };
  
  // Validate the form
  const validateForm = () => {
    if (!selectedChannel) {
      setError('Please select a channel');
      return false;
    }
    
    if (!message.trim()) {
      setError('Please enter a message');
      return false;
    }
    
    if (isScheduled) {
      const scheduledTime = getScheduledTime();
      if (isBefore(scheduledTime, new Date())) {
        setError('Scheduled time must be in the future');
        return false;
      }
    }
    
    setError(null);
    return true;
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setSending(true);
    
    try {
      const userId = localStorage.getItem('userId');
      
      if (isScheduled) {
        const scheduledTime = getScheduledTime();
        await scheduleMessage(userId, selectedChannel, message, scheduledTime);
        setSuccess('Message scheduled successfully');
      } else {
        await sendImmediateMessage(userId, selectedChannel, message);
        setSuccess('Message sent successfully');
      }
      
      // Reset form
      setMessage('');
    } catch (error) {
      setError(error.message || 'Failed to send message');
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };
  
  return (
    <div className="container mx-auto max-w-2xl space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">
          {isScheduled ? 'Schedule a Message' : 'Send a Message'}
        </h1>
        <p className="text-muted-foreground">
          {isScheduled 
            ? 'Schedule a message to be sent later to a Slack channel' 
            : 'Send an immediate message to a Slack channel'
          }
        </p>
      </div>
      
      <Card className="border-none shadow-md overflow-hidden">
        <form onSubmit={handleSubmit}>
          <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 border-b">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-md bg-indigo-100 flex items-center justify-center">
                  {isScheduled ? (
                    <Calendar className="h-5 w-5 text-indigo-700" />
                  ) : (
                    <SendIcon className="h-5 w-5 text-indigo-700" />
                  )}
                </div>
                <span>Message Details</span>
              </CardTitle>
              <div className="flex items-center gap-3 bg-white px-3 py-1.5 rounded-full shadow-sm border border-slate-200">
                <Label htmlFor="scheduled" className="text-sm font-normal cursor-pointer select-none">
                  Schedule for later
                </Label>
                <Switch 
                  id="scheduled" 
                  checked={isScheduled}
                  onCheckedChange={setIsScheduled}
                />
              </div>
            </div>
            <CardDescription className="ml-10">
              {isScheduled 
                ? "Set up your message to send at a specific time" 
                : "Send a message immediately to any channel"
              }
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6 pt-6">
            {/* Channel selector */}
            <div className="space-y-2">
              <Label htmlFor="channel" className="flex items-center gap-1.5 text-sm font-semibold">
                <Hash className="h-4 w-4 text-slate-400" />
                Channel
              </Label>
              <Select 
                value={selectedChannel} 
                onValueChange={setSelectedChannel}
                disabled={loadingChannels}
              >
                <SelectTrigger id="channel" className="bg-white border-slate-300">
                  <SelectValue placeholder="Select a channel" />
                </SelectTrigger>
                <SelectContent>
                  {loadingChannels ? (
                    <div className="p-2 text-center">
                      <InlineLoader color="#4A154B" />
                    </div>
                  ) : channels.length > 0 ? (
                    channels.map(channel => (
                      <SelectItem key={channel.id} value={channel.id}>
                        <span className="flex items-center gap-2">
                          <Hash className="h-3.5 w-3.5 text-slate-400" />
                          {channel.name}
                        </span>
                      </SelectItem>
                    ))
                  ) : (
                    <div className="p-2 text-center text-slate-500">No channels available</div>
                  )}
                </SelectContent>
              </Select>
            </div>
            
            {/* Message content */}
            <div className="space-y-2">
              <Label htmlFor="message" className="flex items-center gap-1.5 text-sm font-semibold">
                <MessageCircle className="h-4 w-4 text-slate-400" />
                Message
              </Label>
              <div className="border border-slate-200 dark:border-slate-700 rounded-md bg-white dark:bg-slate-900">
                <Textarea
                  id="message"
                  placeholder="Type your message here..."
                  className="min-h-[120px] border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
                <div className="flex items-center justify-between p-2 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    {message.length > 0 ? `${message.length} characters` : 'Enter your message'}
                  </div>
                  {/* We could add formatting buttons here in the future */}
                </div>
              </div>
            </div>
            
            {/* Schedule options */}
            {isScheduled && (
              <div className="border border-slate-200 dark:border-slate-700 rounded-md p-4 bg-blue-50/50 dark:bg-slate-800/50">
                <h3 className="text-sm font-medium mb-3 flex items-center gap-1.5">
                  <Clock className="h-4 w-4 text-blue-500" />
                  <span>Delivery Time</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs text-slate-500 dark:text-slate-400">Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4 text-blue-500" />
                          {date ? format(date, 'PPP') : 'Pick a date'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={date}
                          onSelect={setDate}
                          disabled={(date) => isBefore(date, new Date())}
                          initialFocus
                          className="rounded-md border border-slate-200"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="time" className="text-xs text-slate-500 dark:text-slate-400">Time</Label>
                    <div className="flex items-center bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md px-3 py-2">
                      <Clock className="mr-2 h-4 w-4 text-blue-500" />
                      <Input
                        id="time"
                        type="time"
                        value={time}
                        onChange={(e) => setTime(e.target.value)}
                        className="flex-1 border-0 p-0 focus-visible:ring-0"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Error/Success messages */}
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 p-3 rounded-md text-sm">
                {error}
              </div>
            )}
            
            {success && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 p-3 rounded-md text-sm flex items-center gap-2">
                <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                </svg>
                {success}
              </div>
            )}
          </CardContent>
          
          <CardFooter className="flex justify-between bg-slate-50 border-t border-slate-200 py-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => navigate('/dashboard')}
              className="border-slate-300 hover:bg-slate-100"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={sending}
              className={`${isScheduled ? 'bg-indigo-700 hover:bg-indigo-800' : 'bg-indigo-700 hover:bg-indigo-800'}`}
            >
              {sending ? (
                <div className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </div>
              ) : (
                <>
                  {isScheduled ? (
                    <>
                      <Calendar className="mr-2 h-4 w-4" />
                      Schedule Message
                    </>
                  ) : (
                    <>
                      <SendIcon className="mr-2 h-4 w-4" />
                      Send Now
                    </>
                  )}
                </>
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
