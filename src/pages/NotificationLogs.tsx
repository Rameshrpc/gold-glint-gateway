import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ResponsiveTable } from '@/components/ui/responsive-table';
import { MessageSquare, Phone, Search, Calendar, User, FileText, Loader2, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { format, subDays } from 'date-fns';

interface NotificationLog {
  id: string;
  channel: string;
  recipient_name: string | null;
  recipient_phone: string | null;
  message_content: string;
  entity_type: string | null;
  status: string;
  delivery_status: string | null;
  provider_message_id: string | null;
  template_code: string | null;
  error_message: string | null;
  sent_at: string | null;
  created_at: string;
}

export default function NotificationLogs() {
  const { client } = useAuth();
  const [logs, setLogs] = useState<NotificationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [channelFilter, setChannelFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('7');

  const fetchLogs = async () => {
    if (!client?.id) return;
    
    setLoading(true);
    try {
      const fromDate = subDays(new Date(), parseInt(dateFilter)).toISOString();
      
      let query = supabase
        .from('notification_logs')
        .select('*')
        .eq('client_id', client.id)
        .gte('created_at', fromDate)
        .order('created_at', { ascending: false })
        .limit(200);

      if (channelFilter !== 'all') {
        query = query.eq('channel', channelFilter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setLogs(data || []);
    } catch (error) {
      console.error('Error fetching notification logs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [client?.id, channelFilter, dateFilter]);

  const filteredLogs = logs.filter(log =>
    log.recipient_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    log.recipient_phone?.includes(searchQuery) ||
    log.message_content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'whatsapp':
        return <MessageSquare className="h-4 w-4 text-green-600" />;
      case 'sms':
        return <Phone className="h-4 w-4 text-blue-600" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getChannelBadge = (channel: string) => {
    switch (channel) {
      case 'whatsapp':
        return <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">WhatsApp</Badge>;
      case 'sms':
        return <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">SMS</Badge>;
      default:
        return <Badge variant="secondary">{channel}</Badge>;
    }
  };

  // Stats
  const smsCount = logs.filter(l => l.channel === 'sms').length;
  const whatsappCount = logs.filter(l => l.channel === 'whatsapp').length;
  const sentCount = logs.filter(l => l.delivery_status === 'sent' || l.status === 'sent').length;
  const failedCount = logs.filter(l => l.delivery_status === 'failed' || l.status === 'failed').length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Notification Logs</h1>
          <p className="text-muted-foreground">View history of sent SMS and WhatsApp messages</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-muted">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{logs.length}</p>
                  <p className="text-sm text-muted-foreground">Total Messages</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                  <Phone className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{smsCount}</p>
                  <p className="text-sm text-muted-foreground">SMS Sent</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900/30">
                  <MessageSquare className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{whatsappCount}</p>
                  <p className="text-sm text-muted-foreground">WhatsApp Sent</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Message History</CardTitle>
            <CardDescription>Messages opened via native SMS and WhatsApp apps</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-3 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, phone, or message..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={channelFilter} onValueChange={setChannelFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Channel" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Channels</SelectItem>
                  <SelectItem value="sms">SMS</SelectItem>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                </SelectContent>
              </Select>
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Date Range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Today</SelectItem>
                  <SelectItem value="7">Last 7 days</SelectItem>
                  <SelectItem value="30">Last 30 days</SelectItem>
                  <SelectItem value="90">Last 90 days</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon" onClick={fetchLogs}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <ResponsiveTable>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Channel</TableHead>
                      <TableHead>Recipient</TableHead>
                      <TableHead className="hidden md:table-cell">Message</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLogs.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                          No notification logs found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredLogs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getChannelIcon(log.channel)}
                              <span className="hidden sm:inline">{getChannelBadge(log.channel)}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{log.recipient_name || 'Unknown'}</p>
                              <p className="text-xs text-muted-foreground">{log.recipient_phone}</p>
                            </div>
                          </TableCell>
                          <TableCell className="hidden md:table-cell max-w-xs">
                            <p className="truncate text-sm text-muted-foreground">
                              {log.message_content.slice(0, 80)}...
                            </p>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              {format(new Date(log.sent_at || log.created_at), 'dd/MM/yy')}
                              <br />
                              <span className="text-xs text-muted-foreground">
                                {format(new Date(log.sent_at || log.created_at), 'HH:mm')}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge 
                              variant="secondary" 
                              className={`text-xs ${
                                (log.delivery_status || log.status) === 'sent' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                (log.delivery_status || log.status) === 'failed' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                                (log.delivery_status || log.status) === 'queued' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                                ''
                              }`}
                            >
                              {log.delivery_status || log.status}
                            </Badge>
                            {log.template_code && (
                              <p className="text-xs text-muted-foreground mt-1">{log.template_code}</p>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </ResponsiveTable>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
