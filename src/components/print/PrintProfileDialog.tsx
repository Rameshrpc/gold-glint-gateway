import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Printer, Download, Languages } from 'lucide-react';
import { toast } from 'sonner';
import { pdf } from '@react-pdf/renderer';
import { PDFDocument } from 'pdf-lib';

// PDF Components
import LoanReceiptPDF from './documents/LoanReceiptPDF';
import InterestReceiptPDF from './documents/InterestReceiptPDF';
import RedemptionReceiptPDF from './documents/RedemptionReceiptPDF';
import KycDocumentPDF from './documents/KycDocumentPDF';
import GoldDeclarationPDF from './documents/GoldDeclarationPDF';
import LoanSummaryPDF from './documents/LoanSummaryPDF';
import DeclarationPDF from './documents/DeclarationPDF';

type LanguageOption = 'bilingual' | 'english' | 'tamil';

interface PrintProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profileType: string;
  data: any;
  title?: string;
}

interface DocumentSelection {
  document_type: string;
  copies: number;
  selected: boolean;
  is_required: boolean;
}

const DOCUMENT_LABELS: Record<string, string> = {
  'loan_receipt': 'Loan Receipt',
  'interest_receipt': 'Interest Receipt',
  'redemption_receipt': 'Redemption Receipt',
  'reloan_receipt': 'Reloan Receipt',
  'kyc': 'KYC Document',
  'gold_declaration': 'Gold Declaration',
  'summary': 'Loan Summary',
  'declaration': 'Declaration',
  'auction_notice': 'Auction Notice',
};

// Hardcoded default documents for each profile type
const DEFAULT_PROFILE_DOCUMENTS: Record<string, DocumentSelection[]> = {
  'loan': [
    { document_type: 'loan_receipt', copies: 2, selected: true, is_required: true },
    { document_type: 'kyc', copies: 1, selected: true, is_required: false },
    { document_type: 'gold_declaration', copies: 1, selected: true, is_required: false },
    { document_type: 'summary', copies: 1, selected: false, is_required: false },
    { document_type: 'declaration', copies: 1, selected: false, is_required: false },
  ],
  'interest': [
    { document_type: 'interest_receipt', copies: 2, selected: true, is_required: true },
  ],
  'redemption': [
    { document_type: 'redemption_receipt', copies: 2, selected: true, is_required: true },
    { document_type: 'gold_declaration', copies: 1, selected: true, is_required: false },
  ],
  'reloan': [
    { document_type: 'loan_receipt', copies: 2, selected: true, is_required: true },
    { document_type: 'kyc', copies: 1, selected: true, is_required: false },
    { document_type: 'gold_declaration', copies: 1, selected: true, is_required: false },
  ],
  'auction': [
    { document_type: 'auction_notice', copies: 1, selected: true, is_required: true },
  ],
};

export default function PrintProfileDialog({
  open,
  onOpenChange,
  profileType,
  data,
  title,
}: PrintProfileDialogProps) {
  const [documents, setDocuments] = useState<DocumentSelection[]>([]);
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [language, setLanguage] = useState<LanguageOption>('bilingual');
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Initialize documents based on hardcoded defaults
  useEffect(() => {
    const defaultDocs = DEFAULT_PROFILE_DOCUMENTS[profileType] || [];
    setDocuments(defaultDocs.map(doc => ({ ...doc })));
  }, [profileType]);

  const toggleDocument = (docType: string) => {
    setDocuments((prev) =>
      prev.map((doc) =>
        doc.document_type === docType && !doc.is_required
          ? { ...doc, selected: !doc.selected }
          : doc
      )
    );
  };

  const updateCopies = (docType: string, copies: number) => {
    setDocuments((prev) =>
      prev.map((doc) =>
        doc.document_type === docType ? { ...doc, copies: Math.max(1, copies) } : doc
      )
    );
  };

  // Returns array of components for documents that generate multiple pages (like loan receipt with customer/office copies)
  const getDocumentComponents = (docType: string): React.ReactElement[] => {
    switch (docType) {
      case 'loan_receipt':
        // Generate both customer and office copies
        return [
          <LoanReceiptPDF key="customer" data={data} config={{ language, copyType: 'customer' }} />,
          <LoanReceiptPDF key="office" data={data} config={{ language, copyType: 'office' }} />
        ];
      case 'interest_receipt':
        return [<InterestReceiptPDF key="interest" data={data} />];
      case 'redemption_receipt':
        return [<RedemptionReceiptPDF key="redemption" data={data} />];
      case 'kyc':
        return [<KycDocumentPDF key="kyc" data={data} config={{ language }} />];
      case 'gold_declaration':
        return [<GoldDeclarationPDF key="gold" data={data} config={{ language }} />];
      case 'summary':
        return [<LoanSummaryPDF key="summary" data={data} />];
      case 'declaration':
        return [<DeclarationPDF key="declaration" data={data} config={{ language }} />];
      default:
        return [];
    }
  };

  const generateMergedPdf = async (selectedDocs: DocumentSelection[]) => {
    const mergedPdf = await PDFDocument.create();
    // Calculate total items including multi-page documents like loan receipt (customer + office)
    let totalItems = 0;
    for (const doc of selectedDocs) {
      const components = getDocumentComponents(doc.document_type);
      totalItems += components.length * doc.copies;
    }
    let processed = 0;

    for (const doc of selectedDocs) {
      const components = getDocumentComponents(doc.document_type);
      if (components.length === 0) continue;

      // Generate each component (e.g., customer copy and office copy for loan receipt)
      for (const component of components) {
        const blob = await pdf(component).toBlob();
        const pdfBytes = await blob.arrayBuffer();
        const existingPdf = await PDFDocument.load(pdfBytes);

        // Add copies of this document
        for (let i = 0; i < doc.copies; i++) {
          const pages = await mergedPdf.copyPages(existingPdf, existingPdf.getPageIndices());
          pages.forEach(page => mergedPdf.addPage(page));
          processed++;
          setProgress((processed / totalItems) * 100);
        }
      }
    }

    return mergedPdf;
  };

  const handlePrint = async () => {
    const selectedDocs = documents.filter((doc) => doc.selected);
    if (selectedDocs.length === 0) {
      toast.error('Please select at least one document to print');
      return;
    }

    setGenerating(true);
    setProgress(0);

    try {
      const mergedPdf = await generateMergedPdf(selectedDocs);
      const mergedPdfBytes = await mergedPdf.save();
      const blob = new Blob([new Uint8Array(mergedPdfBytes)], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);

      // Use iframe for printing
      if (iframeRef.current) {
        iframeRef.current.src = url;
        iframeRef.current.onload = () => {
          try {
            iframeRef.current?.contentWindow?.print();
          } catch (error) {
            console.error('Print error:', error);
            // Fallback: open in new window
            window.open(url, '_blank');
          }
        };
      }

      toast.success('Print dialog opened');
    } catch (error) {
      console.error('Print error:', error);
      toast.error('Failed to generate documents');
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = async () => {
    const selectedDocs = documents.filter((doc) => doc.selected);
    if (selectedDocs.length === 0) {
      toast.error('Please select at least one document to download');
      return;
    }

    setGenerating(true);
    setProgress(0);

    try {
      const mergedPdf = await generateMergedPdf(selectedDocs);
      const mergedPdfBytes = await mergedPdf.save();
      const blob = new Blob([new Uint8Array(mergedPdfBytes)], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = `${data.loan_number || 'documents'}_all_documents.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success('Documents downloaded as single PDF');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download documents');
    } finally {
      setGenerating(false);
    }
  };

  const selectedCount = documents.filter((d) => d.selected).length;
  const totalCopies = documents.filter((d) => d.selected).reduce((sum, d) => sum + d.copies, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Printer className="h-5 w-5 text-primary" />
            {title || 'Print Documents'}
          </DialogTitle>
        </DialogHeader>

        {/* Hidden iframe for printing */}
        <iframe
          ref={iframeRef}
          className="hidden"
          title="Print Frame"
        />

        <div className="py-4 space-y-4">
          {/* Language Selection */}
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Languages className="h-4 w-4" />
              Language / மொழி
            </Label>
            <Select value={language} onValueChange={(val: LanguageOption) => setLanguage(val)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bilingual">Bilingual (English + தமிழ்)</SelectItem>
                <SelectItem value="english">English Only</SelectItem>
                <SelectItem value="tamil">தமிழ் மட்டும்</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Document Selection */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Select Documents</Label>
            <ScrollArea className="h-[280px] pr-4">
              <div className="space-y-3">
                {documents.map((doc) => (
                  <div
                    key={doc.document_type}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Checkbox
                        id={doc.document_type}
                        checked={doc.selected}
                        onCheckedChange={() => toggleDocument(doc.document_type)}
                        disabled={doc.is_required}
                      />
                      <div>
                        <Label
                          htmlFor={doc.document_type}
                          className="cursor-pointer font-medium"
                        >
                          {DOCUMENT_LABELS[doc.document_type] || doc.document_type}
                        </Label>
                        {doc.is_required && (
                          <p className="text-xs text-muted-foreground">Required</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Label className="text-xs text-muted-foreground">Copies:</Label>
                      <Input
                        type="number"
                        min={1}
                        max={10}
                        value={doc.copies}
                        onChange={(e) =>
                          updateCopies(doc.document_type, parseInt(e.target.value) || 1)
                        }
                        className="w-14 h-8 text-center"
                        disabled={!doc.selected}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Summary */}
          <div className="mt-4 p-3 bg-muted rounded-lg">
            <div className="flex justify-between text-sm">
              <span>Selected Documents:</span>
              <span className="font-medium">{selectedCount}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Total Pages:</span>
              <span className="font-medium">{totalCopies}</span>
            </div>
          </div>

          {/* Progress */}
          {generating && progress > 0 && (
            <div className="mt-4">
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-xs text-center text-muted-foreground mt-1">
                Generating merged PDF...
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={generating}>
            Cancel
          </Button>
          <Button variant="outline" onClick={handleDownload} disabled={generating}>
            {generating ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            Download
          </Button>
          <Button onClick={handlePrint} disabled={generating}>
            {generating ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Printer className="h-4 w-4 mr-2" />
            )}
            Print All
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
