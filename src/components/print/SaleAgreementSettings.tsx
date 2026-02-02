import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { usePrintSettings } from '@/hooks/usePrintSettings';
import { Loader2, Upload, X, Image as ImageIcon } from 'lucide-react';
import { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

export function SaleAgreementSettings() {
  const { settings, loading, updateSettings, saving } = usePrintSettings();
  const { client } = useAuth();
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !client?.id) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be less than 2MB');
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `sale-agreement-logo-${client.id}.${fileExt}`;
      const filePath = `${client.id}/${fileName}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('print-assets')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('print-assets')
        .getPublicUrl(filePath);

      // Save URL to settings
      await updateSettings({ sale_agreement_logo_url: publicUrl });
      toast.success('Logo uploaded successfully');
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast.error('Failed to upload logo');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveLogo = async () => {
    await updateSettings({ sale_agreement_logo_url: null });
    toast.success('Logo removed');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sale Agreement Settings</CardTitle>
        <CardDescription>
          Configure settings specific to Sale Agreement (Trading Format) documents
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Logo Upload for Zamin Gold */}
        <div className="space-y-3">
          <Label>Logo for Sale Agreements</Label>
          <div className="flex items-start gap-4">
            {/* Logo Preview */}
            <div className="w-24 h-24 border rounded-lg flex items-center justify-center bg-muted overflow-hidden">
              {settings.sale_agreement_logo_url ? (
                <img
                  src={settings.sale_agreement_logo_url}
                  alt="Sale Agreement Logo"
                  className="max-w-full max-h-full object-contain"
                />
              ) : (
                <ImageIcon className="h-8 w-8 text-muted-foreground" />
              )}
            </div>
            
            {/* Upload/Remove Buttons */}
            <div className="flex flex-col gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="hidden"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading || saving}
              >
                {uploading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Upload className="h-4 w-4 mr-2" />
                )}
                Upload Logo
              </Button>
              {settings.sale_agreement_logo_url && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRemoveLogo}
                  disabled={saving}
                  className="text-destructive hover:text-destructive"
                >
                  <X className="h-4 w-4 mr-2" />
                  Remove
                </Button>
              )}
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            This logo will appear on KYC Documents and Jewel Image when printing Sale Agreements.
            If not set, the main company logo will be used.
          </p>
        </div>

        <div className="space-y-2">
          <Label>Company Name for Sale Agreements</Label>
          <Input
            value={settings.sale_agreement_company_name || ''}
            onChange={(e) => updateSettings({ 
              sale_agreement_company_name: e.target.value || null 
            })}
            placeholder="e.g., ZAMIN GOLD (leave empty to use main company name)"
          />
          <p className="text-sm text-muted-foreground">
            This name will appear on Sale Agreement documents as the buyer (e.g., "M/s. ZAMIN GOLD"). 
            If left empty, the main company name will be used.
          </p>
        </div>

        <div className="space-y-2">
          <Label>Company Address for Sale Agreements</Label>
          <Input
            value={settings.sale_agreement_company_address || ''}
            onChange={(e) => updateSettings({ 
              sale_agreement_company_address: e.target.value || null 
            })}
            placeholder="Enter the full address for ZAMIN GOLD"
          />
          <p className="text-sm text-muted-foreground">
            This address will appear on Sale Agreement documents. 
            If left empty, the main company address will be used.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
