import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useBranchPrintSettings } from '@/hooks/useBranchPrintSettings';
import { usePrintTemplates } from '@/hooks/usePrintTemplates';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Upload, ImageIcon, X, Building2 } from 'lucide-react';
import { toast } from 'sonner';

interface Branch {
  id: string;
  branch_name: string;
  branch_code: string;
}

export function BranchPrintSettingsTab() {
  const { client } = useAuth();
  const { branchSettings, loading: loadingSettings, saving, getBranchSettings, upsertBranchSettings } = useBranchPrintSettings();
  const { templates, loading: loadingTemplates } = usePrintTemplates();
  
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loadingBranches, setLoadingBranches] = useState(true);
  const [selectedBranchId, setSelectedBranchId] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [formData, setFormData] = useState({
    default_template_id: '',
    logo_url: '',
    use_client_logo: true,
    company_slogan_english: '',
    company_slogan_tamil: '',
    footer_english: '',
    footer_tamil: '',
  });

  useEffect(() => {
    if (!client?.id) return;
    
    const fetchBranches = async () => {
      setLoadingBranches(true);
      const { data } = await supabase
        .from('branches')
        .select('id, branch_name, branch_code')
        .eq('client_id', client.id)
        .eq('is_active', true)
        .order('branch_name');
      
      setBranches(data || []);
      setLoadingBranches(false);
    };

    fetchBranches();
  }, [client?.id]);

  useEffect(() => {
    if (selectedBranchId) {
      const settings = getBranchSettings(selectedBranchId);
      if (settings) {
        setFormData({
          default_template_id: settings.default_template_id || '',
          logo_url: settings.logo_url || '',
          use_client_logo: settings.use_client_logo,
          company_slogan_english: settings.company_slogan_english || '',
          company_slogan_tamil: settings.company_slogan_tamil || '',
          footer_english: settings.footer_english || '',
          footer_tamil: settings.footer_tamil || '',
        });
      } else {
        setFormData({
          default_template_id: '',
          logo_url: '',
          use_client_logo: true,
          company_slogan_english: '',
          company_slogan_tamil: '',
          footer_english: '',
          footer_tamil: '',
        });
      }
    }
  }, [selectedBranchId, branchSettings, getBranchSettings]);

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
      const fileName = `branch-logo-${selectedBranchId}-${Date.now()}.${fileExt}`;
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

  const handleSave = async () => {
    if (!selectedBranchId) return;

    await upsertBranchSettings(selectedBranchId, {
      default_template_id: formData.default_template_id || null,
      logo_url: formData.logo_url || null,
      use_client_logo: formData.use_client_logo,
      company_slogan_english: formData.company_slogan_english || null,
      company_slogan_tamil: formData.company_slogan_tamil || null,
      footer_english: formData.footer_english || null,
      footer_tamil: formData.footer_tamil || null,
    });
  };

  const selectedBranch = branches.find(b => b.id === selectedBranchId);
  const hasSettings = selectedBranchId ? !!getBranchSettings(selectedBranchId) : false;

  if (loadingBranches || loadingSettings || loadingTemplates) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Branch Print Settings
          </CardTitle>
          <CardDescription>
            Customize print settings per branch. Branch settings override client defaults.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Branch Selector */}
          <div className="space-y-2">
            <Label>Select Branch</Label>
            <Select value={selectedBranchId || ''} onValueChange={setSelectedBranchId}>
              <SelectTrigger className="w-full max-w-sm">
                <SelectValue placeholder="Select a branch to configure" />
              </SelectTrigger>
              <SelectContent>
                {branches.map(branch => (
                  <SelectItem key={branch.id} value={branch.id}>
                    <div className="flex items-center gap-2">
                      {branch.branch_name}
                      <Badge variant="outline" className="text-xs">{branch.branch_code}</Badge>
                      {getBranchSettings(branch.id) && (
                        <Badge variant="secondary" className="text-xs">Configured</Badge>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedBranchId && (
            <>
              {/* Template Assignment */}
              <div className="space-y-2">
                <Label>Default Print Template</Label>
                <Select 
                  value={formData.default_template_id} 
                  onValueChange={(val) => setFormData(prev => ({ ...prev, default_template_id: val }))}
                >
                  <SelectTrigger className="w-full max-w-sm">
                    <SelectValue placeholder="Use client default" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Use Client Default</SelectItem>
                    {templates.map(template => (
                      <SelectItem key={template.id} value={template.id}>
                        <div className="flex items-center gap-2">
                          {template.template_name}
                          {template.is_default && <Badge variant="secondary" className="text-xs">Default</Badge>}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Assign a template for this branch. If not set, the client default template is used.
                </p>
              </div>

              {/* Logo Settings */}
              <div className="space-y-4 border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Use Client Logo</Label>
                    <p className="text-xs text-muted-foreground">Use the main company logo for this branch</p>
                  </div>
                  <Switch
                    checked={formData.use_client_logo}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, use_client_logo: checked }))}
                  />
                </div>

                {!formData.use_client_logo && (
                  <div className="space-y-2">
                    <Label>Branch Logo</Label>
                    <div className="flex items-center gap-4">
                      {formData.logo_url ? (
                        <div className="relative">
                          <img 
                            src={formData.logo_url} 
                            alt="Branch Logo" 
                            className="w-16 h-16 object-contain border rounded-lg bg-muted"
                          />
                          <Button
                            size="icon"
                            variant="destructive"
                            className="absolute -top-2 -right-2 h-5 w-5"
                            onClick={() => setFormData(prev => ({ ...prev, logo_url: '' }))}
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
                )}
              </div>

              {/* Override Slogan & Footer */}
              <div className="space-y-4">
                <Label>Override Slogan & Footer (Optional)</Label>
                <p className="text-xs text-muted-foreground mb-2">
                  Leave empty to use template or client defaults
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs">Slogan (English)</Label>
                    <Input
                      value={formData.company_slogan_english}
                      onChange={(e) => setFormData(prev => ({ ...prev, company_slogan_english: e.target.value }))}
                      placeholder="Use default"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Slogan (Tamil)</Label>
                    <Input
                      value={formData.company_slogan_tamil}
                      onChange={(e) => setFormData(prev => ({ ...prev, company_slogan_tamil: e.target.value }))}
                      placeholder="Use default"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Footer (English)</Label>
                    <Textarea
                      value={formData.footer_english}
                      onChange={(e) => setFormData(prev => ({ ...prev, footer_english: e.target.value }))}
                      placeholder="Use default"
                      rows={2}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Footer (Tamil)</Label>
                    <Textarea
                      value={formData.footer_tamil}
                      onChange={(e) => setFormData(prev => ({ ...prev, footer_tamil: e.target.value }))}
                      placeholder="Use default"
                      rows={2}
                    />
                  </div>
                </div>
              </div>

              <Button onClick={handleSave} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {hasSettings ? 'Update Settings' : 'Save Settings'}
              </Button>
            </>
          )}

          {!selectedBranchId && branches.length > 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Select a branch to configure its print settings
            </div>
          )}

          {branches.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No branches found. Create branches first to configure print settings.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
