import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Loader2, Save, Upload, Eye } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { FONT_OPTIONS, RECEIPT_TYPES } from '@/lib/print-utils';
import { toast } from 'sonner';

interface ClientPrintSettings {
  id: string;
  receipt_type: string;
  logo_url: string | null;
  header_text: string | null;
  footer_text: string | null;
  custom_terms: string | null;
  font_size: number;
  show_logo: boolean;
  show_declaration: boolean;
  show_signature_section: boolean;
  show_terms: boolean;
  watermark_text: string | null;
  watermark_type: string;
}

export default function BrandingManager() {
  const { client } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedReceiptType, setSelectedReceiptType] = useState<string>('loan_receipt');
  const [settings, setSettings] = useState<Partial<ClientPrintSettings>>({
    logo_url: null,
    header_text: '',
    footer_text: '',
    custom_terms: '',
    font_size: 10,
    show_logo: true,
    show_declaration: true,
    show_signature_section: true,
    show_terms: true,
    watermark_text: '',
    watermark_type: 'none',
  });

  useEffect(() => {
    if (client?.id) {
      fetchSettings();
    }
  }, [client?.id, selectedReceiptType]);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('client_print_settings')
        .select('*')
        .eq('client_id', client!.id)
        .eq('receipt_type', selectedReceiptType)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setSettings({
          id: data.id,
          logo_url: data.logo_url,
          header_text: data.header_text || '',
          footer_text: data.footer_text || '',
          custom_terms: data.custom_terms || '',
          font_size: data.font_size || 10,
          show_logo: data.show_logo ?? true,
          show_declaration: data.show_declaration ?? true,
          show_signature_section: data.show_signature_section ?? true,
          show_terms: data.show_terms ?? true,
          watermark_text: data.watermark_text || '',
          watermark_type: data.watermark_type || 'none',
        });
      } else {
        // Reset to defaults if no settings exist
        setSettings({
          logo_url: null,
          header_text: '',
          footer_text: '',
          custom_terms: '',
          font_size: 10,
          show_logo: true,
          show_declaration: true,
          show_signature_section: true,
          show_terms: true,
          watermark_text: '',
          watermark_type: 'none',
        });
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!client?.id) return;

    setSaving(true);
    try {
      const data = {
        client_id: client.id,
        receipt_type: selectedReceiptType,
        header_text: settings.header_text || null,
        footer_text: settings.footer_text || null,
        custom_terms: settings.custom_terms || null,
        font_size: settings.font_size || 10,
        show_logo: settings.show_logo,
        show_declaration: settings.show_declaration,
        show_signature_section: settings.show_signature_section,
        show_terms: settings.show_terms,
        watermark_text: settings.watermark_text || null,
        watermark_type: settings.watermark_type || 'none',
      };

      if (settings.id) {
        // Update existing
        const { error } = await supabase
          .from('client_print_settings')
          .update(data)
          .eq('id', settings.id);

        if (error) throw error;
      } else {
        // Insert new
        const { error } = await supabase
          .from('client_print_settings')
          .insert(data);

        if (error) throw error;
      }

      toast.success('Settings saved successfully');
      fetchSettings();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
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
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Receipt Type:</span>
          <Select value={selectedReceiptType} onValueChange={setSelectedReceiptType}>
            <SelectTrigger className="w-48">
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
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Header & Footer */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Header & Footer</CardTitle>
            <CardDescription>Customize the header and footer text</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Header Text</Label>
              <Textarea
                placeholder="Enter header text (company name, address, etc.)"
                value={settings.header_text || ''}
                onChange={(e) => setSettings({ ...settings, header_text: e.target.value })}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>Footer Text</Label>
              <Textarea
                placeholder="Enter footer text (contact info, thank you message, etc.)"
                value={settings.footer_text || ''}
                onChange={(e) => setSettings({ ...settings, footer_text: e.target.value })}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Display Options */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Display Options</CardTitle>
            <CardDescription>Toggle visibility of different sections</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="show-logo">Show Company Logo</Label>
              <Switch
                id="show-logo"
                checked={settings.show_logo}
                onCheckedChange={(checked) => setSettings({ ...settings, show_logo: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="show-declaration">Show Declaration</Label>
              <Switch
                id="show-declaration"
                checked={settings.show_declaration}
                onCheckedChange={(checked) => setSettings({ ...settings, show_declaration: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="show-signature">Show Signature Section</Label>
              <Switch
                id="show-signature"
                checked={settings.show_signature_section}
                onCheckedChange={(checked) => setSettings({ ...settings, show_signature_section: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="show-terms">Show Terms & Conditions</Label>
              <Switch
                id="show-terms"
                checked={settings.show_terms}
                onCheckedChange={(checked) => setSettings({ ...settings, show_terms: checked })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Terms & Conditions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Terms & Conditions</CardTitle>
            <CardDescription>Custom terms to display on receipts</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder="Enter terms and conditions..."
              value={settings.custom_terms || ''}
              onChange={(e) => setSettings({ ...settings, custom_terms: e.target.value })}
              rows={6}
            />
          </CardContent>
        </Card>

        {/* Watermark */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Watermark</CardTitle>
            <CardDescription>Add a watermark to your receipts</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Watermark Type</Label>
              <Select
                value={settings.watermark_type}
                onValueChange={(value) => setSettings({ ...settings, watermark_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="text">Text</SelectItem>
                  <SelectItem value="image">Image (Logo)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {settings.watermark_type === 'text' && (
              <div className="space-y-2">
                <Label>Watermark Text</Label>
                <Input
                  placeholder="e.g., CONFIDENTIAL, COPY, etc."
                  value={settings.watermark_text || ''}
                  onChange={(e) => setSettings({ ...settings, watermark_text: e.target.value })}
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={fetchSettings}>
          Reset
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Settings
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
