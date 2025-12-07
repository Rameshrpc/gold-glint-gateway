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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Layers } from "lucide-react";

interface ItemGroup {
  id: string;
  client_id: string;
  group_code: string;
  group_name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
}

export default function ItemGroups() {
  const { profile } = useAuth();
  const [itemGroups, setItemGroups] = useState<ItemGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<ItemGroup | null>(null);
  
  const [formData, setFormData] = useState({
    group_code: "",
    group_name: "",
    description: "",
    is_active: true,
  });

  useEffect(() => {
    if (profile?.client_id) {
      fetchItemGroups();
    }
  }, [profile?.client_id]);

  const fetchItemGroups = async () => {
    try {
      const { data, error } = await supabase
        .from("item_groups")
        .select("*")
        .eq("client_id", profile?.client_id)
        .order("group_name");

      if (error) throw error;
      setItemGroups(data || []);
    } catch (error: any) {
      toast.error("Failed to fetch item groups");
    } finally {
      setLoading(false);
    }
  };

  const seedDefaultGroups = async () => {
    if (!profile?.client_id) return;

    try {
      const defaultGroups = [
        { group_code: "GOLD", group_name: "Gold", description: "Gold ornaments and items" },
        { group_code: "SILVER", group_name: "Silver", description: "Silver ornaments and items" },
      ];

      for (const group of defaultGroups) {
        const exists = itemGroups.find(g => g.group_code === group.group_code);
        if (!exists) {
          await supabase.from("item_groups").insert({
            ...group,
            client_id: profile.client_id,
            is_active: true,
          });
        }
      }

      toast.success("Default groups created");
      fetchItemGroups();
    } catch (error: any) {
      toast.error("Failed to seed groups");
    }
  };

  const handleSubmit = async () => {
    if (!profile?.client_id) return;

    try {
      if (editingGroup) {
        const { error } = await supabase
          .from("item_groups")
          .update({
            group_code: formData.group_code,
            group_name: formData.group_name,
            description: formData.description || null,
            is_active: formData.is_active,
          })
          .eq("id", editingGroup.id);

        if (error) throw error;
        toast.success("Item group updated");
      } else {
        const { error } = await supabase.from("item_groups").insert({
          client_id: profile.client_id,
          group_code: formData.group_code,
          group_name: formData.group_name,
          description: formData.description || null,
          is_active: formData.is_active,
        });

        if (error) throw error;
        toast.success("Item group created");
      }

      setDialogOpen(false);
      resetForm();
      fetchItemGroups();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleEdit = (group: ItemGroup) => {
    setEditingGroup(group);
    setFormData({
      group_code: group.group_code,
      group_name: group.group_name,
      description: group.description || "",
      is_active: group.is_active,
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this item group?")) return;

    try {
      const { error } = await supabase.from("item_groups").delete().eq("id", id);
      if (error) throw error;
      toast.success("Item group deleted");
      fetchItemGroups();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const resetForm = () => {
    setEditingGroup(null);
    setFormData({
      group_code: "",
      group_name: "",
      description: "",
      is_active: true,
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Item Groups</h1>
            <p className="text-muted-foreground">Manage metal categories (Gold, Silver)</p>
          </div>
          <div className="flex gap-2">
            {itemGroups.length === 0 && (
              <Button variant="outline" onClick={seedDefaultGroups}>
                <Layers className="mr-2 h-4 w-4" />
                Add Default Groups
              </Button>
            )}
            <Dialog open={dialogOpen} onOpenChange={(open) => {
              setDialogOpen(open);
              if (!open) resetForm();
            }}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Group
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingGroup ? "Edit" : "Add"} Item Group</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Group Code</Label>
                      <Input
                        value={formData.group_code}
                        onChange={(e) => setFormData({ ...formData, group_code: e.target.value.toUpperCase() })}
                        placeholder="GOLD"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Group Name</Label>
                      <Input
                        value={formData.group_name}
                        onChange={(e) => setFormData({ ...formData, group_name: e.target.value })}
                        placeholder="Gold"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Optional description"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={formData.is_active}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                    />
                    <Label>Active</Label>
                  </div>
                  <Button onClick={handleSubmit} className="w-full">
                    {editingGroup ? "Update" : "Create"} Group
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Item Groups</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-muted-foreground">Loading...</p>
            ) : itemGroups.length === 0 ? (
              <p className="text-muted-foreground">No item groups found. Add default groups to get started.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {itemGroups.map((group) => (
                    <TableRow key={group.id}>
                      <TableCell className="font-mono">{group.group_code}</TableCell>
                      <TableCell className="font-medium">{group.group_name}</TableCell>
                      <TableCell className="text-muted-foreground">{group.description || "-"}</TableCell>
                      <TableCell>
                        <Badge variant={group.is_active ? "default" : "secondary"}>
                          {group.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(group)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(group.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
