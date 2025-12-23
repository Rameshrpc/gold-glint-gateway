import { useState, useEffect } from 'react';
import MobileLayout from './MobileLayout';
import MobileGradientHeader from './MobileGradientHeader';
import { MobileSearchBar, MobileBottomSheet } from './shared';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Plus, Package, Sparkles, Pencil, Trash2, Filter } from 'lucide-react';
import { vibrateSuccess } from '@/lib/haptics';

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

export default function MobileItems() {
  const { profile } = useAuth();
  const [items, setItems] = useState<Item[]>([]);
  const [itemGroups, setItemGroups] = useState<ItemGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterGroupId, setFilterGroupId] = useState<string>('all');
  const [showSearch, setShowSearch] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  
  const [formData, setFormData] = useState({
    item_group_id: '',
    item_code: '',
    item_name: '',
    tamil_name: '',
    description: '',
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
          .from('items')
          .select('*, item_groups(id, group_code, group_name)')
          .eq('client_id', profile?.client_id)
          .order('item_name'),
        supabase
          .from('item_groups')
          .select('id, group_code, group_name')
          .eq('client_id', profile?.client_id)
          .eq('is_active', true)
          .order('group_name'),
      ]);

      if (itemsRes.error) throw itemsRes.error;
      if (groupsRes.error) throw groupsRes.error;

      setItems(itemsRes.data || []);
      setItemGroups(groupsRes.data || []);
    } catch (error: any) {
      toast.error('Failed to fetch items');
    } finally {
      setLoading(false);
    }
  };

  const seedTamilGoldItems = async () => {
    if (!profile?.client_id) return;

    const goldGroup = itemGroups.find(g => g.group_code === 'GOLD');
    if (!goldGroup) {
      toast.error('Please create Gold item group first');
      return;
    }

    try {
      let addedCount = 0;
      for (const item of TAMIL_GOLD_ITEMS) {
        const exists = items.find(i => i.item_code === item.item_code);
        if (!exists) {
          await supabase.from('items').insert({
            client_id: profile.client_id,
            item_group_id: goldGroup.id,
            ...item,
            is_active: true,
          });
          addedCount++;
        }
      }

      vibrateSuccess();
      toast.success(`Added ${addedCount} Tamil gold items`);
      fetchData();
    } catch (error: any) {
      toast.error('Failed to seed items');
    }
  };

  const handleSubmit = async () => {
    if (!profile?.client_id || !formData.item_group_id) return;

    try {
      if (editingItem) {
        const { error } = await supabase
          .from('items')
          .update({
            item_group_id: formData.item_group_id,
            item_code: formData.item_code,
            item_name: formData.item_name,
            tamil_name: formData.tamil_name || null,
            description: formData.description || null,
            is_active: formData.is_active,
          })
          .eq('id', editingItem.id);

        if (error) throw error;
        toast.success('Item updated');
      } else {
        const { error } = await supabase.from('items').insert({
          client_id: profile.client_id,
          item_group_id: formData.item_group_id,
          item_code: formData.item_code,
          item_name: formData.item_name,
          tamil_name: formData.tamil_name || null,
          description: formData.description || null,
          is_active: formData.is_active,
        });

        if (error) throw error;
        toast.success('Item created');
      }

      vibrateSuccess();
      setShowForm(false);
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
      tamil_name: item.tamil_name || '',
      description: item.description || '',
      is_active: item.is_active,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from('items').delete().eq('id', id);
      if (error) throw error;
      vibrateSuccess();
      toast.success('Item deleted');
      fetchData();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const resetForm = () => {
    setEditingItem(null);
    setFormData({
      item_group_id: itemGroups.find(g => g.group_code === 'GOLD')?.id || '',
      item_code: '',
      item_name: '',
      tamil_name: '',
      description: '',
      is_active: true,
    });
  };

  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.item_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.item_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.tamil_name && item.tamil_name.includes(searchQuery));
    const matchesGroup = filterGroupId === 'all' || item.item_group_id === filterGroupId;
    return matchesSearch && matchesGroup;
  });

  return (
    <MobileLayout hideNav={showForm}>
      <MobileGradientHeader 
        title="Items Master"
        showSearch
        onSearchClick={() => setShowSearch(true)}
      >
        <button 
          onClick={() => setShowFilter(true)}
          className="p-2 rounded-full bg-background/10 active:bg-background/20"
        >
          <Filter className="h-5 w-5 text-foreground" />
        </button>
      </MobileGradientHeader>

      <div className="p-4 space-y-4">
        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1"
            onClick={seedTamilGoldItems}
          >
            <Sparkles className="mr-2 h-4 w-4" />
            Seed Gold Items
          </Button>
          <Button 
            size="sm" 
            className="flex-1"
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Item
          </Button>
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between bg-muted/30 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            <span className="font-medium">Total Items</span>
          </div>
          <Badge variant="secondary">{filteredItems.length}</Badge>
        </div>

        {/* Items List */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-card rounded-xl p-4 animate-pulse">
                <div className="h-4 bg-muted rounded w-1/3 mb-2" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No items found</p>
            <p className="text-sm">Use "Seed Gold Items" to add common items</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredItems.map((item) => (
              <div 
                key={item.id} 
                className="bg-card rounded-xl p-4 border border-border/50 shadow-sm"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded">
                        {item.item_code}
                      </span>
                      <Badge variant={item.is_active ? 'default' : 'secondary'} className="text-xs">
                        {item.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <h3 className="font-semibold">{item.item_name}</h3>
                    {item.tamil_name && (
                      <p className="text-sm text-muted-foreground">{item.tamil_name}</p>
                    )}
                    {item.item_groups && (
                      <Badge variant="outline" className="mt-2 text-xs">
                        {item.item_groups.group_name}
                      </Badge>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8"
                      onClick={() => handleEdit(item)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-destructive"
                      onClick={() => handleDelete(item.id)}
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
        isOpen={showSearch}
        onClose={() => setShowSearch(false)}
        title="Search Items"
      >
        <div className="p-4">
          <MobileSearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search by code, name, or Tamil name..."
            autoFocus
          />
        </div>
      </MobileBottomSheet>

      {/* Filter Sheet */}
      <MobileBottomSheet
        isOpen={showFilter}
        onClose={() => setShowFilter(false)}
        title="Filter by Group"
      >
        <div className="p-4 space-y-3">
          <Button 
            variant={filterGroupId === 'all' ? 'default' : 'outline'} 
            className="w-full justify-start"
            onClick={() => {
              setFilterGroupId('all');
              setShowFilter(false);
            }}
          >
            All Groups
          </Button>
          {itemGroups.map((group) => (
            <Button 
              key={group.id}
              variant={filterGroupId === group.id ? 'default' : 'outline'} 
              className="w-full justify-start"
              onClick={() => {
                setFilterGroupId(group.id);
                setShowFilter(false);
              }}
            >
              {group.group_name}
            </Button>
          ))}
        </div>
      </MobileBottomSheet>

      {/* Add/Edit Form Sheet */}
      <MobileBottomSheet
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        title={editingItem ? 'Edit Item' : 'Add Item'}
      >
        <div className="p-4 space-y-4">
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
          
          <div className="space-y-2">
            <Label>Tamil Name</Label>
            <Input
              value={formData.tamil_name}
              onChange={(e) => setFormData({ ...formData, tamil_name: e.target.value })}
              placeholder="தாலி சங்கிலி"
            />
          </div>
          
          <div className="flex items-center gap-3">
            <Switch
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
            />
            <Label>Active</Label>
          </div>
          
          <Button onClick={handleSubmit} className="w-full" disabled={!formData.item_group_id || !formData.item_code}>
            {editingItem ? 'Update' : 'Create'} Item
          </Button>
        </div>
      </MobileBottomSheet>
    </MobileLayout>
  );
}
