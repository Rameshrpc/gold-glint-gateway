import { useState, useEffect, useRef, useCallback } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  MessageCircle, Send, Bot, UserCheck, Search, Phone, 
  Clock, Check, CheckCheck, AlertCircle, Info, IndianRupee,
  CalendarClock, FileText, ArrowLeft, Zap, ChevronRight,
  AlertTriangle, User, CreditCard, Plus, Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, isToday, isYesterday, differenceInDays } from 'date-fns';
import { toast } from 'sonner';

// ── Types ──────────────────────────────────────────────
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
  customer_name?: string;
  // GLMS context
  active_loan_count?: number;
  total_outstanding?: number;
  overdue_days?: number;
  last_payment_date?: string | null;
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

interface LoanSummary {
  id: string;
  loan_number: string;
  principal_amount: number;
  interest_rate: number;
  loan_date: string;
  maturity_date: string;
  status: string;
  next_interest_due_date: string | null;
  last_interest_paid_date: string | null;
  total_interest_paid: number | null;
}

type FilterTab = 'all' | 'overdue' | 'bot' | 'unassigned';

// ── Quick Reply Templates ──────────────────────────────
const QUICK_TEMPLATES = [
  {
    label: 'Payment Reminder',
    icon: IndianRupee,
    template: (name: string, amount: string, dueDate: string) =>
      `Dear ${name}, your gold loan interest of ₹${amount} is due on ${dueDate}. Kindly make the payment to avoid penalty charges. Thank you.`,
  },
  {
    label: 'Due Notice',
    icon: CalendarClock,
    template: (name: string, loanNo: string, days: string) =>
      `Dear ${name}, your gold loan ${loanNo} is overdue by ${days} days. Please clear the dues immediately to avoid further action. Contact us for assistance.`,
  },
  {
    label: 'Redemption Info',
    icon: FileText,
    template: (name: string, loanNo: string, amount: string) =>
      `Dear ${name}, to redeem your gold loan ${loanNo}, the total settlement amount is ₹${amount}. Please visit our branch with valid ID proof. Thank you.`,
  },
  {
    label: 'Auction Warning',
    icon: AlertTriangle,
    template: (name: string, loanNo: string, date: string) =>
      `IMPORTANT: Dear ${name}, your gold loan ${loanNo} is scheduled for auction on ${date} due to non-payment. Please contact us immediately to settle your dues and reclaim your gold.`,
  },
];

// ── Helpers ────────────────────────────────────────────
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

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);
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

// ── Main Component ─────────────────────────────────────
export default function WhatsAppInbox() {
  const { profile } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState<FilterTab>('all');
  const [sending, setSending] = useState(false);
  const [loadingChats, setLoadingChats] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [customerLoans, setCustomerLoans] = useState<LoanSummary[]>([]);
  const [showTemplates, setShowTemplates] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [newChatOpen, setNewChatOpen] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerResults, setCustomerResults] = useState<{ id: string; full_name: string; phone: string }[]>([]);
  const [searchingCustomers, setSearchingCustomers] = useState(false);
  const [creatingChat, setCreatingChat] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const customerSearchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clientId = profile?.client_id;
  const selectedChat = chats.find(c => c.id === selectedChatId);

  // ── Fetch chats with GLMS context ──
  const fetchChats = useCallback(async () => {
    if (!clientId) return;
    const { data, error } = await supabase
      .from('whatsapp_chats')
      .select('*')
      .eq('client_id', clientId)
      .order('last_message_at', { ascending: false, nullsFirst: false });

    if (error) { console.error('Error fetching chats:', error); return; }

    const customerIds = (data || []).map(c => c.customer_id).filter(Boolean) as string[];
    let customerMap: Record<string, string> = {};
    let loanContextMap: Record<string, { count: number; outstanding: number; overdue_days: number; last_payment: string | null }> = {};

    if (customerIds.length > 0) {
      // Fetch customer names
      const { data: customers } = await supabase
        .from('customers')
        .select('id, full_name')
        .in('id', customerIds);
      if (customers) {
        customerMap = Object.fromEntries(customers.map(c => [c.id, c.full_name]));
      }

      // Fetch active loans for context
      const { data: loans } = await supabase
        .from('loans')
        .select('customer_id, principal_amount, next_interest_due_date, last_interest_paid_date')
        .in('customer_id', customerIds)
        .eq('client_id', clientId)
        .eq('status', 'active');

      if (loans) {
        const today = new Date();
        for (const loan of loans) {
          if (!loanContextMap[loan.customer_id]) {
            loanContextMap[loan.customer_id] = { count: 0, outstanding: 0, overdue_days: 0, last_payment: null };
          }
          const ctx = loanContextMap[loan.customer_id];
          ctx.count += 1;
          ctx.outstanding += Number(loan.principal_amount);
          if (loan.next_interest_due_date) {
            const dueDate = new Date(loan.next_interest_due_date);
            if (dueDate < today) {
              const days = differenceInDays(today, dueDate);
              ctx.overdue_days = Math.max(ctx.overdue_days, days);
            }
          }
          if (loan.last_interest_paid_date) {
            if (!ctx.last_payment || loan.last_interest_paid_date > ctx.last_payment) {
              ctx.last_payment = loan.last_interest_paid_date;
            }
          }
        }
      }
    }

    setChats((data || []).map(c => {
      const ctx = c.customer_id ? loanContextMap[c.customer_id] : undefined;
      return {
        ...c,
        customer_name: c.customer_id ? customerMap[c.customer_id] : undefined,
        active_loan_count: ctx?.count || 0,
        total_outstanding: ctx?.outstanding || 0,
        overdue_days: ctx?.overdue_days || 0,
        last_payment_date: ctx?.last_payment || null,
      };
    }));
    setLoadingChats(false);
  }, [clientId]);

  // ── Fetch messages ──
  const fetchMessages = useCallback(async () => {
    if (!selectedChatId || !clientId) return;
    setLoadingMessages(true);
    const { data, error } = await supabase
      .from('whatsapp_messages')
      .select('*')
      .eq('chat_id', selectedChatId)
      .eq('client_id', clientId)
      .order('created_at', { ascending: true });

    if (error) console.error('Error fetching messages:', error);
    setMessages(data || []);
    setLoadingMessages(false);

    await supabase.from('whatsapp_chats').update({ unread_count: 0 }).eq('id', selectedChatId);
  }, [selectedChatId, clientId]);

  // ── Fetch customer loans for drawer ──
  const fetchCustomerLoans = useCallback(async (customerId: string) => {
    if (!clientId) return;
    const { data } = await supabase
      .from('loans')
      .select('id, loan_number, principal_amount, interest_rate, loan_date, maturity_date, status, next_interest_due_date, last_interest_paid_date, total_interest_paid')
      .eq('customer_id', customerId)
      .eq('client_id', clientId)
      .order('loan_date', { ascending: false })
      .limit(10);
    setCustomerLoans((data as LoanSummary[]) || []);
  }, [clientId]);

  // ── Search customers for new chat ──
  const searchCustomers = useCallback(async (query: string) => {
    if (!clientId || query.length < 2) { setCustomerResults([]); return; }
    setSearchingCustomers(true);
    const { data } = await supabase
      .from('customers')
      .select('id, full_name, phone')
      .eq('client_id', clientId)
      .or(`full_name.ilike.%${query}%,phone.ilike.%${query}%`)
      .limit(10);
    setCustomerResults(data || []);
    setSearchingCustomers(false);
  }, [clientId]);

  const handleCustomerSearchChange = (value: string) => {
    setCustomerSearch(value);
    if (customerSearchTimeout.current) clearTimeout(customerSearchTimeout.current);
    customerSearchTimeout.current = setTimeout(() => searchCustomers(value), 300);
  };

  // ── Start new chat with customer ──
  const startNewChat = async (customer: { id: string; full_name: string; phone: string }) => {
    if (!clientId) return;
    setCreatingChat(true);

    // Check for existing chat
    const { data: existing } = await supabase
      .from('whatsapp_chats')
      .select('id')
      .eq('client_id', clientId)
      .eq('customer_phone', customer.phone)
      .maybeSingle();

    if (existing) {
      setSelectedChatId(existing.id);
      setNewChatOpen(false);
      setCustomerSearch('');
      setCustomerResults([]);
      setCreatingChat(false);
      toast.info('Chat already exists — switched to it');
      return;
    }

    // Create new chat
    const { data: newChat, error } = await supabase
      .from('whatsapp_chats')
      .insert({
        client_id: clientId,
        customer_id: customer.id,
        customer_phone: customer.phone,
        status: 'open',
        unread_count: 0,
      })
      .select('id')
      .single();

    if (error) {
      toast.error('Failed to create chat');
      console.error(error);
    } else if (newChat) {
      await fetchChats();
      setSelectedChatId(newChat.id);
      toast.success(`Chat started with ${customer.full_name}`);
    }

    setNewChatOpen(false);
    setCustomerSearch('');
    setCustomerResults([]);
    setCreatingChat(false);
  };

  useEffect(() => { fetchChats(); }, [fetchChats]);
  useEffect(() => { fetchMessages(); }, [fetchMessages]);
  useEffect(() => {
    if (selectedChat?.customer_id) fetchCustomerLoans(selectedChat.customer_id);
    else setCustomerLoans([]);
  }, [selectedChat?.customer_id, fetchCustomerLoans]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── Realtime ──
  useEffect(() => {
    if (!clientId) return;
    const chatChannel = supabase
      .channel('whatsapp-chats-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'whatsapp_chats', filter: `client_id=eq.${clientId}` }, () => fetchChats())
      .subscribe();

    const msgChannel = supabase
      .channel('whatsapp-messages-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'whatsapp_messages', filter: `client_id=eq.${clientId}` }, (payload) => {
        const newMsg = payload.new as Message;
        if (newMsg.chat_id === selectedChatId) {
          setMessages(prev => [...prev, newMsg]);
        }
        fetchChats();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(chatChannel);
      supabase.removeChannel(msgChannel);
    };
  }, [clientId, selectedChatId, fetchChats]);

  // ── Send message ──
  const handleSend = async () => {
    if (!newMessage.trim() || !selectedChatId || !clientId || !profile) return;
    setSending(true);
    const msgText = newMessage.trim();
    setNewMessage('');
    setShowTemplates(false);

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
      await supabase.from('whatsapp_chats').update({
        last_message_at: new Date().toISOString(),
        last_message_preview: msgText.slice(0, 100),
      }).eq('id', selectedChatId);
    }
    setSending(false);
  };

  // ── Use quick template ──
  const applyTemplate = (templateFn: (name: string, arg2: string, arg3: string) => string) => {
    const name = selectedChat?.customer_name || 'Customer';
    const outstanding = selectedChat?.total_outstanding ? formatCurrency(selectedChat.total_outstanding) : '₹0';
    const overdue = String(selectedChat?.overdue_days || 0);
    const loanNo = customerLoans[0]?.loan_number || 'N/A';
    const maturity = customerLoans[0]?.maturity_date ? format(new Date(customerLoans[0].maturity_date), 'dd/MM/yyyy') : 'N/A';

    // Use the most relevant args based on template
    const msg = templateFn(name, loanNo || outstanding, overdue || maturity);
    setNewMessage(msg);
    setShowTemplates(false);
  };

  // ── Filter logic ──
  const filteredChats = chats.filter(c => {
    // Tab filter
    if (filterTab === 'overdue' && (!c.overdue_days || c.overdue_days <= 0)) return false;
    if (filterTab === 'bot' && c.status !== 'bot_handled') return false;
    if (filterTab === 'unassigned' && (c.assigned_to || c.status === 'bot_handled')) return false;

    // Search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (c.customer_name?.toLowerCase().includes(q) || c.customer_phone.includes(q) || c.last_message_preview?.toLowerCase().includes(q));
    }
    return true;
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

  const getOverdueBadge = (chat: Chat) => {
    if (!chat.overdue_days || chat.overdue_days <= 0) return null;
    const color = chat.overdue_days > 90 ? 'text-destructive border-destructive/30 bg-destructive/10' :
                  chat.overdue_days > 30 ? 'text-amber-600 border-amber-500/30 bg-amber-500/10' :
                  'text-yellow-600 border-yellow-500/30 bg-yellow-500/10';
    return <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0", color)}>{chat.overdue_days}d overdue</Badge>;
  };

  // Tab counts
  const tabCounts = {
    all: chats.length,
    overdue: chats.filter(c => c.overdue_days && c.overdue_days > 0).length,
    bot: chats.filter(c => c.status === 'bot_handled').length,
    unassigned: chats.filter(c => !c.assigned_to && c.status !== 'bot_handled').length,
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
          {/* ─── LEFT PANE — Chat List ─── */}
          <div className={cn(
            "w-full md:w-[340px] lg:w-[380px] flex-shrink-0 border-r bg-card flex flex-col",
            selectedChatId && "hidden md:flex"
          )}>
            {/* Search */}
            <div className="p-3 border-b space-y-2">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search chats..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="pl-9 h-9 bg-muted/50"
                  />
                </div>
                <Button size="sm" className="h-9 px-3" onClick={() => setNewChatOpen(true)}>
                  <Plus className="h-4 w-4 mr-1" /> New
                </Button>
              </div>

              {/* New Chat Dialog */}
              <Dialog open={newChatOpen} onOpenChange={(open) => { setNewChatOpen(open); if (!open) { setCustomerSearch(''); setCustomerResults([]); } }}>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Start New Chat</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search customer by name or phone..."
                        value={customerSearch}
                        onChange={e => handleCustomerSearchChange(e.target.value)}
                        className="pl-9"
                        autoFocus
                      />
                    </div>
                    <ScrollArea className="max-h-64">
                      {searchingCustomers ? (
                        <div className="flex items-center justify-center py-4 text-muted-foreground text-sm">
                          <Loader2 className="h-4 w-4 animate-spin mr-2" /> Searching...
                        </div>
                      ) : customerResults.length > 0 ? (
                        <div className="space-y-1">
                          {customerResults.map(c => (
                            <button
                              key={c.id}
                              disabled={creatingChat}
                              onClick={() => startNewChat(c)}
                              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md hover:bg-muted/70 transition-colors text-left"
                            >
                              <Avatar className="h-8 w-8">
                                <AvatarFallback className="bg-primary/10 text-primary text-xs">{getInitials(c.full_name)}</AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate text-foreground">{c.full_name}</p>
                                <p className="text-xs text-muted-foreground">{c.phone}</p>
                              </div>
                              <MessageCircle className="h-4 w-4 text-muted-foreground" />
                            </button>
                          ))}
                        </div>
                      ) : customerSearch.length >= 2 ? (
                        <p className="text-center text-muted-foreground text-sm py-4">No customers found</p>
                      ) : (
                        <p className="text-center text-muted-foreground text-sm py-4">Type at least 2 characters to search</p>
                      )}
                    </ScrollArea>
                  </div>
                </DialogContent>
              </Dialog>
              {/* Filter Tabs */}
              <Tabs value={filterTab} onValueChange={(v) => setFilterTab(v as FilterTab)}>
                <TabsList className="w-full h-8 bg-muted/50">
                  <TabsTrigger value="all" className="text-xs flex-1 h-6 data-[state=active]:bg-background">
                    All{tabCounts.all > 0 && <span className="ml-1 text-muted-foreground">({tabCounts.all})</span>}
                  </TabsTrigger>
                  <TabsTrigger value="overdue" className="text-xs flex-1 h-6 data-[state=active]:bg-background">
                    Overdue{tabCounts.overdue > 0 && <span className="ml-1 text-destructive">({tabCounts.overdue})</span>}
                  </TabsTrigger>
                  <TabsTrigger value="bot" className="text-xs flex-1 h-6 data-[state=active]:bg-background">
                    Bot{tabCounts.bot > 0 && <span className="ml-1 text-blue-500">({tabCounts.bot})</span>}
                  </TabsTrigger>
                  <TabsTrigger value="unassigned" className="text-xs flex-1 h-6 data-[state=active]:bg-background">
                    Open{tabCounts.unassigned > 0 && <span className="ml-1 text-amber-500">({tabCounts.unassigned})</span>}
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {/* Chat list */}
            <ScrollArea className="flex-1">
              {loadingChats ? (
                <div className="p-8 text-center text-muted-foreground text-sm">Loading chats...</div>
              ) : filteredChats.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground text-sm">
                  {searchQuery || filterTab !== 'all' ? 'No chats match this filter' : 'No WhatsApp chats yet'}
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
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {chat.last_message_preview || 'No messages yet'}
                      </p>
                      {/* GLMS Context Row */}
                      <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                        {getStatusBadge(chat)}
                        {getOverdueBadge(chat)}
                        {(chat.active_loan_count ?? 0) > 0 && (
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-border text-muted-foreground">
                            <CreditCard className="h-2.5 w-2.5 mr-0.5" />
                            {chat.active_loan_count} loan{(chat.active_loan_count ?? 0) > 1 ? 's' : ''}
                          </Badge>
                        )}
                        {chat.unread_count > 0 && (
                          <span className="ml-auto inline-flex items-center justify-center h-5 min-w-[20px] px-1.5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
                            {chat.unread_count}
                          </span>
                        )}
                      </div>
                      {/* Outstanding Amount */}
                      {(chat.total_outstanding ?? 0) > 0 && (
                        <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
                          <IndianRupee className="h-3 w-3" />
                          Outstanding: <span className="font-medium text-foreground">{formatCurrency(chat.total_outstanding!)}</span>
                        </p>
                      )}
                    </div>
                  </button>
                ))
              )}
            </ScrollArea>
          </div>

          {/* ─── RIGHT PANE — Message Thread ─── */}
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
                {/* Chat Header with Customer Quick View */}
                <div className="flex items-center gap-3 px-4 py-2.5 border-b bg-card">
                  <Button variant="ghost" size="icon" className="md:hidden h-8 w-8" onClick={() => setSelectedChatId(null)}>
                    <ArrowLeft className="h-4 w-4" />
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
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{selectedChat?.customer_phone}</span>
                      {(selectedChat?.active_loan_count ?? 0) > 0 && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <CreditCard className="h-3 w-3" />
                            {selectedChat?.active_loan_count} active loan{(selectedChat?.active_loan_count ?? 0) > 1 ? 's' : ''}
                          </span>
                        </>
                      )}
                      {(selectedChat?.total_outstanding ?? 0) > 0 && (
                        <>
                          <span>•</span>
                          <span className="font-medium text-foreground">{formatCurrency(selectedChat!.total_outstanding!)}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {selectedChat && getStatusBadge(selectedChat)}
                    {selectedChat?.overdue_days && selectedChat.overdue_days > 0 && getOverdueBadge(selectedChat)}
                    {/* Customer Info Drawer */}
                    <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
                      <SheetTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <Info className="h-4 w-4" />
                        </Button>
                      </SheetTrigger>
                      <SheetContent className="w-[360px] sm:w-[400px]">
                        <SheetHeader>
                          <SheetTitle className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            Customer Details
                          </SheetTitle>
                        </SheetHeader>
                        <div className="mt-4 space-y-4">
                          {/* Customer Card */}
                          <div className="rounded-lg border bg-card p-4 space-y-2">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-12 w-12">
                                <AvatarFallback className="bg-primary/10 text-primary font-medium">
                                  {selectedChat?.customer_name ? getInitials(selectedChat.customer_name) : '?'}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-semibold text-foreground">{selectedChat?.customer_name || 'Unknown'}</p>
                                <p className="text-sm text-muted-foreground">{selectedChat?.customer_phone}</p>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3 mt-3">
                              <div className="rounded-md bg-muted/50 p-2.5 text-center">
                                <p className="text-xs text-muted-foreground">Active Loans</p>
                                <p className="text-lg font-bold text-foreground">{selectedChat?.active_loan_count || 0}</p>
                              </div>
                              <div className="rounded-md bg-muted/50 p-2.5 text-center">
                                <p className="text-xs text-muted-foreground">Outstanding</p>
                                <p className="text-lg font-bold text-foreground">{formatCurrency(selectedChat?.total_outstanding || 0)}</p>
                              </div>
                              <div className="rounded-md bg-muted/50 p-2.5 text-center">
                                <p className="text-xs text-muted-foreground">Overdue Days</p>
                                <p className={cn("text-lg font-bold", (selectedChat?.overdue_days ?? 0) > 0 ? 'text-destructive' : 'text-foreground')}>
                                  {selectedChat?.overdue_days || 0}
                                </p>
                              </div>
                              <div className="rounded-md bg-muted/50 p-2.5 text-center">
                                <p className="text-xs text-muted-foreground">Last Payment</p>
                                <p className="text-sm font-medium text-foreground">
                                  {selectedChat?.last_payment_date ? format(new Date(selectedChat.last_payment_date), 'dd/MM/yy') : '—'}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Loans List */}
                          <div className="space-y-2">
                            <h4 className="text-sm font-semibold text-foreground">Loan History</h4>
                            {customerLoans.length === 0 ? (
                              <p className="text-sm text-muted-foreground">No loans found</p>
                            ) : (
                              customerLoans.map(loan => {
                                const isOverdue = loan.next_interest_due_date && new Date(loan.next_interest_due_date) < new Date();
                                return (
                                  <div key={loan.id} className="rounded-lg border p-3 space-y-1.5">
                                    <div className="flex items-center justify-between">
                                      <span className="font-mono text-sm font-medium text-foreground">{loan.loan_number}</span>
                                      <Badge variant={loan.status === 'active' ? 'default' : 'secondary'} className="text-[10px]">
                                        {loan.status}
                                      </Badge>
                                    </div>
                                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                                      <span>Principal: <span className="font-medium text-foreground">{formatCurrency(loan.principal_amount)}</span></span>
                                      <span>@ {loan.interest_rate}%</span>
                                    </div>
                                    {loan.status === 'active' && loan.next_interest_due_date && (
                                      <p className={cn("text-xs flex items-center gap-1", isOverdue ? "text-destructive" : "text-muted-foreground")}>
                                        <CalendarClock className="h-3 w-3" />
                                        Due: {format(new Date(loan.next_interest_due_date), 'dd MMM yyyy')}
                                        {isOverdue && ' (OVERDUE)'}
                                      </p>
                                    )}
                                  </div>
                                );
                              })
                            )}
                          </div>
                        </div>
                      </SheetContent>
                    </Sheet>
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
                          className={cn("flex", msg.is_outbound ? "justify-end" : "justify-start")}
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

                {/* Quick Templates Panel */}
                {showTemplates && (
                  <div className="border-t bg-muted/30 px-4 py-2">
                    <div className="max-w-2xl mx-auto">
                      <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                        <Zap className="h-3 w-3" /> Quick Reply Templates
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        {QUICK_TEMPLATES.map((t, i) => (
                          <button
                            key={i}
                            onClick={() => applyTemplate(t.template)}
                            className="flex items-center gap-2 px-3 py-2 rounded-lg border bg-card hover:bg-muted/50 transition-colors text-left"
                          >
                            <t.icon className="h-4 w-4 text-primary flex-shrink-0" />
                            <span className="text-xs font-medium text-foreground">{t.label}</span>
                            <ChevronRight className="h-3 w-3 text-muted-foreground ml-auto" />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Input */}
                <div className="border-t bg-card px-4 py-3">
                  <form
                    onSubmit={e => { e.preventDefault(); handleSend(); }}
                    className="flex items-center gap-2 max-w-2xl mx-auto"
                  >
                    <Button
                      type="button"
                      variant={showTemplates ? 'default' : 'ghost'}
                      size="icon"
                      className="h-10 w-10 flex-shrink-0"
                      onClick={() => setShowTemplates(!showTemplates)}
                      title="Quick templates"
                    >
                      <Zap className="h-4 w-4" />
                    </Button>
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
