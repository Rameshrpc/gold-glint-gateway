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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Building2, Plus, Loader2, Search, Edit, Users } from 'lucide-react';
import { toast } from 'sonner';

type BusinessType = 'loans' | 'sale_agreements' | 'both';

interface Client {
  id: string;
  client_code: string;
  company_name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  is_active: boolean;
  created_at: string;
}

const getDefaultModulesForBusinessType = (type: BusinessType): string[] => {
  const commonModules = [
    'dashboard', 'quick_view', 'customers', 'agents', 
    'notifications', 'reports', 'accounting', 'settings'
  ];
  const loanModules = ['loans', 'interest', 'redemption', 'repledge', 'takeover'];
  const saleModules = ['sale_agreements', 'sale_margin', 'sale_repurchase', 'sale_schemes'];

  switch (type) {
    case 'loans':
      return [...commonModules, ...loanModules];
    case 'sale_agreements':
      return [...commonModules, ...saleModules];
    case 'both':
      return [...commonModules, ...loanModules, ...saleModules];
  }
};

export default function Clients() {
  const { isPlatformAdmin } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Form state
  const [clientCode, setClientCode] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [businessType, setBusinessType] = useState<BusinessType>('loans');

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error('Error fetching clients:', error);
      toast.error('Failed to load clients');
    }
    setLoading(false);
  };

  const resetForm = () => {
    setClientCode('');
    setCompanyName('');
    setEmail('');
    setPhone('');
    setAddress('');
    setIsActive(true);
    setEditingClient(null);
    setBusinessType('loans');
  };

  const openEditDialog = (client: Client) => {
    setEditingClient(client);
    setClientCode(client.client_code);
    setCompanyName(client.company_name);
    setEmail(client.email || '');
    setPhone(client.phone || '');
    setAddress(client.address || '');
    setIsActive(client.is_active);
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (editingClient) {
        // Update existing client
        const { error } = await supabase
          .from('clients')
          .update({
            client_code: clientCode.toUpperCase(),
            company_name: companyName,
            email: email || null,
            phone: phone || null,
            address: address || null,
            is_active: isActive,
          })
          .eq('id', editingClient.id);

        if (error) throw error;
        toast.success('Client updated successfully');
      } else {
        // Determine feature flags based on business type
        const supportsLoans = businessType === 'loans' || businessType === 'both';
        const supportsSaleAgreements = businessType === 'sale_agreements' || businessType === 'both';

        // Create new client with feature flags
        const { data: newClient, error } = await supabase
          .from('clients')
          .insert({
            client_code: clientCode.toUpperCase(),
            company_name: companyName,
            email: email || null,
            phone: phone || null,
            address: address || null,
            is_active: isActive,
            supports_loans: supportsLoans,
            supports_sale_agreements: supportsSaleAgreements,
          })
          .select()
          .single();

        if (error) throw error;

        // Create default main branch for new client
        await supabase.from('branches').insert({
          client_id: newClient.id,
          branch_code: 'MAIN',
          branch_name: 'Main Branch',
          branch_type: 'main_branch',
          is_active: true,
        });

        // Create default client modules based on business type
        const defaultModules = getDefaultModulesForBusinessType(businessType);
        await supabase.from('client_modules').insert(
          defaultModules.map(moduleKey => ({
            client_id: newClient.id,
            module_key: moduleKey,
            is_enabled: true,
          }))
        );

        toast.success('Client created successfully');
      }

      setDialogOpen(false);
      resetForm();
      fetchClients();
    } catch (error: any) {
      // Handle specific error cases with user-friendly messages
      if (error.code === '23505' || error.message?.includes('duplicate key')) {
        if (error.message?.includes('client_code') || error.details?.includes('client_code')) {
          toast.error('Client code already exists. Please use a different code.');
        } else if (error.message?.includes('company_name') || error.details?.includes('company_name')) {
          toast.error('A client with this company name already exists.');
        } else {
          toast.error('A record with this information already exists.');
        }
      } else {
        toast.error(error.message || 'Operation failed');
      }
    }
    setSubmitting(false);
  };

  const toggleClientStatus = async (client: Client) => {
    try {
      const { error } = await supabase
        .from('clients')
        .update({ is_active: !client.is_active })
        .eq('id', client.id);

      if (error) throw error;
      toast.success(`Client ${!client.is_active ? 'activated' : 'deactivated'}`);
      fetchClients();
    } catch (error) {
      toast.error('Failed to update client status');
    }
  };

  const filteredClients = clients.filter(
    (client) =>
      client.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.client_code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isPlatformAdmin()) {
    return (
      <DashboardLayout>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground">You don't have permission to access this page.</p>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Clients</h1>
            <p className="text-muted-foreground">Manage tenant organizations</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="bg-amber-600 hover:bg-amber-700">
                <Plus className="h-4 w-4 mr-2" />
                Add Client
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>{editingClient ? 'Edit Client' : 'Add New Client'}</DialogTitle>
                <DialogDescription>
                  {editingClient ? 'Update client details' : 'Create a new tenant organization'}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="clientCode">Client Code *</Label>
                  <Input
                    id="clientCode"
                    value={clientCode}
                    onChange={(e) => setClientCode(e.target.value.toUpperCase())}
                    placeholder="e.g., GOLD01"
                    required
                    maxLength={20}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="companyName">Company Name *</Label>
                  <Input
                    id="companyName"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Company name"
                    required
                  />
                </div>
                {!editingClient && (
                  <div className="space-y-3">
                    <Label>Business Type *</Label>
                    <RadioGroup 
                      value={businessType} 
                      onValueChange={(value) => setBusinessType(value as BusinessType)}
                      className="space-y-2"
                    >
                      <div className="flex items-start space-x-3 p-2 rounded-md border hover:bg-muted/50 cursor-pointer">
                        <RadioGroupItem value="loans" id="type-loans" className="mt-1" />
                        <div className="flex-1">
                          <Label htmlFor="type-loans" className="font-normal cursor-pointer">
                            Loans Only
                          </Label>
                          <p className="text-xs text-muted-foreground">
                            Traditional gold loan operations
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3 p-2 rounded-md border hover:bg-muted/50 cursor-pointer">
                        <RadioGroupItem value="sale_agreements" id="type-sale" className="mt-1" />
                        <div className="flex-1">
                          <Label htmlFor="type-sale" className="font-normal cursor-pointer">
                            Sale Agreements Only
                          </Label>
                          <p className="text-xs text-muted-foreground">
                            Trading format (purchase/repurchase)
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3 p-2 rounded-md border hover:bg-muted/50 cursor-pointer">
                        <RadioGroupItem value="both" id="type-both" className="mt-1" />
                        <div className="flex-1">
                          <Label htmlFor="type-both" className="font-normal cursor-pointer">
                            Both Loans & Sale Agreements
                          </Label>
                          <p className="text-xs text-muted-foreground">
                            Full access to all modules
                          </p>
                        </div>
                      </div>
                    </RadioGroup>
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="contact@company.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 9876543210"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Business address"
                  />
                </div>
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
                    {editingClient ? 'Update' : 'Create'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search clients..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
          </div>
        ) : filteredClients.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center">
              <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Clients Yet</h3>
              <p className="text-muted-foreground mb-4">
                Get started by creating your first client organization.
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client Code</TableHead>
                  <TableHead>Company Name</TableHead>
                  <TableHead className="hidden md:table-cell">Email</TableHead>
                  <TableHead className="hidden md:table-cell">Phone</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell className="font-mono font-medium">{client.client_code}</TableCell>
                    <TableCell>{client.company_name}</TableCell>
                    <TableCell className="hidden md:table-cell">{client.email || '-'}</TableCell>
                    <TableCell className="hidden md:table-cell">{client.phone || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={client.is_active ? 'default' : 'secondary'}>
                        {client.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(client)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Switch
                          checked={client.is_active}
                          onCheckedChange={() => toggleClientStatus(client)}
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