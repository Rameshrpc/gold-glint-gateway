import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Printer, Download, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { pdf } from '@react-pdf/renderer';
import { useDefaultPrintProfile, PrintProfileDocument } from '@/hooks/usePrintProfiles';

// PDF Components
import LoanReceiptPDF from './documents/LoanReceiptPDF';
import InterestReceiptPDF from './documents/InterestReceiptPDF';
import RedemptionReceiptPDF from './documents/RedemptionReceiptPDF';
import KycDocumentPDF from './documents/KycDocumentPDF';
import GoldDeclarationPDF from './documents/GoldDeclarationPDF';
import LoanSummaryPDF from './documents/LoanSummaryPDF';
import DeclarationPDF from './documents/DeclarationPDF';

interface PrintProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profileType: string; // 'loan', 'interest', 'redemption', etc.
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

// Default documents if no profile is configured
const DEFAULT_DOCUMENTS: Record<string, string[]> = {
  'loan': ['loan_receipt', 'kyc', 'gold_declaration', 'summary', 'declaration'],
  'interest': ['interest_receipt'],
  'redemption': ['redemption_receipt', 'gold_declaration'],
  'reloan': ['loan_receipt', 'kyc', 'gold_declaration'],
  'auction': ['auction_notice'],
};

export default function PrintProfileDialog({
  open,
  onOpenChange,
  profileType,
  data,
  title,
}: PrintProfileDialogProps) {
  const { profile, loading: profileLoading } = useDefaultPrintProfile(profileType);
  const [documents, setDocuments] = useState<DocumentSelection[]>([]);
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);

  // Initialize documents based on profile or defaults
  useEffect(() => {
    if (profile && profile.documents.length > 0) {
      // Use profile documents
      setDocuments(
        profile.documents.map((doc) => ({
          document_type: doc.document_type,
          copies: doc.copies || 1,
          selected: doc.is_required || true,
          is_required: doc.is_required || false,
        }))
      );
    } else {
      // Use default documents for profile type
      const defaultDocs = DEFAULT_DOCUMENTS[profileType] || [];
      setDocuments(
        defaultDocs.map((docType, index) => ({
          document_type: docType,
          copies: 1,
          selected: true,
          is_required: index === 0, // First document is required
        }))
      );
    }
  }, [profile, profileType]);

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

  const getDocumentComponent = (docType: string) => {
    switch (docType) {
      case 'loan_receipt':
        return <LoanReceiptPDF data={data} />;
      case 'interest_receipt':
        return <InterestReceiptPDF data={data} />;
      case 'redemption_receipt':
        return <RedemptionReceiptPDF data={data} />;
      case 'kyc':
        return <KycDocumentPDF data={data} />;
      case 'gold_declaration':
        return <GoldDeclarationPDF data={data} />;
      case 'summary':
        return <LoanSummaryPDF data={data} />;
      case 'declaration':
        return <DeclarationPDF data={data} />;
      default:
        return null;
    }
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
      const totalDocs = selectedDocs.reduce((sum, doc) => sum + doc.copies, 0);
      let processedDocs = 0;

      // Generate and print each document
      for (const doc of selectedDocs) {
        const component = getDocumentComponent(doc.document_type);
        if (!component) continue;

        const blob = await pdf(component).toBlob();
        const url = URL.createObjectURL(blob);

        // Print the specified number of copies
        for (let i = 0; i < doc.copies; i++) {
          const printWindow = window.open(url, '_blank');
          if (printWindow) {
            printWindow.addEventListener('load', () => {
              printWindow.print();
            });
          }
          processedDocs++;
          setProgress((processedDocs / totalDocs) * 100);
        }

        // Small delay between documents
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      toast.success('Documents sent to print');
      onOpenChange(false);
    } catch (error) {
      console.error('Print error:', error);
      toast.error('Failed to generate documents');
    } finally {
      setGenerating(false);
      setProgress(0);
    }
  };

  const handleDownload = async () => {
    const selectedDocs = documents.filter((doc) => doc.selected);
    if (selectedDocs.length === 0) {
      toast.error('Please select at least one document to download');
      return;
    }

    setGenerating(true);

    try {
      // Download each selected document
      for (const doc of selectedDocs) {
        const component = getDocumentComponent(doc.document_type);
        if (!component) continue;

        const blob = await pdf(component).toBlob();
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `${data.loan_number || 'document'}_${doc.document_type}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        // Small delay between downloads
        await new Promise((resolve) => setTimeout(resolve, 300));
      }

      toast.success('Documents downloaded');
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

        <div className="py-4">
          {/* Profile Info */}
          {profile && (
            <div className="mb-4 p-3 bg-muted rounded-lg">
              <p className="text-sm font-medium">{profile.profile_name}</p>
              {profile.description && (
                <p className="text-xs text-muted-foreground">{profile.description}</p>
              )}
            </div>
          )}

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
                Generating documents...
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
