import React from 'react';
import { Avatar } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

/**
 * MessageThread component that renders a Slack-like message thread
 */
export function MessageThread({ messages = [], title, className }) {
  if (messages.length === 0) {
    return null;
  }

  return (
    <div className={cn("bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden", className)}>
      {title && (
        <div className="border-b border-slate-200 dark:border-slate-800 px-4 py-3 bg-slate-50 dark:bg-slate-800/60">
          <h3 className="font-medium text-slate-800 dark:text-slate-200">{title}</h3>
        </div>
      )}
      
      <div>
        {messages.map((message, index) => (
          <div 
            key={message.id || index} 
            className={`p-4 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors ${
              index !== 0 ? "border-t border-slate-200 dark:border-slate-800" : ""
            }`}
          >
            <div className="flex gap-3">
              <div className="flex-shrink-0">
                <Avatar>
                  {message.avatar || (
                    <div className={`w-9 h-9 rounded bg-${message.color || 'blue'}-100 dark:bg-slate-700 flex items-center justify-center text-${message.color || 'blue'}-600 dark:text-${message.color || 'blue'}-400`}>
                      {message.icon || message.user?.charAt(0).toUpperCase() || '?'}
                    </div>
                  )}
                </Avatar>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-slate-900 dark:text-slate-200">
                      {message.user || 'Unknown User'}
                    </span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {message.timestamp && format(message.timestamp, "h:mm a")}
                    </span>
                  </div>
                  {message.actions && (
                    <div className="flex items-center gap-1">
                      {message.actions.map((action, i) => (
                        <Button 
                          key={i}
                          variant="ghost" 
                          size="sm"
                          onClick={action.onClick}
                          className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-700"
                        >
                          {action.icon && <span className="mr-1">{action.icon}</span>}
                          {action.label}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
                <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap break-words">
                  {message.content}
                </p>
                
                {message.attachments && message.attachments.length > 0 && (
                  <div className="mt-2 space-y-2">
                    {message.attachments.map((attachment, i) => (
                      <div key={i} className="bg-slate-50 dark:bg-slate-800/60 rounded p-3">
                        {attachment}
                      </div>
                    ))}
                  </div>
                )}
                
                {message.replies && message.replies.length > 0 && (
                  <div className="mt-3 pl-2 border-l-2 border-slate-200 dark:border-slate-700 space-y-3">
                    {message.replies.map((reply, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <Avatar className="w-6 h-6">
                          <div className={`w-6 h-6 rounded bg-${reply.color || 'gray'}-100 dark:bg-slate-700 flex items-center justify-center text-${reply.color || 'gray'}-600 dark:text-${reply.color || 'gray'}-400 text-xs`}>
                            {reply.user?.charAt(0).toUpperCase() || '?'}
                          </div>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-xs text-slate-900 dark:text-slate-200">
                              {reply.user}
                            </span>
                            <span className="text-xs text-slate-500 dark:text-slate-400">
                              {reply.timestamp && format(reply.timestamp, "h:mm a")}
                            </span>
                          </div>
                          <p className="text-xs text-slate-700 dark:text-slate-300">
                            {reply.content}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
