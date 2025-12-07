import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Plus, Pencil, Trash2, Package, Search, Sparkles } from "lucide-react";

interface ItemGroup {
  id: string;
  group_code: string;
  group_name: string;
}

interface Item {
  id: string;
  client_id: string;
  item_group_id: string;
  item_code: string;
  item_name: string;
  tamil_name: string | null;
  description: string | null;
  is_active: boolean;
  created_at: string;
  item_groups?: ItemGroup;
}

const TAMIL_GOLD_ITEMS = [
  { item_code: "THALI", item_name: "Thali Chain", tamil_name: "தாலி சங்கிலி" },
  { item_code: "MUGAPPU", item_name: "Mugappu", tamil_name: "முகப்பு" },
  { item_code: "KOLUSU", item_name: "Anklet", tamil_name: "கொலுசு" },
  { item_code: "KAMMAL", item_name: "Earring", tamil_name: "காதணி" },
  { item_code: "VAALAI", item_name: "Bangle", tamil_name: "வளையல்" },
  { item_code: "OTTIYANAM", item_name: "Hip Belt", tamil_name: "ஒட்டியானம்" },
  { item_code: "MOOKUTHI", item_name: "Nose Ring", tamil_name: "மூக்குத்தி" },
  { item_code: "JIMIKKI", item_name: "Jhumka", tamil_name: "ஜிமிக்கி" },
  { item_code: "HAARAM", item_name: "Long Chain", tamil_name: "ஹாரம்" },
  { item_code: "MOTHIRAM", item_name: "Ring", tamil_name: "மோதிரம்" },
  { item_code: "VANKI", item_name: "Armlet", tamil_name: "வாங்கி" },
  { item_code: "KUNJALAM", item_name: "Pendant", tamil_name: "குஞ்சலம்" },
  { item_code: "KASUMALA", item_name: "Coin Necklace", tamil_name: "காசுமாலை" },
  { item_code: "ATTIGAI", item_name: "Choker", tamil_name: "அட்டிகை" },
  { item_code: "NETHICHUTTI", item_name: "Forehead Jewel", tamil_name: "நெற்றிச்சுட்டி" },
  { item_code: "KAPPU", item_name: "Bracelet", tamil_name: "கப்பு" },
  { item_code: "SARADU", item_name: "Thread Necklace", tamil_name: "சரடு" },
  { item_code: "COIN", item_name: "Gold Coin", tamil_name: "தங்க காசு" },
  { item_code: "BAR", item_name: "Gold Bar", tamil_name: "தங்க கட்டி" },
  { item_code: "METTI", item_name: "Toe Ring", tamil_name: "மெட்டி" },
  { item_code: "THANDAI", item_name: "Armband", tamil_name: "தண்டை" },
  { item_code: "NATHINI", item_name: "Nose Pin", tamil_name: "நாத்தினி" },
  { item_code: "KAAPU", item_name: "Baby Bangle", tamil_name: "காப்பு" },
  { item_code: "ARAIGNAN", item_name: "Waist Chain", tamil_name: "அரைஞாண்" },
  { item_code: "OTHER", item_name: "Other", tamil_name: "மற்றவை" },
];

export default function Items() {
  const { profile } = useAuth();
  const [items, setItems] = useState<Item[]>([]);
  const [itemGroups, setItemGroups] = useState<ItemGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterGroupId, setFilterGroupId] = useState<string>("all");
  
  const [formData, setFormData] = useState({
    item_group_id: "",
    item_code: "",
    item_name: "",
    tamil_name: "",
    description: "",
    is_active: true,
  });

  useEffect(() => {
    if (profile?.client_id) {
      fetchData();
    }
  }, [profile?.client_id]);

  const fetchData = async () => {
    try {
      const [itemsRes, groupsRes] = await Promise.all([
        supabase
          .from("items")
          .select("*, item_groups(id, group_code, group_name)")
          .eq("client_id", profile?.client_id)
          .order("item_name"),
        supabase
          .from("item_groups")
          .select("id, group_code, group_name")
          .eq("client_id", profile?.client_id)
          .eq("is_active", true)
          .order("group_name"),
      ]);

      if (itemsRes.error) throw itemsRes.error;
      if (groupsRes.error) throw groupsRes.error;

      setItems(itemsRes.data || []);
      setItemGroups(groupsRes.data || []);
    } catch (error: any) {
      toast.error("Failed to fetch items");
    } finally {
      setLoading(false);
    }
  };

  const seedTamilGoldItems = async () => {
    if (!profile?.client_id) return;

    const goldGroup = itemGroups.find(g => g.group_code === "GOLD");
    if (!goldGroup) {
      toast.error("Please create Gold item group first");
      return;
    }

    try {
      let addedCount = 0;
      for (const item of TAMIL_GOLD_ITEMS) {
        const exists = items.find(i => i.item_code === item.item_code);
        if (!exists) {
          await supabase.from("items").insert({
            client_id: profile.client_id,
            item_group_id: goldGroup.id,
            ...item,
            is_active: true,
          });
          addedCount++;
        }
      }

      toast.success(`Added ${addedCount} Tamil gold items`);
      fetchData();
    } catch (error: any) {
      toast.error("Failed to seed items");
    }
  };

  const handleSubmit = async () => {
    if (!profile?.client_id || !formData.item_group_id) return;

    try {
      if (editingItem) {
        const { error } = await supabase
          .from("items")
          .update({
            item_group_id: formData.item_group_id,
            item_code: formData.item_code,
            item_name: formData.item_name,
            tamil_name: formData.tamil_name || null,
            description: formData.description || null,
            is_active: formData.is_active,
          })
          .eq("id", editingItem.id);

        if (error) throw error;
        toast.success("Item updated");
      } else {
        const { error } = await supabase.from("items").insert({
          client_id: profile.client_id,
          item_group_id: formData.item_group_id,
          item_code: formData.item_code,
          item_name: formData.item_name,
          tamil_name: formData.tamil_name || null,
          description: formData.description || null,
          is_active: formData.is_active,
        });

        if (error) throw error;
        toast.success("Item created");
      }

      setDialogOpen(false);
      resetForm();
      fetchData();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleEdit = (item: Item) => {
    setEditingItem(item);
    setFormData({
      item_group_id: item.item_group_id,
      item_code: item.item_code,
      item_name: item.item_name,
      tamil_name: item.tamil_name || "",
      description: item.description || "",
      is_active: item.is_active,
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this item?")) return;

    try {
      const { error } = await supabase.from("items").delete().eq("id", id);
      if (error) throw error;
      toast.success("Item deleted");
      fetchData();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const resetForm = () => {
    setEditingItem(null);
    setFormData({
      item_group_id: itemGroups.find(g => g.group_code === "GOLD")?.id || "",
      item_code: "",
      item_name: "",
      tamil_name: "",
      description: "",
      is_active: true,
    });
  };

  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.item_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.item_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.tamil_name && item.tamil_name.includes(searchQuery));
    const matchesGroup = filterGroupId === "all" || item.item_group_id === filterGroupId;
    return matchesSearch && matchesGroup;
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Items Master</h1>
            <p className="text-muted-foreground">Manage gold and silver item types</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={seedTamilGoldItems}>
              <Sparkles className="mr-2 h-4 w-4" />
              Seed Tamil Gold Items
            </Button>
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
                  Add Item
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{editingItem ? "Edit" : "Add"} Item</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Item Group</Label>
                    <Select
                      value={formData.item_group_id}
                      onValueChange={(value) => setFormData({ ...formData, item_group_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select group" />
                      </SelectTrigger>
                      <SelectContent>
                        {itemGroups.map((group) => (
                          <SelectItem key={group.id} value={group.id}>
                            {group.group_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Item Code</Label>
                      <Input
                        value={formData.item_code}
                        onChange={(e) => setFormData({ ...formData, item_code: e.target.value.toUpperCase() })}
                        placeholder="THALI"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Item Name (English)</Label>
                      <Input
                        value={formData.item_name}
                        onChange={(e) => setFormData({ ...formData, item_name: e.target.value })}
                        placeholder="Thali Chain"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Tamil Name</Label>
                    <Input
                      value={formData.tamil_name}
                      onChange={(e) => setFormData({ ...formData, tamil_name: e.target.value })}
                      placeholder="தாலி சங்கிலி"
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
                    {editingItem ? "Update" : "Create"} Item
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row gap-4 justify-between">
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                All Items ({filteredItems.length})
              </CardTitle>
              <div className="flex gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search items..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 w-[200px]"
                  />
                </div>
                <Select value={filterGroupId} onValueChange={setFilterGroupId}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="All Groups" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Groups</SelectItem>
                    {itemGroups.map((group) => (
                      <SelectItem key={group.id} value={group.id}>
                        {group.group_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-muted-foreground">Loading...</p>
            ) : filteredItems.length === 0 ? (
              <p className="text-muted-foreground">No items found. Use "Seed Tamil Gold Items" to populate common items.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Tamil Name</TableHead>
                    <TableHead>Group</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-mono">{item.item_code}</TableCell>
                      <TableCell className="font-medium">{item.item_name}</TableCell>
                      <TableCell>{item.tamil_name || "-"}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {item.item_groups?.group_name || "-"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={item.is_active ? "default" : "secondary"}>
                          {item.is_active ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(item)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)}>
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
