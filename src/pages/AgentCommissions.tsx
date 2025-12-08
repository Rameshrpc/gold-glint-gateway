import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { generateAgentCommissionVoucher } from '@/hooks/useVoucherGeneration';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import SourceAccountSelector from '@/components/payments/SourceAccountSelector';
import { useSourceAccount } from '@/hooks/useSourceAccount';
import { Check, X, Wallet, RefreshCw, Users, IndianRupee, Clock, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface AgentCommission {
  id: string;
  client_id: string;
  branch_id: string;
  agent_id: string;
  loan_id: string;
  commission_percentage: number;
  loan_principal: number;
  commission_amount: number;
  status: 'pending' | 'approved' | 'paid' | 'cancelled';
  payment_date: string | null;
  payment_mode: string | null;
  payment_reference: string | null;
  remarks: string | null;
  created_at: string;
  agent?: { full_name: string; agent_code: string };
  loan?: { loan_number: string };
}

interface Agent {
  id: string;
  agent_code: string;
  full_name: string;
  total_commission_earned: number;
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-blue-100 text-blue-800',
  paid: 'bg-green-100 text-green-800',
  cancelled: 'bg-gray-100 text-gray-800',
};

export default function AgentCommissions() {
  const { profile, currentBranch } = useAuth();
  const [commissions, setCommissions] = useState<AgentCommission[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('pending');
  const [selectedCommissions, setSelectedCommissions] = useState<string[]>([]);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [paymentMode, setPaymentMode] = useState('cash');
  const [paymentReference, setPaymentReference] = useState('');
  const sourceAccount = useSourceAccount();

  useEffect(() => {
    if (profile?.client_id) {
      fetchData();
    }
  }, [profile?.client_id, selectedTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch commissions with related data
      let query = supabase
        .from('agent_commissions')
        .select(`
          *,
          agent:agents(full_name, agent_code),
          loan:loans(loan_number)
        `)
        .eq('client_id', profile?.client_id)
        .order('created_at', { ascending: false });

      if (selectedTab !== 'all') {
        query = query.eq('status', selectedTab);
      }

      const { data: commissionsData, error: commissionsError } = await query;
      if (commissionsError) throw commissionsError;
      setCommissions((commissionsData as any) || []);

      // Fetch agents summary
      const { data: agentsData, error: agentsError } = await supabase
        .from('agents')
        .select('id, agent_code, full_name, total_commission_earned')
        .eq('client_id', profile?.client_id)
        .eq('is_active', true);

      if (agentsError) throw agentsError;
      setAgents(agentsData || []);
    } catch (error: any) {
      toast.error('Failed to fetch data', { description: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (commissionIds: string[]) => {
    try {
      const { error } = await supabase
        .from('agent_commissions')
        .update({ status: 'approved' })
        .in('id', commissionIds);

      if (error) throw error;

      toast.success(`${commissionIds.length} commission(s) approved`);
      setSelectedCommissions([]);
      fetchData();
    } catch (error: any) {
      toast.error('Failed to approve', { description: error.message });
    }
  };

  const handleCancel = async (commissionId: string) => {
    try {
      const { error } = await supabase
        .from('agent_commissions')
        .update({ status: 'cancelled' })
        .eq('id', commissionId);

      if (error) throw error;

      toast.success('Commission cancelled');
      fetchData();
    } catch (error: any) {
      toast.error('Failed to cancel', { description: error.message });
    }
  };

  const handleBulkPayment = async () => {
    if (selectedCommissions.length === 0) {
      toast.error('Please select commissions to pay');
      return;
    }

    try {
      const paidCommissions = commissions.filter(c => selectedCommissions.includes(c.id));
      const agentTotals: Record<string, { amount: number; name: string }> = {};
      
      paidCommissions.forEach(c => {
        if (!agentTotals[c.agent_id]) {
          agentTotals[c.agent_id] = { amount: 0, name: c.agent?.full_name || 'Agent' };
        }
        agentTotals[c.agent_id].amount += c.commission_amount;
      });

      // Generate voucher for commission payment
      const voucherResult = await generateAgentCommissionVoucher({
        clientId: profile?.client_id || '',
        branchId: currentBranch?.id || '',
        commissionIds: selectedCommissions,
        totalAmount: totalSelected,
        paymentMode: paymentMode,
        agentName: Object.values(agentTotals).map(a => a.name).join(', '),
      });

      // Update commission records with voucher
      const { error: updateError } = await supabase
        .from('agent_commissions')
        .update({
          status: 'paid',
          payment_date: new Date().toISOString().split('T')[0],
          payment_mode: paymentMode,
          payment_reference: paymentReference || null,
          source_type: sourceAccount.sourceType,
          source_bank_id: sourceAccount.sourceBankId || null,
          source_account_id: sourceAccount.sourceAccountId || null,
          voucher_id: voucherResult.voucherId || null,
        })
        .in('id', selectedCommissions);

      if (updateError) throw updateError;

      // Update agent's total_commission_earned
      for (const [agentId, data] of Object.entries(agentTotals)) {
        const agent = agents.find(a => a.id === agentId);
        if (agent) {
          await supabase
            .from('agents')
            .update({ total_commission_earned: (agent.total_commission_earned || 0) + data.amount })
            .eq('id', agentId);
        }
      }

      const voucherMsg = voucherResult.voucherNumber && voucherResult.voucherNumber !== 'SKIPPED' 
        ? ` (Voucher: ${voucherResult.voucherNumber})` 
        : '';
      toast.success(`${selectedCommissions.length} commission(s) paid successfully${voucherMsg}`);
      setIsPaymentDialogOpen(false);
      setSelectedCommissions([]);
      setPaymentReference('');
      fetchData();
    } catch (error: any) {
      toast.error('Failed to process payment', { description: error.message });
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

  const toggleCommission = (id: string) => {
    setSelectedCommissions(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const toggleAllApproved = () => {
    const approvedIds = commissions.filter(c => c.status === 'approved').map(c => c.id);
    if (selectedCommissions.length === approvedIds.length) {
      setSelectedCommissions([]);
    } else {
      setSelectedCommissions(approvedIds);
    }
  };

  const totalPending = commissions.filter(c => c.status === 'pending').reduce((sum, c) => sum + c.commission_amount, 0);
  const totalApproved = commissions.filter(c => c.status === 'approved').reduce((sum, c) => sum + c.commission_amount, 0);
  const totalSelected = commissions.filter(c => selectedCommissions.includes(c.id)).reduce((sum, c) => sum + c.commission_amount, 0);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Agent Commissions</h1>
            <p className="text-muted-foreground">
              Manage and pay agent commissions from loan disbursements
            </p>
          </div>
          <Button variant="outline" onClick={fetchData} disabled={loading}>
            <RefreshCw className={cn('h-4 w-4 mr-2', loading && 'animate-spin')} />
            Refresh
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                Active Agents
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{agents.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Clock className="h-4 w-4 text-yellow-600" />
                Pending
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{formatCurrency(totalPending)}</div>
              <p className="text-xs text-muted-foreground">
                {commissions.filter(c => c.status === 'pending').length} commissions
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-blue-600" />
                Approved (Unpaid)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{formatCurrency(totalApproved)}</div>
              <p className="text-xs text-muted-foreground">
                {commissions.filter(c => c.status === 'approved').length} commissions
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <IndianRupee className="h-4 w-4 text-green-600" />
                Total Paid (All Time)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(agents.reduce((sum, a) => sum + (a.total_commission_earned || 0), 0))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Commissions Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Commissions</CardTitle>
                <CardDescription>View and manage agent commissions by status</CardDescription>
              </div>
              {selectedTab === 'approved' && selectedCommissions.length > 0 && (
                <Button onClick={() => setIsPaymentDialogOpen(true)}>
                  <Wallet className="h-4 w-4 mr-2" />
                  Pay Selected ({formatCurrency(totalSelected)})
                </Button>
              )}
              {selectedTab === 'pending' && selectedCommissions.length > 0 && (
                <Button onClick={() => handleApprove(selectedCommissions)}>
                  <Check className="h-4 w-4 mr-2" />
                  Approve Selected ({selectedCommissions.length})
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <Tabs value={selectedTab} onValueChange={setSelectedTab}>
              <TabsList className="mb-4">
                <TabsTrigger value="pending">Pending</TabsTrigger>
                <TabsTrigger value="approved">Approved</TabsTrigger>
                <TabsTrigger value="paid">Paid</TabsTrigger>
                <TabsTrigger value="all">All</TabsTrigger>
              </TabsList>

              <TabsContent value={selectedTab}>
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : commissions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No commissions found
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {(selectedTab === 'pending' || selectedTab === 'approved') && (
                          <TableHead className="w-12">
                            <Checkbox
                              checked={
                                commissions.filter(c => c.status === selectedTab).length > 0 &&
                                selectedCommissions.length === commissions.filter(c => c.status === selectedTab).length
                              }
                              onCheckedChange={() => {
                                const statusIds = commissions.filter(c => c.status === selectedTab).map(c => c.id);
                                if (selectedCommissions.length === statusIds.length) {
                                  setSelectedCommissions([]);
                                } else {
                                  setSelectedCommissions(statusIds);
                                }
                              }}
                            />
                          </TableHead>
                        )}
                        <TableHead>Date</TableHead>
                        <TableHead>Agent</TableHead>
                        <TableHead>Loan #</TableHead>
                        <TableHead className="text-right">Principal</TableHead>
                        <TableHead className="text-right">Rate</TableHead>
                        <TableHead className="text-right">Commission</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {commissions.map(commission => (
                        <TableRow key={commission.id}>
                          {(selectedTab === 'pending' || selectedTab === 'approved') && (
                            <TableCell>
                              {commission.status === selectedTab && (
                                <Checkbox
                                  checked={selectedCommissions.includes(commission.id)}
                                  onCheckedChange={() => toggleCommission(commission.id)}
                                />
                              )}
                            </TableCell>
                          )}
                          <TableCell className="text-sm">
                            {format(new Date(commission.created_at), 'dd MMM yyyy')}
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{commission.agent?.full_name}</div>
                            <div className="text-xs text-muted-foreground">{commission.agent?.agent_code}</div>
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {commission.loan?.loan_number}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(commission.loan_principal)}
                          </TableCell>
                          <TableCell className="text-right">
                            {commission.commission_percentage}%
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            {formatCurrency(commission.commission_amount)}
                          </TableCell>
                          <TableCell>
                            <Badge className={statusColors[commission.status]}>
                              {commission.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            {commission.status === 'pending' && (
                              <div className="flex justify-end gap-2">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleApprove([commission.id])}
                                >
                                  <Check className="h-4 w-4 text-green-600" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleCancel(commission.id)}
                                >
                                  <X className="h-4 w-4 text-red-600" />
                                </Button>
                              </div>
                            )}
                            {commission.status === 'paid' && commission.payment_date && (
                              <div className="text-xs text-muted-foreground">
                                {format(new Date(commission.payment_date), 'dd MMM yyyy')}
                              </div>
                            )}
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

        {/* Agent Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Agent Summary</CardTitle>
            <CardDescription>Commission earnings by agent</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Agent</TableHead>
                  <TableHead className="text-right">Pending</TableHead>
                  <TableHead className="text-right">Approved</TableHead>
                  <TableHead className="text-right">Total Paid</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {agents.map(agent => {
                  const agentCommissions = commissions.filter(c => c.agent_id === agent.id);
                  const pending = agentCommissions.filter(c => c.status === 'pending').reduce((sum, c) => sum + c.commission_amount, 0);
                  const approved = agentCommissions.filter(c => c.status === 'approved').reduce((sum, c) => sum + c.commission_amount, 0);
                  return (
                    <TableRow key={agent.id}>
                      <TableCell>
                        <div className="font-medium">{agent.full_name}</div>
                        <div className="text-xs text-muted-foreground">{agent.agent_code}</div>
                      </TableCell>
                      <TableCell className="text-right text-yellow-600">
                        {formatCurrency(pending)}
                      </TableCell>
                      <TableCell className="text-right text-blue-600">
                        {formatCurrency(approved)}
                      </TableCell>
                      <TableCell className="text-right font-semibold text-green-600">
                        {formatCurrency(agent.total_commission_earned || 0)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Payment Dialog */}
        <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Process Commission Payment</DialogTitle>
              <DialogDescription>
                Pay {selectedCommissions.length} selected commission(s) totaling {formatCurrency(totalSelected)}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Payment Mode</Label>
                <Select value={paymentMode} onValueChange={setPaymentMode}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="neft">NEFT</SelectItem>
                    <SelectItem value="upi">UPI</SelectItem>
                    <SelectItem value="cheque">Cheque</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {paymentMode !== 'cash' && (
              <SourceAccountSelector
                clientId={profile?.client_id || ''}
                paymentMode={paymentMode}
                sourceType={sourceAccount.sourceType}
                setSourceType={sourceAccount.setSourceType}
                sourceBankId={sourceAccount.sourceBankId}
                setSourceBankId={sourceAccount.setSourceBankId}
                sourceAccountId={sourceAccount.sourceAccountId}
                setSourceAccountId={sourceAccount.setSourceAccountId}
                selectedLoyaltyId={sourceAccount.selectedLoyaltyId}
                setSelectedLoyaltyId={sourceAccount.setSelectedLoyaltyId}
              />
              )}

              <div className="space-y-2">
                <Label>Reference Number</Label>
                <Input
                  value={paymentReference}
                  onChange={e => setPaymentReference(e.target.value)}
                  placeholder="Transaction reference"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsPaymentDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleBulkPayment}>
                Pay {formatCurrency(totalSelected)}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
