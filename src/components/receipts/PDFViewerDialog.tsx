import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { pdf } from '@react-pdf/renderer';
import { Download, Printer, FileText } from 'lucide-react';
import { toast } from 'sonner';

interface PDFViewerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  document: React.ReactElement;
  fileName: string;
}

export function PDFViewerDialog({ open, onOpenChange, title, document, fileName }: PDFViewerDialogProps) {
  const [loading, setLoading] = useState(false);
  const [paperSize, setPaperSize] = useState<'a4' | 'a5' | 'thermal'>('a4');

  const handleDownload = async () => {
    setLoading(true);
    try {
      const blob = await pdf(document).toBlob();
      const url = URL.createObjectURL(blob);
      const link = window.document.createElement('a');
      link.href = url;
      link.download = `${fileName}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success('PDF downloaded successfully');
    } catch (error) {
      toast.error('Failed to generate PDF');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = async () => {
    setLoading(true);
    try {
      const blob = await pdf(document).toBlob();
      const url = URL.createObjectURL(blob);
      const printWindow = window.open(url, '_blank');
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print();
        };
      }
    } catch (error) {
      toast.error('Failed to generate PDF for printing');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            {title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Paper Size Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Paper Size</label>
            <Select value={paperSize} onValueChange={(v) => setPaperSize(v as 'a4' | 'a5' | 'thermal')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="a4">A4 (Standard)</SelectItem>
                <SelectItem value="a5">A5 (Half Page)</SelectItem>
                <SelectItem value="thermal">Thermal (80mm)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Preview Info */}
          <div className="bg-muted/50 rounded-lg p-4 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              Click Download or Print to generate the PDF
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button 
              onClick={handleDownload} 
              disabled={loading}
              className="flex-1"
              variant="outline"
            >
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
            <Button 
              onClick={handlePrint} 
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700"
            >
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}