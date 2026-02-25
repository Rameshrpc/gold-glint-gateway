import { useState, useEffect, useRef, useCallback } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { 
  MessageCircle, Send, Bot, UserCheck, Search, Phone, 
  MoreVertical, Paperclip, Clock, Check, CheckCheck, AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, isToday, isYesterday } from 'date-fns';
import { toast } from 'sonner';

interface Chat {
  id: string;
  client_id: string;
  customer_id: string | null;
  customer_phone: string;
  status: string;
  assigned_to: string | null;
  last_message_at: string | null;
  last_message_preview: string | null;
  unread_count: number;
  tags: string[] | null;
  created_at: string;
  // Joined
  customer_name?: string;
}

interface Message {
  id: string;
  chat_id: string;
  client_id: string;
  sender_type: string;
  sender_id: string | null;
  message_text: string | null;
  message_type: string;
  media_url: string | null;
  provider_message_id: string | null;
  delivery_status: string;
  is_outbound: boolean;
  created_at: string;
}

function formatChatTime(dateStr: string | null) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isToday(d)) return format(d, 'h:mm a');
  if (isYesterday(d)) return 'Yesterday';
  return format(d, 'dd/MM/yy');
}

function getInitials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

function DeliveryIcon({ status }: { status: string }) {
  switch (status) {
    case 'read': return <CheckCheck className="h-3.5 w-3.5 text-blue-500" />;
    case 'delivered': return <CheckCheck className="h-3.5 w-3.5 text-muted-foreground" />;
    case 'sent': return <Check className="h-3.5 w-3.5 text-muted-foreground" />;
    case 'failed': return <AlertCircle className="h-3.5 w-3.5 text-destructive" />;
    default: return <Clock className="h-3 w-3 text-muted-foreground" />;
  }
}

export default function WhatsAppInbox() {
  const { profile, client } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sending, setSending] = useState(false);
  const [loadingChats, setLoadingChats] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const clientId = profile?.client_id;
  const selectedChat = chats.find(c => c.id === selectedChatId);

  // Fetch chats
  const fetchChats = useCallback(async () => {
    if (!clientId) return;
    const { data, error } = await supabase
      .from('whatsapp_chats')
      .select('*')
      .eq('client_id', clientId)
      .order('last_message_at', { ascending: false, nullsFirst: false });

    if (error) {
      console.error('Error fetching chats:', error);
      return;
    }

    // Fetch customer names for chats that have customer_id
    const customerIds = (data || []).map(c => c.customer_id).filter(Boolean) as string[];
    let customerMap: Record<string, string> = {};
    if (customerIds.length > 0) {
      const { data: customers } = await supabase
        .from('customers')
        .select('id, full_name')
        .in('id', customerIds);
      if (customers) {
        customerMap = Object.fromEntries(customers.map(c => [c.id, c.full_name]));
      }
    }

    setChats((data || []).map(c => ({
      ...c,
      customer_name: c.customer_id ? customerMap[c.customer_id] : undefined,
    })));
    setLoadingChats(false);
  }, [clientId]);

  // Fetch messages for selected chat
  const fetchMessages = useCallback(async () => {
    if (!selectedChatId || !clientId) return;
    setLoadingMessages(true);
    const { data, error } = await supabase
      .from('whatsapp_messages')
      .select('*')
      .eq('chat_id', selectedChatId)
      .eq('client_id', clientId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching messages:', error);
    }
    setMessages(data || []);
    setLoadingMessages(false);

    // Mark chat as read
    await supabase
      .from('whatsapp_chats')
      .update({ unread_count: 0 })
      .eq('id', selectedChatId);
  }, [selectedChatId, clientId]);

  useEffect(() => { fetchChats(); }, [fetchChats]);
  useEffect(() => { fetchMessages(); }, [fetchMessages]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Realtime subscriptions
  useEffect(() => {
    if (!clientId) return;

    const chatChannel = supabase
      .channel('whatsapp-chats-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'whatsapp_chats', filter: `client_id=eq.${clientId}` }, () => {
        fetchChats();
      })
      .subscribe();

    const msgChannel = supabase
      .channel('whatsapp-messages-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'whatsapp_messages', filter: `client_id=eq.${clientId}` }, (payload) => {
        const newMsg = payload.new as Message;
        if (newMsg.chat_id === selectedChatId) {
          setMessages(prev => [...prev, newMsg]);
        }
        fetchChats(); // refresh sidebar
      })
      .subscribe();

    return () => {
      supabase.removeChannel(chatChannel);
      supabase.removeChannel(msgChannel);
    };
  }, [clientId, selectedChatId, fetchChats]);

  // Send message
  const handleSend = async () => {
    if (!newMessage.trim() || !selectedChatId || !clientId || !profile) return;
    setSending(true);
    const msgText = newMessage.trim();
    setNewMessage('');

    const { error } = await supabase.from('whatsapp_messages').insert({
      chat_id: selectedChatId,
      client_id: clientId,
      sender_type: 'human',
      sender_id: profile.user_id,
      message_text: msgText,
      message_type: 'text',
      is_outbound: true,
      delivery_status: 'sent',
    });

    if (error) {
      toast.error('Failed to send message');
      setNewMessage(msgText);
    } else {
      // Update chat preview
      await supabase.from('whatsapp_chats').update({
        last_message_at: new Date().toISOString(),
        last_message_preview: msgText.slice(0, 100),
      }).eq('id', selectedChatId);
    }
    setSending(false);
  };

  const filteredChats = chats.filter(c => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (c.customer_name?.toLowerCase().includes(q) || c.customer_phone.includes(q) || c.last_message_preview?.toLowerCase().includes(q));
  });

  const getStatusBadge = (chat: Chat) => {
    if (chat.status === 'bot_handled') {
      return <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-blue-500/30 text-blue-600 dark:text-blue-400 bg-blue-500/10"><Bot className="h-2.5 w-2.5 mr-0.5" />Bot</Badge>;
    }
    if (chat.assigned_to) {
      return <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-green-500/30 text-green-600 dark:text-green-400 bg-green-500/10"><UserCheck className="h-2.5 w-2.5 mr-0.5" />Agent</Badge>;
    }
    return <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-amber-500/30 text-amber-600 dark:text-amber-400 bg-amber-500/10">Unassigned</Badge>;
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col h-[calc(100vh-3.5rem)] lg:h-screen">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b bg-card">
          <MessageCircle className="h-5 w-5 text-primary" />
          <h1 className="text-lg font-semibold text-foreground">WhatsApp Inbox</h1>
          <Badge variant="secondary" className="ml-auto">{chats.length} chats</Badge>
        </div>

        <div className="flex flex-1 min-h-0">
          {/* LEFT PANE — Chat List */}
          <div className={cn(
            "w-full md:w-[340px] lg:w-[380px] flex-shrink-0 border-r bg-card flex flex-col",
            selectedChatId && "hidden md:flex"
          )}>
            {/* Search */}
            <div className="p-3 border-b">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search chats..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-9 h-9 bg-muted/50"
                />
              </div>
            </div>

            {/* Chat list */}
            <ScrollArea className="flex-1">
              {loadingChats ? (
                <div className="p-8 text-center text-muted-foreground text-sm">Loading chats...</div>
              ) : filteredChats.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground text-sm">
                  {searchQuery ? 'No chats found' : 'No WhatsApp chats yet'}
                </div>
              ) : (
                filteredChats.map(chat => (
                  <button
                    key={chat.id}
                    onClick={() => setSelectedChatId(chat.id)}
                    className={cn(
                      "w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-muted/50 transition-colors border-b border-border/50",
                      selectedChatId === chat.id && "bg-muted"
                    )}
                  >
                    <Avatar className="h-10 w-10 flex-shrink-0 mt-0.5">
                      <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                        {chat.customer_name ? getInitials(chat.customer_name) : chat.customer_phone.slice(-2)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm text-foreground truncate">
                          {chat.customer_name || chat.customer_phone}
                        </span>
                        <span className="text-[11px] text-muted-foreground ml-2 flex-shrink-0">
                          {formatChatTime(chat.last_message_at)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-0.5">
                        <p className="text-xs text-muted-foreground truncate pr-2">
                          {chat.last_message_preview || 'No messages yet'}
                        </p>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          {chat.unread_count > 0 && (
                            <span className="inline-flex items-center justify-center h-5 min-w-[20px] px-1.5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
                              {chat.unread_count}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="mt-1">{getStatusBadge(chat)}</div>
                    </div>
                  </button>
                ))
              )}
            </ScrollArea>
          </div>

          {/* RIGHT PANE — Message Thread */}
          <div className={cn(
            "flex-1 flex flex-col bg-background",
            !selectedChatId && "hidden md:flex"
          )}>
            {!selectedChatId ? (
              <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-3">
                <MessageCircle className="h-16 w-16 opacity-20" />
                <p className="text-sm">Select a chat to view messages</p>
              </div>
            ) : (
              <>
                {/* Chat Header */}
                <div className="flex items-center gap-3 px-4 py-3 border-b bg-card">
                  {/* Back button on mobile */}
                  <Button variant="ghost" size="icon" className="md:hidden h-8 w-8" onClick={() => setSelectedChatId(null)}>
                    <span className="sr-only">Back</span>
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                  </Button>
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-primary/10 text-primary text-sm">
                      {selectedChat?.customer_name ? getInitials(selectedChat.customer_name) : selectedChat?.customer_phone.slice(-2)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-foreground truncate">
                      {selectedChat?.customer_name || selectedChat?.customer_phone}
                    </p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <Phone className="h-3 w-3" />
                      {selectedChat?.customer_phone}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    {selectedChat && getStatusBadge(selectedChat)}
                  </div>
                </div>

                {/* Messages */}
                <ScrollArea className="flex-1 px-4 py-3">
                  {loadingMessages ? (
                    <div className="text-center text-muted-foreground text-sm py-8">Loading...</div>
                  ) : messages.length === 0 ? (
                    <div className="text-center text-muted-foreground text-sm py-8">No messages in this conversation</div>
                  ) : (
                    <div className="space-y-2 max-w-2xl mx-auto">
                      {messages.map(msg => (
                        <div
                          key={msg.id}
                          className={cn(
                            "flex",
                            msg.is_outbound ? "justify-end" : "justify-start"
                          )}
                        >
                          <div className={cn(
                            "max-w-[75%] rounded-xl px-3.5 py-2 shadow-sm",
                            msg.is_outbound
                              ? "bg-primary text-primary-foreground rounded-br-sm"
                              : "bg-muted text-foreground rounded-bl-sm",
                            msg.sender_type === 'bot' && !msg.is_outbound && "border border-blue-500/20 bg-blue-500/5"
                          )}>
                            {msg.sender_type === 'bot' && (
                              <div className="flex items-center gap-1 mb-1">
                                <Bot className="h-3 w-3 text-blue-500" />
                                <span className="text-[10px] font-medium text-blue-500">AI Bot</span>
                              </div>
                            )}
                            <p className="text-sm whitespace-pre-wrap break-words">{msg.message_text}</p>
                            <div className={cn(
                              "flex items-center justify-end gap-1 mt-1",
                              msg.is_outbound ? "text-primary-foreground/60" : "text-muted-foreground"
                            )}>
                              <span className="text-[10px]">{format(new Date(msg.created_at), 'h:mm a')}</span>
                              {msg.is_outbound && <DeliveryIcon status={msg.delivery_status} />}
                            </div>
                          </div>
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </ScrollArea>

                {/* Input */}
                <div className="border-t bg-card px-4 py-3">
                  <form
                    onSubmit={e => { e.preventDefault(); handleSend(); }}
                    className="flex items-center gap-2 max-w-2xl mx-auto"
                  >
                    <Input
                      placeholder="Type a message..."
                      value={newMessage}
                      onChange={e => setNewMessage(e.target.value)}
                      disabled={sending}
                      className="flex-1 bg-muted/50"
                      autoFocus
                    />
                    <Button
                      type="submit"
                      size="icon"
                      disabled={!newMessage.trim() || sending}
                      className="h-10 w-10 rounded-full"
                    >
                      <Send className="h-4 w-4" />
                    </Button>
                  </form>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
