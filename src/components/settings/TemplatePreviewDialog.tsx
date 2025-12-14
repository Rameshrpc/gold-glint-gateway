import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { FONT_OPTIONS, PAPER_SIZES, LANGUAGE_OPTIONS, RECEIPT_TYPES } from '@/lib/print-utils';

interface PrintTemplate {
  id: string;
  template_name: string;
  template_code: string;
  receipt_type: string;
  language: string | null;
  layout_style: string | null;
  paper_size: string | null;
  font_family: string | null;
  color_scheme: { primary?: string; secondary?: string } | null;
  is_active: boolean | null;
}

interface TemplatePreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: PrintTemplate | null;
}

export default function TemplatePreviewDialog({ 
  open, 
  onOpenChange, 
  template 
}: TemplatePreviewDialogProps) {
  if (!template) return null;

  const getReceiptTypeLabel = (value: string) => 
    RECEIPT_TYPES.find(t => t.value === value)?.label || value;
  
  const getFontLabel = (value: string | null) => 
    FONT_OPTIONS.find(f => f.value === value)?.label || value || 'Default';
  
  const getPaperSizeLabel = (value: string | null) => 
    PAPER_SIZES.find(p => p.value === value)?.label || value || 'A4';
  
  const getLanguageLabel = (value: string | null) => 
    LANGUAGE_OPTIONS.find(l => l.value === value)?.label || value || 'English';

  const primaryColor = template.color_scheme?.primary || '#B45309';
  const secondaryColor = template.color_scheme?.secondary || '#1E40AF';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Template Preview: {template.template_name}
            <Badge variant={template.is_active ? 'default' : 'secondary'}>
              {template.is_active ? 'Active' : 'Inactive'}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Template Info */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Code:</span>
              <span className="ml-2 font-mono">{template.template_code}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Type:</span>
              <span className="ml-2">{getReceiptTypeLabel(template.receipt_type)}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Language:</span>
              <span className="ml-2">{getLanguageLabel(template.language)}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Paper Size:</span>
              <span className="ml-2">{getPaperSizeLabel(template.paper_size)}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Font:</span>
              <span className="ml-2" style={{ fontFamily: template.font_family || 'Roboto' }}>
                {getFontLabel(template.font_family)}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Layout:</span>
              <span className="ml-2 capitalize">{template.layout_style || 'Classic'}</span>
            </div>
          </div>

          <Separator />

          {/* Color Preview */}
          <div>
            <h4 className="text-sm font-medium mb-3">Color Scheme</h4>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <div 
                  className="w-8 h-8 rounded border" 
                  style={{ backgroundColor: primaryColor }}
                />
                <div className="text-sm">
                  <div className="font-medium">Primary</div>
                  <div className="text-muted-foreground font-mono text-xs">{primaryColor}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div 
                  className="w-8 h-8 rounded border" 
                  style={{ backgroundColor: secondaryColor }}
                />
                <div className="text-sm">
                  <div className="font-medium">Secondary</div>
                  <div className="text-muted-foreground font-mono text-xs">{secondaryColor}</div>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Sample Preview */}
          <div>
            <h4 className="text-sm font-medium mb-3">Sample Layout Preview</h4>
            <div 
              className="border rounded-lg p-4 bg-white text-black"
              style={{ fontFamily: template.font_family || 'Roboto' }}
            >
              {/* Header */}
              <div 
                className="text-center pb-3 border-b-2 mb-3"
                style={{ borderColor: primaryColor }}
              >
                <h3 
                  className="text-lg font-bold"
                  style={{ color: primaryColor }}
                >
                  COMPANY NAME
                </h3>
                <p className="text-xs text-gray-600">123 Main Street, City, State - 123456</p>
                <p className="text-xs text-gray-600">Phone: +91 98765 43210 | Email: info@company.com</p>
              </div>

              {/* Title */}
              <div 
                className="text-center py-2 mb-3 rounded"
                style={{ backgroundColor: primaryColor, color: 'white' }}
              >
                <span className="font-semibold text-sm uppercase">
                  {getReceiptTypeLabel(template.receipt_type)}
                </span>
              </div>

              {/* Sample Content */}
              <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                <div><span className="text-gray-500">Receipt No:</span> RCP-2024-001</div>
                <div><span className="text-gray-500">Date:</span> 14/12/2024</div>
                <div><span className="text-gray-500">Customer:</span> John Doe</div>
                <div><span className="text-gray-500">Phone:</span> +91 98765 43210</div>
              </div>

              {/* Sample Table */}
              <table className="w-full text-xs border-collapse mb-3">
                <thead>
                  <tr style={{ backgroundColor: secondaryColor, color: 'white' }}>
                    <th className="border p-1 text-left">Item</th>
                    <th className="border p-1 text-right">Weight</th>
                    <th className="border p-1 text-right">Value</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border p-1">Gold Chain 22K</td>
                    <td className="border p-1 text-right">15.5g</td>
                    <td className="border p-1 text-right">₹85,250</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="border p-1">Gold Ring 22K</td>
                    <td className="border p-1 text-right">8.2g</td>
                    <td className="border p-1 text-right">₹45,100</td>
                  </tr>
                </tbody>
              </table>

              {/* Footer */}
              <div 
                className="text-center pt-2 border-t text-xs"
                style={{ borderColor: secondaryColor }}
              >
                <p className="text-gray-500">Thank you for your business</p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
