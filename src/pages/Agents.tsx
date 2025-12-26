import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ResponsiveTable } from "@/components/ui/responsive-table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, UserCog, Search, Phone, Mail } from "lucide-react";

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

export default function Agents() {
  const { profile } = useAuth();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  
  const [formData, setFormData] = useState({
    agent_code: "",
    full_name: "",
    phone: "",
    email: "",
    address: "",
    branch_id: "",
    commission_percentage: "1",
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
          .from("agents")
          .select("*, branches(id, branch_code, branch_name)")
          .eq("client_id", profile?.client_id)
          .order("full_name"),
        supabase
          .from("branches")
          .select("id, branch_code, branch_name")
          .eq("client_id", profile?.client_id)
          .eq("is_active", true)
          .order("branch_name"),
      ]);

      if (agentsRes.error) throw agentsRes.error;
      if (branchesRes.error) throw branchesRes.error;

      setAgents(agentsRes.data || []);
      setBranches(branchesRes.data || []);
    } catch (error: any) {
      toast.error("Failed to fetch agents");
    } finally {
      setLoading(false);
    }
  };

  const generateAgentCode = async () => {
    const count = agents.length + 1;
    return `AGT${String(count).padStart(4, "0")}`;
  };

  const handleSubmit = async () => {
    if (!profile?.client_id) return;

    try {
      const agentCode = editingAgent?.agent_code || await generateAgentCode();
      
      if (editingAgent) {
        const { error } = await supabase
          .from("agents")
          .update({
            full_name: formData.full_name,
            phone: formData.phone || null,
            email: formData.email || null,
            address: formData.address || null,
            branch_id: formData.branch_id || null,
            commission_percentage: parseFloat(formData.commission_percentage) || 0,
            is_active: formData.is_active,
          })
          .eq("id", editingAgent.id);

        if (error) throw error;
        toast.success("Agent updated");
      } else {
        const { error } = await supabase.from("agents").insert({
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
        toast.success("Agent created");
      }

      setDialogOpen(false);
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
      phone: agent.phone || "",
      email: agent.email || "",
      address: agent.address || "",
      branch_id: agent.branch_id || "",
      commission_percentage: agent.commission_percentage.toString(),
      is_active: agent.is_active,
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this agent?")) return;

    try {
      const { error } = await supabase.from("agents").delete().eq("id", id);
      if (error) throw error;
      toast.success("Agent deleted");
      fetchData();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const resetForm = () => {
    setEditingAgent(null);
    setFormData({
      agent_code: "",
      full_name: "",
      phone: "",
      email: "",
      address: "",
      branch_id: "",
      commission_percentage: "1",
      is_active: true,
    });
  };

  const filteredAgents = agents.filter((agent) =>
    agent.agent_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    agent.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (agent.phone && agent.phone.includes(searchQuery))
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Agents</h1>
            <p className="text-muted-foreground">Manage referral agents who bring in customers</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button onClick={() => {
                resetForm();
                setDialogOpen(true);
              }}>
                <Plus className="mr-2 h-4 w-4" />
                Add Agent
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>{editingAgent ? "Edit" : "Add"} Agent</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
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
                <div className="grid grid-cols-2 gap-4">
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
                    value={formData.branch_id || "none"}
                    onValueChange={(value) => setFormData({ ...formData, branch_id: value === "none" ? "" : value })}
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
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                  />
                  <Label>Active</Label>
                </div>
                <Button onClick={handleSubmit} className="w-full" disabled={!formData.full_name}>
                  {editingAgent ? "Update" : "Create"} Agent
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row gap-4 justify-between">
              <CardTitle className="flex items-center gap-2">
                <UserCog className="h-5 w-5" />
                All Agents ({filteredAgents.length})
              </CardTitle>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search agents..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-[250px]"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-muted-foreground">Loading...</p>
            ) : filteredAgents.length === 0 ? (
              <p className="text-muted-foreground">No agents found. Add your first agent to get started.</p>
            ) : (
              <ResponsiveTable minWidth="900px">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Code</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Branch</TableHead>
                      <TableHead>Commission</TableHead>
                      <TableHead>Earned</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAgents.map((agent) => (
                      <TableRow key={agent.id}>
                        <TableCell className="font-mono">{agent.agent_code}</TableCell>
                        <TableCell className="font-medium">{agent.full_name}</TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {agent.phone && (
                              <div className="flex items-center gap-1 text-sm">
                                <Phone className="h-3 w-3" />
                                {agent.phone}
                              </div>
                            )}
                            {agent.email && (
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <Mail className="h-3 w-3" />
                                {agent.email}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {agent.branches ? (
                            <Badge variant="outline">{agent.branches.branch_name}</Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell>{agent.commission_percentage}%</TableCell>
                        <TableCell className="font-medium text-green-600">
                          ₹{agent.total_commission_earned.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Badge variant={agent.is_active ? "default" : "secondary"}>
                            {agent.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(agent)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(agent.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ResponsiveTable>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
