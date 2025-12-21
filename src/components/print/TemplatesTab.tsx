import { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { usePrintTemplates, PrintTemplate, PrintTemplateInsert } from '@/hooks/usePrintTemplates';
import { Loader2, Plus, Trash2, Edit2, Copy, Star, Upload, ImageIcon, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface TemplateFormData {
  template_name: string;
  description: string;
  language: string;
  paper_size: string;
  font_family: string;
  include_loan_receipt: boolean;
  include_kyc_documents: boolean;
  include_jewel_image: boolean;
  include_gold_declaration: boolean;
  include_terms_conditions: boolean;
  loan_receipt_copies: number;
  kyc_documents_copies: number;
  jewel_image_copies: number;
  gold_declaration_copies: number;
  terms_conditions_copies: number;
  logo_url: string | null;
  footer_english: string;
  footer_tamil: string;
  company_slogan_english: string;
  company_slogan_tamil: string;
}

const DEFAULT_FORM_DATA: TemplateFormData = {
  template_name: '',
  description: '',
  language: 'bilingual',
  paper_size: 'A4',
  font_family: 'Roboto',
  include_loan_receipt: true,
  include_kyc_documents: true,
  include_jewel_image: true,
  include_gold_declaration: true,
  include_terms_conditions: true,
  loan_receipt_copies: 2,
  kyc_documents_copies: 1,
  jewel_image_copies: 1,
  gold_declaration_copies: 1,
  terms_conditions_copies: 1,
  logo_url: null,
  footer_english: 'Thank you for your business',
  footer_tamil: 'உங்கள் வணிகத்திற்கு நன்றி',
  company_slogan_english: '',
  company_slogan_tamil: '',
};

export function TemplatesTab() {
  const { templates, loading, saving, createTemplate, updateTemplate, deleteTemplate, setDefaultTemplate, cloneTemplate } = usePrintTemplates();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<PrintTemplate | null>(null);
  const [formData, setFormData] = useState<TemplateFormData>(DEFAULT_FORM_DATA);
  const [cloneDialogOpen, setCloneDialogOpen] = useState(false);
  const [cloneSourceId, setCloneSourceId] = useState<string | null>(null);
  const [cloneName, setCloneName] = useState('');
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Logo must be less than 2MB');
      return;
    }

    setUploadingLogo(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `template-logo-${Date.now()}.${fileExt}`;
      const filePath = `logos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('print-assets')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('print-assets')
        .getPublicUrl(filePath);

      setFormData(prev => ({ ...prev, logo_url: publicUrl }));
      toast.success('Logo uploaded');
    } catch (error: any) {
      console.error('Error uploading logo:', error);
      toast.error('Failed to upload logo');
    } finally {
      setUploadingLogo(false);
      if (logoInputRef.current) {
        logoInputRef.current.value = '';
      }
    }
  };

  const openCreateDialog = () => {
    setEditingTemplate(null);
    setFormData(DEFAULT_FORM_DATA);
    setIsDialogOpen(true);
  };

  const openEditDialog = (template: PrintTemplate) => {
    setEditingTemplate(template);
    setFormData({
      template_name: template.template_name,
      description: template.description || '',
      language: template.language,
      paper_size: template.paper_size,
      font_family: template.font_family,
      include_loan_receipt: template.include_loan_receipt,
      include_kyc_documents: template.include_kyc_documents,
      include_jewel_image: template.include_jewel_image,
      include_gold_declaration: template.include_gold_declaration,
      include_terms_conditions: template.include_terms_conditions,
      loan_receipt_copies: template.loan_receipt_copies,
      kyc_documents_copies: template.kyc_documents_copies,
      jewel_image_copies: template.jewel_image_copies,
      gold_declaration_copies: template.gold_declaration_copies,
      terms_conditions_copies: template.terms_conditions_copies,
      logo_url: template.logo_url,
      footer_english: template.footer_english || '',
      footer_tamil: template.footer_tamil || '',
      company_slogan_english: template.company_slogan_english || '',
      company_slogan_tamil: template.company_slogan_tamil || '',
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.template_name.trim()) {
      toast.error('Template name is required');
      return;
    }

    const templateData: PrintTemplateInsert = {
      template_name: formData.template_name,
      template_code: formData.template_name.toUpperCase().replace(/\s+/g, '_').substring(0, 20),
      description: formData.description || null,
      language: formData.language,
      paper_size: formData.paper_size,
      font_family: formData.font_family,
      include_loan_receipt: formData.include_loan_receipt,
      include_kyc_documents: formData.include_kyc_documents,
      include_jewel_image: formData.include_jewel_image,
      include_gold_declaration: formData.include_gold_declaration,
      include_terms_conditions: formData.include_terms_conditions,
      loan_receipt_copies: formData.loan_receipt_copies,
      kyc_documents_copies: formData.kyc_documents_copies,
      jewel_image_copies: formData.jewel_image_copies,
      gold_declaration_copies: formData.gold_declaration_copies,
      terms_conditions_copies: formData.terms_conditions_copies,
      logo_url: formData.logo_url,
      header_english: null,
      header_tamil: null,
      footer_english: formData.footer_english || null,
      footer_tamil: formData.footer_tamil || null,
      company_slogan_english: formData.company_slogan_english || null,
      company_slogan_tamil: formData.company_slogan_tamil || null,
      is_default: false,
      is_active: true,
    };

    if (editingTemplate) {
      await updateTemplate(editingTemplate.id, templateData);
    } else {
      await createTemplate(templateData);
    }
    setIsDialogOpen(false);
  };

  const handleClone = async () => {
    if (!cloneSourceId || !cloneName.trim()) return;
    await cloneTemplate(cloneSourceId, cloneName);
    setCloneDialogOpen(false);
    setCloneName('');
    setCloneSourceId(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Print Templates</CardTitle>
            <CardDescription>Create and manage reusable print configurations</CardDescription>
          </div>
          <Button onClick={openCreateDialog}>
            <Plus className="h-4 w-4 mr-2" />
            New Template
          </Button>
        </CardHeader>
        <CardContent>
          {templates.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>No templates yet. Create your first template to get started.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Template Name</TableHead>
                  <TableHead>Language</TableHead>
                  <TableHead>Paper Size</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {templates.map((template) => (
                  <TableRow key={template.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {template.is_default && (
                          <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                        )}
                        <div>
                          <p className="font-medium">{template.template_name}</p>
                          {template.description && (
                            <p className="text-sm text-muted-foreground">{template.description}</p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{template.language}</Badge>
                    </TableCell>
                    <TableCell>{template.paper_size}</TableCell>
                    <TableCell>
                      {template.is_active ? (
                        <Badge variant="secondary">Active</Badge>
                      ) : (
                        <Badge variant="outline">Inactive</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {!template.is_default && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            title="Set as Default"
                            onClick={() => setDefaultTemplate(template.id)}
                          >
                            <Star className="h-4 w-4" />
                          </Button>
                        )}
                        <Button 
                          variant="ghost" 
                          size="icon"
                          title="Clone"
                          onClick={() => {
                            setCloneSourceId(template.id);
                            setCloneName(`${template.template_name} (Copy)`);
                            setCloneDialogOpen(true);
                          }}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          title="Edit"
                          onClick={() => openEditDialog(template)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          title="Delete"
                          onClick={() => deleteTemplate(template.id)}
                          disabled={template.is_default}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Template Editor Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingTemplate ? 'Edit Template' : 'Create Template'}</DialogTitle>
            <DialogDescription>Configure print settings for this template</DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Template Name *</Label>
                <Input
                  value={formData.template_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, template_name: e.target.value }))}
                  placeholder="Standard Loan Documents"
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Input
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Optional description"
                />
              </div>
            </div>

            {/* Settings */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Language</Label>
                <Select 
                  value={formData.language} 
                  onValueChange={(val) => setFormData(prev => ({ ...prev, language: val }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bilingual">Bilingual</SelectItem>
                    <SelectItem value="english">English</SelectItem>
                    <SelectItem value="tamil">Tamil</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Paper Size</Label>
                <Select 
                  value={formData.paper_size} 
                  onValueChange={(val) => setFormData(prev => ({ ...prev, paper_size: val }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A4">A4</SelectItem>
                    <SelectItem value="Legal">Legal</SelectItem>
                    <SelectItem value="Letter">Letter</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Font Family</Label>
                <Select 
                  value={formData.font_family} 
                  onValueChange={(val) => setFormData(prev => ({ ...prev, font_family: val }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Roboto">Roboto</SelectItem>
                    <SelectItem value="Noto Sans">Noto Sans</SelectItem>
                    <SelectItem value="Poppins">Poppins</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Logo */}
            <div className="space-y-2">
              <Label>Template Logo</Label>
              <div className="flex items-center gap-4">
                {formData.logo_url ? (
                  <div className="relative">
                    <img 
                      src={formData.logo_url} 
                      alt="Template Logo" 
                      className="w-16 h-16 object-contain border rounded-lg bg-muted"
                    />
                    <Button
                      size="icon"
                      variant="destructive"
                      className="absolute -top-2 -right-2 h-5 w-5"
                      onClick={() => setFormData(prev => ({ ...prev, logo_url: null }))}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <div className="w-16 h-16 border-2 border-dashed rounded-lg flex items-center justify-center bg-muted/50">
                    <ImageIcon className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}
                <div>
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => logoInputRef.current?.click()}
                    disabled={uploadingLogo}
                  >
                    {uploadingLogo ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
                    Upload
                  </Button>
                </div>
              </div>
            </div>

            {/* Document Selection */}
            <div className="space-y-3">
              <Label>Documents & Copies</Label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { key: 'include_loan_receipt', label: 'Loan Receipt', copies: 'loan_receipt_copies' },
                  { key: 'include_kyc_documents', label: 'KYC Documents', copies: 'kyc_documents_copies' },
                  { key: 'include_jewel_image', label: 'Jewel Image', copies: 'jewel_image_copies' },
                  { key: 'include_gold_declaration', label: 'Gold Declaration', copies: 'gold_declaration_copies' },
                  { key: 'include_terms_conditions', label: 'Terms & Conditions', copies: 'terms_conditions_copies' },
                ].map(doc => (
                  <div key={doc.key} className="flex items-center justify-between p-2 border rounded">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={formData[doc.key as keyof TemplateFormData] as boolean}
                        onCheckedChange={(checked) => setFormData(prev => ({ ...prev, [doc.key]: checked }))}
                      />
                      <span className="text-sm">{doc.label}</span>
                    </div>
                    <Input
                      type="number"
                      min={1}
                      max={5}
                      value={formData[doc.copies as keyof TemplateFormData] as number}
                      onChange={(e) => setFormData(prev => ({ ...prev, [doc.copies]: parseInt(e.target.value) || 1 }))}
                      className="w-16 h-8 text-center"
                      disabled={!(formData[doc.key as keyof TemplateFormData] as boolean)}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Slogan & Footer */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Company Slogan (English)</Label>
                <Input
                  value={formData.company_slogan_english}
                  onChange={(e) => setFormData(prev => ({ ...prev, company_slogan_english: e.target.value }))}
                  placeholder="Your trusted partner"
                />
              </div>
              <div className="space-y-2">
                <Label>Company Slogan (Tamil)</Label>
                <Input
                  value={formData.company_slogan_tamil}
                  onChange={(e) => setFormData(prev => ({ ...prev, company_slogan_tamil: e.target.value }))}
                  placeholder="உங்கள் நம்பகமான பங்காளி"
                />
              </div>
              <div className="space-y-2">
                <Label>Footer (English)</Label>
                <Textarea
                  value={formData.footer_english}
                  onChange={(e) => setFormData(prev => ({ ...prev, footer_english: e.target.value }))}
                  rows={2}
                />
              </div>
              <div className="space-y-2">
                <Label>Footer (Tamil)</Label>
                <Textarea
                  value={formData.footer_tamil}
                  onChange={(e) => setFormData(prev => ({ ...prev, footer_tamil: e.target.value }))}
                  rows={2}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingTemplate ? 'Save Changes' : 'Create Template'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Clone Dialog */}
      <Dialog open={cloneDialogOpen} onOpenChange={setCloneDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Clone Template</DialogTitle>
            <DialogDescription>Create a copy of this template with a new name</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>New Template Name</Label>
              <Input
                value={cloneName}
                onChange={(e) => setCloneName(e.target.value)}
                placeholder="Template name"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCloneDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleClone} disabled={saving || !cloneName.trim()}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Clone
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
