import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Slider } from '@/components/ui/slider';
import { Upload, Image, Type, X } from 'lucide-react';
import { usePrintSettings, useSavePrintSettings, useUploadBrandingAsset } from '@/hooks/usePrintSettings';
import { toast } from 'sonner';

export function BrandingTab() {
  const { data: settings } = usePrintSettings();
  const saveMutation = useSavePrintSettings();
  const uploadMutation = useUploadBrandingAsset();

  // Get the first settings record for global branding
  const currentSettings = settings?.[0];

  const [logoUrl, setLogoUrl] = useState(currentSettings?.logo_url || '');
  const [watermarkType, setWatermarkType] = useState<'none' | 'text' | 'image'>(
    (currentSettings?.watermark_type as 'none' | 'text' | 'image') || 'none'
  );
  const [watermarkText, setWatermarkText] = useState(currentSettings?.watermark_text || '');
  const [watermarkImageUrl, setWatermarkImageUrl] = useState(currentSettings?.watermark_image_url || '');
  const [watermarkOpacity, setWatermarkOpacity] = useState(currentSettings?.watermark_opacity || 15);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 500 * 1024) {
      toast.error('Logo must be less than 500KB');
      return;
    }

    try {
      const url = await uploadMutation.mutateAsync({ file, type: 'logo' });
      setLogoUrl(url);
      toast.success('Logo uploaded successfully');
    } catch (error) {
      console.error(error);
    }
  };

  const handleWatermarkUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 500 * 1024) {
      toast.error('Watermark must be less than 500KB');
      return;
    }

    try {
      const url = await uploadMutation.mutateAsync({ file, type: 'watermark' });
      setWatermarkImageUrl(url);
      toast.success('Watermark uploaded successfully');
    } catch (error) {
      console.error(error);
    }
  };

  const handleSave = () => {
    // Save branding for all receipt types
    const receiptTypes = ['loan', 'interest', 'redemption', 'auction'];
    receiptTypes.forEach(type => {
      saveMutation.mutate({
        receipt_type: type,
        logo_url: logoUrl,
        watermark_type: watermarkType,
        watermark_text: watermarkText,
        watermark_image_url: watermarkImageUrl,
        watermark_opacity: watermarkOpacity,
      });
    });
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Logo Upload */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Image className="h-5 w-5 text-primary" />
            Company Logo
          </CardTitle>
          <CardDescription>
            Upload your company logo to display on all receipts
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-center w-full">
            {logoUrl ? (
              <div className="relative">
                <img 
                  src={logoUrl} 
                  alt="Company Logo" 
                  className="max-h-32 max-w-full object-contain border rounded-lg p-2"
                />
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute -top-2 -right-2 h-6 w-6"
                  onClick={() => setLogoUrl('')}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Click to upload logo
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    PNG, JPG up to 500KB
                  </p>
                </div>
                <input 
                  type="file" 
                  className="hidden" 
                  accept="image/png,image/jpeg"
                  onChange={handleLogoUpload}
                />
              </label>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Watermark Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Type className="h-5 w-5 text-primary" />
            Watermark Settings
          </CardTitle>
          <CardDescription>
            Add a watermark to your receipts for branding or security
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <RadioGroup 
            value={watermarkType} 
            onValueChange={(v) => setWatermarkType(v as 'none' | 'text' | 'image')}
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="none" id="none" />
              <Label htmlFor="none">No Watermark</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="text" id="text" />
              <Label htmlFor="text">Text Watermark</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="image" id="image" />
              <Label htmlFor="image">Image Watermark</Label>
            </div>
          </RadioGroup>

          {watermarkType === 'text' && (
            <div className="space-y-2">
              <Label>Watermark Text</Label>
              <Input
                value={watermarkText}
                onChange={(e) => setWatermarkText(e.target.value)}
                placeholder="e.g., CONFIDENTIAL, COPY, Company Name"
              />
            </div>
          )}

          {watermarkType === 'image' && (
            <div className="space-y-2">
              <Label>Watermark Image</Label>
              {watermarkImageUrl ? (
                <div className="relative inline-block">
                  <img 
                    src={watermarkImageUrl} 
                    alt="Watermark" 
                    className="max-h-20 object-contain opacity-50 border rounded p-1"
                  />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute -top-2 -right-2 h-5 w-5"
                    onClick={() => setWatermarkImageUrl('')}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <label className="flex items-center gap-2 cursor-pointer p-2 border rounded hover:bg-muted/50">
                  <Upload className="h-4 w-4" />
                  <span className="text-sm">Upload watermark image</span>
                  <input 
                    type="file" 
                    className="hidden" 
                    accept="image/png,image/jpeg"
                    onChange={handleWatermarkUpload}
                  />
                </label>
              )}
            </div>
          )}

          {watermarkType !== 'none' && (
            <div className="space-y-2">
              <Label>Opacity: {watermarkOpacity}%</Label>
              <Slider
                value={[watermarkOpacity]}
                onValueChange={([v]) => setWatermarkOpacity(v)}
                min={5}
                max={50}
                step={5}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="md:col-span-2 flex justify-end">
        <Button 
          onClick={handleSave}
          disabled={saveMutation.isPending}
          className="bg-gradient-to-r from-amber-500 to-orange-600"
        >
          {saveMutation.isPending ? 'Saving...' : 'Save Branding Settings'}
        </Button>
      </div>
    </div>
  );
}
