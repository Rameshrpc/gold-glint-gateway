import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { format, subDays, startOfMonth } from 'date-fns';

export interface DashboardStats {
  totalCustomers: number;
  activeLoans: number;
  totalAUM: number;
  monthlyCollection: number;
  overdueLoans: number;
}

export interface GoldCustody {
  totalWeightGrams: number;
  totalAppraisedValue: number;
  itemCount: number;
  avgLTV: number;
}

export interface OverdueBucket {
  label: string;
  range: string;
  count: number;
  amount: number;
  color: string;
}

export interface BranchPerformance {
  branchId: string;
  branchName: string;
  branchCode: string;
  aum: number;
  loanCount: number;
  percentage: number;
}

export interface TrendDataPoint {
  date: string;
  displayDate: string;
  disbursements: number;
  collections: number;
  cumulativeAUM: number;
}

export interface DashboardData {
  stats: DashboardStats;
  goldCustody: GoldCustody;
  overdueBuckets: OverdueBucket[];
  branchPerformance: BranchPerformance[];
  trendData: TrendDataPoint[];
  isLoading: boolean;
  refetch: () => void;
}

export function useDashboardData(): DashboardData {
  const { profile, hasRole, branches } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalCustomers: 0,
    activeLoans: 0,
    totalAUM: 0,
    monthlyCollection: 0,
    overdueLoans: 0,
  });
  const [goldCustody, setGoldCustody] = useState<GoldCustody>({
    totalWeightGrams: 0,
    totalAppraisedValue: 0,
    itemCount: 0,
    avgLTV: 0,
  });
  const [overdueBuckets, setOverdueBuckets] = useState<OverdueBucket[]>([]);
  const [branchPerformance, setBranchPerformance] = useState<BranchPerformance[]>([]);
  const [trendData, setTrendData] = useState<TrendDataPoint[]>([]);

  const isTenantAdmin = hasRole('tenant_admin') || hasRole('super_admin');

  const fetchData = useCallback(async () => {
    if (!profile?.client_id) return;

    setIsLoading(true);
    const today = new Date();
    const todayStr = format(today, 'yyyy-MM-dd');
    const startOfMonthStr = format(startOfMonth(today), 'yyyy-MM-dd');
    const fourteenDaysAgo = format(subDays(today, 14), 'yyyy-MM-dd');

    try {
      // Fetch all data in parallel
      const [
        customersRes,
        loansRes,
        goldItemsRes,
        interestPaymentsRes,
        branchesData,
      ] = await Promise.all([
        // Total customers
        supabase
          .from('customers')
          .select('id', { count: 'exact' })
          .eq('client_id', profile.client_id)
          .eq('is_active', true),
        
        // All loans with details
        supabase
          .from('loans')
          .select('id, branch_id, principal_amount, status, maturity_date, loan_date, net_disbursed')
          .eq('client_id', profile.client_id),
        
        // Gold items for custody
        supabase
          .from('gold_items')
          .select('id, net_weight_grams, appraised_value, loan_id')
          .eq('is_repledged', false),
        
        // Interest payments for collections
        supabase
          .from('interest_payments')
          .select('id, amount_paid, payment_date, branch_id')
          .eq('client_id', profile.client_id)
          .gte('payment_date', fourteenDaysAgo),
        
        // Get branches for branch performance
        supabase
          .from('branches')
          .select('id, branch_name, branch_code')
          .eq('client_id', profile.client_id)
          .eq('is_active', true),
      ]);

      const allLoans = loansRes.data || [];
      const activeLoans = allLoans.filter(l => l.status === 'active');
      const goldItems = goldItemsRes.data || [];
      const interestPayments = interestPaymentsRes.data || [];
      const branchesList = branchesData.data || [];

      // Calculate basic stats
      const totalAUM = activeLoans.reduce((sum, l) => sum + (l.principal_amount || 0), 0);
      const monthlyCollection = interestPayments
        .filter(p => p.payment_date >= startOfMonthStr)
        .reduce((sum, p) => sum + (p.amount_paid || 0), 0);

      // Calculate overdue buckets
      const overdueLoans = activeLoans.filter(l => l.maturity_date < todayStr);
      const buckets = calculateOverdueBuckets(overdueLoans, todayStr);

      // Calculate gold custody
      const activeLoanIds = new Set(activeLoans.map(l => l.id));
      const activeGoldItems = goldItems.filter(g => activeLoanIds.has(g.loan_id));
      const totalGoldWeight = activeGoldItems.reduce((sum, g) => sum + (g.net_weight_grams || 0), 0);
      const totalAppraisedValue = activeGoldItems.reduce((sum, g) => sum + (g.appraised_value || 0), 0);
      const avgLTV = totalAppraisedValue > 0 ? (totalAUM / totalAppraisedValue) * 100 : 0;

      // Calculate branch performance (top 5)
      const branchStats = branchesList.map(branch => {
        const branchLoans = activeLoans.filter(l => l.branch_id === branch.id);
        const branchAUM = branchLoans.reduce((sum, l) => sum + (l.principal_amount || 0), 0);
        return {
          branchId: branch.id,
          branchName: branch.branch_name,
          branchCode: branch.branch_code,
          aum: branchAUM,
          loanCount: branchLoans.length,
          percentage: totalAUM > 0 ? (branchAUM / totalAUM) * 100 : 0,
        };
      });
      const topBranches = branchStats
        .sort((a, b) => b.aum - a.aum)
        .slice(0, 5);

      // Calculate trend data (last 14 days)
      const trendPoints: TrendDataPoint[] = [];
      for (let i = 13; i >= 0; i--) {
        const date = subDays(today, i);
        const dateStr = format(date, 'yyyy-MM-dd');
        const displayDate = format(date, 'MMM d');
        
        // Disbursements on this day
        const dayDisbursements = allLoans
          .filter(l => l.loan_date === dateStr)
          .reduce((sum, l) => sum + (l.net_disbursed || 0), 0);
        
        // Collections on this day
        const dayCollections = interestPayments
          .filter(p => p.payment_date === dateStr)
          .reduce((sum, p) => sum + (p.amount_paid || 0), 0);
        
        // Cumulative AUM (loans active as of this date)
        const cumulativeAUM = allLoans
          .filter(l => l.loan_date <= dateStr && l.status === 'active')
          .reduce((sum, l) => sum + (l.principal_amount || 0), 0);

        trendPoints.push({
          date: dateStr,
          displayDate,
          disbursements: dayDisbursements,
          collections: dayCollections,
          cumulativeAUM,
        });
      }

      setStats({
        totalCustomers: customersRes.count || 0,
        activeLoans: activeLoans.length,
        totalAUM,
        monthlyCollection,
        overdueLoans: overdueLoans.length,
      });

      setGoldCustody({
        totalWeightGrams: totalGoldWeight,
        totalAppraisedValue,
        itemCount: activeGoldItems.length,
        avgLTV,
      });

      setOverdueBuckets(buckets);
      setBranchPerformance(topBranches);
      setTrendData(trendPoints);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [profile?.client_id]);

  useEffect(() => {
    fetchData();
    // Auto-refresh every 5 minutes
    const interval = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchData]);

  return {
    stats,
    goldCustody,
    overdueBuckets,
    branchPerformance,
    trendData,
    isLoading,
    refetch: fetchData,
  };
}

function calculateOverdueBuckets(overdueLoans: any[], todayStr: string): OverdueBucket[] {
  const today = new Date(todayStr);
  
  const buckets: OverdueBucket[] = [
    { label: 'Current', range: '0 days', count: 0, amount: 0, color: 'hsl(142, 71%, 45%)' },
    { label: '1-30 days', range: '1-30', count: 0, amount: 0, color: 'hsl(45, 93%, 47%)' },
    { label: '31-60 days', range: '31-60', count: 0, amount: 0, color: 'hsl(38, 92%, 50%)' },
    { label: '61-90 days', range: '61-90', count: 0, amount: 0, color: 'hsl(25, 95%, 53%)' },
    { label: '90+ days', range: '90+', count: 0, amount: 0, color: 'hsl(0, 84%, 60%)' },
  ];

  overdueLoans.forEach(loan => {
    const maturityDate = new Date(loan.maturity_date);
    const daysOverdue = Math.floor((today.getTime() - maturityDate.getTime()) / (1000 * 60 * 60 * 24));
    const amount = loan.principal_amount || 0;

    if (daysOverdue <= 0) {
      buckets[0].count++;
      buckets[0].amount += amount;
    } else if (daysOverdue <= 30) {
      buckets[1].count++;
      buckets[1].amount += amount;
    } else if (daysOverdue <= 60) {
      buckets[2].count++;
      buckets[2].amount += amount;
    } else if (daysOverdue <= 90) {
      buckets[3].count++;
      buckets[3].amount += amount;
    } else {
      buckets[4].count++;
      buckets[4].amount += amount;
    }
  });

  return buckets;
}
