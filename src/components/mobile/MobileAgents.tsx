import { useState, useEffect } from 'react';
import MobileLayout from './MobileLayout';
import MobileGradientHeader from './MobileGradientHeader';
import { MobileSearchBar, MobileBottomSheet } from './shared';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Plus, UserCog, Phone, Mail, Pencil, Trash2, IndianRupee } from 'lucide-react';
import { triggerHaptic } from '@/lib/haptics';

interface Branch {
  id: string;
  branch_code: string;
  branch_name: string;
}

interface Agent {
  id: string;
  client_id: string;
  branch_id: string | null;
  agent_code: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  commission_percentage: number;
  total_commission_earned: number;
  is_active: boolean;
  created_at: string;
  branches?: Branch;
}

export default function MobileAgents() {
  const { profile } = useAuth();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  
  const [formData, setFormData] = useState({
    agent_code: '',
    full_name: '',
    phone: '',
    email: '',
    address: '',
    branch_id: '',
    commission_percentage: '1',
    is_active: true,
  });

  useEffect(() => {
    if (profile?.client_id) {
      fetchData();
    }
  }, [profile?.client_id]);

  const fetchData = async () => {
    try {
      const [agentsRes, branchesRes] = await Promise.all([
        supabase
          .from('agents')
          .select('*, branches(id, branch_code, branch_name)')
          .eq('client_id', profile?.client_id)
          .order('full_name'),
        supabase
          .from('branches')
          .select('id, branch_code, branch_name')
          .eq('client_id', profile?.client_id)
          .eq('is_active', true)
          .order('branch_name'),
      ]);

      if (agentsRes.error) throw agentsRes.error;
      if (branchesRes.error) throw branchesRes.error;

      setAgents(agentsRes.data || []);
      setBranches(branchesRes.data || []);
    } catch (error: any) {
      toast.error('Failed to fetch agents');
    } finally {
      setLoading(false);
    }
  };

  const generateAgentCode = async () => {
    const count = agents.length + 1;
    return `AGT${String(count).padStart(4, '0')}`;
  };

  const handleSubmit = async () => {
    if (!profile?.client_id || !formData.full_name) return;

    try {
      const agentCode = editingAgent?.agent_code || await generateAgentCode();
      
      if (editingAgent) {
        const { error } = await supabase
          .from('agents')
          .update({
            full_name: formData.full_name,
            phone: formData.phone || null,
            email: formData.email || null,
            address: formData.address || null,
            branch_id: formData.branch_id || null,
            commission_percentage: parseFloat(formData.commission_percentage) || 0,
            is_active: formData.is_active,
          })
          .eq('id', editingAgent.id);

        if (error) throw error;
        toast.success('Agent updated');
      } else {
        const { error } = await supabase.from('agents').insert({
          client_id: profile.client_id,
          agent_code: agentCode,
          full_name: formData.full_name,
          phone: formData.phone || null,
          email: formData.email || null,
          address: formData.address || null,
          branch_id: formData.branch_id || null,
          commission_percentage: parseFloat(formData.commission_percentage) || 0,
          is_active: formData.is_active,
        });

        if (error) throw error;
        toast.success('Agent created');
      }

      triggerHaptic('success');
      setShowForm(false);
      resetForm();
      fetchData();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleEdit = (agent: Agent) => {
    setEditingAgent(agent);
    setFormData({
      agent_code: agent.agent_code,
      full_name: agent.full_name,
      phone: agent.phone || '',
      email: agent.email || '',
      address: agent.address || '',
      branch_id: agent.branch_id || '',
      commission_percentage: agent.commission_percentage.toString(),
      is_active: agent.is_active,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from('agents').delete().eq('id', id);
      if (error) throw error;
      triggerHaptic('success');
      toast.success('Agent deleted');
      fetchData();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const resetForm = () => {
    setEditingAgent(null);
    setFormData({
      agent_code: '',
      full_name: '',
      phone: '',
      email: '',
      address: '',
      branch_id: '',
      commission_percentage: '1',
      is_active: true,
    });
  };

  const filteredAgents = agents.filter((agent) =>
    agent.agent_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    agent.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (agent.phone && agent.phone.includes(searchQuery))
  );

  const totalEarned = agents.reduce((sum, a) => sum + a.total_commission_earned, 0);

  return (
    <MobileLayout hideNav={showForm}>
      <MobileGradientHeader 
        title="Agents"
        showSearch
        onSearchClick={() => setShowSearch(true)}
      />

      <div className="p-4 space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-card rounded-xl p-4 border border-border/50">
            <div className="flex items-center gap-2 mb-1">
              <UserCog className="h-5 w-5 text-primary" />
              <span className="text-sm text-muted-foreground">Total Agents</span>
            </div>
            <p className="text-2xl font-bold">{agents.length}</p>
          </div>
          <div className="bg-card rounded-xl p-4 border border-border/50">
            <div className="flex items-center gap-2 mb-1">
              <IndianRupee className="h-5 w-5 text-green-600" />
              <span className="text-sm text-muted-foreground">Total Earned</span>
            </div>
            <p className="text-2xl font-bold text-green-600">₹{totalEarned.toLocaleString()}</p>
          </div>
        </div>

        {/* Add Button */}
        <Button 
          className="w-full"
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Agent
        </Button>

        {/* Agents List */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-card rounded-xl p-4 animate-pulse">
                <div className="h-4 bg-muted rounded w-1/3 mb-2" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : filteredAgents.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <UserCog className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No agents found</p>
            <p className="text-sm">Add your first agent to get started</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredAgents.map((agent) => (
              <div 
                key={agent.id} 
                className="bg-card rounded-xl p-4 border border-border/50 shadow-sm"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded">
                        {agent.agent_code}
                      </span>
                      <Badge variant={agent.is_active ? 'default' : 'secondary'} className="text-xs">
                        {agent.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <h3 className="font-semibold">{agent.full_name}</h3>
                    
                    <div className="mt-2 space-y-1">
                      {agent.phone && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Phone className="h-3 w-3" />
                          {agent.phone}
                        </div>
                      )}
                      {agent.email && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Mail className="h-3 w-3" />
                          {agent.email}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-3 mt-3">
                      <Badge variant="outline">{agent.commission_percentage}% Commission</Badge>
                      <span className="text-sm font-medium text-green-600">
                        ₹{agent.total_commission_earned.toLocaleString()} earned
                      </span>
                    </div>
                    
                    {agent.branches && (
                      <Badge variant="secondary" className="mt-2 text-xs">
                        {agent.branches.branch_name}
                      </Badge>
                    )}
                  </div>
                  <div className="flex flex-col gap-1">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8"
                      onClick={() => handleEdit(agent)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-destructive"
                      onClick={() => handleDelete(agent.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Search Sheet */}
      <MobileBottomSheet
        open={showSearch}
        onOpenChange={setShowSearch}
        title="Search Agents"
      >
        <div className="p-4">
          <MobileSearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search by code, name, or phone..."
            autoFocus
          />
        </div>
      </MobileBottomSheet>

      {/* Add/Edit Form Sheet */}
      <MobileBottomSheet
        open={showForm}
        onOpenChange={setShowForm}
        title={editingAgent ? 'Edit Agent' : 'Add Agent'}
      >
        <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
          {editingAgent && (
            <div className="space-y-2">
              <Label>Agent Code</Label>
              <Input value={formData.agent_code} disabled className="bg-muted" />
            </div>
          )}
          
          <div className="space-y-2">
            <Label>Full Name *</Label>
            <Input
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              placeholder="Enter agent name"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="9876543210"
              />
            </div>
            <div className="space-y-2">
              <Label>Commission %</Label>
              <Input
                type="number"
                step="0.1"
                min="0"
                max="10"
                value={formData.commission_percentage}
                onChange={(e) => setFormData({ ...formData, commission_percentage: e.target.value })}
                placeholder="1.0"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Email</Label>
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="agent@email.com"
            />
          </div>
          
          <div className="space-y-2">
            <Label>Branch (Optional)</Label>
            <Select
              value={formData.branch_id || 'none'}
              onValueChange={(value) => setFormData({ ...formData, branch_id: value === 'none' ? '' : value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select branch" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No specific branch</SelectItem>
                {branches.map((branch) => (
                  <SelectItem key={branch.id} value={branch.id}>
                    {branch.branch_code} - {branch.branch_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label>Address</Label>
            <Textarea
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Enter address"
              rows={2}
            />
          </div>
          
          <div className="flex items-center gap-3">
            <Switch
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
            />
            <Label>Active</Label>
          </div>
          
          <Button onClick={handleSubmit} className="w-full" disabled={!formData.full_name}>
            {editingAgent ? 'Update' : 'Create'} Agent
          </Button>
        </div>
      </MobileBottomSheet>
    </MobileLayout>
  );
}
