import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Users, TrendingUp, IndianRupee, FileText, RefreshCw, Calendar } from 'lucide-react';
import MobileLayout from './MobileLayout';
import MobileSimpleHeader from './MobileSimpleHeader';
import PullToRefreshContainer from './PullToRefreshContainer';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { cn } from '@/lib/utils';

interface Commission {
  id: string;
  agent_id: string;
  commission_percentage: number;
  loan_principal: number;
  commission_amount: number;
  status: string;
  payment_date: string | null;
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

type TabType = 'summary' | 'agents' | 'payments';

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-blue-100 text-blue-800',
  paid: 'bg-green-100 text-green-800',
  cancelled: 'bg-gray-100 text-gray-800',
};

export default function MobileCommissionReports() {
  const { profile } = useAuth();
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('summary');
  const [dateFrom, setDateFrom] = useState(format(startOfMonth(subMonths(new Date(), 2)), 'yyyy-MM-dd'));
  const [dateTo, setDateTo] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));

  const fetchData = useCallback(async () => {
    if (!profile?.client_id) return;

    try {
      const [commissionsRes, agentsRes] = await Promise.all([
        supabase
          .from('agent_commissions')
          .select(`
            *,
            agent:agents(full_name, agent_code),
            loan:loans(loan_number)
          `)
          .eq('client_id', profile.client_id)
          .gte('created_at', dateFrom)
          .lte('created_at', dateTo + 'T23:59:59')
          .order('created_at', { ascending: false }),
        supabase
          .from('agents')
          .select('id, agent_code, full_name, total_commission_earned')
          .eq('client_id', profile.client_id)
          .eq('is_active', true)
          .order('full_name'),
      ]);

      if (commissionsRes.error) throw commissionsRes.error;
      if (agentsRes.error) throw agentsRes.error;

      setCommissions((commissionsRes.data as Commission[]) || []);
      setAgents(agentsRes.data || []);
    } catch (error: any) {
      toast.error('Failed to fetch data', { description: error.message });
    } finally {
      setIsLoading(false);
    }
  }, [profile?.client_id, dateFrom, dateTo]);

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

  // Summary calculations
  const summaryStats = useMemo(() => {
    const totalGenerated = commissions.reduce((sum, c) => sum + c.commission_amount, 0);
    const totalPending = commissions.filter(c => c.status === 'pending').reduce((sum, c) => sum + c.commission_amount, 0);
    const totalApproved = commissions.filter(c => c.status === 'approved').reduce((sum, c) => sum + c.commission_amount, 0);
    const totalPaid = commissions.filter(c => c.status === 'paid').reduce((sum, c) => sum + c.commission_amount, 0);

    return { totalGenerated, totalPending, totalApproved, totalPaid };
  }, [commissions]);

  // Agent-wise summary
  const agentSummary = useMemo(() => {
    const summary: Record<string, {
      agent: Agent;
      totalLoans: number;
      totalCommission: number;
      pending: number;
      paid: number;
    }> = {};

    commissions.forEach(c => {
      if (!summary[c.agent_id]) {
        const agent = agents.find(a => a.id === c.agent_id);
        if (agent) {
          summary[c.agent_id] = {
            agent,
            totalLoans: 0,
            totalCommission: 0,
            pending: 0,
            paid: 0,
          };
        }
      }

      if (summary[c.agent_id]) {
        summary[c.agent_id].totalLoans++;
        summary[c.agent_id].totalCommission += c.commission_amount;
        if (c.status === 'pending' || c.status === 'approved') summary[c.agent_id].pending += c.commission_amount;
        if (c.status === 'paid') summary[c.agent_id].paid += c.commission_amount;
      }
    });

    return Object.values(summary).sort((a, b) => b.totalCommission - a.totalCommission);
  }, [commissions, agents]);

  const paidCommissions = commissions.filter(c => c.status === 'paid');

  const tabs: { key: TabType; label: string }[] = [
    { key: 'summary', label: 'Summary' },
    { key: 'agents', label: 'By Agent' },
    { key: 'payments', label: 'Payments' },
  ];

  return (
    <MobileLayout>
      <MobileSimpleHeader title="Commission Reports" />

      <PullToRefreshContainer onRefresh={handleRefresh} className="px-4 py-4 space-y-4">
        {/* Date Filters */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs">From</Label>
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="h-9"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">To</Label>
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="h-9"
            />
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-card rounded-xl border p-3">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Total</span>
            </div>
            <p className="text-lg font-bold">{formatCurrency(summaryStats.totalGenerated)}</p>
          </div>
          <div className="bg-card rounded-xl border p-3">
            <div className="flex items-center gap-2 mb-1">
              <IndianRupee className="h-4 w-4 text-green-600" />
              <span className="text-xs text-muted-foreground">Paid</span>
            </div>
            <p className="text-lg font-bold text-green-600">{formatCurrency(summaryStats.totalPaid)}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors",
                activeTab === tab.key
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {activeTab === 'summary' && (
              <div className="bg-card rounded-xl border overflow-hidden">
                {['pending', 'approved', 'paid', 'cancelled'].map((status, i) => {
                  const statusCommissions = commissions.filter(c => c.status === status);
                  const amount = statusCommissions.reduce((s, c) => s + c.commission_amount, 0);
                  return (
                    <div 
                      key={status} 
                      className={cn(
                        "flex items-center justify-between p-3",
                        i !== 3 && "border-b"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <Badge className={statusColors[status]}>{status}</Badge>
                        <span className="text-sm text-muted-foreground">({statusCommissions.length})</span>
                      </div>
                      <span className="font-semibold">{formatCurrency(amount)}</span>
                    </div>
                  );
                })}
              </div>
            )}

            {activeTab === 'agents' && (
              <div className="space-y-3">
                {agentSummary.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No agent data</p>
                  </div>
                ) : (
                  agentSummary.map((item) => (
                    <div key={item.agent.id} className="bg-card rounded-xl border p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-semibold">{item.agent.full_name}</p>
                          <p className="text-xs text-muted-foreground">{item.agent.agent_code}</p>
                        </div>
                        <span className="text-sm text-muted-foreground">{item.totalLoans} loans</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div>
                          <p className="text-xs text-muted-foreground">Total</p>
                          <p className="font-semibold">{formatCurrency(item.totalCommission)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Pending</p>
                          <p className="font-semibold text-yellow-600">{formatCurrency(item.pending)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Paid</p>
                          <p className="font-semibold text-green-600">{formatCurrency(item.paid)}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === 'payments' && (
              <div className="space-y-3">
                {paidCommissions.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No payments yet</p>
                  </div>
                ) : (
                  paidCommissions.map((commission) => (
                    <div key={commission.id} className="bg-card rounded-xl border p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-semibold">{commission.agent?.full_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {commission.payment_date 
                              ? format(new Date(commission.payment_date), 'dd MMM yyyy')
                              : format(new Date(commission.created_at), 'dd MMM yyyy')
                            }
                          </p>
                        </div>
                        <p className="font-bold text-green-600">{formatCurrency(commission.commission_amount)}</p>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Loan: {commission.loan?.loan_number}
                      </p>
                    </div>
                  ))
                )}
              </div>
            )}
          </>
        )}

        <div className="h-20" />
      </PullToRefreshContainer>
    </MobileLayout>
  );
}
