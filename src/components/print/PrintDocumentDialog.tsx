import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Loader2, Printer, Download, FileText } from 'lucide-react';
import { usePrintTemplates } from '@/hooks/usePrintTemplate';
import { RECEIPT_TYPES } from '@/lib/print-utils';
import { pdf } from '@react-pdf/renderer';
import { toast } from 'sonner';

// PDF Documents
import LoanReceiptPDF from './documents/LoanReceiptPDF';
import InterestReceiptPDF from './documents/InterestReceiptPDF';
import RedemptionReceiptPDF from './documents/RedemptionReceiptPDF';

interface PrintDocumentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentType: string;
  data: any;
  title?: string;
}

export default function PrintDocumentDialog({
  open,
  onOpenChange,
  documentType,
  data,
  title,
}: PrintDocumentDialogProps) {
  const { templates, loading: templatesLoading } = usePrintTemplates();
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [copies, setCopies] = useState<number>(1);
  const [generating, setGenerating] = useState(false);

  const availableTemplates = templates.filter(t => t.receipt_type === documentType);
  const selectedTemplate = availableTemplates.find(t => t.id === selectedTemplateId);

  const getDocumentComponent = () => {
    const templateConfig = selectedTemplate ? {
      fontFamily: selectedTemplate.font_family || 'Roboto',
      colorScheme: selectedTemplate.color_scheme || { primary: '#B45309', secondary: '#1E40AF' },
      language: selectedTemplate.language || 'bilingual',
    } : undefined;

    switch (documentType) {
      case 'loan_receipt':
        return <LoanReceiptPDF data={data} config={templateConfig} />;
      case 'interest_receipt':
        return <InterestReceiptPDF data={data} config={templateConfig} />;
      case 'redemption_receipt':
        return <RedemptionReceiptPDF data={data} config={templateConfig} />;
      default:
        return null;
    }
  };

  const handlePrint = async () => {
    setGenerating(true);
    try {
      const docComponent = getDocumentComponent();
      if (!docComponent) {
        toast.error('Document type not supported');
        return;
      }

      const blob = await pdf(docComponent).toBlob();
      const url = URL.createObjectURL(blob);
      
      // Open in new window for printing
      const printWindow = window.open(url, '_blank');
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print();
        };
      }
      
      toast.success('Document ready for printing');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate document');
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = async () => {
    setGenerating(true);
    try {
      const docComponent = getDocumentComponent();
      if (!docComponent) {
        toast.error('Document type not supported');
        return;
      }

      const blob = await pdf(docComponent).toBlob();
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `${documentType}_${data.id || Date.now()}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success('Document downloaded');
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate document');
    } finally {
      setGenerating(false);
    }
  };

  const getDocumentTypeLabel = () => {
    return RECEIPT_TYPES.find(r => r.value === documentType)?.label || documentType;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            {title || `Print ${getDocumentTypeLabel()}`}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Template Selection */}
          <div className="space-y-2">
            <Label>Template</Label>
            <Select
              value={selectedTemplateId || 'default'}
              onValueChange={(v) => setSelectedTemplateId(v === 'default' ? '' : v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select template..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Default Template</SelectItem>
                {availableTemplates.map(template => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.template_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Copies */}
          <div className="space-y-2">
            <Label>Number of Copies</Label>
            <Select value={copies.toString()} onValueChange={(v) => setCopies(parseInt(v))}>
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1</SelectItem>
                <SelectItem value="2">2</SelectItem>
                <SelectItem value="3">3</SelectItem>
                <SelectItem value="4">4</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* Document Info */}
          <div className="bg-muted/50 rounded-lg p-3 text-sm space-y-1">
            <p><span className="text-muted-foreground">Document:</span> {getDocumentTypeLabel()}</p>
            {data?.loan_number && (
              <p><span className="text-muted-foreground">Loan #:</span> {data.loan_number}</p>
            )}
            {data?.customer?.full_name && (
              <p><span className="text-muted-foreground">Customer:</span> {data.customer.full_name}</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1 gap-2"
              onClick={handleDownload}
              disabled={generating}
            >
              {generating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              Download
            </Button>
            <Button
              className="flex-1 gap-2"
              onClick={handlePrint}
              disabled={generating}
            >
              {generating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Printer className="h-4 w-4" />
              )}
              Print
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
