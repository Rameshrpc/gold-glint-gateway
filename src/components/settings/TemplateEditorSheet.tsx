import { useState, useEffect } from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PrintTemplate } from '@/hooks/usePrintSettings';
import { Loader2 } from 'lucide-react';

interface TemplateEditorSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: PrintTemplate | null;
  isCreating: boolean;
  onSave: (data: Partial<PrintTemplate>) => Promise<void>;
}

const RECEIPT_TYPES = [
  { value: 'loan', label: 'Loan Receipt' },
  { value: 'interest', label: 'Interest Receipt' },
  { value: 'redemption', label: 'Redemption Receipt' },
  { value: 'auction', label: 'Auction Notice' },
  { value: 'kyc', label: 'KYC Documents' },
  { value: 'declaration', label: 'Gold Declaration' },
];

const LANGUAGES = [
  { value: 'english', label: 'English' },
  { value: 'tamil', label: 'Tamil' },
  { value: 'bilingual', label: 'Bilingual (English + Tamil)' },
];

const LAYOUTS = [
  { value: 'classic', label: 'Classic' },
  { value: 'modern', label: 'Modern' },
  { value: 'formal', label: 'Formal' },
  { value: 'compact', label: 'Compact' },
  { value: 'minimal', label: 'Minimal' },
];

const PAPER_SIZES = [
  { value: 'a4', label: 'A4 (210 × 297 mm)' },
  { value: 'a5', label: 'A5 (148 × 210 mm)' },
  { value: 'thermal', label: 'Thermal (80mm)' },
];

export function TemplateEditorSheet({
  open,
  onOpenChange,
  template,
  isCreating,
  onSave
}: TemplateEditorSheetProps) {
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    template_code: '',
    template_name: '',
    receipt_type: 'loan',
    language: 'bilingual',
    layout_style: 'classic',
    paper_size: 'a4',
    primary_color: '#B45309',
    secondary_color: '#1E40AF',
  });

  useEffect(() => {
    if (template) {
      setFormData({
        template_code: template.template_code,
        template_name: template.template_name,
        receipt_type: template.receipt_type,
        language: template.language || 'bilingual',
        layout_style: template.layout_style || 'classic',
        paper_size: template.paper_size || 'a4',
        primary_color: template.color_scheme?.primary || '#B45309',
        secondary_color: template.color_scheme?.secondary || '#1E40AF',
      });
    } else {
      setFormData({
        template_code: '',
        template_name: '',
        receipt_type: 'loan',
        language: 'bilingual',
        layout_style: 'classic',
        paper_size: 'a4',
        primary_color: '#B45309',
        secondary_color: '#1E40AF',
      });
    }
  }, [template, open]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave({
        template_code: formData.template_code,
        template_name: formData.template_name,
        receipt_type: formData.receipt_type,
        language: formData.language,
        layout_style: formData.layout_style,
        paper_size: formData.paper_size,
        color_scheme: {
          primary: formData.primary_color,
          secondary: formData.secondary_color
        }
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle>
            {isCreating ? 'Create Template' : 'Edit Template'}
          </SheetTitle>
          <SheetDescription>
            {isCreating
              ? 'Create a new print template for documents'
              : 'Modify template settings and appearance'}
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-4 py-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="template_code">Template Code</Label>
              <Input
                id="template_code"
                value={formData.template_code}
                onChange={(e) => setFormData({ ...formData, template_code: e.target.value.toUpperCase() })}
                placeholder="LOAN_BILINGUAL"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="receipt_type">Receipt Type</Label>
              <Select
                value={formData.receipt_type}
                onValueChange={(v) => setFormData({ ...formData, receipt_type: v })}
              >
                <SelectTrigger>
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

          <div className="space-y-2">
            <Label htmlFor="template_name">Template Name</Label>
            <Input
              id="template_name"
              value={formData.template_name}
              onChange={(e) => setFormData({ ...formData, template_name: e.target.value })}
              placeholder="Bilingual Formal Loan Receipt"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="language">Language</Label>
              <Select
                value={formData.language}
                onValueChange={(v) => setFormData({ ...formData, language: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGES.map(lang => (
                    <SelectItem key={lang.value} value={lang.value}>
                      {lang.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="layout_style">Layout Style</Label>
              <Select
                value={formData.layout_style}
                onValueChange={(v) => setFormData({ ...formData, layout_style: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LAYOUTS.map(layout => (
                    <SelectItem key={layout.value} value={layout.value}>
                      {layout.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="paper_size">Paper Size</Label>
            <Select
              value={formData.paper_size}
              onValueChange={(v) => setFormData({ ...formData, paper_size: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAPER_SIZES.map(size => (
                  <SelectItem key={size.value} value={size.value}>
                    {size.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <Label>Color Scheme</Label>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="primary_color" className="text-xs text-muted-foreground">
                  Primary Color
                </Label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    id="primary_color"
                    value={formData.primary_color}
                    onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                    className="h-10 w-12 rounded border cursor-pointer"
                  />
                  <Input
                    value={formData.primary_color}
                    onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                    className="flex-1"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="secondary_color" className="text-xs text-muted-foreground">
                  Secondary Color
                </Label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    id="secondary_color"
                    value={formData.secondary_color}
                    onChange={(e) => setFormData({ ...formData, secondary_color: e.target.value })}
                    className="h-10 w-12 rounded border cursor-pointer"
                  />
                  <Input
                    value={formData.secondary_color}
                    onChange={(e) => setFormData({ ...formData, secondary_color: e.target.value })}
                    className="flex-1"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <SheetFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving || !formData.template_code || !formData.template_name}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isCreating ? 'Create Template' : 'Save Changes'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
