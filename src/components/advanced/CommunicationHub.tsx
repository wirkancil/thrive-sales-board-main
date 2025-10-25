import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  MessageSquare, 
  Phone, 
  Mail, 
  Calendar,
  Send,
  Paperclip,
  Users,
  Clock,
  Star,
  MoreHorizontal,
  Video,
  FileText,
  ExternalLink
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface Activity {
  id: string;
  type: 'message' | 'call' | 'email' | 'meeting' | 'note';
  content: string;
  author: {
    id: string;
    name: string;
    avatar?: string;
  };
  timestamp: string;
  opportunity_id?: string;
  customer_name?: string;
  attachments?: Array<{ name: string; type: string; url: string }>;
  priority?: 'low' | 'medium' | 'high';
}

interface Conversation {
  id: string;
  participants: Array<{ id: string; name: string; avatar?: string }>;
  last_message: string;
  last_activity: string;
  unread_count: number;
  opportunity_name?: string;
}

export const CommunicationHub = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchCommunicationData = async () => {
      setLoading(true);
      try {
        // Initialize empty data - in real app, fetch from API
        setActivities([]);
        setConversations([]);
      } catch (error) {
        console.error('Error fetching communication data:', error);
        toast.error('Failed to load communication data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchCommunicationData();
  }, []);



  const sendMessage = () => {
    if (!newMessage.trim()) return;

    const message: Activity = {
      id: `msg-${Date.now()}`,
      type: 'message',
      content: newMessage,
      author: { id: user?.id || '', name: 'You' },
      timestamp: new Date().toISOString()
    };

    setActivities(prev => [message, ...prev]);
    setNewMessage('');
    toast.success('Message sent');
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'message':
        return <MessageSquare className="h-4 w-4" />;
      case 'call':
        return <Phone className="h-4 w-4" />;
      case 'email':
        return <Mail className="h-4 w-4" />;
      case 'meeting':
        return <Calendar className="h-4 w-4" />;
      case 'note':
        return <FileText className="h-4 w-4" />;
      default:
        return <MessageSquare className="h-4 w-4" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'message':
        return 'text-blue-500';
      case 'call':
        return 'text-green-500';
      case 'email':
        return 'text-purple-500';
      case 'meeting':
        return 'text-orange-500';
      case 'note':
        return 'text-gray-500';
      default:
        return 'text-blue-500';
    }
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'high':
        return 'border-l-red-500 bg-red-50';
      case 'medium':
        return 'border-l-yellow-500 bg-yellow-50';
      case 'low':
        return 'border-l-green-500 bg-green-50';
      default:
        return 'border-l-gray-200 bg-background';
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const date = new Date(timestamp);
    const diff = now.getTime() - date.getTime();
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-32 bg-muted rounded"></div>
            <div className="h-32 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <MessageSquare className="h-6 w-6 text-primary" />
            Communication Hub
          </h2>
          <p className="text-muted-foreground">Stay connected with your team and customers</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Phone className="h-4 w-4 mr-2" />
            Start Call
          </Button>
          <Button variant="outline" size="sm">
            <Video className="h-4 w-4 mr-2" />
            Video Meeting
          </Button>
        </div>
      </div>

      <Tabs defaultValue="feed" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="feed">Activity Feed</TabsTrigger>
          <TabsTrigger value="conversations">Conversations</TabsTrigger>
          <TabsTrigger value="compose">Compose</TabsTrigger>
        </TabsList>

        <TabsContent value="feed" className="space-y-4">
          <div className="flex gap-2 mb-4">
            <Button variant="outline" size="sm">All</Button>
            <Button variant="ghost" size="sm">Messages</Button>
            <Button variant="ghost" size="sm">Calls</Button>
            <Button variant="ghost" size="sm">Emails</Button>
            <Button variant="ghost" size="sm">Meetings</Button>
          </div>

          <ScrollArea className="h-[600px]">
            <div className="space-y-3">
              {activities.map((activity) => (
                <Card key={activity.id} className={`border-l-4 ${getPriorityColor(activity.priority)}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={activity.author.avatar} />
                        <AvatarFallback>{activity.author.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{activity.author.name}</span>
                            <div className={`p-1 rounded ${getActivityColor(activity.type)}`}>
                              {getActivityIcon(activity.type)}
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {activity.type}
                            </Badge>
                            {activity.customer_name && (
                              <Badge variant="secondary" className="text-xs">
                                {activity.customer_name}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {formatTimeAgo(activity.timestamp)}
                          </div>
                        </div>
                        
                        <p className="text-sm">{activity.content}</p>
                        
                        {activity.attachments && activity.attachments.length > 0 && (
                          <div className="flex gap-2 mt-2">
                            {activity.attachments.map((attachment, index) => (
                              <Button key={index} variant="outline" size="sm" className="text-xs">
                                <Paperclip className="h-3 w-3 mr-1" />
                                {attachment.name}
                              </Button>
                            ))}
                          </div>
                        )}
                      </div>
                      
                      <Button variant="ghost" size="sm">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="conversations" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[600px]">
            {/* Conversations List */}
            <div className="lg:col-span-1 space-y-2">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                Active Conversations
              </h3>
              <ScrollArea className="h-[550px]">
                {conversations.map((conversation) => (
                  <Card 
                    key={conversation.id}
                    className={`cursor-pointer mb-2 ${selectedConversation === conversation.id ? 'ring-2 ring-primary' : ''}`}
                    onClick={() => setSelectedConversation(conversation.id)}
                  >
                    <CardContent className="p-3">
                      <div className="flex items-center gap-2">
                        <div className="flex -space-x-2">
                          {conversation.participants.slice(0, 2).map((participant) => (
                            <Avatar key={participant.id} className="w-6 h-6 border-2 border-background">
                              <AvatarImage src={participant.avatar} />
                              <AvatarFallback className="text-xs">{participant.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                          ))}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium truncate">
                              {conversation.participants.map(p => p.name).join(', ')}
                            </p>
                            {conversation.unread_count > 0 && (
                              <Badge variant="destructive" className="text-xs">
                                {conversation.unread_count}
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground truncate">
                            {conversation.last_message}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatTimeAgo(conversation.last_activity)}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </ScrollArea>
            </div>
            
            {/* Chat Area */}
            <div className="lg:col-span-2">
              {selectedConversation ? (
                <Card className="h-full">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">Conversation</h3>
                        <Badge variant="outline">Active</Badge>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <Phone className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Video className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="flex flex-col h-[480px]">
                    <ScrollArea className="flex-1 mb-4">
                      <div className="space-y-3 p-2">
                        {/* Mock messages */}
                        <div className="flex gap-2">
                          <Avatar className="w-6 h-6">
                            <AvatarFallback>JS</AvatarFallback>
                          </Avatar>
                          <div className="bg-muted p-2 rounded-lg max-w-[80%]">
                            <p className="text-sm">Let's schedule a follow-up call to discuss the implementation details.</p>
                            <p className="text-xs text-muted-foreground mt-1">2m ago</p>
                          </div>
                        </div>
                        <div className="flex gap-2 justify-end">
                          <div className="bg-primary text-primary-foreground p-2 rounded-lg max-w-[80%]">
                            <p className="text-sm">Sounds good! I'm available tomorrow afternoon.</p>
                            <p className="text-xs text-primary-foreground/70 mt-1">1m ago</p>
                          </div>
                        </div>
                      </div>
                    </ScrollArea>
                    
                    {/* Message Input */}
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Paperclip className="h-4 w-4" />
                      </Button>
                      <Input 
                        placeholder="Type a message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                        className="flex-1"
                      />
                      <Button onClick={sendMessage}>
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className="h-full flex items-center justify-center">
                  <div className="text-center text-muted-foreground">
                    <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Select a conversation to start messaging</p>
                  </div>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="compose" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Compose Message</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Recipients</label>
                <Input placeholder="Search team members or customers..." />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Subject</label>
                <Input placeholder="Enter subject..." />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Message</label>
                <Textarea 
                  placeholder="Type your message..."
                  className="min-h-[200px]"
                />
              </div>
              
              <div className="flex justify-between">
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Paperclip className="h-4 w-4 mr-2" />
                    Attach Files
                  </Button>
                  <Button variant="outline" size="sm">
                    <Star className="h-4 w-4 mr-2" />
                    High Priority
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline">Save Draft</Button>
                  <Button>Send Message</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};