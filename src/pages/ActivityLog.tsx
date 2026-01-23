import { useState, useEffect, useMemo } from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, RefreshCw, Download, Activity, Search, Filter, User, Clock } from 'lucide-react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { exportToCSV, exportToExcel, ExportColumn } from '@/lib/export-utils';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
interface ActivityLogEntry {
  id: string;
  user_id: string;
  user_name: string | null;
  action: string;
  module: string;
  entity_type: string | null;
  entity_identifier: string | null;
  description: string | null;
  created_at: string;
  metadata: Record<string, unknown>;
}

interface UserOption {
  id: string;
  name: string;
}

const ACTION_STYLES: Record<string, { label: string; className: string }> = {
  login: { label: 'Login', className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
  logout: { label: 'Logout', className: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200' },
  view: { label: 'View', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' },
  create: { label: 'Create', className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200' },
  update: { label: 'Update', className: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200' },
  delete: { label: 'Delete', className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' },
  export: { label: 'Export', className: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' },
  print: { label: 'Print', className: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200' },
  payment: { label: 'Payment', className: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200' },
  redeem: { label: 'Redeem', className: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' },
  reloan: { label: 'Reloan', className: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200' },
  approve: { label: 'Approve', className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' },
  reject: { label: 'Reject', className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' },
};

const MODULES = [
  'dashboard',
  'loans',
  'customers',
  'interest',
  'redemption',
  'reloan',
  'auction',
  'gold-vault',
  'vouchers',
  'reports',
  'settings',
  'users',
  'branches',
  'schemes',
  'agents',
];

export default function ActivityLog() {
  const { profile, hasRole } = useAuth();
  const navigate = useNavigate();
  
  const [logs, setLogs] = useState<ActivityLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserOption[]>([]);
  
  // Filters
  const [fromDate, setFromDate] = useState<Date | undefined>(() => {
    const date = new Date();
    date.setDate(date.getDate() - 7);
    return date;
  });
  const [toDate, setToDate] = useState<Date | undefined>(new Date());
  const [selectedUser, setSelectedUser] = useState<string>('all');
  const [selectedAction, setSelectedAction] = useState<string>('all');
  const [selectedModule, setSelectedModule] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Check authorization
  useEffect(() => {
    const isTenantAdmin = hasRole('tenant_admin') || hasRole('super_admin') || hasRole('moderator');
    if (!isTenantAdmin) {
      toast.error('Access denied. Tenant admin access required.');
      navigate('/dashboard');
    }
  }, [hasRole, navigate]);

  // Fetch users for filter
  useEffect(() => {
    async function fetchUsers() {
      if (!profile?.client_id) return;
      
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name')
        .eq('client_id', profile.client_id)
        .order('full_name');
      
      if (data) {
        setUsers(data.map(u => ({ id: u.id, name: u.full_name || 'Unknown' })));
      }
    }
    fetchUsers();
  }, [profile?.client_id]);

  // Fetch activity logs
  const fetchLogs = async () => {
    if (!profile?.client_id) return;
    
    setLoading(true);
    try {
      let query = (supabase.from('activity_logs') as any)
        .select('*')
        .eq('client_id', profile.client_id)
        .order('created_at', { ascending: false })
        .limit(500);

      if (fromDate) {
        query = query.gte('created_at', format(fromDate, 'yyyy-MM-dd'));
      }
      if (toDate) {
        const nextDay = new Date(toDate);
        nextDay.setDate(nextDay.getDate() + 1);
        query = query.lt('created_at', format(nextDay, 'yyyy-MM-dd'));
      }
      if (selectedUser !== 'all') {
        query = query.eq('user_id', selectedUser);
      }
      if (selectedAction !== 'all') {
        query = query.eq('action', selectedAction);
      }
      if (selectedModule !== 'all') {
        query = query.eq('module', selectedModule);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      setLogs(data || []);
    } catch (error) {
      console.error('Failed to fetch activity logs:', error);
      toast.error('Failed to fetch activity logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [profile?.client_id, fromDate, toDate, selectedUser, selectedAction, selectedModule]);

  // Filter logs by search query
  const filteredLogs = useMemo(() => {
    if (!searchQuery.trim()) return logs;
    const query = searchQuery.toLowerCase();
    return logs.filter(log => 
      log.user_name?.toLowerCase().includes(query) ||
      log.entity_identifier?.toLowerCase().includes(query) ||
      log.description?.toLowerCase().includes(query) ||
      log.module.toLowerCase().includes(query)
    );
  }, [logs, searchQuery]);

  // Export handlers
  const handleExport = (exportFormat: 'csv' | 'excel') => {
    const columns: ExportColumn<ActivityLogEntry>[] = [
      { key: 'created_at', header: 'Timestamp', formatter: (v) => format(new Date(v), 'yyyy-MM-dd HH:mm:ss') },
      { key: 'user_name', header: 'User', formatter: (v) => v || 'Unknown' },
      { key: 'action', header: 'Action', formatter: (v) => ACTION_STYLES[v]?.label || v },
      { key: 'module', header: 'Module' },
      { key: 'entity_identifier', header: 'Entity', formatter: (v) => v || '-' },
      { key: 'description', header: 'Description', formatter: (v) => v || '-' },
    ];

    if (exportFormat === 'csv') {
      exportToCSV(filteredLogs, columns, 'activity-log');
    } else {
      exportToExcel(filteredLogs, columns, 'activity-log');
    }
    toast.success(`Exported ${filteredLogs.length} records`);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Activity className="h-6 w-6 text-primary" />
              Activity Log
            </h1>
            <p className="text-muted-foreground">Track all user activities across the application</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={fetchLogs} disabled={loading}>
              <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
              Refresh
            </Button>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-40" align="end">
                <div className="flex flex-col gap-1">
                  <Button variant="ghost" size="sm" onClick={() => handleExport('csv')}>
                    Export CSV
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleExport('excel')}>
                    Export Excel
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
              {/* From Date */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {fromDate ? format(fromDate, 'dd MMM yyyy') : 'From Date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={fromDate} onSelect={setFromDate} initialFocus />
                </PopoverContent>
              </Popover>

              {/* To Date */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="justify-start text-left font-normal">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {toDate ? format(toDate, 'dd MMM yyyy') : 'To Date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={toDate} onSelect={setToDate} initialFocus />
                </PopoverContent>
              </Popover>

              {/* User Filter */}
              <Select value={selectedUser} onValueChange={setSelectedUser}>
                <SelectTrigger>
                  <User className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="All Users" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  {users.map(user => (
                    <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Action Filter */}
              <Select value={selectedAction} onValueChange={setSelectedAction}>
                <SelectTrigger>
                  <SelectValue placeholder="All Actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  {Object.entries(ACTION_STYLES).map(([key, { label }]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Module Filter */}
              <Select value={selectedModule} onValueChange={setSelectedModule}>
                <SelectTrigger>
                  <SelectValue placeholder="All Modules" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Modules</SelectItem>
                  {MODULES.map(module => (
                    <SelectItem key={module} value={module}>
                      {module.charAt(0).toUpperCase() + module.slice(1).replace('-', ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Search */}
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
          </CardContent>
        </Card>

        {/* Activity Log Table */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">
              Activity Records
              <Badge variant="secondary" className="ml-2">{filteredLogs.length}</Badge>
            </CardTitle>
            <CardDescription>
              Showing recent activity from {fromDate ? format(fromDate, 'dd MMM yyyy') : 'start'} to {toDate ? format(toDate, 'dd MMM yyyy') : 'now'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                <Activity className="h-12 w-12 mb-4 opacity-50" />
                <p className="text-lg font-medium">No activity found</p>
                <p className="text-sm">Try adjusting your filters or date range</p>
              </div>
            ) : (
              <ScrollArea className="h-[500px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[180px]">
                        <Clock className="h-4 w-4 inline mr-1" />
                        Timestamp
                      </TableHead>
                      <TableHead>User</TableHead>
                      <TableHead className="w-[100px]">Action</TableHead>
                      <TableHead>Module</TableHead>
                      <TableHead>Entity</TableHead>
                      <TableHead className="hidden lg:table-cell">Description</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLogs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="font-mono text-sm">
                          {format(new Date(log.created_at), 'dd MMM yyyy HH:mm:ss')}
                        </TableCell>
                        <TableCell className="font-medium">
                          {log.user_name || 'Unknown'}
                        </TableCell>
                        <TableCell>
                          <Badge className={cn("text-xs", ACTION_STYLES[log.action]?.className)}>
                            {ACTION_STYLES[log.action]?.label || log.action}
                          </Badge>
                        </TableCell>
                        <TableCell className="capitalize">
                          {log.module.replace('-', ' ')}
                        </TableCell>
                        <TableCell>
                          {log.entity_identifier || '-'}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-muted-foreground max-w-xs truncate">
                          {log.description || '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
