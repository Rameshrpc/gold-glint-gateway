import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Users as UsersIcon, Plus, Loader2, Search, Edit, Shield } from 'lucide-react';
import { toast } from 'sonner';

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

interface Client {
  id: string;
  client_code: string;
  company_name: string;
}

interface Branch {
  id: string;
  branch_code: string;
  branch_name: string;
}

const ALL_ROLES: { value: AppRole; label: string; platformOnly?: boolean }[] = [
  { value: 'super_admin', label: 'Super Admin', platformOnly: true },
  { value: 'moderator', label: 'Moderator', platformOnly: true },
  { value: 'tenant_admin', label: 'Tenant Admin' },
  { value: 'branch_manager', label: 'Branch Manager' },
  { value: 'loan_officer', label: 'Loan Officer' },
  { value: 'appraiser', label: 'Appraiser' },
  { value: 'collection_agent', label: 'Collection Agent' },
  { value: 'auditor', label: 'Auditor' },
];

export default function Users() {
  const { isPlatformAdmin, hasRole, client: currentClient } = useAuth();
  const [users, setUsers] = useState<UserWithRoles[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [rolesDialogOpen, setRolesDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserWithRoles | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterClientId, setFilterClientId] = useState<string>('all');

  // Form state
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [selectedClientId, setSelectedClientId] = useState('');
  const [selectedBranchId, setSelectedBranchId] = useState('');
  const [selectedRoles, setSelectedRoles] = useState<AppRole[]>(['loan_officer']);
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    fetchUsers();
    if (isPlatformAdmin()) {
      fetchClients();
    }
  }, [filterClientId]);

  useEffect(() => {
    if (selectedClientId) {
      fetchBranches(selectedClientId);
    }
  }, [selectedClientId]);

  const fetchClients = async () => {
    const { data } = await supabase
      .from('clients')
      .select('id, client_code, company_name')
      .eq('is_active', true)
      .order('company_name');
    setClients(data || []);
  };

  const fetchBranches = async (clientId: string) => {
    const { data } = await supabase
      .from('branches')
      .select('id, branch_code, branch_name')
      .eq('client_id', clientId)
      .eq('is_active', true)
      .order('branch_name');
    setBranches(data || []);
  };

  const fetchUsers = async () => {
    try {
      let query = supabase
        .from('profiles')
        .select(`
          *,
          clients:client_id(company_name, client_code),
          branches:branch_id(branch_name)
        `)
        .order('created_at', { ascending: false });

      // If tenant admin, only show users from their client
      if (!isPlatformAdmin() && currentClient) {
        query = query.eq('client_id', currentClient.id);
      } else if (filterClientId && filterClientId !== 'all') {
        query = query.eq('client_id', filterClientId);
      }

      const { data: profilesData, error: profilesError } = await query;

      if (profilesError) throw profilesError;

      // Fetch roles for all users
      const userIds = profilesData?.map(p => p.user_id) || [];
      const { data: rolesData } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .in('user_id', userIds);

      // Combine profiles with roles
      const usersWithRoles: UserWithRoles[] = (profilesData || []).map(profile => ({
        ...profile,
        roles: rolesData?.filter(r => r.user_id === profile.user_id).map(r => r.role as AppRole) || [],
      }));

      setUsers(usersWithRoles);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    }
    setLoading(false);
  };

  const resetForm = () => {
    setFullName('');
    setEmail('');
    setPhone('');
    setPassword('');
    setSelectedClientId(currentClient?.id || '');
    setSelectedBranchId('');
    setSelectedRoles(['loan_officer']);
    setIsActive(true);
    setEditingUser(null);
  };

  const openEditDialog = (user: UserWithRoles) => {
    setEditingUser(user);
    setFullName(user.full_name);
    setEmail(user.email || '');
    setPhone(user.phone || '');
    setSelectedClientId(user.client_id);
    setSelectedBranchId(user.branch_id || '');
    setIsActive(user.is_active);
    setDialogOpen(true);
  };

  const openRolesDialog = (user: UserWithRoles) => {
    setEditingUser(user);
    setSelectedRoles(user.roles);
    setRolesDialogOpen(true);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Create auth user first
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('Failed to create user');

      // Create profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          user_id: authData.user.id,
          client_id: selectedClientId,
          branch_id: selectedBranchId || null,
          full_name: fullName,
          email: email,
          phone: phone || null,
          is_active: isActive,
        });

      if (profileError) throw profileError;

      // Assign roles
      const roleInserts = selectedRoles.map(role => ({
        user_id: authData.user!.id,
        role,
      }));

      const { error: rolesError } = await supabase
        .from('user_roles')
        .insert(roleInserts);

      if (rolesError) throw rolesError;

      toast.success('User created successfully');
      setDialogOpen(false);
      resetForm();
      fetchUsers();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create user');
    }
    setSubmitting(false);
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setSubmitting(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          phone: phone || null,
          branch_id: selectedBranchId || null,
          is_active: isActive,
        })
        .eq('id', editingUser.id);

      if (error) throw error;

      toast.success('User updated successfully');
      setDialogOpen(false);
      resetForm();
      fetchUsers();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update user');
    }
    setSubmitting(false);
  };

  const handleUpdateRoles = async () => {
    if (!editingUser) return;
    setSubmitting(true);

    try {
      // Delete existing roles
      await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', editingUser.user_id);

      // Insert new roles
      if (selectedRoles.length > 0) {
        const roleInserts = selectedRoles.map(role => ({
          user_id: editingUser.user_id,
          role,
        }));

        const { error } = await supabase
          .from('user_roles')
          .insert(roleInserts);

        if (error) throw error;
      }

      toast.success('Roles updated successfully');
      setRolesDialogOpen(false);
      setEditingUser(null);
      fetchUsers();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update roles');
    }
    setSubmitting(false);
  };

  const toggleUserStatus = async (user: UserWithRoles) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: !user.is_active })
        .eq('id', user.id);

      if (error) throw error;
      toast.success(`User ${!user.is_active ? 'activated' : 'deactivated'}`);
      fetchUsers();
    } catch (error) {
      toast.error('Failed to update user status');
    }
  };

  const availableRoles = ALL_ROLES.filter(role => {
    if (role.platformOnly && !isPlatformAdmin()) return false;
    return true;
  });

  const filteredUsers = users.filter(
    (user) =>
      user.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getRoleBadgeVariant = (role: AppRole) => {
    switch (role) {
      case 'super_admin':
        return 'destructive';
      case 'moderator':
        return 'destructive';
      case 'tenant_admin':
        return 'default';
      case 'branch_manager':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Users</h1>
            <p className="text-muted-foreground">Manage user accounts and roles</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="bg-amber-600 hover:bg-amber-700">
                <Plus className="h-4 w-4 mr-2" />
                Add User
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>{editingUser ? 'Edit User' : 'Add New User'}</DialogTitle>
                <DialogDescription>
                  {editingUser ? 'Update user details' : 'Create a new user account'}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={editingUser ? handleUpdateUser : handleCreateUser} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name *</Label>
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Full name"
                    required
                  />
                </div>
                {!editingUser && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="user@company.com"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Password *</Label>
                      <Input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        minLength={6}
                      />
                    </div>
                  </>
                )}
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 9876543210"
                  />
                </div>
                {isPlatformAdmin() && !editingUser && (
                  <div className="space-y-2">
                    <Label htmlFor="client">Client *</Label>
                    <Select value={selectedClientId} onValueChange={setSelectedClientId} required>
                      <SelectTrigger>
                        <SelectValue placeholder="Select client" />
                      </SelectTrigger>
                      <SelectContent>
                        {clients.map((client) => (
                          <SelectItem key={client.id} value={client.id}>
                            {client.company_name} ({client.client_code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                {(selectedClientId || editingUser) && (
                  <div className="space-y-2">
                    <Label htmlFor="branch">Branch</Label>
                    <Select value={selectedBranchId} onValueChange={setSelectedBranchId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select branch (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        {branches.map((branch) => (
                          <SelectItem key={branch.id} value={branch.id}>
                            {branch.branch_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                {!editingUser && (
                  <div className="space-y-2">
                    <Label>Roles *</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {availableRoles.map((role) => (
                        <div key={role.value} className="flex items-center space-x-2">
                          <Checkbox
                            id={role.value}
                            checked={selectedRoles.includes(role.value)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedRoles([...selectedRoles, role.value]);
                              } else {
                                setSelectedRoles(selectedRoles.filter(r => r !== role.value));
                              }
                            }}
                          />
                          <Label htmlFor={role.value} className="text-sm font-normal">
                            {role.label}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <Label htmlFor="isActive">Active Status</Label>
                  <Switch
                    id="isActive"
                    checked={isActive}
                    onCheckedChange={setIsActive}
                  />
                </div>
                <div className="flex gap-2 pt-4">
                  <Button type="button" variant="outline" className="flex-1" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="flex-1 bg-amber-600 hover:bg-amber-700" disabled={submitting}>
                    {submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                    {editingUser ? 'Update' : 'Create'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          {isPlatformAdmin() && (
            <Select value={filterClientId} onValueChange={setFilterClientId}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by client" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Clients</SelectItem>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.company_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Roles Dialog */}
        <Dialog open={rolesDialogOpen} onOpenChange={(open) => { setRolesDialogOpen(open); if (!open) setEditingUser(null); }}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Manage Roles</DialogTitle>
              <DialogDescription>
                Update roles for {editingUser?.full_name}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                {availableRoles.map((role) => (
                  <div key={role.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`role-${role.value}`}
                      checked={selectedRoles.includes(role.value)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedRoles([...selectedRoles, role.value]);
                        } else {
                          setSelectedRoles(selectedRoles.filter(r => r !== role.value));
                        }
                      }}
                    />
                    <Label htmlFor={`role-${role.value}`} className="text-sm font-normal">
                      {role.label}
                    </Label>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 pt-4">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setRolesDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleUpdateRoles} className="flex-1 bg-amber-600 hover:bg-amber-700" disabled={submitting}>
                  {submitting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Save Roles
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
          </div>
        ) : filteredUsers.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <UsersIcon className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Users Found</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery ? 'No users match your search.' : 'Get started by creating your first user.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead className="hidden md:table-cell">Email</TableHead>
                  {isPlatformAdmin() && <TableHead className="hidden lg:table-cell">Client</TableHead>}
                  <TableHead className="hidden sm:table-cell">Branch</TableHead>
                  <TableHead>Roles</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.full_name}</TableCell>
                    <TableCell className="hidden md:table-cell">{user.email || '-'}</TableCell>
                    {isPlatformAdmin() && (
                      <TableCell className="hidden lg:table-cell">
                        {user.clients?.company_name || '-'}
                      </TableCell>
                    )}
                    <TableCell className="hidden sm:table-cell">
                      {user.branches?.branch_name || '-'}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {user.roles.slice(0, 2).map((role) => (
                          <Badge key={role} variant={getRoleBadgeVariant(role)} className="text-xs">
                            {role.replace('_', ' ')}
                          </Badge>
                        ))}
                        {user.roles.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{user.roles.length - 2}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={user.is_active ? 'default' : 'secondary'}>
                        {user.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openRolesDialog(user)}
                          title="Manage roles"
                        >
                          <Shield className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(user)}
                          title="Edit user"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Switch
                          checked={user.is_active}
                          onCheckedChange={() => toggleUserStatus(user)}
                        />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}