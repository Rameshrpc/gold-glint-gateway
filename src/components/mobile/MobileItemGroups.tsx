import { useState, useEffect } from 'react';
import MobileLayout from './MobileLayout';
import MobileSimpleHeader from './MobileSimpleHeader';
import { MobileBottomSheet } from './shared';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Plus, Layers, Pencil, Trash2 } from 'lucide-react';
import { vibrateSuccess } from '@/lib/haptics';

interface ItemGroup {
  id: string;
  client_id: string;
  group_code: string;
  group_name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
}

export default function MobileItemGroups() {
  const { profile } = useAuth();
  const [itemGroups, setItemGroups] = useState<ItemGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingGroup, setEditingGroup] = useState<ItemGroup | null>(null);
  
  const [formData, setFormData] = useState({
    group_code: '',
    group_name: '',
    description: '',
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
        .from('item_groups')
        .select('*')
        .eq('client_id', profile?.client_id)
        .order('group_name');

      if (error) throw error;
      setItemGroups(data || []);
    } catch (error: any) {
      toast.error('Failed to fetch item groups');
    } finally {
      setLoading(false);
    }
  };

  const seedDefaultGroups = async () => {
    if (!profile?.client_id) return;

    try {
      const defaultGroups = [
        { group_code: 'GOLD', group_name: 'Gold', description: 'Gold ornaments and items' },
        { group_code: 'SILVER', group_name: 'Silver', description: 'Silver ornaments and items' },
      ];

      for (const group of defaultGroups) {
        const exists = itemGroups.find(g => g.group_code === group.group_code);
        if (!exists) {
          await supabase.from('item_groups').insert({
            ...group,
            client_id: profile.client_id,
            is_active: true,
          });
        }
      }

      vibrateSuccess();
      toast.success('Default groups created');
      fetchItemGroups();
    } catch (error: any) {
      toast.error('Failed to seed groups');
    }
  };

  const handleSubmit = async () => {
    if (!profile?.client_id) return;

    try {
      if (editingGroup) {
        const { error } = await supabase
          .from('item_groups')
          .update({
            group_code: formData.group_code,
            group_name: formData.group_name,
            description: formData.description || null,
            is_active: formData.is_active,
          })
          .eq('id', editingGroup.id);

        if (error) throw error;
        toast.success('Item group updated');
      } else {
        const { error } = await supabase.from('item_groups').insert({
          client_id: profile.client_id,
          group_code: formData.group_code,
          group_name: formData.group_name,
          description: formData.description || null,
          is_active: formData.is_active,
        });

        if (error) throw error;
        toast.success('Item group created');
      }

      vibrateSuccess();
      setShowForm(false);
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
      description: group.description || '',
      is_active: group.is_active,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from('item_groups').delete().eq('id', id);
      if (error) throw error;
      vibrateSuccess();
      toast.success('Item group deleted');
      fetchItemGroups();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const resetForm = () => {
    setEditingGroup(null);
    setFormData({
      group_code: '',
      group_name: '',
      description: '',
      is_active: true,
    });
  };

  return (
    <MobileLayout hideNav={showForm}>
      <MobileSimpleHeader title="Item Groups" showBack />

      <div className="p-4 space-y-4">
        {/* Action Buttons */}
        <div className="flex gap-2">
          {itemGroups.length === 0 && (
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1"
              onClick={seedDefaultGroups}
            >
              <Layers className="mr-2 h-4 w-4" />
              Add Defaults
            </Button>
          )}
          <Button 
            size="sm" 
            className="flex-1"
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Group
          </Button>
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between bg-card rounded-lg p-3 border">
          <div className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-primary" />
            <span className="font-medium">Total Groups</span>
          </div>
          <Badge variant="secondary">{itemGroups.length}</Badge>
        </div>

        {/* Groups List */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2].map(i => (
              <div key={i} className="bg-card rounded-xl p-4 animate-pulse">
                <div className="h-4 bg-muted rounded w-1/3 mb-2" />
                <div className="h-3 bg-muted rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : itemGroups.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Layers className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No item groups found</p>
            <p className="text-sm">Add default groups to get started</p>
          </div>
        ) : (
          <div className="space-y-3">
            {itemGroups.map((group) => (
              <div 
                key={group.id} 
                className="bg-card rounded-xl p-4 border border-border/50 shadow-sm"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded">
                        {group.group_code}
                      </span>
                      <Badge variant={group.is_active ? 'default' : 'secondary'} className="text-xs">
                        {group.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <h3 className="font-semibold">{group.group_name}</h3>
                    {group.description && (
                      <p className="text-sm text-muted-foreground mt-1">{group.description}</p>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8"
                      onClick={() => handleEdit(group)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-destructive"
                      onClick={() => handleDelete(group.id)}
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

      {/* Add/Edit Form Sheet */}
      <MobileBottomSheet
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        title={editingGroup ? 'Edit Item Group' : 'Add Item Group'}
      >
        <div className="p-4 space-y-4">
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
          
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Optional description"
              rows={3}
            />
          </div>
          
          <div className="flex items-center gap-3">
            <Switch
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
            />
            <Label>Active</Label>
          </div>
          
          <Button onClick={handleSubmit} className="w-full" disabled={!formData.group_code || !formData.group_name}>
            {editingGroup ? 'Update' : 'Create'} Group
          </Button>
        </div>
      </MobileBottomSheet>
    </MobileLayout>
  );
}
