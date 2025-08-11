import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  SendIcon,
  X,
  MessageSquare,
  User
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { submitSupportTicket, getSupportTickets, getTicketById, addTicketResponse } from '@/services/supportService';

export default function SupportPage() {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState('new-ticket');
  const [loading, setLoading] = useState(false);

  // New ticket form state
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [priority, setPriority] = useState('normal');

  // State for tickets
  const [tickets, setTickets] = useState([]);
  const [loadingTickets, setLoadingTickets] = useState(false);

  // Ticket details modal state
  const [ticketDetailsOpen, setTicketDetailsOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [loadingTicketDetails, setLoadingTicketDetails] = useState(false);
  const [ticketResponse, setTicketResponse] = useState('');
  const [submittingResponse, setSubmittingResponse] = useState(false);

  // Fetch user's support tickets when tab changes to my-tickets
  useEffect(() => {
    const fetchTickets = async () => {
      if (activeTab === 'my-tickets' && currentUser) {
        try {
          setLoadingTickets(true);
          const ticketsData = await getSupportTickets(currentUser.uid);
          setTickets(ticketsData);
        } catch (error) {
          console.error('Error fetching tickets:', error);
          toast.error('Failed to load your support tickets');
        } finally {
          setLoadingTickets(false);
        }
      }
    };

    fetchTickets();
  }, [activeTab, currentUser]);

  // Handle viewing ticket details
  const handleViewTicketDetails = async (ticketId) => {
    try {
      setLoadingTicketDetails(true);
      setTicketDetailsOpen(true);

      const ticketData = await getTicketById(ticketId);
      setSelectedTicket(ticketData);
    } catch (error) {
      console.error('Error fetching ticket details:', error);
      toast.error('Failed to load ticket details');
      setTicketDetailsOpen(false);
    } finally {
      setLoadingTicketDetails(false);
    }
  };

  // Handle closing the ticket details modal
  const handleCloseTicketDetails = () => {
    setTicketDetailsOpen(false);
    setSelectedTicket(null);
    setTicketResponse('');
  };

  // Handle submitting a response to a ticket
  const handleSubmitResponse = async (e) => {
    e.preventDefault();

    if (!ticketResponse.trim() || !selectedTicket) {
      toast.error('Please enter a message');
      return;
    }

    try {
      setSubmittingResponse(true);

      await addTicketResponse(selectedTicket.id, {
        message: ticketResponse,
        isAdmin: false,
        userName: currentUser.displayName || currentUser.email.split('@')[0]
      });

      // Refresh ticket details
      const updatedTicket = await getTicketById(selectedTicket.id);
      setSelectedTicket(updatedTicket);

      // Clear response field
      setTicketResponse('');

      toast.success('Response added successfully');
    } catch (error) {
      console.error('Error adding response:', error);
      toast.error('Failed to add response');
    } finally {
      setSubmittingResponse(false);
    }
  };

  const handleTicketSubmit = async (e) => {
    e.preventDefault();

    if (!subject.trim() || !message.trim()) {
      toast.error('Please complete all fields');
      return;
    }

    try {
      setLoading(true);

      // Send the ticket data to our backend using the supportService
      await submitSupportTicket({
        userId: currentUser.uid,
        subject,
        message,
        priority,
        email: currentUser.email,
        name: currentUser.displayName || currentUser.email.split('@')[0]
      });

      toast.success('Support ticket submitted successfully', {
        description: 'We will get back to you as soon as possible.'
      });

      // Reset form
      setSubject('');
      setMessage('');
      setPriority('normal');

      // Switch to tickets tab
      setActiveTab('my-tickets');
    } catch (error) {
      console.error('Error submitting ticket:', error);
      toast.error('Failed to submit ticket', {
        description: error.message || 'Please try again later.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pb-10">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Support Center</h1>
        <p className="text-slate-500 mt-1">Get help with Threadly or report issues</p>
      </div>

      <Tabs defaultValue="new-ticket" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="new-ticket">New Support Ticket</TabsTrigger>
          <TabsTrigger value="my-tickets">My Tickets</TabsTrigger>
          <TabsTrigger value="help">Help Resources</TabsTrigger>
        </TabsList>

        <TabsContent value="new-ticket">
          <Card>
            <CardHeader>
              <CardTitle>Submit a Support Ticket</CardTitle>
              <CardDescription>
                Please provide details about your issue or question. Our support team will get back to you as soon as possible.
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleTicketSubmit}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Input
                    id="subject"
                    placeholder="Brief description of your issue"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    placeholder="Please provide as much detail as possible about your issue"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="min-h-[150px]"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select
                    defaultValue="normal"
                    value={priority}
                    onValueChange={(value) => {
                      setPriority(value);
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low - General question</SelectItem>
                      <SelectItem value="normal">Normal - Issue affecting some functionality</SelectItem>
                      <SelectItem value="high">High - Critical issue affecting core functionality</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between items-center pt-2">
                <div className="text-sm text-slate-500">
                  All fields are required
                </div>
                <Button
                  type="submit"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="animate-spin mr-2">
                        <Clock size={16} />
                      </span>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <SendIcon size={16} className="mr-2" />
                      Submit Ticket
                    </>
                  )}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>

        <TabsContent value="my-tickets">
          <Card>
            <CardHeader>
              <CardTitle>My Support Tickets</CardTitle>
              <CardDescription>
                View and track the status of your support tickets
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingTickets ? (
                <div className="flex justify-center items-center py-12">
                  <div className="flex flex-col items-center">
                    <Clock size={30} className="animate-spin text-indigo-600 mb-3" />
                    <p className="text-slate-500">Loading your tickets...</p>
                  </div>
                </div>
              ) : tickets.length > 0 ? (
                <div className="divide-y divide-slate-200 border rounded-lg">
                  {tickets.map(ticket => (
                    <div key={ticket.id} className="p-4 hover:bg-slate-50 transition-colors">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-medium text-slate-900">{ticket.subject}</h3>
                          <span className="text-xs text-slate-500">Ticket ID: {ticket.id} • {ticket.createdAt ? new Date(ticket.createdAt).toLocaleDateString() : 'Unknown date'}</span>
                        </div>
                        <div>
                          {ticket.status === 'resolved' ? (
                            <span className="inline-flex items-center bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                              <CheckCircle size={12} className="mr-1" /> Resolved
                            </span>
                          ) : ticket.status === 'open' ? (
                            <span className="inline-flex items-center bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                              <Clock size={12} className="mr-1" /> Open
                            </span>
                          ) : (
                            <span className="inline-flex items-center bg-amber-100 text-amber-800 text-xs px-2 py-1 rounded-full">
                              <AlertTriangle size={12} className="mr-1" /> Pending
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="mt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs"
                          onClick={() => handleViewTicketDetails(ticket.id)}
                        >
                          View Details
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500">
                  <p>You haven't submitted any support tickets yet.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="help">
          <Card>
            <CardHeader>
              <CardTitle>Help Resources</CardTitle>
              <CardDescription>
                Find answers to common questions and learn more about Threadly
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-2">Contact Information</h3>
                  <p className="text-slate-600 mb-4">
                    If you need immediate assistance, you can reach out to us directly:
                  </p>
                  <ul className="space-y-2">
                    <li className="flex items-center">
                      <span className="font-medium mr-2">Email:</span>
                      <a href="mailto:dashdinanath056@gmail.com" className="text-indigo-600 hover:text-indigo-800">
                        dashdinanath056@gmail.com
                      </a>
                    </li>
                    <li className="flex items-center">
                      <span className="font-medium mr-2">GitHub:</span>
                      <a href="https://github.com/DinanathDash" className="text-indigo-600 hover:text-indigo-800" target="_blank" rel="noopener noreferrer">
                        github.com/DinanathDash
                      </a>
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-2">Frequently Asked Questions</h3>
                  <div className="space-y-4">
                    <div className="border border-slate-200 rounded-lg p-4">
                      <h4 className="font-medium text-slate-900 mb-2">How do I connect my Slack workspace?</h4>
                      <p className="text-slate-600">
                        To connect your Slack workspace, go to the Dashboard and click on the "Connect with Slack" button.
                        Follow the authorization process to grant Threadly access to your workspace.
                      </p>
                    </div>
                    <div className="border border-slate-200 rounded-lg p-4">
                      <h4 className="font-medium text-slate-900 mb-2">Can I schedule recurring messages?</h4>
                      <p className="text-slate-600">
                        Yes, you can schedule recurring messages. When creating a new message, select the "Make recurring"
                        option and choose your preferred frequency.
                      </p>
                    </div>
                    <div className="border border-slate-200 rounded-lg p-4">
                      <h4 className="font-medium text-slate-900 mb-2">What if my scheduled message fails to send?</h4>
                      <p className="text-slate-600">
                        If a scheduled message fails to send, you'll receive a notification. You can view the details
                        in the Scheduled Messages section and attempt to resend or edit the message.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Ticket Details Modal */}
      <Dialog open={ticketDetailsOpen} onOpenChange={setTicketDetailsOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          {loadingTicketDetails ? (
            <div className="flex justify-center items-center py-12">
              <div className="flex flex-col items-center">
                <Clock size={30} className="animate-spin text-indigo-600 mb-3" />
                <p className="text-slate-500">Loading ticket details...</p>
              </div>
            </div>
          ) : selectedTicket ? (
            <>
              <DialogHeader>
                <h2 className='text-xl font-semibold'>Ticket Details</h2>
                <DialogTitle className="text-xl flex justify-between items-center">
                  <span className='text-lg font-medium'>{selectedTicket.subject}</span>
                  <span className={`inline-flex items-center text-xs px-2 py-1 rounded-full ${selectedTicket.status === 'resolved' ? 'bg-green-100 text-green-800' :
                    selectedTicket.status === 'open' ? 'bg-blue-100 text-blue-800' :
                      'bg-amber-100 text-amber-800'
                    }`}>
                    {selectedTicket.status === 'resolved' ? (
                      <><CheckCircle size={12} className="mr-1" /> Resolved</>
                    ) : selectedTicket.status === 'open' ? (
                      <><Clock size={12} className="mr-1" /> Open</>
                    ) : (
                      <><AlertTriangle size={12} className="mr-1" /> {selectedTicket.status}</>
                    )}
                  </span>
                </DialogTitle>
                <DialogDescription className="flex justify-between">
                  <span>Ticket ID: {selectedTicket.id}</span>
                  <span>Created: {selectedTicket.createdAt ? new Date(selectedTicket.createdAt).toLocaleString() : 'Unknown date'}</span>
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                <div className="border-b pb-2">
                  <h4 className="text-sm font-medium text-slate-500">Original Message:</h4>
                  <div className="mt-2 bg-slate-50 p-4 rounded-md">
                    <div className="flex items-start gap-3">
                      <div className="bg-indigo-100 rounded-full p-2 flex-shrink-0">
                        <User size={16} className="text-indigo-600" />
                      </div>
                      <div>
                        <div className="flex items-center">
                          <span className="font-medium">{selectedTicket.name || 'You'}</span>
                          <span className="text-xs text-slate-500 ml-2">
                            {selectedTicket.createdAt ? new Date(selectedTicket.createdAt).toLocaleString() : ''}
                          </span>
                        </div>
                        <div className="mt-1 text-slate-700 whitespace-pre-line">{selectedTicket.message}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {selectedTicket.responses && selectedTicket.responses.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-slate-500 mb-3">Conversation:</h4>
                    <div className="space-y-4">
                      {selectedTicket.responses.map((response, index) => (
                        <div key={index} className={`p-4 rounded-md ${response.isAdmin ? 'bg-blue-50' : 'bg-slate-50'}`}>
                          <div className="flex items-start gap-3">
                            <div className={`${response.isAdmin ? 'bg-blue-100' : 'bg-indigo-100'} rounded-full p-2 flex-shrink-0`}>
                              {response.isAdmin ? (
                                <MessageSquare size={16} className="text-blue-600" />
                              ) : (
                                <User size={16} className={`${response.isAdmin ? 'text-blue-600' : 'text-indigo-600'}`} />
                              )}
                            </div>
                            <div>
                              <div className="flex items-center">
                                <span className="font-medium">
                                  {response.isAdmin ? 'Support Agent' : (response.name || 'You')}
                                </span>
                                <span className="text-xs text-slate-500 ml-2">
                                  {response.createdAt ? new Date(response.createdAt).toLocaleString() : ''}
                                </span>
                              </div>
                              <div className="mt-1 text-slate-700 whitespace-pre-line">{response.message}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Response form */}
                {selectedTicket.status !== 'resolved' && selectedTicket.status !== 'closed' && (
                  <div className="pt-4 border-t">
                    <h4 className="text-sm font-medium text-slate-700 mb-2">Add Response</h4>
                    <form onSubmit={handleSubmitResponse}>
                      <Textarea
                        value={ticketResponse}
                        onChange={(e) => setTicketResponse(e.target.value)}
                        placeholder="Type your response here..."
                        className="min-h-[100px] mb-3"
                      />
                      <div className="flex justify-between">
                        <Button variant="outline" onClick={handleCloseTicketDetails}>
                          Close
                        </Button>
                        <Button type="submit" disabled={submittingResponse}>
                          {submittingResponse ? (
                            <>
                              <span className="animate-spin mr-2">
                                <Clock size={16} />
                              </span>
                              Sending...
                            </>
                          ) : (
                            <>
                              <SendIcon size={16} className="mr-2" />
                              Send Response
                            </>
                          )}
                        </Button>
                      </div>
                    </form>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="py-8 text-center text-slate-500">
              <p>Failed to load ticket details.</p>
              <Button variant="outline" onClick={handleCloseTicketDetails} className="mt-4">
                Close
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
