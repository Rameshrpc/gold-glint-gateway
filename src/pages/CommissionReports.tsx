import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { printElement } from '@/lib/print';
import { RefreshCw, Download, FileText, Users, TrendingUp, IndianRupee } from 'lucide-react';
import { toast } from 'sonner';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { cn } from '@/lib/utils';

interface Commission {
  id: string;
  agent_id: string;
  loan_id: string;
  commission_percentage: number;
  loan_principal: number;
  commission_amount: number;
  status: string;
  payment_date: string | null;
  payment_mode: string | null;
  payment_reference: string | null;
  created_at: string;
  agent?: { full_name: string; agent_code: string; phone?: string };
  loan?: { loan_number: string; loan_date: string };
  voucher?: { voucher_number: string };
}

interface Agent {
  id: string;
  agent_code: string;
  full_name: string;
  phone: string | null;
  total_commission_earned: number;
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-blue-100 text-blue-800',
  paid: 'bg-green-100 text-green-800',
  cancelled: 'bg-gray-100 text-gray-800',
};

export default function CommissionReports() {
  const { profile, client } = useAuth();
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('summary');
  const [selectedAgent, setSelectedAgent] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState(format(startOfMonth(subMonths(new Date(), 2)), 'yyyy-MM-dd'));
  const [dateTo, setDateTo] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));

  useEffect(() => {
    if (profile?.client_id) {
      fetchData();
    }
  }, [profile?.client_id, dateFrom, dateTo, selectedAgent, selectedStatus]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch all commissions with filters
      let query = supabase
        .from('agent_commissions')
        .select(`
          *,
          agent:agents(full_name, agent_code, phone),
          loan:loans(loan_number, loan_date),
          voucher:vouchers(voucher_number)
        `)
        .eq('client_id', profile?.client_id)
        .gte('created_at', dateFrom)
        .lte('created_at', dateTo + 'T23:59:59')
        .order('created_at', { ascending: false });

      if (selectedAgent !== 'all') {
        query = query.eq('agent_id', selectedAgent);
      }

      if (selectedStatus !== 'all') {
        query = query.eq('status', selectedStatus);
      }

      const { data: commissionsData, error: commissionsError } = await query;
      if (commissionsError) throw commissionsError;
      setCommissions((commissionsData as Commission[]) || []);

      // Fetch agents summary
      const { data: agentsData, error: agentsError } = await supabase
        .from('agents')
        .select('id, agent_code, full_name, phone, total_commission_earned')
        .eq('client_id', profile?.client_id)
        .eq('is_active', true)
        .order('full_name');

      if (agentsError) throw agentsError;
      setAgents(agentsData || []);
    } catch (error: any) {
      toast.error('Failed to fetch data', { description: error.message });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  // Summary calculations
  const summaryStats = useMemo(() => {
    const totalGenerated = commissions.reduce((sum, c) => sum + c.commission_amount, 0);
    const totalPending = commissions.filter(c => c.status === 'pending').reduce((sum, c) => sum + c.commission_amount, 0);
    const totalApproved = commissions.filter(c => c.status === 'approved').reduce((sum, c) => sum + c.commission_amount, 0);
    const totalPaid = commissions.filter(c => c.status === 'paid').reduce((sum, c) => sum + c.commission_amount, 0);
    const totalCancelled = commissions.filter(c => c.status === 'cancelled').reduce((sum, c) => sum + c.commission_amount, 0);

    return { totalGenerated, totalPending, totalApproved, totalPaid, totalCancelled };
  }, [commissions]);

  // Agent-wise summary
  const agentSummary = useMemo(() => {
    const summary: Record<string, {
      agent: Agent;
      totalLoans: number;
      totalPrincipal: number;
      totalCommission: number;
      pending: number;
      approved: number;
      paid: number;
    }> = {};

    commissions.forEach(c => {
      if (!summary[c.agent_id]) {
        const agent = agents.find(a => a.id === c.agent_id);
        if (agent) {
          summary[c.agent_id] = {
            agent,
            totalLoans: 0,
            totalPrincipal: 0,
            totalCommission: 0,
            pending: 0,
            approved: 0,
            paid: 0,
          };
        }
      }

      if (summary[c.agent_id]) {
        summary[c.agent_id].totalLoans++;
        summary[c.agent_id].totalPrincipal += c.loan_principal;
        summary[c.agent_id].totalCommission += c.commission_amount;
        
        if (c.status === 'pending') summary[c.agent_id].pending += c.commission_amount;
        if (c.status === 'approved') summary[c.agent_id].approved += c.commission_amount;
        if (c.status === 'paid') summary[c.agent_id].paid += c.commission_amount;
      }
    });

    return Object.values(summary).sort((a, b) => b.totalCommission - a.totalCommission);
  }, [commissions, agents]);

  // Payment history (only paid commissions)
  const paymentHistory = useMemo(() => {
    return commissions.filter(c => c.status === 'paid').sort((a, b) => 
      new Date(b.payment_date || b.created_at).getTime() - new Date(a.payment_date || a.created_at).getTime()
    );
  }, [commissions]);

  const reportData = {
    company: {
      name: client?.company_name || 'Company',
      address: (client as any)?.address,
      phone: (client as any)?.phone,
      email: (client as any)?.email,
    },
    dateRange: { from: dateFrom, to: dateTo },
    summary: summaryStats,
    agentSummary,
    paymentHistory,
    reportType: selectedTab,
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Commission Reports</h1>
            <p className="text-muted-foreground">
              Analyze agent commission data and payment history
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={fetchData} disabled={loading}>
              <RefreshCw className={cn('h-4 w-4 mr-2', loading && 'animate-spin')} />
              Refresh
            </Button>
            <Button onClick={() => printElement('commission-report-content')}>
              <FileText className="h-4 w-4 mr-2" />
              Print Report
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>From Date</Label>
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>To Date</Label>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Agent</Label>
                <Select value={selectedAgent} onValueChange={setSelectedAgent}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Agents" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Agents</SelectItem>
                    {agents.map(agent => (
                      <SelectItem key={agent.id} value={agent.id}>
                        {agent.full_name} ({agent.agent_code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                Total Generated
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(summaryStats.totalGenerated)}</div>
              <p className="text-xs text-muted-foreground">{commissions.length} commissions</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <FileText className="h-4 w-4 text-yellow-600" />
                Pending Approval
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{formatCurrency(summaryStats.totalPending)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-600" />
                Approved (Unpaid)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{formatCurrency(summaryStats.totalApproved)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <IndianRupee className="h-4 w-4 text-green-600" />
                Total Paid
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{formatCurrency(summaryStats.totalPaid)}</div>
            </CardContent>
          </Card>
        </div>

        {/* Report Tabs */}
        <Card>
          <CardHeader>
            <CardTitle>Report Details</CardTitle>
            <CardDescription>View detailed commission reports by category</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={selectedTab} onValueChange={setSelectedTab}>
              <TabsList className="mb-4">
                <TabsTrigger value="summary">Summary</TabsTrigger>
                <TabsTrigger value="agent-wise">Agent-wise</TabsTrigger>
                <TabsTrigger value="payment-history">Payment History</TabsTrigger>
              </TabsList>

              <TabsContent value="summary">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Count</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead className="text-right">% of Total</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {['pending', 'approved', 'paid', 'cancelled'].map(status => {
                        const statusCommissions = commissions.filter(c => c.status === status);
                        const amount = statusCommissions.reduce((sum, c) => sum + c.commission_amount, 0);
                        const percentage = summaryStats.totalGenerated > 0 
                          ? ((amount / summaryStats.totalGenerated) * 100).toFixed(1) 
                          : '0';
                        return (
                          <TableRow key={status}>
                            <TableCell>
                              <Badge className={statusColors[status]}>{status}</Badge>
                            </TableCell>
                            <TableCell className="text-right">{statusCommissions.length}</TableCell>
                            <TableCell className="text-right font-semibold">{formatCurrency(amount)}</TableCell>
                            <TableCell className="text-right">{percentage}%</TableCell>
                          </TableRow>
                        );
                      })}
                      <TableRow className="font-bold bg-muted/50">
                        <TableCell>Total</TableCell>
                        <TableCell className="text-right">{commissions.length}</TableCell>
                        <TableCell className="text-right">{formatCurrency(summaryStats.totalGenerated)}</TableCell>
                        <TableCell className="text-right">100%</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                )}
              </TabsContent>

              <TabsContent value="agent-wise">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : agentSummary.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">No data found</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Agent</TableHead>
                        <TableHead className="text-right">Loans</TableHead>
                        <TableHead className="text-right">Principal Referred</TableHead>
                        <TableHead className="text-right">Total Commission</TableHead>
                        <TableHead className="text-right">Pending</TableHead>
                        <TableHead className="text-right">Paid</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {agentSummary.map(item => (
                        <TableRow key={item.agent.id}>
                          <TableCell>
                            <div className="font-medium">{item.agent.full_name}</div>
                            <div className="text-xs text-muted-foreground">{item.agent.agent_code}</div>
                          </TableCell>
                          <TableCell className="text-right">{item.totalLoans}</TableCell>
                          <TableCell className="text-right">{formatCurrency(item.totalPrincipal)}</TableCell>
                          <TableCell className="text-right font-semibold">{formatCurrency(item.totalCommission)}</TableCell>
                          <TableCell className="text-right text-yellow-600">{formatCurrency(item.pending + item.approved)}</TableCell>
                          <TableCell className="text-right text-green-600">{formatCurrency(item.paid)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </TabsContent>

              <TabsContent value="payment-history">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : paymentHistory.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">No payments found</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Payment Date</TableHead>
                        <TableHead>Agent</TableHead>
                        <TableHead>Loan #</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead>Mode</TableHead>
                        <TableHead>Voucher #</TableHead>
                        <TableHead>Reference</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paymentHistory.map(payment => (
                        <TableRow key={payment.id}>
                          <TableCell>
                            {payment.payment_date 
                              ? format(new Date(payment.payment_date), 'dd MMM yyyy')
                              : '-'}
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{payment.agent?.full_name}</div>
                            <div className="text-xs text-muted-foreground">{payment.agent?.agent_code}</div>
                          </TableCell>
                          <TableCell className="font-mono text-sm">{payment.loan?.loan_number}</TableCell>
                          <TableCell className="text-right font-semibold">
                            {formatCurrency(payment.commission_amount)}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{payment.payment_mode || '-'}</Badge>
                          </TableCell>
                          <TableCell className="font-mono text-xs">
                            {payment.voucher?.voucher_number || '-'}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {payment.payment_reference || '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}