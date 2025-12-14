import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Edit2, Trash2, FileText, GripVertical } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { PROFILE_TYPES, DOCUMENT_TYPES } from '@/lib/print-utils';

interface PrintProfile {
  id: string;
  profile_name: string;
  profile_type: string;
  description: string | null;
  is_default: boolean | null;
  is_active: boolean | null;
  documents?: PrintProfileDocument[];
}

interface PrintProfileDocument {
  id: string;
  document_type: string;
  template_id: string | null;
  print_order: number;
  copies: number | null;
  is_required: boolean | null;
}

interface PrintTemplate {
  id: string;
  template_name: string;
  receipt_type: string;
}

export default function PrintProfilesManager() {
  const { profile } = useAuth();
  const [profiles, setProfiles] = useState<PrintProfile[]>([]);
  const [templates, setTemplates] = useState<PrintTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<PrintProfile | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    profile_name: '',
    profile_type: 'loan',
    description: '',
    is_default: false,
    documents: [] as { document_type: string; copies: number; is_required: boolean }[]
  });

  useEffect(() => {
    fetchProfiles();
    fetchTemplates();
  }, [profile?.client_id]);

  const fetchProfiles = async () => {
    if (!profile?.client_id) return;
    
    try {
      const { data: profilesData, error: profilesError } = await supabase
        .from('print_profiles')
        .select('*')
        .eq('client_id', profile.client_id)
        .order('profile_type');

      if (profilesError) throw profilesError;

      // Fetch documents for each profile
      const profilesWithDocs = await Promise.all(
        (profilesData || []).map(async (p) => {
          const { data: docs } = await supabase
            .from('print_profile_documents')
            .select('*')
            .eq('profile_id', p.id)
            .order('print_order');
          return { ...p, documents: docs || [] };
        })
      );

      setProfiles(profilesWithDocs);
    } catch (error) {
      console.error('Error fetching profiles:', error);
      toast.error('Failed to load print profiles');
    } finally {
      setLoading(false);
    }
  };

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('print_templates')
        .select('id, template_name, receipt_type')
        .eq('is_active', true);

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
  };

  const handleCreateNew = () => {
    setEditingProfile(null);
    setFormData({
      profile_name: '',
      profile_type: 'loan',
      description: '',
      is_default: false,
      documents: []
    });
    setDialogOpen(true);
  };

  const handleEdit = (profile: PrintProfile) => {
    setEditingProfile(profile);
    setFormData({
      profile_name: profile.profile_name,
      profile_type: profile.profile_type,
      description: profile.description || '',
      is_default: profile.is_default || false,
      documents: profile.documents?.map(d => ({
        document_type: d.document_type,
        copies: d.copies || 1,
        is_required: d.is_required || true
      })) || []
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this print profile?')) return;

    try {
      const { error } = await supabase
        .from('print_profiles')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Print profile deleted');
      fetchProfiles();
    } catch (error) {
      console.error('Error deleting profile:', error);
      toast.error('Failed to delete profile');
    }
  };

  const handleSave = async () => {
    if (!profile?.client_id || !formData.profile_name.trim()) {
      toast.error('Profile name is required');
      return;
    }

    try {
      if (editingProfile) {
        // Update existing profile
        const { error: profileError } = await supabase
          .from('print_profiles')
          .update({
            profile_name: formData.profile_name,
            profile_type: formData.profile_type,
            description: formData.description || null,
            is_default: formData.is_default,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingProfile.id);

        if (profileError) throw profileError;

        // Delete old documents and insert new ones
        await supabase
          .from('print_profile_documents')
          .delete()
          .eq('profile_id', editingProfile.id);

        if (formData.documents.length > 0) {
          const { error: docsError } = await supabase
            .from('print_profile_documents')
            .insert(
              formData.documents.map((d, index) => ({
                profile_id: editingProfile.id,
                document_type: d.document_type,
                print_order: index + 1,
                copies: d.copies,
                is_required: d.is_required
              }))
            );

          if (docsError) throw docsError;
        }

        toast.success('Print profile updated');
      } else {
        // Create new profile
        const { data: newProfile, error: profileError } = await supabase
          .from('print_profiles')
          .insert({
            client_id: profile.client_id,
            profile_name: formData.profile_name,
            profile_type: formData.profile_type,
            description: formData.description || null,
            is_default: formData.is_default
          })
          .select()
          .single();

        if (profileError) throw profileError;

        // Insert documents
        if (formData.documents.length > 0) {
          const { error: docsError } = await supabase
            .from('print_profile_documents')
            .insert(
              formData.documents.map((d, index) => ({
                profile_id: newProfile.id,
                document_type: d.document_type,
                print_order: index + 1,
                copies: d.copies,
                is_required: d.is_required
              }))
            );

          if (docsError) throw docsError;
        }

        toast.success('Print profile created');
      }

      setDialogOpen(false);
      fetchProfiles();
    } catch (error: any) {
      console.error('Error saving profile:', error);
      toast.error(error.message || 'Failed to save profile');
    }
  };

  const toggleDocument = (docType: string) => {
    const exists = formData.documents.find(d => d.document_type === docType);
    if (exists) {
      setFormData({
        ...formData,
        documents: formData.documents.filter(d => d.document_type !== docType)
      });
    } else {
      setFormData({
        ...formData,
        documents: [...formData.documents, { document_type: docType, copies: 1, is_required: true }]
      });
    }
  };

  const updateDocumentCopies = (docType: string, copies: number) => {
    setFormData({
      ...formData,
      documents: formData.documents.map(d =>
        d.document_type === docType ? { ...d, copies } : d
      )
    });
  };

  const getProfileTypeLabel = (type: string) =>
    PROFILE_TYPES.find(p => p.value === type)?.label || type;

  const getDocumentLabel = (type: string) =>
    DOCUMENT_TYPES.find(d => d.value === type)?.label || type;

  const getAvailableDocuments = () => {
    const profileType = PROFILE_TYPES.find(p => p.value === formData.profile_type);
    return profileType?.documents || [];
  };

  if (loading) {
    return <div className="flex items-center justify-center p-8">Loading...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">Print Profiles</h3>
          <p className="text-sm text-muted-foreground">
            Create profiles that combine multiple documents into a single print action
          </p>
        </div>
        <Button onClick={handleCreateNew}>
          <Plus className="h-4 w-4 mr-2" />
          Create Profile
        </Button>
      </div>

      {profiles.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No print profiles created yet</p>
            <Button variant="link" onClick={handleCreateNew}>
              Create your first profile
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {profiles.map((p) => (
            <Card key={p.id}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      {p.profile_name}
                      {p.is_default && <Badge variant="secondary">Default</Badge>}
                    </CardTitle>
                    <CardDescription>{getProfileTypeLabel(p.profile_type)}</CardDescription>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => handleEdit(p)}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(p.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {p.description && (
                  <p className="text-sm text-muted-foreground mb-2">{p.description}</p>
                )}
                <div className="flex flex-wrap gap-1">
                  {p.documents?.map((doc) => (
                    <Badge key={doc.id} variant="outline" className="text-xs">
                      {getDocumentLabel(doc.document_type)}
                      {doc.copies && doc.copies > 1 && ` ×${doc.copies}`}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingProfile ? 'Edit Print Profile' : 'Create Print Profile'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="profile_name">Profile Name</Label>
              <Input
                id="profile_name"
                value={formData.profile_name}
                onChange={(e) => setFormData({ ...formData, profile_name: e.target.value })}
                placeholder="e.g., Standard Loan Print"
              />
            </div>

            <div>
              <Label htmlFor="profile_type">Profile Type</Label>
              <Select
                value={formData.profile_type}
                onValueChange={(value) => setFormData({ ...formData, profile_type: value, documents: [] })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PROFILE_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="description">Description (Optional)</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of this profile"
              />
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="is_default"
                checked={formData.is_default}
                onCheckedChange={(checked) => setFormData({ ...formData, is_default: !!checked })}
              />
              <Label htmlFor="is_default" className="font-normal">
                Set as default for {getProfileTypeLabel(formData.profile_type)}
              </Label>
            </div>

            <div>
              <Label className="mb-2 block">Documents to Include</Label>
              <div className="space-y-2 border rounded-md p-3">
                {getAvailableDocuments().map((docType) => {
                  const isSelected = formData.documents.some(d => d.document_type === docType);
                  const doc = formData.documents.find(d => d.document_type === docType);
                  
                  return (
                    <div key={docType} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleDocument(docType)}
                        />
                        <span className="text-sm">{getDocumentLabel(docType)}</span>
                      </div>
                      {isSelected && (
                        <div className="flex items-center gap-1">
                          <Label className="text-xs text-muted-foreground">Copies:</Label>
                          <Input
                            type="number"
                            min={1}
                            max={5}
                            value={doc?.copies || 1}
                            onChange={(e) => updateDocumentCopies(docType, parseInt(e.target.value) || 1)}
                            className="w-14 h-7 text-xs"
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              {editingProfile ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
