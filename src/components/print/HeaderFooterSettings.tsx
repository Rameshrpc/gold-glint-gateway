import { useRef, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { usePrintSettings } from '@/hooks/usePrintSettings';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Upload, ImageIcon, X } from 'lucide-react';
import { toast } from 'sonner';

export function HeaderFooterSettings() {
  const { settings, loading, updateSettings } = usePrintSettings();
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
      const fileName = `logo-${Date.now()}.${fileExt}`;
      const filePath = `logos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('print-assets')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('print-assets')
        .getPublicUrl(filePath);

      await updateSettings({ logo_url: publicUrl });
      toast.success('Logo uploaded successfully');
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

  const handleRemoveLogo = async () => {
    try {
      await updateSettings({ logo_url: null });
      toast.success('Logo removed');
    } catch (error) {
      toast.error('Failed to remove logo');
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
    <Card>
      <CardHeader>
        <CardTitle>Header & Footer Settings</CardTitle>
        <CardDescription>Customize logo, header slogan and footer text (bilingual)</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Logo Upload Section */}
        <div className="space-y-3">
          <Label>Company Logo</Label>
          <div className="flex items-center gap-4">
            {settings.logo_url ? (
              <div className="relative">
                <img 
                  src={settings.logo_url} 
                  alt="Company Logo" 
                  className="w-20 h-20 object-contain border rounded-lg bg-muted"
                />
                <Button
                  size="icon"
                  variant="destructive"
                  className="absolute -top-2 -right-2 h-6 w-6"
                  onClick={handleRemoveLogo}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <div className="w-20 h-20 border-2 border-dashed rounded-lg flex items-center justify-center bg-muted/50">
                <ImageIcon className="h-8 w-8 text-muted-foreground" />
              </div>
            )}
            <div className="flex-1">
              <input
                ref={logoInputRef}
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="hidden"
              />
              <Button
                variant="outline"
                onClick={() => logoInputRef.current?.click()}
                disabled={uploadingLogo}
              >
                {uploadingLogo ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4 mr-2" />
                )}
                {settings.logo_url ? 'Change Logo' : 'Upload Logo'}
              </Button>
              <p className="text-xs text-muted-foreground mt-1">
                Recommended: Square image, max 2MB
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label>Company Slogan (English)</Label>
            <Input 
              value={settings.company_slogan_english || ''} 
              onChange={(e) => updateSettings({ company_slogan_english: e.target.value || null })}
              placeholder="Your trusted gold loan partner"
            />
          </div>
          <div className="space-y-2">
            <Label>Company Slogan (Tamil)</Label>
            <Input 
              value={settings.company_slogan_tamil || ''} 
              onChange={(e) => updateSettings({ company_slogan_tamil: e.target.value || null })}
              placeholder="உங்கள் நம்பகமான தங்க கடன் பங்காளி"
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label>Footer Text (English)</Label>
            <Textarea 
              value={settings.footer_english || ''} 
              onChange={(e) => updateSettings({ footer_english: e.target.value || null })}
              placeholder="Thank you for your business"
              rows={2}
            />
          </div>
          <div className="space-y-2">
            <Label>Footer Text (Tamil)</Label>
            <Textarea 
              value={settings.footer_tamil || ''} 
              onChange={(e) => updateSettings({ footer_tamil: e.target.value || null })}
              placeholder="உங்கள் வணிகத்திற்கு நன்றி"
              rows={2}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
