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
import { Plus, Building, Loader2, Filter } from 'lucide-react';
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

export default function Branches() {
  const { client, isPlatformAdmin } = useAuth();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Determine which client_id to use
    const targetClientId = isAdmin ? selectedClientId : client?.id;
    
    if (!targetClientId) {
      toast.error(isAdmin ? 'Please select a client' : 'No client associated');
      return;
    }

    setSaving(true);
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
    setSaving(false);
  };

  const resetForm = () => {
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
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700">
                <Plus className="h-4 w-4 mr-2" />
                Add Branch
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Branch</DialogTitle>
                <DialogDescription>
                  {isAdmin 
                    ? 'Create a new branch for any client' 
                    : 'Create a new branch for your organization'}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Client selection for platform admins */}
                {isAdmin && (
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
                    disabled={saving || (isAdmin && !selectedClientId)}
                    className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700"
                  >
                    {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Create Branch
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
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
              <Button 
                onClick={() => setDialogOpen(true)}
                className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add First Branch
              </Button>
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
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
