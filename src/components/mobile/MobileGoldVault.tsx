import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Vault, Package, Scale, IndianRupee, Calendar, Building2, Eye, Unlock } from 'lucide-react';
import MobileLayout from './MobileLayout';
import MobileSimpleHeader from './MobileSimpleHeader';
import PullToRefreshContainer from './PullToRefreshContainer';
import { MobileSearchBar, MobileBottomSheet, MobileDataCard } from './shared';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { vibrateLight } from '@/lib/haptics';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface RepledgePacket {
  id: string;
  packet_number: string;
  packet_date: string;
  bank_id: string;
  total_loans: number;
  total_principal: number;
  total_gold_weight_grams: number;
  total_appraised_value: number;
  bank_loan_amount: number | null;
  status: string;
  bank?: { bank_name: string; bank_code: string };
}

interface InVaultLoan {
  id: string;
  loan_number: string;
  loan_date: string;
  principal_amount: number;
  status: string;
  customer?: { full_name: string };
  gold_items?: { net_weight_grams: number; appraised_value: number }[];
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
};

const formatWeight = (grams: number) => {
  return `${grams.toFixed(2)}g`;
};

export default function MobileGoldVault() {
  const { client } = useAuth();
  const [activeTab, setActiveTab] = useState<'vault' | 'repledged'>('vault');
  const [packets, setPackets] = useState<RepledgePacket[]>([]);
  const [inVaultLoans, setInVaultLoans] = useState<InVaultLoan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPacket, setSelectedPacket] = useState<RepledgePacket | null>(null);
  const [selectedLoan, setSelectedLoan] = useState<InVaultLoan | null>(null);

  const fetchData = useCallback(async () => {
    if (!client) return;

    try {
      await Promise.all([fetchPackets(), fetchInVaultLoans()]);
    } finally {
      setIsLoading(false);
    }
  }, [client]);

  const fetchPackets = async () => {
    if (!client) return;
    
    const { data, error } = await supabase
      .from('repledge_packets')
      .select('*, bank:banks_nbfc(bank_name, bank_code)')
      .eq('client_id', client.id)
      .order('packet_date', { ascending: false });

    if (!error) {
      setPackets(data || []);
    }
  };

  const fetchInVaultLoans = async () => {
    if (!client) return;
    
    const { data: repledgedItems } = await supabase
      .from('repledge_items')
      .select('loan_id, packet:repledge_packets(status)')
      .eq('client_id', client.id);

    const activeLoanIds = repledgedItems
      ?.filter(i => (i.packet as any)?.status === 'active')
      .map(i => i.loan_id) || [];

    let query = supabase
      .from('loans')
      .select('id, loan_number, loan_date, principal_amount, status, customer:customers(full_name), gold_items(net_weight_grams, appraised_value)')
      .eq('client_id', client.id)
      .eq('status', 'active')
      .order('loan_date', { ascending: false });

    if (activeLoanIds.length > 0) {
      query = query.not('id', 'in', `(${activeLoanIds.join(',')})`);
    }

    const { data, error } = await query;

    if (!error) {
      setInVaultLoans(data || []);
    }
  };

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRefresh = useCallback(async () => {
    setIsLoading(true);
    await fetchData();
  }, [fetchData]);

  // Calculate totals
  const vaultTotals = inVaultLoans.reduce((acc, loan) => {
    const weight = loan.gold_items?.reduce((sum, g) => sum + g.net_weight_grams, 0) || 0;
    const value = loan.gold_items?.reduce((sum, g) => sum + g.appraised_value, 0) || 0;
    return {
      loans: acc.loans + 1,
      weight: acc.weight + weight,
      value: acc.value + value,
      principal: acc.principal + loan.principal_amount,
    };
  }, { loans: 0, weight: 0, value: 0, principal: 0 });

  const repledgeTotals = packets
    .filter(p => p.status === 'active')
    .reduce((acc, p) => ({
      packets: acc.packets + 1,
      loans: acc.loans + p.total_loans,
      weight: acc.weight + p.total_gold_weight_grams,
      value: acc.value + p.total_appraised_value,
      bankLoan: acc.bankLoan + (p.bank_loan_amount || 0),
    }), { packets: 0, loans: 0, weight: 0, value: 0, bankLoan: 0 });

  const filteredVaultLoans = inVaultLoans.filter(loan => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      loan.loan_number.toLowerCase().includes(query) ||
      loan.customer?.full_name.toLowerCase().includes(query)
    );
  });

  const filteredPackets = packets.filter(packet => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      packet.packet_number.toLowerCase().includes(query) ||
      packet.bank?.bank_name.toLowerCase().includes(query)
    );
  });

  return (
    <MobileLayout>
      <MobileSimpleHeader title="Gold Vault" showBack />

      <PullToRefreshContainer onRefresh={handleRefresh} className="px-4 py-4 space-y-4 animate-fade-in">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gradient-to-br from-amber-50 to-orange-100 dark:from-amber-900/20 dark:to-orange-900/20 rounded-2xl p-4 border border-amber-200/50">
            <div className="flex items-center gap-2 mb-2">
              <Vault className="w-4 h-4 text-amber-600" />
              <span className="text-xs font-medium text-amber-700 dark:text-amber-400">In Vault</span>
            </div>
            <p className="text-xl font-bold text-amber-900 dark:text-amber-100">{vaultTotals.loans}</p>
            <p className="text-xs text-amber-600">{formatWeight(vaultTotals.weight)}</p>
          </div>
          <div className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl p-4 border border-blue-200/50">
            <div className="flex items-center gap-2 mb-2">
              <Package className="w-4 h-4 text-blue-600" />
              <span className="text-xs font-medium text-blue-700 dark:text-blue-400">Repledged</span>
            </div>
            <p className="text-xl font-bold text-blue-900 dark:text-blue-100">{repledgeTotals.packets}</p>
            <p className="text-xs text-blue-600">{formatWeight(repledgeTotals.weight)}</p>
          </div>
        </div>

        {/* Tab Switcher */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'vault' | 'repledged')} className="w-full">
          <TabsList className="w-full h-12 bg-muted/50 p-1 rounded-xl">
            <TabsTrigger 
              value="vault" 
              className="flex-1 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              <Vault className="w-4 h-4 mr-2" />
              In Vault ({vaultTotals.loans})
            </TabsTrigger>
            <TabsTrigger 
              value="repledged"
              className="flex-1 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              <Package className="w-4 h-4 mr-2" />
              Repledged ({repledgeTotals.packets})
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Search */}
        <MobileSearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder={activeTab === 'vault' ? 'Search loans...' : 'Search packets...'}
        />

        {/* Content */}
        <div className="space-y-3">
          {isLoading ? (
            <div className="space-y-3">
              {Array(4).fill(0).map((_, i) => (
                <div key={i} className="h-28 rounded-2xl shimmer" />
              ))}
            </div>
          ) : activeTab === 'vault' ? (
            filteredVaultLoans.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center animate-fade-in">
                <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                  <Vault className="w-10 h-10 text-muted-foreground/50" />
                </div>
                <h3 className="text-lg font-semibold mb-1">No loans in vault</h3>
                <p className="text-sm text-muted-foreground">
                  {searchQuery ? 'Try a different search' : 'All gold is either repledged or no active loans'}
                </p>
              </div>
            ) : (
              filteredVaultLoans.map((loan, index) => {
                const weight = loan.gold_items?.reduce((sum, g) => sum + g.net_weight_grams, 0) || 0;
                const value = loan.gold_items?.reduce((sum, g) => sum + g.appraised_value, 0) || 0;
                
                return (
                  <div
                    key={loan.id}
                    className="animate-slide-up-fade"
                    style={{ animationDelay: `${index * 30}ms` }}
                  >
                    <MobileDataCard
                      title={loan.loan_number}
                      subtitle={loan.customer?.full_name || 'Unknown Customer'}
                      icon={<Vault className="w-5 h-5 text-amber-500" />}
                      badge={{ label: 'In Vault', variant: 'success' }}
                      onClick={() => { vibrateLight(); setSelectedLoan(loan); }}
                      accentColor="gold"
                      stats={[
                        { label: 'Weight', value: formatWeight(weight) },
                        { label: 'Principal', value: formatCurrency(loan.principal_amount).replace('₹', '₹') },
                      ]}
                    />
                  </div>
                );
              })
            )
          ) : (
            filteredPackets.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center animate-fade-in">
                <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                  <Package className="w-10 h-10 text-muted-foreground/50" />
                </div>
                <h3 className="text-lg font-semibold mb-1">No repledge packets</h3>
                <p className="text-sm text-muted-foreground">
                  {searchQuery ? 'Try a different search' : 'Create packets from the desktop version'}
                </p>
              </div>
            ) : (
              filteredPackets.map((packet, index) => (
                <div
                  key={packet.id}
                  className="animate-slide-up-fade"
                  style={{ animationDelay: `${index * 30}ms` }}
                >
                  <MobileDataCard
                    title={packet.packet_number}
                    subtitle={packet.bank?.bank_name || 'Unknown Bank'}
                    icon={<Package className="w-5 h-5 text-blue-500" />}
                    badge={{ 
                      label: packet.status === 'active' ? 'Active' : packet.status, 
                      variant: packet.status === 'active' ? 'success' : packet.status === 'redeemed' ? 'default' : 'warning' 
                    }}
                    onClick={() => { vibrateLight(); setSelectedPacket(packet); }}
                    accentColor={packet.status === 'active' ? 'success' : 'default'}
                    stats={[
                      { label: 'Loans', value: packet.total_loans },
                      { label: 'Weight', value: formatWeight(packet.total_gold_weight_grams) },
                      { label: 'Bank Loan', value: formatCurrency(packet.bank_loan_amount || 0).replace('₹', '₹') },
                    ]}
                  />
                </div>
              ))
            )
          )}
        </div>

        <div className="h-20" />
      </PullToRefreshContainer>

      {/* Loan Details Sheet */}
      <MobileBottomSheet
        isOpen={!!selectedLoan}
        onClose={() => setSelectedLoan(null)}
        title="Loan Details"
        snapPoints={['half']}
      >
        {selectedLoan && (
          <div className="p-4 space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 flex items-center justify-center">
                <Vault className="w-7 h-7 text-amber-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">{selectedLoan.loan_number}</h3>
                <p className="text-sm text-muted-foreground">{selectedLoan.customer?.full_name}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-muted/50 rounded-xl p-3">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Scale className="w-4 h-4" />
                  <span className="text-xs">Gold Weight</span>
                </div>
                <p className="font-bold">
                  {formatWeight(selectedLoan.gold_items?.reduce((sum, g) => sum + g.net_weight_grams, 0) || 0)}
                </p>
              </div>
              <div className="bg-muted/50 rounded-xl p-3">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <IndianRupee className="w-4 h-4" />
                  <span className="text-xs">Principal</span>
                </div>
                <p className="font-bold">{formatCurrency(selectedLoan.principal_amount)}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-muted/50 rounded-xl p-3">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Loan Date</p>
                <p className="font-medium">{format(new Date(selectedLoan.loan_date), 'dd MMM yyyy')}</p>
              </div>
            </div>

            <p className="text-xs text-muted-foreground text-center">
              To create repledge packets, use the desktop version.
            </p>
          </div>
        )}
      </MobileBottomSheet>

      {/* Packet Details Sheet */}
      <MobileBottomSheet
        isOpen={!!selectedPacket}
        onClose={() => setSelectedPacket(null)}
        title="Packet Details"
        snapPoints={['half', 'full']}
      >
        {selectedPacket && (
          <div className="p-4 space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 flex items-center justify-center">
                <Package className="w-7 h-7 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold">{selectedPacket.packet_number}</h3>
                <p className="text-sm text-muted-foreground">{selectedPacket.bank?.bank_name}</p>
              </div>
              <Badge
                className={cn(
                  selectedPacket.status === 'active' && 'bg-emerald-100 text-emerald-600',
                  selectedPacket.status === 'redeemed' && 'bg-muted'
                )}
              >
                {selectedPacket.status}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-muted/50 rounded-xl p-3">
                <p className="text-xs text-muted-foreground mb-1">Total Loans</p>
                <p className="text-xl font-bold">{selectedPacket.total_loans}</p>
              </div>
              <div className="bg-muted/50 rounded-xl p-3">
                <p className="text-xs text-muted-foreground mb-1">Gold Weight</p>
                <p className="text-xl font-bold">{formatWeight(selectedPacket.total_gold_weight_grams)}</p>
              </div>
              <div className="bg-muted/50 rounded-xl p-3">
                <p className="text-xs text-muted-foreground mb-1">Our Principal</p>
                <p className="font-bold">{formatCurrency(selectedPacket.total_principal)}</p>
              </div>
              <div className="bg-muted/50 rounded-xl p-3">
                <p className="text-xs text-muted-foreground mb-1">Bank Loan</p>
                <p className="font-bold text-blue-600">{formatCurrency(selectedPacket.bank_loan_amount || 0)}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-muted/50 rounded-xl p-3">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Packet Date</p>
                <p className="font-medium">{format(new Date(selectedPacket.packet_date), 'dd MMM yyyy')}</p>
              </div>
            </div>

            <p className="text-xs text-muted-foreground text-center">
              To manage or redeem packets, use the desktop version.
            </p>
          </div>
        )}
      </MobileBottomSheet>
    </MobileLayout>
  );
}
