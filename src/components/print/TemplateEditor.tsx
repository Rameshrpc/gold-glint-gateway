import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Save, RotateCcw } from 'lucide-react';
import { PrintTemplate } from '@/hooks/usePrintTemplates';
import { PrintSettings, useSavePrintSettings } from '@/hooks/usePrintSettings';
import { toast } from 'sonner';
import type { Json } from '@/integrations/supabase/types';

export interface TemplateConfig {
  header_text_en: string;
  header_text_ta: string;
  show_customer_details: boolean;
  show_gold_table: boolean;
  show_financial_summary: boolean;
  show_declaration: boolean;
  show_customer_signature: boolean;
  show_staff_signature: boolean;
  footer_text_en: string;
  footer_text_ta: string;
  show_terms: boolean;
  custom_terms_en: string;
  custom_terms_ta: string;
  primary_color: string;
  secondary_color: string;
  font_size: number;
}

const defaultConfig: TemplateConfig = {
  header_text_en: '',
  header_text_ta: '',
  show_customer_details: true,
  show_gold_table: true,
  show_financial_summary: true,
  show_declaration: true,
  show_customer_signature: true,
  show_staff_signature: true,
  footer_text_en: 'Thank you for your business',
  footer_text_ta: 'உங்கள் வணிகத்திற்கு நன்றி',
  show_terms: false,
  custom_terms_en: '',
  custom_terms_ta: '',
  primary_color: '#B45309',
  secondary_color: '#1E40AF',
  font_size: 10,
};

interface TemplateEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: PrintTemplate | null;
  receiptType: string;
  existingConfig?: Partial<TemplateConfig>;
}

export function TemplateEditor({ 
  open, 
  onOpenChange, 
  template, 
  receiptType,
  existingConfig 
}: TemplateEditorProps) {
  const [config, setConfig] = useState<TemplateConfig>({ ...defaultConfig, ...existingConfig });
  const saveMutation = useSavePrintSettings();

  useEffect(() => {
    if (existingConfig) {
      setConfig({ ...defaultConfig, ...existingConfig });
    } else {
      setConfig(defaultConfig);
    }
  }, [existingConfig, open]);

  const handleSave = () => {
    saveMutation.mutate({
      receipt_type: receiptType,
      template_id: template?.id,
      template_config: config as unknown as Json,
    } as Partial<PrintSettings> & { receipt_type: string }, {
      onSuccess: () => {
        toast.success('Template settings saved');
        onOpenChange(false);
      },
    });
  };

  const handleReset = () => {
    setConfig(defaultConfig);
    toast.info('Settings reset to defaults');
  };

  const updateConfig = <K extends keyof TemplateConfig>(key: K, value: TemplateConfig[K]) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };

  if (!template) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-hidden flex flex-col">
        <SheetHeader>
          <SheetTitle>Edit Template: {template.template_name}</SheetTitle>
          <SheetDescription>
            Customize the template settings for {receiptType} receipts
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 flex gap-4 mt-4 overflow-hidden">
          {/* Settings Panel */}
          <ScrollArea className="flex-1 pr-4">
            <Accordion type="multiple" defaultValue={['header', 'content', 'signature', 'footer', 'layout']} className="space-y-2">
              {/* Header Settings */}
              <AccordionItem value="header" className="border rounded-lg px-4">
                <AccordionTrigger className="hover:no-underline">
                  Header Settings
                </AccordionTrigger>
                <AccordionContent className="space-y-4 pb-4">
                  <div className="space-y-2">
                    <Label htmlFor="header_text_en">Header Text (English)</Label>
                    <Input
                      id="header_text_en"
                      value={config.header_text_en}
                      onChange={(e) => updateConfig('header_text_en', e.target.value)}
                      placeholder="Company tagline or subtitle"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="header_text_ta">Header Text (Tamil)</Label>
                    <Input
                      id="header_text_ta"
                      value={config.header_text_ta}
                      onChange={(e) => updateConfig('header_text_ta', e.target.value)}
                      placeholder="நிறுவனத்தின் தொலைநோக்கு"
                    />
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Content Sections */}
              <AccordionItem value="content" className="border rounded-lg px-4">
                <AccordionTrigger className="hover:no-underline">
                  Content Sections
                </AccordionTrigger>
                <AccordionContent className="space-y-4 pb-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="show_customer_details">Show Customer Details</Label>
                    <Switch
                      id="show_customer_details"
                      checked={config.show_customer_details}
                      onCheckedChange={(v) => updateConfig('show_customer_details', v)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="show_gold_table">Show Gold Items Table</Label>
                    <Switch
                      id="show_gold_table"
                      checked={config.show_gold_table}
                      onCheckedChange={(v) => updateConfig('show_gold_table', v)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="show_financial_summary">Show Financial Summary</Label>
                    <Switch
                      id="show_financial_summary"
                      checked={config.show_financial_summary}
                      onCheckedChange={(v) => updateConfig('show_financial_summary', v)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="show_declaration">Show Declaration</Label>
                    <Switch
                      id="show_declaration"
                      checked={config.show_declaration}
                      onCheckedChange={(v) => updateConfig('show_declaration', v)}
                    />
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Signature Section */}
              <AccordionItem value="signature" className="border rounded-lg px-4">
                <AccordionTrigger className="hover:no-underline">
                  Signature Section
                </AccordionTrigger>
                <AccordionContent className="space-y-4 pb-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="show_customer_signature">Show Customer Signature</Label>
                    <Switch
                      id="show_customer_signature"
                      checked={config.show_customer_signature}
                      onCheckedChange={(v) => updateConfig('show_customer_signature', v)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="show_staff_signature">Show Staff Signature</Label>
                    <Switch
                      id="show_staff_signature"
                      checked={config.show_staff_signature}
                      onCheckedChange={(v) => updateConfig('show_staff_signature', v)}
                    />
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* Footer Settings */}
              <AccordionItem value="footer" className="border rounded-lg px-4">
                <AccordionTrigger className="hover:no-underline">
                  Footer Settings
                </AccordionTrigger>
                <AccordionContent className="space-y-4 pb-4">
                  <div className="space-y-2">
                    <Label htmlFor="footer_text_en">Footer Text (English)</Label>
                    <Input
                      id="footer_text_en"
                      value={config.footer_text_en}
                      onChange={(e) => updateConfig('footer_text_en', e.target.value)}
                      placeholder="Thank you message"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="footer_text_ta">Footer Text (Tamil)</Label>
                    <Input
                      id="footer_text_ta"
                      value={config.footer_text_ta}
                      onChange={(e) => updateConfig('footer_text_ta', e.target.value)}
                      placeholder="நன்றி செய்தி"
                    />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <Label htmlFor="show_terms">Show Terms & Conditions</Label>
                    <Switch
                      id="show_terms"
                      checked={config.show_terms}
                      onCheckedChange={(v) => updateConfig('show_terms', v)}
                    />
                  </div>
                  {config.show_terms && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="custom_terms_en">Terms (English)</Label>
                        <Textarea
                          id="custom_terms_en"
                          value={config.custom_terms_en}
                          onChange={(e) => updateConfig('custom_terms_en', e.target.value)}
                          placeholder="Enter terms and conditions..."
                          rows={3}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="custom_terms_ta">Terms (Tamil)</Label>
                        <Textarea
                          id="custom_terms_ta"
                          value={config.custom_terms_ta}
                          onChange={(e) => updateConfig('custom_terms_ta', e.target.value)}
                          placeholder="விதிமுறைகள் மற்றும் நிபந்தனைகள்..."
                          rows={3}
                        />
                      </div>
                    </>
                  )}
                </AccordionContent>
              </AccordionItem>

              {/* Layout Options */}
              <AccordionItem value="layout" className="border rounded-lg px-4">
                <AccordionTrigger className="hover:no-underline">
                  Layout & Colors
                </AccordionTrigger>
                <AccordionContent className="space-y-4 pb-4">
                  <div className="space-y-2">
                    <Label>Font Size: {config.font_size}pt</Label>
                    <Slider
                      value={[config.font_size]}
                      onValueChange={([v]) => updateConfig('font_size', v)}
                      min={8}
                      max={14}
                      step={1}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="primary_color">Primary Color</Label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          id="primary_color"
                          value={config.primary_color}
                          onChange={(e) => updateConfig('primary_color', e.target.value)}
                          className="w-10 h-10 rounded border cursor-pointer"
                        />
                        <Input
                          value={config.primary_color}
                          onChange={(e) => updateConfig('primary_color', e.target.value)}
                          className="flex-1"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="secondary_color">Secondary Color</Label>
                      <div className="flex gap-2">
                        <input
                          type="color"
                          id="secondary_color"
                          value={config.secondary_color}
                          onChange={(e) => updateConfig('secondary_color', e.target.value)}
                          className="w-10 h-10 rounded border cursor-pointer"
                        />
                        <Input
                          value={config.secondary_color}
                          onChange={(e) => updateConfig('secondary_color', e.target.value)}
                          className="flex-1"
                        />
                      </div>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </ScrollArea>

          {/* Live Preview Panel */}
          <div className="hidden lg:flex flex-col w-64 border rounded-lg p-4 bg-muted/30">
            <h4 className="font-medium mb-3 text-sm">Live Preview</h4>
            <div className="flex-1 bg-background rounded border p-3 text-[6px] leading-tight overflow-hidden">
              {/* Mini preview */}
              <div className="text-center mb-2">
                <div className="w-6 h-6 bg-muted rounded mx-auto mb-1" />
                <div className="font-bold" style={{ color: config.primary_color }}>Company Name</div>
                {config.header_text_en && <div className="text-muted-foreground">{config.header_text_en}</div>}
              </div>
              <div className="border-t border-b py-1 my-1 text-center font-bold" style={{ color: config.secondary_color }}>
                {receiptType.toUpperCase()} RECEIPT
              </div>
              {config.show_customer_details && (
                <div className="mb-1">
                  <div className="font-bold">Customer Details</div>
                  <div className="h-1 bg-muted w-3/4 my-0.5" />
                  <div className="h-1 bg-muted w-1/2" />
                </div>
              )}
              {config.show_gold_table && (
                <div className="mb-1">
                  <div className="font-bold">Gold Items</div>
                  <div className="border h-6 flex items-center justify-center text-muted-foreground">
                    Table
                  </div>
                </div>
              )}
              {config.show_financial_summary && (
                <div className="mb-1">
                  <div className="font-bold">Summary</div>
                  <div className="h-1 bg-muted w-full my-0.5" />
                  <div className="h-1 bg-muted w-4/5" />
                </div>
              )}
              {config.show_declaration && (
                <div className="mb-1 text-muted-foreground italic">
                  Declaration text...
                </div>
              )}
              {(config.show_customer_signature || config.show_staff_signature) && (
                <div className="flex justify-between mt-2">
                  {config.show_customer_signature && <div className="border-t w-8 text-center pt-0.5">Customer</div>}
                  {config.show_staff_signature && <div className="border-t w-8 text-center pt-0.5">Staff</div>}
                </div>
              )}
              {config.footer_text_en && (
                <div className="text-center mt-2 text-muted-foreground border-t pt-1">
                  {config.footer_text_en}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-between pt-4 border-t mt-4">
          <Button variant="outline" onClick={handleReset}>
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset to Defaults
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saveMutation.isPending}>
              <Save className="h-4 w-4 mr-2" />
              Save Settings
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
