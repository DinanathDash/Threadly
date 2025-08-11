import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useSlack } from '@/context/SlackContext';
import '@/styles/channel-fixes.css';
import { getChannelMessages, getChannelInfo, sendChannelMessage } from '@/services/channelService';
import { 
  Info, 
  Users, 
  Send,
  RefreshCcw,
  AlertCircle 
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function ChannelPage() {
  const { channelId } = useParams();
  const { currentUser } = useAuth();
  const { isConnected } = useSlack();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [messages, setMessages] = useState([]);
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState(null);
  const [channelInfo, setChannelInfo] = useState(null);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  
  const messagesEndRef = useRef(null);
  const scrollAreaRef = useRef(null);

  // Format timestamp to human-readable time
  const formatTimestamp = (timestamp) => {
    const date = new Date(parseInt(timestamp.split('.')[0]) * 1000);
    return date.toLocaleString('en-US', { 
      hour: 'numeric', 
      minute: 'numeric',
      hour12: true,
      month: 'short',
      day: 'numeric'
    });
  };
  
  // Fetch messages for this channel
  const fetchMessages = async (reset = true) => {
    if (!isConnected || !currentUser || !channelId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const cursor = reset ? null : nextCursor;
      const response = await getChannelMessages(currentUser.uid, channelId, cursor);
      
      // Sort messages by timestamp (oldest first, like Slack)
      const sortedMessages = [...response.messages].sort((a, b) => 
        parseFloat(a.timestamp) - parseFloat(b.timestamp)
      );
      
      if (reset) {
        setMessages(sortedMessages);
      } else {
        // For pagination, we add older messages at the top
        setMessages(prev => [...sortedMessages, ...prev]);
      }
      
      setHasMore(response.hasMore);
      setNextCursor(response.nextCursor);
    } catch (err) {
      console.error('Error fetching channel messages:', err);
      // Check for specific errors
      if (err.message && err.message.includes('403') || 
          err.message && err.message.includes('missing_scope')) {
        setError('Additional permissions needed to access channel messages. Please reconnect your Slack account.');
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };
  
  // Fetch channel information
  const fetchChannelInfo = async () => {
    if (!isConnected || !currentUser || !channelId) return;
    
    try {
      const response = await getChannelInfo(currentUser.uid, channelId);
      setChannelInfo(response);
    } catch (err) {
      console.error('Error fetching channel info:', err);
    }
  };
  
  // Handle sending a message
  const handleSendMessage = async () => {
    if (!message.trim() || !channelId || !currentUser) return;
    
    try {
      setSending(true);
      await sendChannelMessage(currentUser.uid, channelId, message);
      setMessage('');
      
      // Refetch messages to see the new one
      await fetchMessages();
      
      // Scroll to bottom
      scrollToBottom();
    } catch (err) {
      console.error('Error sending message:', err);
      setError(err.message);
    } finally {
      setSending(false);
    }
  };
  
  // Load more messages
  const loadMoreMessages = async () => {
    if (hasMore && !loading) {
      await fetchMessages(false);
    }
  };
  
  // Auto-scroll to bottom on new messages
  const scrollToBottom = () => {
    try {
      // Use the direct ref to scroll
      if (scrollAreaRef.current) {
        setTimeout(() => {
          scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
        }, 0);
      }
      
      // Also use the end ref as a backup
      if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: 'auto' });
      }
    } catch (e) {
      console.error('Error scrolling:', e);
    }
  };
  
  // Fetch initial data
  useEffect(() => {
    if (isConnected && currentUser && channelId) {
      fetchMessages();
      fetchChannelInfo();
    }
    
    // Set up an interval to refresh messages
    const interval = setInterval(() => {
      if (isConnected && currentUser && channelId) {
        fetchMessages();
      }
    }, 30000); // Refresh every 30 seconds
    
    return () => clearInterval(interval);
  }, [isConnected, currentUser, channelId]);
  
  // Scroll to bottom when messages change or loading status changes
  useEffect(() => {
    if (messages.length > 0) {
      // First scroll immediately
      scrollToBottom();
      
      // Then set up a delayed scroll to handle any async rendering
      const timeoutId = setTimeout(() => {
        scrollToBottom();
      }, 100);
      
      return () => clearTimeout(timeoutId);
    }
  }, [messages, loading]);
  
  // Initial scroll on mount and whenever channel changes
  useEffect(() => {
    // Initial scroll when component mounts
    scrollToBottom();
    
    const scrollHandler = () => {
      if (scrollAreaRef.current) {
        scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
      }
    };
    
    // Add a global resize handler to handle container size changes
    window.addEventListener('resize', scrollHandler);
    
    return () => window.removeEventListener('resize', scrollHandler);
  }, [channelId]);
  
  // Handle Enter key to send message
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-7rem)] overflow-hidden">
      {/* Channel Header */}
      <div className="border-b border-slate-100 px-3 sm:px-6 py-2 flex-shrink-0 flex flex-col sm:flex-row sm:items-center justify-between sticky top-0 bg-white z-10 gap-2 sm:gap-0">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-semibold text-slate-800 truncate max-w-[200px] sm:max-w-full">
            # {channelInfo?.name || 'Loading...'}
          </h1>
          {channelInfo?.isPrivate && (
            <Badge variant="outline" className="text-xs px-1.5 py-0">
              private
            </Badge>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {channelInfo && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="text-sm text-slate-500">
                    {channelInfo.memberCount > 0 ? channelInfo.memberCount : 1} {(channelInfo.memberCount === 1 || !channelInfo.memberCount) ? 'member' : 'members'}
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Channel has {channelInfo.memberCount > 0 ? channelInfo.memberCount : 1} {(channelInfo.memberCount === 1 || !channelInfo.memberCount) ? 'member' : 'members'}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon">
                <Info className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="mr-10 ml-4">
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Channel Info</h4>
                <Separator />
                {channelInfo ? (
                  <div className="text-sm space-y-1">
                    <p><span className="font-medium">Name:</span> #{channelInfo.name}</p>
                    {channelInfo.topic && (
                      <p><span className="font-medium">Topic:</span> {channelInfo.topic}</p>
                    )}
                    {channelInfo.purpose && (
                      <p><span className="font-medium">Purpose:</span> {channelInfo.purpose}</p>
                    )}
                    <p><span className="font-medium">Created:</span> {channelInfo.created}</p>
                  </div>
                ) : (
                  <p className="text-sm text-slate-500">Loading channel information...</p>
                )}
              </div>
            </PopoverContent>
          </Popover>
          
          <Button variant="ghost" size="icon" onClick={() => fetchMessages()} disabled={loading}>
            <RefreshCcw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>
      
      {/* Messages and Input Container */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Messages Area - flex-1 to take remaining space */}
        <div className="flex-1 overflow-hidden relative">
          <div className="h-full overflow-y-auto px-3 sm:px-6 py-2 messages-scroll-container" ref={scrollAreaRef}>
            <div className="flex flex-col justify-end min-h-full">
              {/* Load more button */}
              {/* Load more button */}
              {hasMore && (
                <div className="text-center py-2 mt-auto">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={loadMoreMessages}
                    disabled={loading}
                  >
                    {loading ? 'Loading...' : 'Load older messages'}
                  </Button>
                </div>
              )}
              
              {/* Error message */}
              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  <div>
                    <AlertDescription>
                      {error.includes('missing_scope') || error.includes('permissions') ? (
                        <>
                          <p className="font-medium mb-2">Additional Slack permissions are needed</p>
                          <p className="text-sm mb-3">This feature requires additional permissions to read channel messages.</p>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => window.location.href = '/oauth-callback?reauthorize=true'}
                          >
                            Reconnect to Slack
                          </Button>
                        </>
                      ) : (
                        error
                      )}
                    </AlertDescription>
                  </div>
                </Alert>
              )}
              
              {/* Messages list */}
              {loading && messages.length === 0 ? (
                // Loading skeletons
                <div className="space-y-4 mt-auto">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <Skeleton className="h-8 w-8 rounded-full" />
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2">
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-3 w-16" />
                        </div>
                        <Skeleton className="h-4 w-full" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-2 w-full mt-auto">
                  {messages.length === 0 ? (
                    <div className="text-center py-10" style={{ marginTop: 'auto' }}>
                      <p className="text-slate-500">No messages in this channel yet.</p>
                    </div>
                  ) : (
                    messages.map(msg => (
                      <div key={msg.id} className="flex items-start gap-2 sm:gap-3 group">
                        <Avatar className="h-7 w-7 sm:h-8 sm:w-8 flex-shrink-0">
                          {msg.userDetails?.avatar ? (
                            <AvatarImage src={msg.userDetails.avatar} alt={msg.userDetails.name || 'User'} />
                          ) : (
                            <AvatarFallback className="bg-indigo-100 text-indigo-700 text-xs sm:text-sm">
                              {msg.botName ? msg.botName.charAt(0).toUpperCase() : 
                               msg.userDetails?.name ? msg.userDetails.name.charAt(0).toUpperCase() : 
                               msg.user ? msg.user.charAt(0).toUpperCase() : 'T'}
                            </AvatarFallback>
                          )}
                        </Avatar>
                        
                        <div className="space-y-1 flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                            <span className="font-medium text-xs sm:text-sm truncate max-w-[120px] sm:max-w-full">
                              {msg.botName || msg.userDetails?.name || (msg.isBot ? 'Threadly Bot' : 'User')}
                              {msg.isBot && <span className="ml-1 text-xs text-gray-500">BOT</span>}
                            </span>
                            <span className="text-xs text-slate-400">
                              {formatTimestamp(msg.timestamp)}
                            </span>
                          </div>
                          <div className="text-xs sm:text-sm whitespace-pre-wrap break-words">{msg.text}</div>
                          
                          {/* Attachments if any */}
                          {msg.attachments && msg.attachments.length > 0 && (
                            <div className="mt-2 space-y-2">
                              {msg.attachments.map((att, idx) => (
                                <div key={idx} className="border rounded p-2 text-sm">
                                  {att.text || att.fallback}
                                </div>
                              ))}
                            </div>
                          )}
                          
                          {/* Reactions if any */}
                          {msg.reactions && msg.reactions.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {msg.reactions.map((reaction, idx) => (
                                <Badge key={idx} variant="outline" className="text-xs px-1.5 py-0">
                                  :{reaction.name}: {reaction.count}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
              
              {/* End reference for scrolling */}
              <div ref={messagesEndRef} />
            </div>
          </div>
        </div>
        
        {/* Message Input - Fixed at bottom */}
        <div className="flex-shrink-0 border-t border-slate-200 p-3 sm:p-4 bg-white shadow-md">
          <div className="flex items-end gap-2">
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Message #${channelInfo?.name || 'channel'}`}
              className="min-h-[60px] flex-1 resize-none focus:border-indigo-500"
              disabled={sending}
            />
            <Button 
              onClick={handleSendMessage} 
              disabled={!message.trim() || sending}
              className="mb-1"
            >
              <Send className="h-4 w-4 mr-2" />
              Send
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
