import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
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
import { Badge } from '@/components/ui/badge';
import { Plus, Building, Loader2, Filter, Edit, Trash2, UserPlus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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

interface Client {
  id: string;
  client_code: string;
  company_name: string;
}

interface UserProfile {
  user_id: string;
  full_name: string;
  email: string | null;
  branch_id: string | null;
}

export default function Branches() {
  const { client, isPlatformAdmin, hasRole } = useAuth();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Edit/Delete state
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [branchToDelete, setBranchToDelete] = useState<Branch | null>(null);

  // Manager assignment state
  const [managerDialogOpen, setManagerDialogOpen] = useState(false);
  const [selectedBranchForManager, setSelectedBranchForManager] = useState<Branch | null>(null);
  const [availableManagers, setAvailableManagers] = useState<UserProfile[]>([]);
  const [currentManager, setCurrentManager] = useState<UserProfile | null>(null);
  const [selectedManagerId, setSelectedManagerId] = useState<string>('');
  const [loadingManagers, setLoadingManagers] = useState(false);

  // Filter state for platform admins
  const [filterClientId, setFilterClientId] = useState<string>('all');

  // Form state
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [branchCode, setBranchCode] = useState('');
  const [branchName, setBranchName] = useState('');
  const [branchType, setBranchType] = useState<string>('main_branch');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  const isAdmin = isPlatformAdmin();
  const canManageBranches = isAdmin || hasRole('tenant_admin');

  // Fetch clients for platform admins
  const fetchClients = async () => {
    const { data, error } = await supabase
      .from('clients')
      .select('id, client_code, company_name')
      .eq('is_active', true)
      .order('company_name');

    if (!error && data) {
      setClients(data);
    }
  };

  const fetchBranches = async () => {
    setLoading(true);
    
    let query = supabase
      .from('branches')
      .select('*, clients(company_name, client_code)')
      .order('created_at', { ascending: false });

    // Platform admins can see all or filter by client
    if (isAdmin) {
      if (filterClientId !== 'all') {
        query = query.eq('client_id', filterClientId);
      }
    } else if (client) {
      // Non-admins only see their client's branches
      query = query.eq('client_id', client.id);
    } else {
      setBranches([]);
      setLoading(false);
      return;
    }

    const { data, error } = await query;

    if (error) {
      toast.error('Failed to fetch branches');
    } else {
      setBranches(data as Branch[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (isAdmin) {
      fetchClients();
    }
  }, [isAdmin]);

  useEffect(() => {
    fetchBranches();
  }, [client, filterClientId, isAdmin]);

  const openEditDialog = (branch: Branch) => {
    setEditingBranch(branch);
    setSelectedClientId(branch.client_id);
    setBranchCode(branch.branch_code);
    setBranchName(branch.branch_name);
    setBranchType(branch.branch_type);
    setAddress(branch.address || '');
    setPhone(branch.phone || '');
    setEmail(branch.email || '');
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Determine which client_id to use
    const targetClientId = isAdmin ? selectedClientId : client?.id;
    
    if (!targetClientId) {
      toast.error(isAdmin ? 'Please select a client' : 'No client associated');
      return;
    }

    setSaving(true);

    if (editingBranch) {
      // Update existing branch
      const { error } = await supabase
        .from('branches')
        .update({
          branch_code: branchCode.toUpperCase(),
          branch_name: branchName,
          branch_type: branchType as 'main_branch' | 'company_owned' | 'franchise' | 'tenant',
          address: address || null,
          phone: phone || null,
          email: email || null,
        })
        .eq('id', editingBranch.id);

      if (error) {
        if (error.code === '23505') {
          toast.error('Branch code already exists');
        } else {
          toast.error('Failed to update branch');
        }
      } else {
        toast.success('Branch updated successfully');
        setDialogOpen(false);
        resetForm();
        fetchBranches();
      }
    } else {
      // Create new branch
      const { error } = await supabase
        .from('branches')
        .insert([{
          client_id: targetClientId,
          branch_code: branchCode.toUpperCase(),
          branch_name: branchName,
          branch_type: branchType as 'main_branch' | 'company_owned' | 'franchise' | 'tenant',
          address: address || null,
          phone: phone || null,
          email: email || null,
        }]);

      if (error) {
        if (error.code === '23505') {
          toast.error('Branch code already exists');
        } else {
          toast.error('Failed to create branch');
        }
      } else {
        toast.success('Branch created successfully');
        setDialogOpen(false);
        resetForm();
        fetchBranches();
      }
    }
    setSaving(false);
  };

  const handleDeleteBranch = async () => {
    if (!branchToDelete) return;

    const { error } = await supabase
      .from('branches')
      .update({ is_active: false })
      .eq('id', branchToDelete.id);

    if (error) {
      toast.error('Failed to deactivate branch');
    } else {
      toast.success('Branch deactivated successfully');
      fetchBranches();
    }
    setDeleteDialogOpen(false);
    setBranchToDelete(null);
  };

  const openDeleteDialog = (branch: Branch) => {
    setBranchToDelete(branch);
    setDeleteDialogOpen(true);
  };

  // Branch Manager Assignment
  const fetchBranchManagerData = async (branch: Branch) => {
    setLoadingManagers(true);
    setSelectedBranchForManager(branch);
    setManagerDialogOpen(true);

    // Fetch current manager (user assigned to this branch with branch_manager role)
    const { data: currentManagerData } = await supabase
      .from('profiles')
      .select('user_id, full_name, email, branch_id')
      .eq('branch_id', branch.id)
      .maybeSingle();

    setCurrentManager(currentManagerData as UserProfile | null);

    // Fetch all users with branch_manager role in the same client
    const { data: managerProfiles } = await supabase
      .from('profiles')
      .select('user_id, full_name, email, branch_id')
      .eq('client_id', branch.client_id);

    if (managerProfiles) {
      // Filter to get users who have branch_manager role
      const { data: managerRoles } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'branch_manager');

      const managerUserIds = new Set(managerRoles?.map(r => r.user_id) || []);
      const filteredManagers = managerProfiles.filter(p => managerUserIds.has(p.user_id));
      setAvailableManagers(filteredManagers as UserProfile[]);
    }

    setSelectedManagerId(currentManagerData?.user_id || '');
    setLoadingManagers(false);
  };

  const handleAssignManager = async () => {
    if (!selectedBranchForManager) return;

    setSaving(true);

    // First, unassign current manager if any
    if (currentManager) {
      await supabase
        .from('profiles')
        .update({ branch_id: null })
        .eq('user_id', currentManager.user_id);
    }

    // Assign new manager if selected
    if (selectedManagerId) {
      const { error } = await supabase
        .from('profiles')
        .update({ branch_id: selectedBranchForManager.id })
        .eq('user_id', selectedManagerId);

      if (error) {
        toast.error('Failed to assign manager');
      } else {
        toast.success('Branch manager assigned successfully');
      }
    } else {
      toast.success('Manager unassigned from branch');
    }

    setManagerDialogOpen(false);
    setSelectedBranchForManager(null);
    setSelectedManagerId('');
    setSaving(false);
  };

  const resetForm = () => {
    setEditingBranch(null);
    setSelectedClientId('');
    setBranchCode('');
    setBranchName('');
    setBranchType('main_branch');
    setAddress('');
    setPhone('');
    setEmail('');
  };

  const getBranchTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      main_branch: 'bg-amber-100 text-amber-800',
      company_owned: 'bg-blue-100 text-blue-800',
      franchise: 'bg-green-100 text-green-800',
      tenant: 'bg-purple-100 text-purple-800',
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Branches</h1>
            <p className="text-muted-foreground">
              {isAdmin ? 'Manage branches across all clients' : 'Manage your branch network'}
            </p>
          </div>
          {canManageBranches && (
            <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Branch
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingBranch ? 'Edit Branch' : 'Add New Branch'}</DialogTitle>
                  <DialogDescription>
                    {editingBranch 
                      ? 'Update branch details'
                      : isAdmin 
                        ? 'Create a new branch for any client' 
                        : 'Create a new branch for your organization'}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Client selection for platform admins (only on create) */}
                  {isAdmin && !editingBranch && (
                    <div className="space-y-2">
                      <Label htmlFor="client-select">Client *</Label>
                      <Select value={selectedClientId} onValueChange={setSelectedClientId} required>
                        <SelectTrigger>
                          <SelectValue placeholder="Select client" />
                        </SelectTrigger>
                        <SelectContent>
                          {clients.map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.company_name} ({c.client_code})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="branch-code">Branch Code</Label>
                      <Input
                        id="branch-code"
                        placeholder="e.g., BR001"
                        value={branchCode}
                        onChange={(e) => setBranchCode(e.target.value.toUpperCase())}
                        className="uppercase"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="branch-type">Branch Type</Label>
                      <Select value={branchType} onValueChange={setBranchType}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="main_branch">Main Branch</SelectItem>
                          <SelectItem value="company_owned">Company Owned</SelectItem>
                          <SelectItem value="franchise">Franchise</SelectItem>
                          <SelectItem value="tenant">Tenant</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="branch-name">Branch Name</Label>
                    <Input
                      id="branch-name"
                      placeholder="e.g., Main Street Branch"
                      value={branchName}
                      onChange={(e) => setBranchName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      placeholder="Full address"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        placeholder="+91 XXXXX XXXXX"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="branch@company.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={saving || (isAdmin && !editingBranch && !selectedClientId)}
                      className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700"
                    >
                      {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                      {editingBranch ? 'Update Branch' : 'Create Branch'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Client filter for platform admins */}
        {isAdmin && clients.length > 0 && (
          <div className="flex items-center gap-3">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={filterClientId} onValueChange={setFilterClientId}>
              <SelectTrigger className="w-[280px]">
                <SelectValue placeholder="Filter by client" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Clients</SelectItem>
                {clients.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.company_name} ({c.client_code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
          </div>
        ) : branches.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-4">
                <Building className="h-8 w-8 text-amber-600" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No Branches Yet</h3>
              <p className="text-muted-foreground text-center max-w-md mb-4">
                {isAdmin 
                  ? 'Create branches for your clients to start managing locations.'
                  : 'Create your first branch to start managing locations.'}
              </p>
              {canManageBranches && (
                <Button 
                  onClick={() => setDialogOpen(true)}
                  className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Branch
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    {isAdmin && <TableHead>Client</TableHead>}
                    <TableHead>Code</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Status</TableHead>
                    {canManageBranches && <TableHead className="text-right">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {branches.map((branch) => (
                    <TableRow key={branch.id}>
                      {isAdmin && (
                        <TableCell className="font-medium">
                          {branch.clients?.company_name || '-'}
                          <span className="text-muted-foreground text-xs ml-1">
                            ({branch.clients?.client_code})
                          </span>
                        </TableCell>
                      )}
                      <TableCell className="font-mono font-medium">{branch.branch_code}</TableCell>
                      <TableCell>{branch.branch_name}</TableCell>
                      <TableCell>
                        <Badge className={getBranchTypeBadge(branch.branch_type)}>
                          {branch.branch_type.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>{branch.phone || '-'}</TableCell>
                      <TableCell>
                        <Badge variant={branch.is_active ? 'default' : 'secondary'}>
                          {branch.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      {canManageBranches && (
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => fetchBranchManagerData(branch)}
                              title="Assign Manager"
                            >
                              <UserPlus className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEditDialog(branch)}
                              title="Edit Branch"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openDeleteDialog(branch)}
                              title="Deactivate Branch"
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Deactivate Branch?</AlertDialogTitle>
              <AlertDialogDescription>
                This will deactivate "{branchToDelete?.branch_name}". The branch will no longer be available for operations but data will be preserved.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteBranch}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Deactivate
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Manager Assignment Dialog */}
        <Dialog open={managerDialogOpen} onOpenChange={setManagerDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Assign Branch Manager</DialogTitle>
              <DialogDescription>
                Select a branch manager for {selectedBranchForManager?.branch_name}
              </DialogDescription>
            </DialogHeader>
            {loadingManagers ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-amber-600" />
              </div>
            ) : (
              <div className="space-y-4">
                {currentManager && (
                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">Current Manager</p>
                    <p className="font-medium">{currentManager.full_name}</p>
                    <p className="text-sm text-muted-foreground">{currentManager.email}</p>
                  </div>
                )}
                
                {availableManagers.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">
                    No users with branch_manager role found. Create users with the branch manager role first.
                  </p>
                ) : (
                  <div className="space-y-2">
                    <Label>Select Manager</Label>
                    <Select value={selectedManagerId} onValueChange={setSelectedManagerId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a manager" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">Unassign Manager</SelectItem>
                        {availableManagers.map((manager) => (
                          <SelectItem key={manager.user_id} value={manager.user_id}>
                            {manager.full_name} {manager.branch_id ? '(Currently assigned)' : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setManagerDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleAssignManager}
                    disabled={saving}
                    className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700"
                  >
                    {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    {selectedManagerId ? 'Assign Manager' : 'Unassign'}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}