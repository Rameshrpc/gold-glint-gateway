import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Users as UsersIcon, Plus, Phone, Mail, Building2, Shield, UserCheck, UserX } from 'lucide-react';
import MobileLayout from './MobileLayout';
import MobileGradientHeader from './MobileGradientHeader';
import PullToRefreshContainer from './PullToRefreshContainer';
import { MobileSearchBar, MobileBottomSheet, MobileDataCard } from './shared';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { vibrateLight } from '@/lib/haptics';
import { cn } from '@/lib/utils';

type AppRole = 'super_admin' | 'moderator' | 'tenant_admin' | 'branch_manager' | 'loan_officer' | 'appraiser' | 'collection_agent' | 'auditor';

interface UserProfile {
  id: string;
  user_id: string;
  client_id: string;
  branch_id: string | null;
  full_name: string;
  email: string | null;
  phone: string | null;
  is_active: boolean;
  created_at: string;
  clients?: { company_name: string; client_code: string };
  branches?: { branch_name: string } | null;
}

interface UserWithRoles extends UserProfile {
  roles: AppRole[];
}

const ROLE_LABELS: Record<AppRole, string> = {
  super_admin: 'Super Admin',
  moderator: 'Moderator',
  tenant_admin: 'Tenant Admin',
  branch_manager: 'Branch Manager',
  loan_officer: 'Loan Officer',
  appraiser: 'Appraiser',
  collection_agent: 'Collection Agent',
  auditor: 'Auditor',
};

const getRoleBadgeVariant = (role: AppRole): 'success' | 'warning' | 'error' | 'default' => {
  switch (role) {
    case 'super_admin':
    case 'moderator':
      return 'error';
    case 'tenant_admin':
      return 'warning';
    case 'branch_manager':
      return 'success';
    default:
      return 'default';
  }
};

export default function MobileUsers() {
  const { isPlatformAdmin, hasRole, client: currentClient } = useAuth();
  const [users, setUsers] = useState<UserWithRoles[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserWithRoles[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState<UserWithRoles | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const filters = [
    { key: 'all', label: 'All', count: users.length },
    { key: 'active', label: 'Active', count: users.filter(u => u.is_active).length },
    { key: 'inactive', label: 'Inactive', count: users.filter(u => !u.is_active).length },
  ];

  const fetchUsers = useCallback(async () => {
    try {
      let query = supabase
        .from('profiles')
        .select(`
          *,
          clients:client_id(company_name, client_code),
          branches:branch_id(branch_name)
        `)
        .order('created_at', { ascending: false });

      if (!isPlatformAdmin() && currentClient) {
        query = query.eq('client_id', currentClient.id);
      }

      const { data: profilesData, error: profilesError } = await query;
      if (profilesError) throw profilesError;

      const userIds = profilesData?.map(p => p.user_id) || [];
      const { data: rolesData } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .in('user_id', userIds);

      const usersWithRoles: UserWithRoles[] = (profilesData || []).map(profile => ({
        ...profile,
        roles: rolesData?.filter(r => r.user_id === profile.user_id).map(r => r.role as AppRole) || [],
      }));

      setUsers(usersWithRoles);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    } finally {
      setIsLoading(false);
    }
  }, [isPlatformAdmin, currentClient]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleRefresh = useCallback(async () => {
    setIsLoading(true);
    await fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    let filtered = [...users];

    if (activeFilter === 'active') {
      filtered = filtered.filter(u => u.is_active);
    } else if (activeFilter === 'inactive') {
      filtered = filtered.filter(u => !u.is_active);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(u =>
        u.full_name.toLowerCase().includes(query) ||
        u.email?.toLowerCase().includes(query) ||
        u.phone?.includes(query)
      );
    }

    setFilteredUsers(filtered);
  }, [users, activeFilter, searchQuery]);

  const toggleUserStatus = async (user: UserWithRoles) => {
    vibrateLight();
    setUpdatingStatus(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: !user.is_active })
        .eq('id', user.id);

      if (error) throw error;
      toast.success(`User ${!user.is_active ? 'activated' : 'deactivated'}`);
      fetchUsers();
      setSelectedUser(prev => prev ? { ...prev, is_active: !prev.is_active } : null);
    } catch (error) {
      toast.error('Failed to update user status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  return (
    <MobileLayout>
      <MobileGradientHeader title="Users" variant="minimal" />

      <PullToRefreshContainer onRefresh={handleRefresh} className="px-4 py-4 space-y-4 animate-fade-in">
        <MobileSearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search by name, email, phone..."
          filters={filters}
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
        />

        <div className="space-y-3">
          {isLoading ? (
            <div className="space-y-3">
              {Array(4).fill(0).map((_, i) => (
                <div key={i} className="h-28 rounded-2xl shimmer" />
              ))}
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center animate-fade-in">
              <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                <UsersIcon className="w-10 h-10 text-muted-foreground/50" />
              </div>
              <h3 className="text-lg font-semibold mb-1">
                {searchQuery ? 'No results found' : 'No users yet'}
              </h3>
              <p className="text-sm text-muted-foreground">
                {searchQuery ? 'Try a different search term' : 'Add users from the desktop version'}
              </p>
            </div>
          ) : (
            filteredUsers.map((user, index) => (
              <div
                key={user.id}
                className="animate-slide-up-fade"
                style={{ animationDelay: `${index * 30}ms` }}
              >
                <MobileDataCard
                  title={user.full_name}
                  subtitle={user.email || 'No email'}
                  icon={<UsersIcon className="w-5 h-5 text-muted-foreground" />}
                  badge={{
                    label: user.is_active ? 'Active' : 'Inactive',
                    variant: user.is_active ? 'success' : 'default',
                  }}
                  onClick={() => { vibrateLight(); setSelectedUser(user); }}
                  accentColor={user.is_active ? 'gold' : 'default'}
                >
                  <div className="space-y-2 mt-2">
                    {user.phone && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone className="w-3.5 h-3.5" />
                        <span>{user.phone}</span>
                      </div>
                    )}
                    {user.branches?.branch_name && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Building2 className="w-3.5 h-3.5" />
                        <span>{user.branches.branch_name}</span>
                      </div>
                    )}
                    <div className="flex flex-wrap gap-1 mt-2">
                      {user.roles.slice(0, 2).map(role => (
                        <Badge
                          key={role}
                          variant="outline"
                          className={cn(
                            'text-[10px] px-1.5 py-0.5',
                            getRoleBadgeVariant(role) === 'error' && 'border-red-300 text-red-600',
                            getRoleBadgeVariant(role) === 'warning' && 'border-amber-300 text-amber-600',
                            getRoleBadgeVariant(role) === 'success' && 'border-emerald-300 text-emerald-600'
                          )}
                        >
                          {ROLE_LABELS[role]}
                        </Badge>
                      ))}
                      {user.roles.length > 2 && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0.5">
                          +{user.roles.length - 2}
                        </Badge>
                      )}
                    </div>
                  </div>
                </MobileDataCard>
              </div>
            ))
          )}
        </div>

        <div className="h-20" />
      </PullToRefreshContainer>

      {/* User Details Sheet */}
      <MobileBottomSheet
        isOpen={!!selectedUser}
        onClose={() => setSelectedUser(null)}
        title="User Details"
        snapPoints={['half', 'full']}
      >
        {selectedUser && (
          <div className="p-4 space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                <UsersIcon className="w-8 h-8 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold">{selectedUser.full_name}</h3>
                <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
              </div>
              <div className={cn(
                'px-3 py-1 rounded-full text-xs font-semibold',
                selectedUser.is_active 
                  ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'
                  : 'bg-muted text-muted-foreground'
              )}>
                {selectedUser.is_active ? 'Active' : 'Inactive'}
              </div>
            </div>

            <div className="space-y-3 bg-muted/50 rounded-xl p-4">
              {selectedUser.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <span>{selectedUser.phone}</span>
                </div>
              )}
              {selectedUser.email && (
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <span>{selectedUser.email}</span>
                </div>
              )}
              {selectedUser.branches?.branch_name && (
                <div className="flex items-center gap-3">
                  <Building2 className="w-4 h-4 text-muted-foreground" />
                  <span>{selectedUser.branches.branch_name}</span>
                </div>
              )}
              {isPlatformAdmin() && selectedUser.clients && (
                <div className="flex items-center gap-3">
                  <Building2 className="w-4 h-4 text-muted-foreground" />
                  <span>{selectedUser.clients.company_name} ({selectedUser.clients.client_code})</span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <h4 className="font-medium flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Roles
              </h4>
              <div className="flex flex-wrap gap-2">
                {selectedUser.roles.map(role => (
                  <Badge
                    key={role}
                    variant="outline"
                    className={cn(
                      'text-xs px-2 py-1',
                      getRoleBadgeVariant(role) === 'error' && 'border-red-300 text-red-600 bg-red-50',
                      getRoleBadgeVariant(role) === 'warning' && 'border-amber-300 text-amber-600 bg-amber-50',
                      getRoleBadgeVariant(role) === 'success' && 'border-emerald-300 text-emerald-600 bg-emerald-50'
                    )}
                  >
                    {ROLE_LABELS[role]}
                  </Badge>
                ))}
                {selectedUser.roles.length === 0 && (
                  <span className="text-sm text-muted-foreground">No roles assigned</span>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between bg-muted/50 rounded-xl p-4">
              <div className="flex items-center gap-3">
                {selectedUser.is_active ? (
                  <UserCheck className="w-5 h-5 text-emerald-500" />
                ) : (
                  <UserX className="w-5 h-5 text-muted-foreground" />
                )}
                <div>
                  <p className="font-medium">Account Status</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedUser.is_active ? 'User can access the system' : 'User is disabled'}
                  </p>
                </div>
              </div>
              <Switch
                checked={selectedUser.is_active}
                onCheckedChange={() => toggleUserStatus(selectedUser)}
                disabled={updatingStatus}
              />
            </div>

            <p className="text-xs text-muted-foreground text-center">
              To edit user details or manage roles, use the desktop version.
            </p>
          </div>
        )}
      </MobileBottomSheet>
    </MobileLayout>
  );
}
