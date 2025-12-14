import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, X, Loader2, Image as ImageIcon, Save } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { ClientPrintSetting, PrintTemplate } from '@/hooks/usePrintSettings';

interface BrandingManagerProps {
  templates: PrintTemplate[];
  clientSettings: ClientPrintSetting[];
  loading: boolean;
  saveClientSetting: (setting: Partial<ClientPrintSetting> & { receipt_type: string }) => Promise<boolean>;
}

const RECEIPT_TYPES = [
  { value: 'loan', label: 'Loan Receipt' },
  { value: 'interest', label: 'Interest Receipt' },
  { value: 'redemption', label: 'Redemption Receipt' },
  { value: 'auction', label: 'Auction Notice' },
  { value: 'kyc', label: 'KYC Documents' },
  { value: 'declaration', label: 'Gold Declaration' },
];

const WATERMARK_TYPES = [
  { value: 'none', label: 'None' },
  { value: 'text', label: 'Text Watermark' },
  { value: 'image', label: 'Image Watermark' },
];

export function BrandingManager({
  templates,
  clientSettings,
  loading,
  saveClientSetting
}: BrandingManagerProps) {
  const { client } = useAuth();
  const [selectedType, setSelectedType] = useState('loan');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  const [settings, setSettings] = useState({
    template_id: '',
    header_text: '',
    footer_text: '',
    watermark_type: 'none',
    watermark_text: '',
    watermark_opacity: 15,
    show_logo: true,
    show_declaration: true,
    show_terms: false,
    show_signature_section: true,
    custom_terms: '',
    margins: { top: 30, right: 30, bottom: 30, left: 30 },
    font_size: 10,
    copies: 1,
  });

  // Load settings when receipt type changes
  useEffect(() => {
    const existing = clientSettings.find(s => s.receipt_type === selectedType);
    if (existing) {
      const defaultMargins = { top: 30, right: 30, bottom: 30, left: 30 };
      const existingMargins = existing.margins || defaultMargins;
      setSettings({
        template_id: existing.template_id || '',
        header_text: existing.header_text || '',
        footer_text: existing.footer_text || '',
        watermark_type: existing.watermark_type || 'none',
        watermark_text: existing.watermark_text || '',
        watermark_opacity: existing.watermark_opacity || 15,
        show_logo: existing.show_logo ?? true,
        show_declaration: existing.show_declaration ?? true,
        show_terms: existing.show_terms ?? false,
        show_signature_section: existing.show_signature_section ?? true,
        custom_terms: existing.custom_terms || '',
        margins: {
          top: existingMargins.top ?? 30,
          right: existingMargins.right ?? 30,
          bottom: existingMargins.bottom ?? 30,
          left: existingMargins.left ?? 30
        },
        font_size: existing.font_size || 10,
        copies: existing.copies || 1,
      });
      setLogoUrl(existing.logo_url);
    } else {
      setSettings({
        template_id: '',
        header_text: '',
        footer_text: '',
        watermark_type: 'none',
        watermark_text: '',
        watermark_opacity: 15,
        show_logo: true,
        show_declaration: true,
        show_terms: false,
        show_signature_section: true,
        custom_terms: '',
        margins: { top: 30, right: 30, bottom: 30, left: 30 },
        font_size: 10,
        copies: 1,
      });
      setLogoUrl(null);
    }
  }, [selectedType, clientSettings]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !client?.id) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error('File size must be less than 2MB');
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${client.id}/logo.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('branding-assets')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('branding-assets')
        .getPublicUrl(fileName);

      setLogoUrl(publicUrl);
      toast.success('Logo uploaded successfully');
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast.error('Failed to upload logo');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveLogo = async () => {
    setLogoUrl(null);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await saveClientSetting({
        receipt_type: selectedType,
        template_id: settings.template_id || null,
        logo_url: logoUrl,
        header_text: settings.header_text || null,
        footer_text: settings.footer_text || null,
        watermark_type: settings.watermark_type,
        watermark_text: settings.watermark_text || null,
        watermark_opacity: settings.watermark_opacity,
        show_logo: settings.show_logo,
        show_declaration: settings.show_declaration,
        show_terms: settings.show_terms,
        show_signature_section: settings.show_signature_section,
        custom_terms: settings.custom_terms || null,
        margins: settings.margins,
        font_size: settings.font_size,
        copies: settings.copies,
      });
    } finally {
      setSaving(false);
    }
  };

  const availableTemplates = templates.filter(
    t => t.receipt_type === selectedType && t.is_active
  );

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Logo Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Company Logo</CardTitle>
          <CardDescription>
            Upload your company logo for print documents
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-4">
            <div className="h-24 w-24 border-2 border-dashed rounded-lg flex items-center justify-center bg-muted/50 overflow-hidden">
              {logoUrl ? (
                <img src={logoUrl} alt="Logo" className="h-full w-full object-contain" />
              ) : (
                <ImageIcon className="h-8 w-8 text-muted-foreground" />
              )}
            </div>
            <div className="space-y-2">
              <div className="flex gap-2">
                <label className="cursor-pointer">
                  <Button variant="outline" size="sm" className="gap-2" asChild disabled={uploading}>
                    <span>
                      {uploading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Upload className="h-4 w-4" />
                      )}
                      Upload Logo
                    </span>
                  </Button>
                  <input
                    type="file"
                    accept="image/png,image/jpeg,image/svg+xml"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                </label>
                {logoUrl && (
                  <Button variant="ghost" size="sm" onClick={handleRemoveLogo}>
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Max 2MB, PNG/JPG/SVG formats
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Receipt Type Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Receipt Settings</CardTitle>
          <CardDescription>
            Configure print settings for each receipt type
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>Receipt Type</Label>
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-full sm:w-[280px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RECEIPT_TYPES.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Tabs defaultValue="template" className="space-y-4">
            <TabsList>
              <TabsTrigger value="template">Template</TabsTrigger>
              <TabsTrigger value="content">Content</TabsTrigger>
              <TabsTrigger value="watermark">Watermark</TabsTrigger>
              <TabsTrigger value="layout">Layout</TabsTrigger>
            </TabsList>

            <TabsContent value="template" className="space-y-4">
              <div className="space-y-2">
                <Label>Default Template</Label>
                <Select
                  value={settings.template_id}
                  onValueChange={(v) => setSettings({ ...settings, template_id: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a template" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableTemplates.map(t => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.template_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <Label>Display Options</Label>
                <div className="grid gap-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="show_logo" className="font-normal">Show Logo</Label>
                    <Switch
                      id="show_logo"
                      checked={settings.show_logo}
                      onCheckedChange={(v) => setSettings({ ...settings, show_logo: v })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="show_declaration" className="font-normal">Show Declaration</Label>
                    <Switch
                      id="show_declaration"
                      checked={settings.show_declaration}
                      onCheckedChange={(v) => setSettings({ ...settings, show_declaration: v })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="show_terms" className="font-normal">Show Terms & Conditions</Label>
                    <Switch
                      id="show_terms"
                      checked={settings.show_terms}
                      onCheckedChange={(v) => setSettings({ ...settings, show_terms: v })}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="show_signature" className="font-normal">Show Signature Section</Label>
                    <Switch
                      id="show_signature"
                      checked={settings.show_signature_section}
                      onCheckedChange={(v) => setSettings({ ...settings, show_signature_section: v })}
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="content" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="header_text">Header Text</Label>
                <Textarea
                  id="header_text"
                  placeholder="Enter custom header text..."
                  value={settings.header_text}
                  onChange={(e) => setSettings({ ...settings, header_text: e.target.value })}
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="footer_text">Footer Text</Label>
                <Textarea
                  id="footer_text"
                  placeholder="Enter custom footer text..."
                  value={settings.footer_text}
                  onChange={(e) => setSettings({ ...settings, footer_text: e.target.value })}
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="custom_terms">Custom Terms (if enabled)</Label>
                <Textarea
                  id="custom_terms"
                  placeholder="Enter custom terms and conditions..."
                  value={settings.custom_terms}
                  onChange={(e) => setSettings({ ...settings, custom_terms: e.target.value })}
                  rows={4}
                />
              </div>
            </TabsContent>

            <TabsContent value="watermark" className="space-y-4">
              <div className="space-y-2">
                <Label>Watermark Type</Label>
                <Select
                  value={settings.watermark_type}
                  onValueChange={(v) => setSettings({ ...settings, watermark_type: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {WATERMARK_TYPES.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {settings.watermark_type === 'text' && (
                <div className="space-y-2">
                  <Label htmlFor="watermark_text">Watermark Text</Label>
                  <Input
                    id="watermark_text"
                    placeholder="e.g., COPY, ORIGINAL"
                    value={settings.watermark_text}
                    onChange={(e) => setSettings({ ...settings, watermark_text: e.target.value })}
                  />
                </div>
              )}

              {settings.watermark_type !== 'none' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Opacity</Label>
                    <span className="text-sm text-muted-foreground">{settings.watermark_opacity}%</span>
                  </div>
                  <Slider
                    value={[settings.watermark_opacity]}
                    onValueChange={([v]) => setSettings({ ...settings, watermark_opacity: v })}
                    min={5}
                    max={30}
                    step={1}
                  />
                </div>
              )}
            </TabsContent>

            <TabsContent value="layout" className="space-y-4">
              <div className="space-y-2">
                <Label>Margins (mm)</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="margin_top" className="text-xs text-muted-foreground">Top</Label>
                    <Input
                      id="margin_top"
                      type="number"
                      value={settings.margins.top}
                      onChange={(e) => setSettings({
                        ...settings,
                        margins: { ...settings.margins, top: parseInt(e.target.value) || 0 }
                      })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="margin_right" className="text-xs text-muted-foreground">Right</Label>
                    <Input
                      id="margin_right"
                      type="number"
                      value={settings.margins.right}
                      onChange={(e) => setSettings({
                        ...settings,
                        margins: { ...settings.margins, right: parseInt(e.target.value) || 0 }
                      })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="margin_bottom" className="text-xs text-muted-foreground">Bottom</Label>
                    <Input
                      id="margin_bottom"
                      type="number"
                      value={settings.margins.bottom}
                      onChange={(e) => setSettings({
                        ...settings,
                        margins: { ...settings.margins, bottom: parseInt(e.target.value) || 0 }
                      })}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="margin_left" className="text-xs text-muted-foreground">Left</Label>
                    <Input
                      id="margin_left"
                      type="number"
                      value={settings.margins.left}
                      onChange={(e) => setSettings({
                        ...settings,
                        margins: { ...settings.margins, left: parseInt(e.target.value) || 0 }
                      })}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Font Size</Label>
                  <span className="text-sm text-muted-foreground">{settings.font_size}px</span>
                </div>
                <Slider
                  value={[settings.font_size]}
                  onValueChange={([v]) => setSettings({ ...settings, font_size: v })}
                  min={8}
                  max={14}
                  step={1}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="copies">Number of Copies</Label>
                <Select
                  value={settings.copies.toString()}
                  onValueChange={(v) => setSettings({ ...settings, copies: parseInt(v) })}
                >
                  <SelectTrigger className="w-[100px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1</SelectItem>
                    <SelectItem value="2">2</SelectItem>
                    <SelectItem value="3">3</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end pt-4 border-t">
            <Button onClick={handleSave} disabled={saving} className="gap-2">
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Save Settings
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
