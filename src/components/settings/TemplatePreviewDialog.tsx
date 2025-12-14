import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PrintTemplate } from '@/hooks/usePrintSettings';
import { Printer, FileText } from 'lucide-react';

interface TemplatePreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: PrintTemplate | null;
}

export function TemplatePreviewDialog({
  open,
  onOpenChange,
  template
}: TemplatePreviewDialogProps) {
  if (!template) return null;

  const handlePrintPreview = () => {
    // Navigate to print preview page with sample data
    window.open(`/print/${template.receipt_type}-receipt/sample`, '_blank');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {template.template_name}
          </DialogTitle>
          <DialogDescription>
            Template preview with sample data
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Template Info */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-muted rounded-lg">
            <div>
              <p className="text-xs text-muted-foreground">Type</p>
              <Badge variant="secondary" className="mt-1 capitalize">
                {template.receipt_type}
              </Badge>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Language</p>
              <p className="font-medium capitalize">{template.language || 'English'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Layout</p>
              <p className="font-medium capitalize">{template.layout_style || 'Classic'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Paper</p>
              <p className="font-medium uppercase">{template.paper_size || 'A4'}</p>
            </div>
          </div>

          {/* Color Scheme Preview */}
          <div className="p-4 border rounded-lg">
            <p className="text-sm font-medium mb-3">Color Scheme</p>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <div
                  className="h-8 w-8 rounded border"
                  style={{ backgroundColor: template.color_scheme?.primary || '#B45309' }}
                />
                <div>
                  <p className="text-xs text-muted-foreground">Primary</p>
                  <p className="text-sm font-mono">{template.color_scheme?.primary || '#B45309'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className="h-8 w-8 rounded border"
                  style={{ backgroundColor: template.color_scheme?.secondary || '#1E40AF' }}
                />
                <div>
                  <p className="text-xs text-muted-foreground">Secondary</p>
                  <p className="text-sm font-mono">{template.color_scheme?.secondary || '#1E40AF'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Preview Image or Placeholder */}
          <div className="border rounded-lg aspect-[210/297] bg-white flex items-center justify-center overflow-hidden">
            {template.preview_image_url ? (
              <img
                src={template.preview_image_url}
                alt="Template preview"
                className="w-full h-full object-contain"
              />
            ) : (
              <div className="text-center p-8">
                <FileText className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
                <p className="text-muted-foreground">Preview not available</p>
                <p className="text-sm text-muted-foreground">
                  Click "Print Preview" to see the template with sample data
                </p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            <Button onClick={handlePrintPreview} className="gap-2">
              <Printer className="h-4 w-4" />
              Print Preview
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
