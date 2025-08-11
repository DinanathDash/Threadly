import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { CalendarIcon, Clock, Loader2, X, Check } from 'lucide-react';
import { format, isPast } from 'date-fns';
import '@/styles/message-card.css';

export function MessageCard({ message, type, onCancel, cancelling }) {
  const isSent = type === 'sent';
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <Card className="message-card">
      <CardContent className="message-card-container">
        <div className="space-y-4 -mb-8">
          {/* Channel */}
          <div className="-mt-4 flex items-center justify-between card-item">
            <span className="text-sm font-medium channel-label">Channel:</span>
            <span className="text-sm bg-muted rounded-md px-2 py-1">#{message.channelId}</span>
          </div>
          
          {/* Time info */}
          <div className="flex items-center justify-between card-item">
            <span className="text-sm font-medium channel-label">{isSent ? 'Sent:' : 'Scheduled:'}</span>
            <div className="flex flex-col items-end">
              <div className="flex items-center gap-1">
                <CalendarIcon className="h-3 w-3" />
                <span className="text-xs">
                  {format(isSent ? message.sentAt : message.scheduledTime, "MMM d, yyyy")}
                </span>
              </div>
              <div className="flex items-center gap-1 text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span className="text-xs">
                  {format(isSent ? message.sentAt : message.scheduledTime, "h:mm a")}
                </span>
              </div>
            </div>
          </div>
          
          {/* Status for sent messages */}
          {isSent && (
            <div className="flex items-center justify-between card-item">
              <span className="text-sm font-medium channel-label">Status:</span>
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700">
                <Check className="h-3 w-3 mr-1" /> Sent
              </span>
            </div>
          )}
          
          {/* Message content */}
          <div className="card-item">
            <p className="text-sm font-medium channel-label">Message:</p>
            <div className="mt-1 rounded-md bg-muted p-3">
              <p className="text-sm whitespace-pre-line line-clamp-3">
                {message.message}
              </p>
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="ghost" size="sm" className="mt-2 text-xs h-7 px-2">
                  View full message
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Message Content</DialogTitle>
                </DialogHeader>
                <div className="py-4">
                  <div className="rounded-md bg-muted p-3">
                    <p className="text-sm whitespace-pre-line">
                      {message.message}
                    </p>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardContent>
      
      {!isSent && !isPast(message.scheduledTime) && (
        <CardFooter>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="w-full">
                Cancel
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Cancel Scheduled Message</DialogTitle>
                <DialogDescription>
                  Are you sure you want to cancel this scheduled message?
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
                <Button 
                  variant="ghost" 
                  type="button" 
                  onClick={() => setDialogOpen(false)}
                >
                  Keep Scheduled
                </Button>
                <Button 
                  variant="destructive" 
                  type="button"
                  disabled={cancelling === message.id}
                  onClick={async () => {
                    await onCancel(message.id);
                    setDialogOpen(false);
                  }}
                >
                  {cancelling === message.id ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <X className="h-4 w-4 mr-2" />
                  )}
                  Cancel Message
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardFooter>
      )}
      
      {!isSent && isPast(message.scheduledTime) && (
        <CardFooter>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="w-full">
                View
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Message in Processing</DialogTitle>
                <DialogDescription>
                  This message is currently being processed for delivery.
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
            </DialogContent>
          </Dialog>
        </CardFooter>
      )}
    </Card>
  );
}
