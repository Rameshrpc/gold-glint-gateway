import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { Save, Upload, RefreshCw } from 'lucide-react';

interface PrintSettingsPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function PrintSettingsPanel({ open, onOpenChange }: PrintSettingsPanelProps) {
  const { client } = useAuth();
  const queryClient = useQueryClient();
  
  const [settings, setSettings] = useState({
    logoUrl: '',
    headerText: '',
    footerText: '',
    fontFamily: 'noto-sans-tamil',
    fontSize: 12,
    primaryColor: '#d97706',
    secondaryColor: '#1f2937',
    watermarkText: '',
    watermarkOpacity: 30,
    showLogo: true,
    showDeclaration: true,
    showSignatureSection: true,
    showTerms: true,
    copies: 1,
    customTermsEnglish: '',
    customTermsTamil: '',
  });

  // Fetch existing settings
  const { data: existingSettings, isLoading } = useQuery({
    queryKey: ['print-settings', client?.id],
    queryFn: async () => {
      if (!client?.id) return null;
      const { data, error } = await supabase
        .from('client_print_settings')
        .select('*')
        .eq('client_id', client.id)
        .eq('receipt_type', 'default')
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!client?.id,
  });

  // Save settings mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!client?.id) throw new Error('No client');
      
      const { error } = await supabase
        .from('client_print_settings')
        .upsert({
          client_id: client.id,
          receipt_type: 'default',
          logo_url: settings.logoUrl,
          header_text: settings.headerText,
          footer_text: settings.footerText,
          font_size: settings.fontSize,
          watermark_text: settings.watermarkText,
          watermark_opacity: settings.watermarkOpacity,
          show_logo: settings.showLogo,
          show_declaration: settings.showDeclaration,
          show_signature_section: settings.showSignatureSection,
          show_terms: settings.showTerms,
          copies: settings.copies,
          custom_terms: settings.customTermsEnglish,
          template_config: {
            fontFamily: settings.fontFamily,
            primaryColor: settings.primaryColor,
            secondaryColor: settings.secondaryColor,
            customTermsTamil: settings.customTermsTamil,
          },
        }, {
          onConflict: 'client_id,receipt_type',
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['print-settings'] });
      toast.success('Print settings saved');
    },
    onError: () => {
      toast.error('Failed to save settings');
    },
  });

  // Load existing settings
  useState(() => {
    if (existingSettings) {
      const config = existingSettings.template_config as any || {};
      setSettings({
        logoUrl: existingSettings.logo_url || '',
        headerText: existingSettings.header_text || '',
        footerText: existingSettings.footer_text || '',
        fontFamily: config.fontFamily || 'noto-sans-tamil',
        fontSize: existingSettings.font_size || 12,
        primaryColor: config.primaryColor || '#d97706',
        secondaryColor: config.secondaryColor || '#1f2937',
        watermarkText: existingSettings.watermark_text || '',
        watermarkOpacity: existingSettings.watermark_opacity || 30,
        showLogo: existingSettings.show_logo ?? true,
        showDeclaration: existingSettings.show_declaration ?? true,
        showSignatureSection: existingSettings.show_signature_section ?? true,
        showTerms: existingSettings.show_terms ?? true,
        copies: existingSettings.copies || 1,
        customTermsEnglish: existingSettings.custom_terms || '',
        customTermsTamil: config.customTermsTamil || '',
      });
    }
  });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Print Settings</SheetTitle>
          <SheetDescription>
            Customize print templates for all documents
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-12rem)] mt-4">
          <Tabs defaultValue="general" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="style">Style</TabsTrigger>
              <TabsTrigger value="content">Content</TabsTrigger>
              <TabsTrigger value="terms">Terms</TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-4 mt-4">
              {/* Logo Upload */}
              <div className="space-y-2">
                <Label>Company Logo</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Logo URL"
                    value={settings.logoUrl}
                    onChange={(e) => setSettings({ ...settings, logoUrl: e.target.value })}
                  />
                  <Button variant="outline" size="icon">
                    <Upload className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">Enter URL or upload logo</p>
              </div>

              <Separator />

              {/* Display Options */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Display Options</Label>
                
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-normal">Show Logo</Label>
                  <Switch
                    checked={settings.showLogo}
                    onCheckedChange={(v) => setSettings({ ...settings, showLogo: v })}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-normal">Show Declaration</Label>
                  <Switch
                    checked={settings.showDeclaration}
                    onCheckedChange={(v) => setSettings({ ...settings, showDeclaration: v })}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-normal">Show Signatures</Label>
                  <Switch
                    checked={settings.showSignatureSection}
                    onCheckedChange={(v) => setSettings({ ...settings, showSignatureSection: v })}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-normal">Show Terms</Label>
                  <Switch
                    checked={settings.showTerms}
                    onCheckedChange={(v) => setSettings({ ...settings, showTerms: v })}
                  />
                </div>
              </div>

              <Separator />

              {/* Print Copies */}
              <div className="space-y-2">
                <Label>Default Copies</Label>
                <Select
                  value={String(settings.copies)}
                  onValueChange={(v) => setSettings({ ...settings, copies: Number(v) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 Copy</SelectItem>
                    <SelectItem value="2">2 Copies</SelectItem>
                    <SelectItem value="3">3 Copies</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>

            <TabsContent value="style" className="space-y-4 mt-4">
              {/* Font Family */}
              <div className="space-y-2">
                <Label>Font Family</Label>
                <Select
                  value={settings.fontFamily}
                  onValueChange={(v) => setSettings({ ...settings, fontFamily: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="noto-sans-tamil">Noto Sans Tamil</SelectItem>
                    <SelectItem value="catamaran">Catamaran</SelectItem>
                    <SelectItem value="mukta-malar">Mukta Malar</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Font Size */}
              <div className="space-y-2">
                <Label>Base Font Size: {settings.fontSize}px</Label>
                <Slider
                  value={[settings.fontSize]}
                  onValueChange={([v]) => setSettings({ ...settings, fontSize: v })}
                  min={10}
                  max={16}
                  step={1}
                />
              </div>

              <Separator />

              {/* Colors */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Colors</Label>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs">Primary</Label>
                    <div className="flex gap-2">
                      <div
                        className="w-8 h-8 rounded border"
                        style={{ backgroundColor: settings.primaryColor }}
                      />
                      <Input
                        type="color"
                        value={settings.primaryColor}
                        onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })}
                        className="w-full h-8"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-xs">Secondary</Label>
                    <div className="flex gap-2">
                      <div
                        className="w-8 h-8 rounded border"
                        style={{ backgroundColor: settings.secondaryColor }}
                      />
                      <Input
                        type="color"
                        value={settings.secondaryColor}
                        onChange={(e) => setSettings({ ...settings, secondaryColor: e.target.value })}
                        className="w-full h-8"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Watermark */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Watermark</Label>
                
                <Input
                  placeholder="Custom watermark text"
                  value={settings.watermarkText}
                  onChange={(e) => setSettings({ ...settings, watermarkText: e.target.value })}
                />
                
                <div className="space-y-2">
                  <Label className="text-xs">Opacity: {settings.watermarkOpacity}%</Label>
                  <Slider
                    value={[settings.watermarkOpacity]}
                    onValueChange={([v]) => setSettings({ ...settings, watermarkOpacity: v })}
                    min={10}
                    max={50}
                    step={5}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="content" className="space-y-4 mt-4">
              {/* Header Text */}
              <div className="space-y-2">
                <Label>Custom Header Text</Label>
                <Textarea
                  placeholder="Additional header information..."
                  value={settings.headerText}
                  onChange={(e) => setSettings({ ...settings, headerText: e.target.value })}
                  rows={3}
                />
              </div>

              {/* Footer Text */}
              <div className="space-y-2">
                <Label>Custom Footer Text</Label>
                <Textarea
                  placeholder="Additional footer information..."
                  value={settings.footerText}
                  onChange={(e) => setSettings({ ...settings, footerText: e.target.value })}
                  rows={3}
                />
              </div>
            </TabsContent>

            <TabsContent value="terms" className="space-y-4 mt-4">
              {/* Terms in English */}
              <div className="space-y-2">
                <Label>Terms & Conditions (English)</Label>
                <Textarea
                  placeholder="Enter terms and conditions in English..."
                  value={settings.customTermsEnglish}
                  onChange={(e) => setSettings({ ...settings, customTermsEnglish: e.target.value })}
                  rows={6}
                />
              </div>

              {/* Terms in Tamil */}
              <div className="space-y-2">
                <Label>Terms & Conditions (Tamil)</Label>
                <Textarea
                  placeholder="விதிமுறைகள் மற்றும் நிபந்தனைகளை தமிழில் உள்ளிடவும்..."
                  value={settings.customTermsTamil}
                  onChange={(e) => setSettings({ ...settings, customTermsTamil: e.target.value })}
                  rows={6}
                  className="font-tamil"
                />
              </div>
            </TabsContent>
          </Tabs>
        </ScrollArea>

        {/* Save Button */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t bg-background">
          <Button
            className="w-full"
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
          >
            {saveMutation.isPending ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Settings
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
