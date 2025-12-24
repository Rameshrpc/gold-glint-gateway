import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Users, Clock, CheckCircle, IndianRupee, RefreshCw, Wallet, Check, X } from 'lucide-react';
import MobileLayout from './MobileLayout';
import MobileSimpleHeader from './MobileSimpleHeader';
import PullToRefreshContainer from './PullToRefreshContainer';
import MobileBottomSheet from './shared/MobileBottomSheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface AgentCommission {
  id: string;
  agent_id: string;
  loan_id: string;
  commission_percentage: number;
  loan_principal: number;
  commission_amount: number;
  status: 'pending' | 'approved' | 'paid' | 'cancelled';
  payment_date: string | null;
  payment_mode: string | null;
  created_at: string;
  agent?: { full_name: string; agent_code: string };
  loan?: { loan_number: string };
}

type FilterType = 'pending' | 'approved' | 'paid' | 'all';

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-blue-100 text-blue-800',
  paid: 'bg-green-100 text-green-800',
  cancelled: 'bg-gray-100 text-gray-800',
};

export default function MobileAgentCommissions() {
  const { profile, currentBranch } = useAuth();
  const [commissions, setCommissions] = useState<AgentCommission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<FilterType>('pending');
  const [selectedCommission, setSelectedCommission] = useState<AgentCommission | null>(null);
  const [showPaySheet, setShowPaySheet] = useState(false);
  const [paymentMode, setPaymentMode] = useState('cash');
  const [paymentReference, setPaymentReference] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const fetchData = useCallback(async () => {
    if (!profile?.client_id) return;

    try {
      let query = supabase
        .from('agent_commissions')
        .select(`
          *,
          agent:agents(full_name, agent_code),
          loan:loans(loan_number)
        `)
        .eq('client_id', profile.client_id)
        .order('created_at', { ascending: false })
        .limit(100);

      if (activeFilter !== 'all') {
        query = query.eq('status', activeFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      setCommissions((data as AgentCommission[]) || []);
    } catch (error: any) {
      toast.error('Failed to fetch data', { description: error.message });
    } finally {
      setIsLoading(false);
    }
  }, [profile?.client_id, activeFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRefresh = useCallback(async () => {
    setIsLoading(true);
    await fetchData();
  }, [fetchData]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const handleApprove = async (commission: AgentCommission) => {
    try {
      const { error } = await supabase
        .from('agent_commissions')
        .update({ status: 'approved' })
        .eq('id', commission.id);

      if (error) throw error;
      toast.success('Commission approved');
      fetchData();
    } catch (error: any) {
      toast.error('Failed to approve', { description: error.message });
    }
  };

  const handlePay = async () => {
    if (!selectedCommission) return;
    setIsProcessing(true);

    try {
      const { error } = await supabase
        .from('agent_commissions')
        .update({
          status: 'paid',
          payment_date: new Date().toISOString().split('T')[0],
          payment_mode: paymentMode,
          payment_reference: paymentReference || null,
        })
        .eq('id', selectedCommission.id);

      if (error) throw error;

      // Update agent total
      if (selectedCommission.agent_id) {
        const { data: agent } = await supabase
          .from('agents')
          .select('total_commission_earned')
          .eq('id', selectedCommission.agent_id)
          .single();

        if (agent) {
          await supabase
            .from('agents')
            .update({ 
              total_commission_earned: (agent.total_commission_earned || 0) + selectedCommission.commission_amount 
            })
            .eq('id', selectedCommission.agent_id);
        }
      }

      toast.success('Commission paid successfully');
      setShowPaySheet(false);
      setSelectedCommission(null);
      setPaymentReference('');
      fetchData();
    } catch (error: any) {
      toast.error('Failed to process payment', { description: error.message });
    } finally {
      setIsProcessing(false);
    }
  };

  const filters: { key: FilterType; label: string; count: number }[] = [
    { key: 'pending', label: 'Pending', count: commissions.filter(c => activeFilter === 'pending' || c.status === 'pending').length },
    { key: 'approved', label: 'Approved', count: commissions.filter(c => activeFilter === 'approved' || c.status === 'approved').length },
    { key: 'paid', label: 'Paid', count: commissions.filter(c => activeFilter === 'paid' || c.status === 'paid').length },
    { key: 'all', label: 'All', count: commissions.length },
  ];

  const totalPending = commissions.filter(c => c.status === 'pending').reduce((s, c) => s + c.commission_amount, 0);
  const totalApproved = commissions.filter(c => c.status === 'approved').reduce((s, c) => s + c.commission_amount, 0);

  return (
    <MobileLayout>
      <MobileSimpleHeader title="Agent Commissions" />

      <PullToRefreshContainer onRefresh={handleRefresh} className="px-4 py-4 space-y-4">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-card rounded-xl border p-3">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="h-4 w-4 text-yellow-600" />
              <span className="text-xs text-muted-foreground">Pending</span>
            </div>
            <p className="text-lg font-bold text-yellow-600">{formatCurrency(totalPending)}</p>
          </div>
          <div className="bg-card rounded-xl border p-3">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle className="h-4 w-4 text-blue-600" />
              <span className="text-xs text-muted-foreground">Approved</span>
            </div>
            <p className="text-lg font-bold text-blue-600">{formatCurrency(totalApproved)}</p>
          </div>
        </div>

        {/* Filter Chips */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4">
          {filters.map((filter) => (
            <button
              key={filter.key}
              onClick={() => setActiveFilter(filter.key)}
              className={cn(
                "flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors",
                activeFilter === filter.key
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {/* Commissions List */}
        <div className="space-y-3">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : commissions.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No commissions found</p>
            </div>
          ) : (
            commissions.map((commission) => (
              <div key={commission.id} className="bg-card rounded-xl border p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold">{commission.agent?.full_name}</p>
                    <p className="text-xs text-muted-foreground">{commission.agent?.agent_code}</p>
                  </div>
                  <Badge className={statusColors[commission.status]}>
                    {commission.status}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs">Loan</p>
                    <p className="font-mono">{commission.loan?.loan_number}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Date</p>
                    <p>{format(new Date(commission.created_at), 'dd MMM yyyy')}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Principal</p>
                    <p>{formatCurrency(commission.loan_principal)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Rate</p>
                    <p>{commission.commission_percentage}%</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t">
                  <div>
                    <p className="text-xs text-muted-foreground">Commission</p>
                    <p className="text-lg font-bold text-primary">{formatCurrency(commission.commission_amount)}</p>
                  </div>
                  
                  {commission.status === 'pending' && (
                    <Button size="sm" onClick={() => handleApprove(commission)}>
                      <Check className="h-4 w-4 mr-1" />
                      Approve
                    </Button>
                  )}
                  
                  {commission.status === 'approved' && (
                    <Button size="sm" onClick={() => { setSelectedCommission(commission); setShowPaySheet(true); }}>
                      <Wallet className="h-4 w-4 mr-1" />
                      Pay
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="h-20" />
      </PullToRefreshContainer>

      {/* Payment Sheet */}
      <MobileBottomSheet
        isOpen={showPaySheet}
        onClose={() => setShowPaySheet(false)}
        title="Process Payment"
      >
        {selectedCommission && (
          <div className="space-y-4 p-4">
            <div className="bg-muted/50 rounded-lg p-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Agent</span>
                <span className="font-medium">{selectedCommission.agent?.full_name}</span>
              </div>
              <div className="flex justify-between items-center mt-2">
                <span className="text-sm text-muted-foreground">Amount</span>
                <span className="font-bold text-lg text-primary">
                  {formatCurrency(selectedCommission.commission_amount)}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Payment Mode</Label>
              <Select value={paymentMode} onValueChange={setPaymentMode}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="upi">UPI</SelectItem>
                  <SelectItem value="cheque">Cheque</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Reference (Optional)</Label>
              <Input
                value={paymentReference}
                onChange={(e) => setPaymentReference(e.target.value)}
                placeholder="Transaction ID or cheque number"
              />
            </div>

            <Button 
              className="w-full" 
              onClick={handlePay}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Wallet className="h-4 w-4 mr-2" />
              )}
              Confirm Payment
            </Button>
          </div>
        )}
      </MobileBottomSheet>
    </MobileLayout>
  );
}
