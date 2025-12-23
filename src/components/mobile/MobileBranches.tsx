import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Building2, Phone, Mail, MapPin, Users } from 'lucide-react';
import MobileLayout from './MobileLayout';
import MobileGradientHeader from './MobileGradientHeader';
import PullToRefreshContainer from './PullToRefreshContainer';
import { MobileSearchBar, MobileBottomSheet, MobileDataCard } from './shared';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { vibrateLight } from '@/lib/haptics';
import { cn } from '@/lib/utils';

interface Branch {
  id: string;
  branch_code: string;
  branch_name: string;
  branch_type: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  is_active: boolean;
  created_at: string;
  client_id: string;
  clients?: {
    company_name: string;
    client_code: string;
  };
}

const BRANCH_TYPE_LABELS: Record<string, string> = {
  main_branch: 'Main Branch',
  company_owned: 'Company Owned',
  franchise: 'Franchise',
  tenant: 'Tenant',
};

const getBranchTypeBadgeVariant = (type: string): 'success' | 'warning' | 'error' | 'default' => {
  switch (type) {
    case 'main_branch':
      return 'warning';
    case 'company_owned':
      return 'success';
    case 'franchise':
      return 'success';
    default:
      return 'default';
  }
};

export default function MobileBranches() {
  const { client, isPlatformAdmin } = useAuth();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [filteredBranches, setFilteredBranches] = useState<Branch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);

  const filters = [
    { key: 'all', label: 'All', count: branches.length },
    { key: 'active', label: 'Active', count: branches.filter(b => b.is_active).length },
    { key: 'inactive', label: 'Inactive', count: branches.filter(b => !b.is_active).length },
  ];

  const fetchBranches = useCallback(async () => {
    try {
      let query = supabase
        .from('branches')
        .select('*, clients(company_name, client_code)')
        .order('created_at', { ascending: false });

      if (!isPlatformAdmin() && client) {
        query = query.eq('client_id', client.id);
      }

      const { data, error } = await query;
      if (error) throw error;
      setBranches(data || []);
    } catch (error) {
      console.error('Error fetching branches:', error);
      toast.error('Failed to load branches');
    } finally {
      setIsLoading(false);
    }
  }, [client, isPlatformAdmin]);

  useEffect(() => {
    fetchBranches();
  }, [fetchBranches]);

  const handleRefresh = useCallback(async () => {
    setIsLoading(true);
    await fetchBranches();
  }, [fetchBranches]);

  useEffect(() => {
    let filtered = [...branches];

    if (activeFilter === 'active') {
      filtered = filtered.filter(b => b.is_active);
    } else if (activeFilter === 'inactive') {
      filtered = filtered.filter(b => !b.is_active);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(b =>
        b.branch_name.toLowerCase().includes(query) ||
        b.branch_code.toLowerCase().includes(query) ||
        b.address?.toLowerCase().includes(query)
      );
    }

    setFilteredBranches(filtered);
  }, [branches, activeFilter, searchQuery]);

  return (
    <MobileLayout>
      <MobileGradientHeader title="Branches" variant="minimal" />

      <PullToRefreshContainer onRefresh={handleRefresh} className="px-4 py-4 space-y-4 animate-fade-in">
        <MobileSearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search by name, code, address..."
          filters={filters}
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
        />

        <div className="space-y-3">
          {isLoading ? (
            <div className="space-y-3">
              {Array(4).fill(0).map((_, i) => (
                <div key={i} className="h-24 rounded-2xl shimmer" />
              ))}
            </div>
          ) : filteredBranches.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center animate-fade-in">
              <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                <Building2 className="w-10 h-10 text-muted-foreground/50" />
              </div>
              <h3 className="text-lg font-semibold mb-1">
                {searchQuery ? 'No results found' : 'No branches yet'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {searchQuery ? 'Try a different search term' : 'Add branches from the desktop version'}
              </p>
            </div>
          ) : (
            filteredBranches.map((branch, index) => (
              <div
                key={branch.id}
                className="animate-slide-up-fade"
                style={{ animationDelay: `${index * 30}ms` }}
              >
                <MobileDataCard
                  title={branch.branch_name}
                  subtitle={branch.branch_code}
                  icon={<Building2 className="w-5 h-5 text-muted-foreground" />}
                  badge={{
                    label: BRANCH_TYPE_LABELS[branch.branch_type] || branch.branch_type,
                    variant: getBranchTypeBadgeVariant(branch.branch_type),
                  }}
                  onClick={() => { vibrateLight(); setSelectedBranch(branch); }}
                  accentColor={branch.is_active ? 'gold' : 'default'}
                >
                  <div className="space-y-1.5 text-sm text-muted-foreground mt-2">
                    {branch.address && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="truncate">{branch.address}</span>
                      </div>
                    )}
                    {branch.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5" />
                        <span>{branch.phone}</span>
                      </div>
                    )}
                  </div>
                </MobileDataCard>
              </div>
            ))
          )}
        </div>

        <div className="h-20" />
      </PullToRefreshContainer>

      {/* Branch Details Sheet */}
      <MobileBottomSheet
        isOpen={!!selectedBranch}
        onClose={() => setSelectedBranch(null)}
        title="Branch Details"
        snapPoints={['half', 'full']}
      >
        {selectedBranch && (
          <div className="p-4 space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 flex items-center justify-center">
                <Building2 className="w-8 h-8 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold">{selectedBranch.branch_name}</h3>
                <p className="text-sm text-muted-foreground">{selectedBranch.branch_code}</p>
              </div>
            </div>

            <div className="flex gap-2">
              <Badge
                variant="outline"
                className={cn(
                  'text-xs',
                  getBranchTypeBadgeVariant(selectedBranch.branch_type) === 'warning' && 'border-amber-300 text-amber-600 bg-amber-50',
                  getBranchTypeBadgeVariant(selectedBranch.branch_type) === 'success' && 'border-emerald-300 text-emerald-600 bg-emerald-50'
                )}
              >
                {BRANCH_TYPE_LABELS[selectedBranch.branch_type] || selectedBranch.branch_type}
              </Badge>
              <Badge
                variant={selectedBranch.is_active ? 'default' : 'secondary'}
                className={selectedBranch.is_active ? 'bg-emerald-100 text-emerald-600' : ''}
              >
                {selectedBranch.is_active ? 'Active' : 'Inactive'}
              </Badge>
            </div>

            <div className="space-y-3 bg-muted/50 rounded-xl p-4">
              {selectedBranch.address && (
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                  <span className="text-sm">{selectedBranch.address}</span>
                </div>
              )}
              {selectedBranch.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <a href={`tel:${selectedBranch.phone}`} className="text-sm text-primary">
                    {selectedBranch.phone}
                  </a>
                </div>
              )}
              {selectedBranch.email && (
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <a href={`mailto:${selectedBranch.email}`} className="text-sm text-primary">
                    {selectedBranch.email}
                  </a>
                </div>
              )}
              {isPlatformAdmin() && selectedBranch.clients && (
                <div className="flex items-center gap-3">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm">
                    {selectedBranch.clients.company_name} ({selectedBranch.clients.client_code})
                  </span>
                </div>
              )}
            </div>

            {selectedBranch.phone && (
              <a
                href={`tel:${selectedBranch.phone}`}
                className="flex items-center justify-center gap-2 w-full py-3 rounded-xl gradient-gold text-white font-medium tap-scale"
              >
                <Phone className="w-4 h-4" />
                Call Branch
              </a>
            )}

            <p className="text-xs text-muted-foreground text-center">
              To edit branch details, use the desktop version.
            </p>
          </div>
        )}
      </MobileBottomSheet>
    </MobileLayout>
  );
}
