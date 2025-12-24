import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Search, Building2, ChevronRight, Loader2 } from 'lucide-react';
import { UserRightsSheet } from '@/components/settings/UserRightsSheet';
import { ClientRightsSheet } from '@/components/settings/ClientRightsSheet';
import { PermissionMatrix } from '@/components/settings/PermissionMatrix';
import { SettingsSidebar, SettingsSection } from '@/components/settings/SettingsSidebar';
import { GeneralPrintSettings } from '@/components/print/GeneralPrintSettings';
import { DocumentsSettings } from '@/components/print/DocumentsSettings';
import { TermsConditionsSettings } from '@/components/print/TermsConditionsSettings';
import { EditableContentSettings } from '@/components/print/EditableContentSettings';
import { HeaderFooterSettings } from '@/components/print/HeaderFooterSettings';
import { TemplatesTab } from '@/components/print/TemplatesTab';
import { BranchPrintSettingsTab } from '@/components/print/BranchPrintSettingsTab';
import { MODULE_KEYS } from '@/lib/modules';

interface UserProfile {
  id: string;
  user_id: string;
  full_name: string;
  email: string | null;
  branch_id: string | null;
  branch: { branch_name: string } | null;
  roles: { role: string }[];
  permissions_count?: number;
}

interface ClientData {
  id: string;
  client_code: string;
  company_name: string;
  plan_name: string | null;
  max_branches: number | null;
  max_users: number | null;
  is_active: boolean | null;
  modules_count?: number;
}

export default function Settings() {
  const { client, isPlatformAdmin, hasRole } = useAuth();
  const [activeSection, setActiveSection] = useState<SettingsSection>('user-rights');
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [clients, setClients] = useState<ClientData[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingClients, setLoadingClients] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [selectedClient, setSelectedClient] = useState<ClientData | null>(null);
  const [userSheetOpen, setUserSheetOpen] = useState(false);
  const [clientSheetOpen, setClientSheetOpen] = useState(false);

  const canManageUserRights = isPlatformAdmin() || hasRole('super_admin') || hasRole('tenant_admin');
  const canManageClientRights = isPlatformAdmin() || hasRole('super_admin');

  useEffect(() => {
    if (canManageUserRights) {
      fetchUsers();
    }
    if (canManageClientRights) {
      fetchClients();
    }
  }, [canManageUserRights, canManageClientRights]);

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      let query = supabase
        .from('profiles')
        .select(`
          id,
          user_id,
          full_name,
          email,
          branch_id,
          branch:branches(branch_name)
        `)
        .order('full_name');

      if (!isPlatformAdmin() && client?.id) {
        query = query.eq('client_id', client.id);
      }

      const { data: profiles, error } = await query;

      if (error) throw error;

      const usersWithRoles = await Promise.all(
        (profiles || []).map(async (profile) => {
          const { data: roles } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', profile.user_id);

          const { count } = await supabase
            .from('user_permissions')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', profile.user_id)
            .eq('is_enabled', true);

          return {
            ...profile,
            roles: roles || [],
            permissions_count: count || MODULE_KEYS.length,
          };
        })
      );

      setUsers(usersWithRoles);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoadingUsers(false);
    }
  };

  const fetchClients = async () => {
    setLoadingClients(true);
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('id, client_code, company_name, plan_name, max_branches, max_users, is_active')
        .order('company_name');

      if (error) throw error;

      const clientsWithModules = await Promise.all(
        (data || []).map(async (c) => {
          const { count } = await supabase
            .from('client_modules')
            .select('*', { count: 'exact', head: true })
            .eq('client_id', c.id)
            .eq('is_enabled', true);

          return {
            ...c,
            modules_count: count || MODULE_KEYS.length,
          };
        })
      );

      setClients(clientsWithModules);
    } catch (error) {
      console.error('Error fetching clients:', error);
    } finally {
      setLoadingClients(false);
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getRoleBadge = (roles: { role: string }[]) => {
    if (!roles || roles.length === 0) return 'User';
    const roleMap: Record<string, string> = {
      super_admin: 'Super Admin',
      moderator: 'Moderator',
      tenant_admin: 'Admin',
      branch_manager: 'Branch Mgr',
      loan_officer: 'Loan Officer',
      appraiser: 'Appraiser',
      collection_agent: 'Collection',
      auditor: 'Auditor',
    };
    return roleMap[roles[0].role] || roles[0].role;
  };

  const filteredUsers = users.filter(user =>
    user.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredClients = clients.filter(c =>
    c.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.client_code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderContent = () => {
    switch (activeSection) {
      case 'user-rights':
        return (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>User Rights</CardTitle>
                <CardDescription>Control which modules each user can access</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 mb-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by name or email..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>

                {loadingUsers ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12">#</TableHead>
                          <TableHead>Name</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Access Level</TableHead>
                          <TableHead className="w-12"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredUsers.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                              No users found
                            </TableCell>
                          </TableRow>
                        ) : (
                          filteredUsers.map((user, index) => (
                            <TableRow
                              key={user.id}
                              className="cursor-pointer hover:bg-muted/50"
                              onClick={() => {
                                setSelectedUser(user);
                                setUserSheetOpen(true);
                              }}
                            >
                              <TableCell className="text-muted-foreground">{index + 1}</TableCell>
                              <TableCell>
                                <div className="flex items-center gap-3">
                                  <Avatar className="h-8 w-8">
                                    <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                      {getInitials(user.full_name)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <p className="font-medium">{user.full_name}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {user.branch?.branch_name || 'No branch'}
                                    </p>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant="secondary">{getRoleBadge(user.roles)}</Badge>
                              </TableCell>
                              <TableCell>
                                <span className="text-sm">
                                  {user.permissions_count === MODULE_KEYS.length
                                    ? 'Full Access'
                                    : `Custom (${user.permissions_count}/${MODULE_KEYS.length})`}
                                </span>
                              </TableCell>
                              <TableCell>
                                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
            <PermissionMatrix />
          </div>
        );

      case 'client-rights':
        return (
          <Card>
            <CardHeader>
              <CardTitle>Client Rights</CardTitle>
              <CardDescription>Control which modules are available for each client/tenant</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by company name or code..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              {loadingClients ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Code</TableHead>
                        <TableHead>Company Name</TableHead>
                        <TableHead>Plan</TableHead>
                        <TableHead>Active Modules</TableHead>
                        <TableHead className="w-12"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredClients.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                            No clients found
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredClients.map((c) => (
                          <TableRow
                            key={c.id}
                            className="cursor-pointer hover:bg-muted/50"
                            onClick={() => {
                              setSelectedClient(c);
                              setClientSheetOpen(true);
                            }}
                          >
                            <TableCell>
                              <Badge variant="outline">{c.client_code}</Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center">
                                  <Building2 className="h-4 w-4 text-primary" />
                                </div>
                                <span className="font-medium">{c.company_name}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="secondary">{c.plan_name || 'Growth'}</Badge>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm">
                                {c.modules_count === MODULE_KEYS.length
                                  ? `All ${MODULE_KEYS.length}`
                                  : `${c.modules_count}/${MODULE_KEYS.length}`}
                              </span>
                            </TableCell>
                            <TableCell>
                              <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        );

      case 'print-general':
        return <GeneralPrintSettings />;
      case 'print-documents':
        return <DocumentsSettings />;
      case 'print-terms':
        return <TermsConditionsSettings />;
      case 'print-content':
        return <EditableContentSettings />;
      case 'print-header-footer':
        return <HeaderFooterSettings />;
      case 'print-templates':
        return <TemplatesTab />;
      case 'print-branches':
        return <BranchPrintSettingsTab />;
      default:
        return null;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-muted-foreground">Manage user rights, client modules, and print configuration</p>
        </div>

        <div className="flex border rounded-lg bg-background overflow-hidden min-h-[600px]">
          <SettingsSidebar
            activeSection={activeSection}
            onSectionChange={setActiveSection}
            showClientRights={canManageClientRights}
          />
          <div className="flex-1 p-6 overflow-auto">
            {renderContent()}
          </div>
        </div>
      </div>

      <UserRightsSheet
        open={userSheetOpen}
        onOpenChange={setUserSheetOpen}
        user={selectedUser}
        onSave={() => fetchUsers()}
      />

      <ClientRightsSheet
        open={clientSheetOpen}
        onOpenChange={setClientSheetOpen}
        client={selectedClient}
        onSave={() => fetchClients()}
      />
    </DashboardLayout>
  );
}
