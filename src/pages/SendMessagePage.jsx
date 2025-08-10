import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSlack } from '@/context/SlackContext';
import { getSlackChannels, getSlackOAuthUrl } from '@/services/slackService';
import { sendImmediateMessage, scheduleMessage } from '@/services/messageService';
import InlineLoader from '@/components/ui/inline-loader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { toast } from 'sonner';

import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Calendar as CalendarIcon, Clock, SendIcon, Loader2, Hash, MessageCircle, RefreshCcw } from 'lucide-react';
import { format, addDays, isBefore, addMinutes, set } from 'date-fns';

export default function SendMessagePage() {
  const [searchParams] = useSearchParams();
  const { isConnected, isLoading } = useSlack();
  const navigate = useNavigate();

  const defaultSchedule = searchParams.get('schedule') === 'false';

  // State
  const [channels, setChannels] = useState([]);
  const [selectedChannel, setSelectedChannel] = useState('');
  const [message, setMessage] = useState('');
  const [isScheduled, setIsScheduled] = useState(defaultSchedule);
  const [date, setDate] = useState(new Date());
  const [time, setTime] = useState('09:00');
  const [loadingChannels, setLoadingChannels] = useState(true);
  const [sending, setSending] = useState(false);
  
  // Handle date selection
  const handleDateSelect = (newDate) => {
    // Ensure we're working with a proper Date object
    const selectedDate = new Date(newDate);
    console.log('Selected date:', selectedDate.toString());
    setDate(selectedDate);
  };

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
          setLoadingChannels(true);

          const userId = localStorage.getItem('userId');

          if (!userId) {
            throw new Error('User ID not found. Please try logging in again.');
          }

          console.log(`Fetching channels for user ID: ${userId}`);
          const channelsData = await getSlackChannels(userId);

          if (Array.isArray(channelsData) && channelsData.length > 0) {
            console.log(`Successfully loaded ${channelsData.length} channels`);
            setChannels(channelsData);
          } else {
            console.warn('No channels returned from API');
            setChannels([]);
            toast.warning('No channels found', {
              description: 'No channels found in your Slack workspace. You might need to join some channels first.',
              duration: 6000,
            });
          }
        } catch (error) {
          console.error('Error loading channels:', error);
          const errorMessage = error.message || 'Failed to load channels';
          
          // Special handling for permission errors
          if (error.message && error.message.includes('missing_scope')) {
            toast.error('Additional permissions needed', {
              description: 'Your Slack connection needs additional permissions to access private channels.',
              action: {
                label: 'Reconnect',
                onClick: () => handleReconnectSlack(),
              },
              duration: 10000,
            });
          } else {
            toast.error('Failed to load channels', {
              description: `${errorMessage}. Please reconnect your Slack account or try again later.`,
              duration: 6000,
            });
          }
        } finally {
          setLoadingChannels(false);
        }
      }
    };

    fetchChannels();
  }, [isConnected]);

  // Handle reconnecting to Slack with additional permissions
  const handleReconnectSlack = async () => {
    try {
      // Check if we have a userId before proceeding
      const userId = localStorage.getItem('userId');
      if (!userId) {
        throw new Error('User ID not found. Please try logging in again.');
      }
      
      console.log('Reconnecting Slack with additional permissions for user ID:', userId);
      const slackOAuthUrl = await getSlackOAuthUrl();
      
      // Store current userId in sessionStorage to ensure it's available after OAuth redirect
      sessionStorage.setItem('connectingUserId', userId);
      
      toast.info('Redirecting to Slack', {
        description: 'You will be redirected to Slack to grant additional permissions.',
      });
      
      window.location.href = slackOAuthUrl;
    } catch (error) {
      console.error('Error starting Slack OAuth flow:', error);
      toast.error('Failed to reconnect', {
        description: error.message || 'Please try again later.',
      });
    }
  };

  // Calculate the scheduled time
  const getScheduledTime = () => {
    try {
      if (!date) {
        console.error('No date selected');
        throw new Error('Please select a date');
      }
      
      // Parse the time from the time input
      const [hours, minutes] = time.split(':').map(Number);
      
      if (isNaN(hours) || isNaN(minutes)) {
        console.error('Invalid time format:', time);
        throw new Error('Invalid time format');
      }
      
      // Create a new date by setting hours and minutes on the selected date
      const dateToUse = new Date(date);
      if (!(dateToUse instanceof Date) || isNaN(dateToUse.getTime())) {
        console.error('Invalid date:', date);
        throw new Error('Invalid date format');
      }
      
      const scheduledDateTime = set(dateToUse, { 
        hours, 
        minutes, 
        seconds: 0, 
        milliseconds: 0 
      });
      
      console.log('Scheduling message for:', scheduledDateTime.toString(), 'ISO:', scheduledDateTime.toISOString());
      return scheduledDateTime;
    } catch (error) {
      console.error('Error parsing scheduled time:', error);
      throw new Error(`Invalid date or time format: ${error.message}`);
    }
  };

  // Validate the form
  const validateForm = () => {
    if (!selectedChannel) {
      toast.error('Please select a channel');
      return false;
    }

    if (!message.trim()) {
      toast.error('Please enter a message');
      return false;
    }

    if (isScheduled) {
      const scheduledTime = getScheduledTime();
      if (isBefore(scheduledTime, new Date())) {
        toast.error('Scheduled time must be in the future');
        return false;
      }
    }

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
        toast.success('Message scheduled successfully', {
          description: `Your message to #${selectedChannel} has been scheduled.`,
          duration: 5000,
        });
      } else {
        await sendImmediateMessage(userId, selectedChannel, message);
        toast.success('Message sent successfully', {
          description: `Your message has been sent to #${selectedChannel}.`,
          duration: 5000,
        });
      }

      // Reset form
      setMessage('');
    } catch (error) {
      toast.error('Failed to send message', {
        description: error.message || 'There was an error. Please try again.',
        duration: 5000,
      });
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="container mx-auto space-y-6 px-4">
      <Card className="border border-slate-100 shadow-sm rounded-xl overflow-hidden">
        <form onSubmit={handleSubmit}>
          <CardHeader className="bg-white border-b border-slate-100">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-indigo-50 flex items-center justify-center">
                  {isScheduled ? (
                    <CalendarIcon className="h-5 w-5 text-indigo-600" strokeWidth={1.5} />
                  ) : (
                    <SendIcon className="h-5 w-5 text-indigo-600" strokeWidth={1.5} />
                  )}
                </div>
                <span className="text-slate-800">Message Details</span>
              </CardTitle>
              <div className="flex items-center gap-3 bg-slate-50 px-3 py-1.5 rounded-full shadow-sm border border-slate-100">
                <Label htmlFor="scheduled" className="text-sm font-medium text-slate-600 cursor-pointer select-none">
                  Schedule for later
                </Label>
                <Switch
                  id="scheduled"
                  checked={isScheduled}
                  onCheckedChange={setIsScheduled}
                  className="data-[state=checked]:bg-indigo-600"
                />
              </div>
            </div>
            <CardDescription className="ml-12 text-slate-500">
              {isScheduled
                ? "Set up your message to send at a specific time"
                : "Send a message immediately to any channel"
              }
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6 pt-4">
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
              <Label htmlFor="message" className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <MessageCircle className="h-4 w-4 text-indigo-500" />
                Message
              </Label>
              <div className="border border-slate-200 rounded-lg bg-white">
                <Textarea
                  id="message"
                  placeholder="Type your message here..."
                  className="min-h-[120px] border-0 focus-visible:ring-0 focus-visible:ring-offset-0 rounded-none"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
                <div className="flex items-center justify-between p-1 border-t border-slate-100 bg-slate-50 rounded-b-lg">
                  <div className="text-xs text-slate-500 px-2">
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
                        <div 
                          className="inline-flex items-center justify-start w-full gap-2 px-4 py-2 text-sm font-medium bg-white border border-slate-200 rounded-lg text-left cursor-pointer hover:bg-slate-50 hover:border-slate-300"
                          role="button"
                          tabIndex={0}
                        >
                          <CalendarIcon className="h-4 w-4 text-indigo-500 flex-shrink-0" strokeWidth={1.5} />
                          <span>{date ? format(date, 'PPP') : 'Pick a date'}</span>
                        </div>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={date}
                          onSelect={handleDateSelect}
                          disabled={(date) => {
                            // Allow today's date but disable past dates
                            const today = new Date();
                            today.setHours(0, 0, 0, 0);
                            const compareDate = new Date(date);
                            compareDate.setHours(0, 0, 0, 0);
                            return compareDate < today;
                          }}
                          initialFocus
                          className="rounded-lg border border-slate-100"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="time" className="text-xs text-slate-500">Time</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <div 
                          className="inline-flex items-center justify-start w-full gap-2 px-4 py-2 text-sm font-medium bg-white border border-slate-200 rounded-lg text-left cursor-pointer hover:bg-slate-50 hover:border-slate-300"
                          role="button"
                          tabIndex={0}
                        >
                          <Clock className="h-4 w-4 text-indigo-500 flex-shrink-0" strokeWidth={1.5} />
                          <span>{time ? format(set(new Date(), { hours: parseInt(time.split(':')[0]), minutes: parseInt(time.split(':')[1]) }), 'h:mm a') : 'Select time'}</span>
                        </div>
                      </PopoverTrigger>
                      <PopoverContent className="w-60 p-4">
                        <div className="space-y-4">
                          <div>
                            <h4 className="text-sm font-medium mb-2">Select Time</h4>
                            <div className="flex items-center">
                              <input
                                id="time"
                                type="time"
                                value={time}
                                onChange={(e) => setTime(e.target.value)}
                                className="w-full px-3 py-2 border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-4 gap-2">
                            {['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'].map((presetTime) => (
                              <button
                                key={presetTime}
                                type="button"
                                onClick={() => setTime(presetTime)}
                                className={`px-2 py-1 text-xs rounded-md ${time === presetTime ? 'bg-indigo-100 text-indigo-700 font-medium' : 'bg-slate-50 hover:bg-slate-100'}`}
                              >
                                {format(set(new Date(), { hours: parseInt(presetTime.split(':')[0]), minutes: parseInt(presetTime.split(':')[1]) }), 'h:mm a')}
                              </button>
                            ))}
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </div>
            )}
          </CardContent>

          <CardFooter className="flex justify-between py-6 -mb-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/dashboard')}
              className="border-slate-200 hover:bg-slate-100 rounded-lg"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={sending}
              className="bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm"
            >
              {sending ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="animate-spin h-4 w-4" />
                  Processing...
                </div>
              ) : (
                <>
                  {isScheduled ? (
                    <>
                      <CalendarIcon className="mr-2 h-4 w-4" />
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
