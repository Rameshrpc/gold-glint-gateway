import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ResponsiveTable } from '@/components/ui/responsive-table';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Search, Calendar as CalendarIcon, ChevronDown, ChevronRight, 
  History, User, FileText, Loader2, RefreshCw, Download
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { cn } from '@/lib/utils';
import { exportToCSV, exportToExcel } from '@/lib/export-utils';

interface AuditLog {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  entity_identifier: string | null;
  user_id: string;
  user_name: string | null;
  old_values: any;
  new_values: any;
  changed_fields: string[] | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  branch_id: string | null;
}

const ACTION_LABELS: Record<string, { label: string; color: string }> = {
  create: { label: 'Created', color: 'bg-green-500/10 dark:bg-green-500/20 text-green-600 dark:text-green-400' },
  update: { label: 'Updated', color: 'bg-blue-500/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400' },
  delete: { label: 'Deleted', color: 'bg-red-500/10 dark:bg-red-500/20 text-red-600 dark:text-red-400' },
  login: { label: 'Login', color: 'bg-purple-500/10 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400' },
  logout: { label: 'Logout', color: 'bg-gray-500/10 dark:bg-gray-500/20 text-gray-600 dark:text-gray-400' },
  approve: { label: 'Approved', color: 'bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' },
  reject: { label: 'Rejected', color: 'bg-orange-500/10 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400' },
};

const ENTITY_TYPES = [
  'loan', 'customer', 'interest_payment', 'redemption', 'auction', 
  'agent', 'scheme', 'voucher', 'user', 'branch', 'repledge_packet'
];

export default function AuditLogs() {
  const { client, profile } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  
  // Filters
  const [dateFrom, setDateFrom] = useState<Date>(startOfMonth(subMonths(new Date(), 1)));
  const [dateTo, setDateTo] = useState<Date>(endOfMonth(new Date()));
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [entityFilter, setEntityFilter] = useState<string>('all');
  const [userFilter, setUserFilter] = useState<string>('all');
  
  // Unique users for filter
  const [users, setUsers] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    if (client) {
      fetchLogs();
      fetchUsers();
    }
  }, [client, dateFrom, dateTo, actionFilter, entityFilter, userFilter]);

  const fetchLogs = async () => {
    if (!client) return;
    
    setLoading(true);
    try {
      let query = supabase
        .from('audit_logs')
        .select('*')
        .eq('client_id', client.id)
        .gte('created_at', format(dateFrom, 'yyyy-MM-dd'))
        .lte('created_at', format(dateTo, 'yyyy-MM-dd') + 'T23:59:59')
        .order('created_at', { ascending: false })
        .limit(500);

      if (actionFilter !== 'all') {
        query = query.eq('action', actionFilter);
      }
      if (entityFilter !== 'all') {
        query = query.eq('entity_type', entityFilter);
      }
      if (userFilter !== 'all') {
        query = query.eq('user_id', userFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      setLogs(data || []);
    } catch (error: any) {
      toast.error('Failed to fetch audit logs');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    if (!client) return;
    
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name')
      .eq('client_id', client.id)
      .order('full_name');
    
    setUsers((data || []).map(u => ({ id: u.id, name: u.full_name || 'Unknown' })));
  };

  const toggleRow = (id: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  const filteredLogs = logs.filter(log => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      log.entity_identifier?.toLowerCase().includes(query) ||
      log.user_name?.toLowerCase().includes(query) ||
      log.entity_type.toLowerCase().includes(query) ||
      log.action.toLowerCase().includes(query)
    );
  });

  const handleExport = (type: 'csv' | 'excel') => {
    const fileName = `audit-logs-${format(new Date(), 'yyyy-MM-dd')}`;
    const exportData = filteredLogs.map(log => ({
      timestamp: format(new Date(log.created_at), 'dd/MM/yyyy HH:mm:ss'),
      action: log.action,
      entity_type: log.entity_type,
      entity_id: log.entity_identifier || log.entity_id || '-',
      user: log.user_name || 'System',
      changed_fields: log.changed_fields?.join(', ') || '-',
      ip_address: log.ip_address || '-',
    }));

    const columns = [
      { key: 'timestamp' as const, header: 'Timestamp' },
      { key: 'action' as const, header: 'Action' },
      { key: 'entity_type' as const, header: 'Entity Type' },
      { key: 'entity_id' as const, header: 'Entity ID' },
      { key: 'user' as const, header: 'User' },
      { key: 'changed_fields' as const, header: 'Changed Fields' },
      { key: 'ip_address' as const, header: 'IP Address' },
    ];

    type === 'csv'
      ? exportToCSV(exportData, columns, fileName)
      : exportToExcel(exportData, columns, fileName, 'Audit Logs');
    
    toast.success(`Exported ${filteredLogs.length} records`);
  };

  const renderValueDiff = (oldVal: any, newVal: any, field: string) => {
    const formatValue = (val: any) => {
      if (val === null || val === undefined) return 'null';
      if (typeof val === 'object') return JSON.stringify(val);
      return String(val);
    };

    return (
      <div key={field} className="py-1 border-b border-border/50 last:border-0">
        <span className="font-medium text-sm">{field}: </span>
        {oldVal !== undefined && (
          <span className="text-red-500 dark:text-red-400 line-through text-sm mr-2">
            {formatValue(oldVal)}
          </span>
        )}
        {newVal !== undefined && (
          <span className="text-green-600 dark:text-green-400 text-sm">
            {formatValue(newVal)}
          </span>
        )}
      </div>
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <History className="h-6 w-6" />
              Audit Logs
            </h1>
            <p className="text-muted-foreground">Track all system activities and changes</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={fetchLogs} disabled={loading}>
              <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
              Refresh
            </Button>
            <Button variant="outline" onClick={() => handleExport('csv')}>
              <Download className="h-4 w-4 mr-2" />
              CSV
            </Button>
            <Button onClick={() => handleExport('excel')}>
              <Download className="h-4 w-4 mr-2" />
              Excel
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid gap-4 md:grid-cols-6">
              <div className="space-y-2">
                <Label>From Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(dateFrom, 'dd MMM yyyy')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={dateFrom}
                      onSelect={(date) => date && setDateFrom(date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label>To Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(dateTo, 'dd MMM yyyy')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={dateTo}
                      onSelect={(date) => date && setDateTo(date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label>Action</Label>
                <Select value={actionFilter} onValueChange={setActionFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Actions" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Actions</SelectItem>
                    {Object.keys(ACTION_LABELS).map((action) => (
                      <SelectItem key={action} value={action}>
                        {ACTION_LABELS[action].label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Entity Type</Label>
                <Select value={entityFilter} onValueChange={setEntityFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {ENTITY_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>User</Label>
                <Select value={userFilter} onValueChange={setUserFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Users" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Users</SelectItem>
                    {users.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Logs Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Activity Log ({filteredLogs.length} records)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No audit logs found for the selected filters
              </div>
            ) : (
              <ScrollArea className="h-[600px]">
                <ResponsiveTable>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-8"></TableHead>
                        <TableHead>Timestamp</TableHead>
                        <TableHead>Action</TableHead>
                        <TableHead>Entity</TableHead>
                        <TableHead>Identifier</TableHead>
                        <TableHead>User</TableHead>
                        <TableHead>Changed Fields</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredLogs.map((log) => {
                        const isExpanded = expandedRows.has(log.id);
                        const actionInfo = ACTION_LABELS[log.action] || { label: log.action, color: 'bg-gray-500/10 text-gray-600' };
                        const hasDetails = log.old_values || log.new_values;

                        return (
                          <Collapsible key={log.id} open={isExpanded} onOpenChange={() => hasDetails && toggleRow(log.id)} asChild>
                            <>
                              <CollapsibleTrigger asChild>
                                <TableRow className={cn(hasDetails && "cursor-pointer hover:bg-muted/50")}>
                                  <TableCell>
                                    {hasDetails && (
                                      isExpanded 
                                        ? <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                        : <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                    )}
                                  </TableCell>
                                  <TableCell className="text-sm text-muted-foreground">
                                    {format(new Date(log.created_at), 'dd MMM yyyy HH:mm:ss')}
                                  </TableCell>
                                  <TableCell>
                                    <Badge className={actionInfo.color}>
                                      {actionInfo.label}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="capitalize">
                                    {log.entity_type.replace(/_/g, ' ')}
                                  </TableCell>
                                  <TableCell className="font-mono text-sm">
                                    {log.entity_identifier || log.entity_id?.slice(0, 8) || '-'}
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex items-center gap-2">
                                      <User className="h-4 w-4 text-muted-foreground" />
                                      <span className="text-sm">{log.user_name || 'System'}</span>
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-sm text-muted-foreground">
                                    {log.changed_fields?.slice(0, 3).join(', ')}
                                    {log.changed_fields && log.changed_fields.length > 3 && ` +${log.changed_fields.length - 3} more`}
                                  </TableCell>
                                </TableRow>
                              </CollapsibleTrigger>
                              <CollapsibleContent asChild>
                                <TableRow className="bg-muted/30">
                                  <TableCell colSpan={7} className="py-4">
                                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                                      {log.old_values && (
                                        <div className="p-3 bg-red-50/50 dark:bg-red-950/20 rounded-lg border border-red-200/50 dark:border-red-900/50">
                                          <h4 className="font-medium text-red-700 dark:text-red-400 mb-2">Previous Values</h4>
                                          <div className="space-y-1">
                                            {Object.entries(log.old_values).map(([key, val]) => (
                                              <div key={key} className="flex gap-2">
                                                <span className="font-medium">{key}:</span>
                                                <span className="text-muted-foreground truncate">
                                                  {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                                                </span>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                      {log.new_values && (
                                        <div className="p-3 bg-green-50/50 dark:bg-green-950/20 rounded-lg border border-green-200/50 dark:border-green-900/50">
                                          <h4 className="font-medium text-green-700 dark:text-green-400 mb-2">New Values</h4>
                                          <div className="space-y-1">
                                            {Object.entries(log.new_values).map(([key, val]) => (
                                              <div key={key} className="flex gap-2">
                                                <span className="font-medium">{key}:</span>
                                                <span className="text-muted-foreground truncate">
                                                  {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                                                </span>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                    {log.ip_address && (
                                      <div className="mt-3 text-xs text-muted-foreground">
                                        IP: {log.ip_address}
                                      </div>
                                    )}
                                  </TableCell>
                                </TableRow>
                              </CollapsibleContent>
                            </>
                          </Collapsible>
                        );
                      })}
                    </TableBody>
                  </Table>
                </ResponsiveTable>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}