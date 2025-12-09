import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { usePrintConfig } from '@/hooks/usePrintConfig';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Printer, Palette, FileText, Eye, Upload, Save, TestTube } from 'lucide-react';

const RECEIPT_TYPES = [
  { value: 'loan', label: 'Loan Receipt' },
  { value: 'interest', label: 'Interest Receipt' },
  { value: 'redemption', label: 'Redemption Receipt' },
  { value: 'reloan', label: 'Reloan Receipt' },
  { value: 'auction', label: 'Auction Receipt' },
];

const TEMPLATE_STYLES = [
  { value: 'classic', label: 'Classic', description: 'Traditional layout with borders' },
  { value: 'modern', label: 'Modern', description: 'Clean minimal design' },
  { value: 'compact', label: 'Compact', description: 'Space-efficient for thermal printers' },
];

const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'bilingual', label: 'Bilingual (English + Tamil)' },
];

const PAPER_SIZES = [
  { value: 'a4', label: 'A4 (210 × 297 mm)' },
  { value: 'a5', label: 'A5 (148 × 210 mm)' },
  { value: 'thermal', label: 'Thermal (80mm)' },
];

export default function PrintSettings() {
  const { client } = useAuth();
  const { settings, loading, updateSettings } = usePrintConfig();
  const [activeReceiptType, setActiveReceiptType] = useState('loan');
  const [saving, setSaving] = useState(false);

  // Local form state
  const [branding, setBranding] = useState({
    logoUrl: settings?.logo_url || '',
    headerText: settings?.header_text || '',
    footerText: settings?.footer_text || '',
    watermarkText: settings?.watermark_text || '',
    watermarkOpacity: settings?.watermark_opacity || 15,
  });

  const [templateConfig, setTemplateConfig] = useState({
    layoutStyle: 'classic',
    language: 'en',
    paperSize: 'a4',
  });

  const [displayOptions, setDisplayOptions] = useState({
    showLogo: settings?.show_logo ?? true,
    showDeclaration: settings?.show_declaration ?? true,
    showTerms: settings?.show_terms ?? true,
    showSignature: settings?.show_signature_section ?? true,
    copies: settings?.copies || 2,
  });

  const handleSaveBranding = async () => {
    setSaving(true);
    try {
      await updateSettings({
        logo_url: branding.logoUrl,
        header_text: branding.headerText,
        footer_text: branding.footerText,
        watermark_text: branding.watermarkText,
        watermark_opacity: branding.watermarkOpacity,
      });
      toast.success('Branding settings saved');
    } catch (error) {
      toast.error('Failed to save branding settings');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveDisplayOptions = async () => {
    setSaving(true);
    try {
      await updateSettings({
        show_logo: displayOptions.showLogo,
        show_declaration: displayOptions.showDeclaration,
        show_terms: displayOptions.showTerms,
        show_signature_section: displayOptions.showSignature,
        copies: displayOptions.copies,
      });
      toast.success('Display options saved');
    } catch (error) {
      toast.error('Failed to save display options');
    } finally {
      setSaving(false);
    }
  };

  const handleTestPrint = () => {
    // Create a simple test print
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Please allow popups to test print');
      return;
    }

    const testContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Test Print - ${activeReceiptType}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            .header { text-align: center; border-bottom: 2px solid #d97706; padding-bottom: 10px; margin-bottom: 20px; }
            .company { font-size: 24px; font-weight: bold; color: #d97706; }
            .title { font-size: 18px; margin-top: 10px; }
            .content { margin: 20px 0; }
            .row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px dotted #ccc; }
            .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
            @media print { body { margin: 0; } }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="company">${client?.company_name || 'Your Company Name'}</div>
            <div class="title">TEST PRINT - ${activeReceiptType.toUpperCase()} RECEIPT</div>
          </div>
          <div class="content">
            <div class="row"><span>Receipt Number:</span><span>TEST-001</span></div>
            <div class="row"><span>Date:</span><span>${new Date().toLocaleDateString()}</span></div>
            <div class="row"><span>Customer:</span><span>Test Customer</span></div>
            <div class="row"><span>Amount:</span><span>₹10,000.00</span></div>
          </div>
          <div class="footer">
            ${branding.footerText || 'This is a test print. Please verify your printer settings.'}
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(testContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Print Settings</h1>
          <p className="text-muted-foreground">Configure receipt templates and branding for your organization</p>
        </div>

        <Tabs defaultValue="branding" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4 lg:w-[600px]">
            <TabsTrigger value="branding" className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              <span className="hidden sm:inline">Branding</span>
            </TabsTrigger>
            <TabsTrigger value="templates" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Templates</span>
            </TabsTrigger>
            <TabsTrigger value="display" className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              <span className="hidden sm:inline">Display</span>
            </TabsTrigger>
            <TabsTrigger value="test" className="flex items-center gap-2">
              <TestTube className="h-4 w-4" />
              <span className="hidden sm:inline">Test</span>
            </TabsTrigger>
          </TabsList>

          {/* Branding Tab */}
          <TabsContent value="branding" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Branding Settings</CardTitle>
                <CardDescription>Customize your receipts with company branding</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="logoUrl">Logo URL</Label>
                    <div className="flex gap-2">
                      <Input
                        id="logoUrl"
                        placeholder="https://example.com/logo.png"
                        value={branding.logoUrl}
                        onChange={(e) => setBranding({ ...branding, logoUrl: e.target.value })}
                      />
                      <Button variant="outline" size="icon">
                        <Upload className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">Recommended size: 200x60 pixels</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="watermarkText">Watermark Text</Label>
                    <Input
                      id="watermarkText"
                      placeholder="e.g., CONFIDENTIAL"
                      value={branding.watermarkText}
                      onChange={(e) => setBranding({ ...branding, watermarkText: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="headerText">Header Text</Label>
                  <Textarea
                    id="headerText"
                    placeholder="Company tagline or additional information..."
                    value={branding.headerText}
                    onChange={(e) => setBranding({ ...branding, headerText: e.target.value })}
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="footerText">Footer Text</Label>
                  <Textarea
                    id="footerText"
                    placeholder="Terms, disclaimers, or contact information..."
                    value={branding.footerText}
                    onChange={(e) => setBranding({ ...branding, footerText: e.target.value })}
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="watermarkOpacity">Watermark Opacity: {branding.watermarkOpacity}%</Label>
                  <Input
                    id="watermarkOpacity"
                    type="range"
                    min="5"
                    max="30"
                    value={branding.watermarkOpacity}
                    onChange={(e) => setBranding({ ...branding, watermarkOpacity: Number(e.target.value) })}
                    className="w-full"
                  />
                </div>

                <Button onClick={handleSaveBranding} disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Branding
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Templates Tab */}
          <TabsContent value="templates" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Template Assignment</CardTitle>
                <CardDescription>Choose template styles for each receipt type</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Receipt Type</Label>
                  <Select value={activeReceiptType} onValueChange={setActiveReceiptType}>
                    <SelectTrigger className="w-full md:w-[300px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {RECEIPT_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  {TEMPLATE_STYLES.map((style) => (
                    <div
                      key={style.value}
                      className={`p-4 border rounded-lg cursor-pointer transition-all ${
                        templateConfig.layoutStyle === style.value
                          ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                          : 'border-border hover:border-primary/50'
                      }`}
                      onClick={() => setTemplateConfig({ ...templateConfig, layoutStyle: style.value })}
                    >
                      <div className="font-medium">{style.label}</div>
                      <div className="text-sm text-muted-foreground">{style.description}</div>
                    </div>
                  ))}
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Language</Label>
                    <Select
                      value={templateConfig.language}
                      onValueChange={(value) => setTemplateConfig({ ...templateConfig, language: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {LANGUAGES.map((lang) => (
                          <SelectItem key={lang.value} value={lang.value}>
                            {lang.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Paper Size</Label>
                    <Select
                      value={templateConfig.paperSize}
                      onValueChange={(value) => setTemplateConfig({ ...templateConfig, paperSize: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PAPER_SIZES.map((size) => (
                          <SelectItem key={size.value} value={size.value}>
                            {size.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button>
                  <Save className="h-4 w-4 mr-2" />
                  Save Template Settings
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Display Options Tab */}
          <TabsContent value="display" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Display Options</CardTitle>
                <CardDescription>Toggle visibility of receipt sections</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Show Logo</Label>
                      <p className="text-sm text-muted-foreground">Display company logo on receipts</p>
                    </div>
                    <Switch
                      checked={displayOptions.showLogo}
                      onCheckedChange={(checked) => setDisplayOptions({ ...displayOptions, showLogo: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Show Declaration</Label>
                      <p className="text-sm text-muted-foreground">Tamil Nadu Pawnbroker Act declaration</p>
                    </div>
                    <Switch
                      checked={displayOptions.showDeclaration}
                      onCheckedChange={(checked) => setDisplayOptions({ ...displayOptions, showDeclaration: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Show Terms & Conditions</Label>
                      <p className="text-sm text-muted-foreground">Display terms at bottom of receipt</p>
                    </div>
                    <Switch
                      checked={displayOptions.showTerms}
                      onCheckedChange={(checked) => setDisplayOptions({ ...displayOptions, showTerms: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Show Signature Section</Label>
                      <p className="text-sm text-muted-foreground">Include signature lines for customer/staff</p>
                    </div>
                    <Switch
                      checked={displayOptions.showSignature}
                      onCheckedChange={(checked) => setDisplayOptions({ ...displayOptions, showSignature: checked })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="copies">Number of Copies</Label>
                    <Select
                      value={String(displayOptions.copies)}
                      onValueChange={(value) => setDisplayOptions({ ...displayOptions, copies: Number(value) })}
                    >
                      <SelectTrigger className="w-[200px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 Copy</SelectItem>
                        <SelectItem value="2">2 Copies</SelectItem>
                        <SelectItem value="3">3 Copies</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button onClick={handleSaveDisplayOptions} disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Display Options
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Test Print Tab */}
          <TabsContent value="test" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Test Print</CardTitle>
                <CardDescription>Preview and test your print settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Select Receipt Type to Test</Label>
                  <Select value={activeReceiptType} onValueChange={setActiveReceiptType}>
                    <SelectTrigger className="w-full md:w-[300px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {RECEIPT_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="p-4 bg-muted rounded-lg">
                  <h3 className="font-medium mb-2">Current Settings Preview</h3>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• Template Style: {TEMPLATE_STYLES.find(s => s.value === templateConfig.layoutStyle)?.label}</li>
                    <li>• Language: {LANGUAGES.find(l => l.value === templateConfig.language)?.label}</li>
                    <li>• Paper Size: {PAPER_SIZES.find(p => p.value === templateConfig.paperSize)?.label}</li>
                    <li>• Show Logo: {displayOptions.showLogo ? 'Yes' : 'No'}</li>
                    <li>• Show Declaration: {displayOptions.showDeclaration ? 'Yes' : 'No'}</li>
                    <li>• Copies: {displayOptions.copies}</li>
                  </ul>
                </div>

                <Button onClick={handleTestPrint} className="w-full md:w-auto">
                  <Printer className="h-4 w-4 mr-2" />
                  Generate Test Print
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
