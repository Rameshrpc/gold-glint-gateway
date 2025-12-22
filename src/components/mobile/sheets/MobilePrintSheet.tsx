import { useState, useEffect } from 'react';
import { pdf } from '@react-pdf/renderer';
import { PDFDocument } from 'pdf-lib';
import { Share, Download, FileText, Loader2, Check, Printer } from 'lucide-react';
import { toast } from 'sonner';
import { MobileBottomSheet } from '../shared';
import { Button } from '@/components/ui/button';
import { usePrintSettings } from '@/hooks/usePrintSettings';
import { useEffectivePrintSettings } from '@/hooks/useEffectivePrintSettings';
import { useAuth } from '@/hooks/useAuth';
import { useClientTerms } from '@/hooks/useClientTerms';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

import { LoanReceiptPDF } from '@/components/print/documents/LoanReceiptPDF';
import { GoldDeclarationPDF } from '@/components/print/documents/GoldDeclarationPDF';
import { TermsConditionsPDF } from '@/components/print/documents/TermsConditionsPDF';
import { KYCDocumentsPDF } from '@/components/print/documents/KYCDocumentsPDF';
import { JewelImagePDF } from '@/components/print/documents/JewelImagePDF';

interface GoldItem {
  id?: string;
  item_type: string;
  description?: string | null;
  gross_weight_grams: number;
  net_weight_grams: number;
  purity: string;
  purity_percentage: number;
  appraised_value: number;
  image_url?: string | null;
}

interface Customer {
  id: string;
  customer_code: string;
  full_name: string;
  phone: string;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  photo_url?: string | null;
  aadhaar_front_url?: string | null;
  aadhaar_back_url?: string | null;
  pan_card_url?: string | null;
}

interface Loan {
  id: string;
  loan_number: string;
  loan_date: string;
  maturity_date: string;
  principal_amount: number;
  interest_rate: number;
  tenure_days: number;
  processing_fee?: number | null;
  document_charges?: number | null;
  net_disbursed: number;
  shown_principal?: number | null;
  advance_interest_shown?: number | null;
  jewel_photo_url?: string | null;
}

// Support both direct data and loanId (for fetching)
interface MobilePrintSheetPropsWithData {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loan: Loan;
  customer: Customer;
  goldItems: GoldItem[];
  loanId?: never;
}

interface MobilePrintSheetPropsWithId {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loanId: string;
  loan?: never;
  customer?: never;
  goldItems?: never;
}

export type MobilePrintSheetProps = MobilePrintSheetPropsWithData | MobilePrintSheetPropsWithId;

type DocumentType = 'loanReceipt' | 'goldDeclaration' | 'termsConditions' | 'kycDocuments' | 'jewelImage';

export default function MobilePrintSheet(props: MobilePrintSheetProps) {
  const { open, onOpenChange } = props;
  const { client, currentBranch } = useAuth();
  const { getBlocksByType } = usePrintSettings();
  const { settings: effectiveSettings } = useEffectivePrintSettings(currentBranch?.id);
  const { data: terms = [] } = useClientTerms('loan');
  
  const [generating, setGenerating] = useState(false);
  const [selectedDocs, setSelectedDocs] = useState<Set<DocumentType>>(new Set(['loanReceipt', 'goldDeclaration']));
  const [fetchedData, setFetchedData] = useState<{ loan: Loan; customer: Customer; goldItems: GoldItem[] } | null>(null);
  const [loading, setLoading] = useState(false);

  // Determine data source
  const hasDirectData = 'loan' in props && props.loan;
  const loan = hasDirectData ? props.loan : fetchedData?.loan;
  const customer = hasDirectData ? props.customer : fetchedData?.customer;
  const goldItems = hasDirectData ? props.goldItems : fetchedData?.goldItems || [];

  // Fetch data if loanId is provided
  useEffect(() => {
    if ('loanId' in props && props.loanId && open) {
      const fetchLoanData = async () => {
        setLoading(true);
        try {
          const { data, error } = await supabase
            .from('loans')
            .select(`
              id, loan_number, loan_date, maturity_date, principal_amount, interest_rate,
              tenure_days, processing_fee, document_charges, net_disbursed, shown_principal,
              advance_interest_shown, jewel_photo_url,
              customer:customers(id, customer_code, full_name, phone, address, city, state, photo_url, aadhaar_front_url, aadhaar_back_url, pan_card_url),
              gold_items(id, item_type, description, gross_weight_grams, net_weight_grams, purity, purity_percentage, appraised_value, image_url)
            `)
            .eq('id', props.loanId)
            .single();

          if (error) throw error;
          if (data) {
            setFetchedData({
              loan: data as unknown as Loan,
              customer: data.customer as unknown as Customer,
              goldItems: (data.gold_items || []) as unknown as GoldItem[],
            });
          }
        } catch (error) {
          console.error('Failed to fetch loan data:', error);
          toast.error('Failed to load loan data');
        } finally {
          setLoading(false);
        }
      };
      fetchLoanData();
    }
  }, [props, open]);

  const documents: { key: DocumentType; label: string; sublabel: string; disabled?: boolean }[] = [
    { key: 'loanReceipt', label: 'Loan Receipt', sublabel: 'Principal & items details' },
    { key: 'goldDeclaration', label: 'Gold Declaration', sublabel: 'Pledging declaration' },
    { key: 'termsConditions', label: 'Terms & Conditions', sublabel: 'Loan terms', disabled: terms.length === 0 },
    { key: 'kycDocuments', label: 'KYC Documents', sublabel: 'Customer documents' },
    { key: 'jewelImage', label: 'Jewel Image', sublabel: 'Photo of pledged items' },
  ];

  // Check if Web Share API with files is supported
  const canShare = typeof navigator.share === 'function' && typeof navigator.canShare === 'function';

  const toggleDoc = (key: DocumentType) => {
    const newSelected = new Set(selectedDocs);
    if (newSelected.has(key)) {
      newSelected.delete(key);
    } else {
      newSelected.add(key);
    }
    setSelectedDocs(newSelected);
  };

  const generatePDF = async (): Promise<Blob | null> => {
    if (selectedDocs.size === 0) {
      toast.error('Please select at least one document');
      return null;
    }

    try {
      const language = effectiveSettings?.language || 'english';
      const paperSize = effectiveSettings?.paper_size || 'A4';
      
      const companyName = client?.company_name || 'Company';
      const branchName = currentBranch?.branch_name;
      
      const declarations = getBlocksByType('gold_declaration');
      const warnings = getBlocksByType('warning');
      const acknowledgments = getBlocksByType('acknowledgment');
      const signatureLabels = getBlocksByType('signature_labels');
      
      const blobs: Blob[] = [];

      // Generate Loan Receipt
      if (selectedDocs.has('loanReceipt')) {
        const doc = (
          <LoanReceiptPDF
            loan={loan}
            customer={customer}
            goldItems={goldItems}
            companyName={companyName}
            branchName={branchName}
            language={language}
            paperSize={paperSize}
            footerEnglish={effectiveSettings?.footer_english}
            footerTamil={effectiveSettings?.footer_tamil}
            sloganEnglish={effectiveSettings?.company_slogan_english}
            sloganTamil={effectiveSettings?.company_slogan_tamil}
            logoUrl={effectiveSettings?.logo_url}
          />
        );
        const blob = await pdf(doc).toBlob();
        blobs.push(blob);
      }

      // Generate Gold Declaration
      if (selectedDocs.has('goldDeclaration')) {
        const doc = (
          <GoldDeclarationPDF
            loan={loan}
            customer={customer}
            companyName={companyName}
            branchName={branchName}
            language={language}
            paperSize={paperSize}
            declarations={declarations}
            warnings={warnings}
            acknowledgments={acknowledgments}
            signatureLabels={signatureLabels}
            sloganEnglish={effectiveSettings?.company_slogan_english}
            sloganTamil={effectiveSettings?.company_slogan_tamil}
            logoUrl={effectiveSettings?.logo_url}
          />
        );
        const blob = await pdf(doc).toBlob();
        blobs.push(blob);
      }

      // Generate Terms & Conditions
      if (selectedDocs.has('termsConditions') && terms.length > 0) {
        const doc = (
          <TermsConditionsPDF
            loan={loan}
            customer={customer}
            companyName={companyName}
            branchName={branchName}
            language={language}
            paperSize={paperSize}
            terms={terms}
            acknowledgments={acknowledgments}
            signatureLabels={signatureLabels}
            sloganEnglish={effectiveSettings?.company_slogan_english}
            sloganTamil={effectiveSettings?.company_slogan_tamil}
            logoUrl={effectiveSettings?.logo_url}
          />
        );
        const blob = await pdf(doc).toBlob();
        blobs.push(blob);
      }

      // Generate KYC Documents
      if (selectedDocs.has('kycDocuments')) {
        const doc = (
          <KYCDocumentsPDF
            customer={customer}
            loanNumber={loan.loan_number}
            companyName={companyName}
            language={language}
            paperSize={paperSize}
            logoUrl={effectiveSettings?.logo_url}
          />
        );
        const blob = await pdf(doc).toBlob();
        blobs.push(blob);
      }

      // Generate Jewel Image
      if (selectedDocs.has('jewelImage')) {
        const doc = (
          <JewelImagePDF
            jewelPhotoUrl={loan.jewel_photo_url}
            goldItems={goldItems}
            loanNumber={loan.loan_number}
            loanDate={loan.loan_date}
            customerName={customer.full_name}
            customerCode={customer.customer_code}
            companyName={companyName}
            language={language}
            paperSize={paperSize}
            logoUrl={effectiveSettings?.logo_url}
          />
        );
        const blob = await pdf(doc).toBlob();
        blobs.push(blob);
      }

      if (blobs.length === 0) return null;

      // Merge all PDFs
      const mergedPdf = await PDFDocument.create();
      
      for (const blob of blobs) {
        const arrayBuffer = await blob.arrayBuffer();
        const pdfDoc = await PDFDocument.load(arrayBuffer);
        const pages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());
        pages.forEach(page => mergedPdf.addPage(page));
      }
      
      const mergedPdfBytes = await mergedPdf.save();
      return new Blob([new Uint8Array(mergedPdfBytes)], { type: 'application/pdf' });
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw error;
    }
  };

  const handleShare = async () => {
    setGenerating(true);
    try {
      const blob = await generatePDF();
      if (!blob) return;

      const fileName = `Loan_${loan.loan_number}_${new Date().toISOString().split('T')[0]}.pdf`;
      const file = new File([blob], fileName, { type: 'application/pdf' });

      // Check if we can share files
      if (canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `Loan ${loan.loan_number}`,
          text: `Loan documents for ${customer.full_name}`,
        });
        toast.success('Shared successfully!');
      } else {
        // Fallback to download
        handleDownload();
      }
      onOpenChange(false);
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error('Share error:', error);
        toast.error('Failed to share. Downloading instead...');
        handleDownload();
      }
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = async () => {
    setGenerating(true);
    try {
      const blob = await generatePDF();
      if (!blob) return;

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Loan_${loan.loan_number}_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success('PDF downloaded successfully!');
      onOpenChange(false);
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to generate PDF');
    } finally {
      setGenerating(false);
    }
  };

  const handlePrint = async () => {
    setGenerating(true);
    try {
      const blob = await generatePDF();
      if (!blob) return;

      const url = URL.createObjectURL(blob);
      const printWindow = window.open(url, '_blank');
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print();
        };
      }
      toast.success('Opening for print...');
      URL.revokeObjectURL(url);
      onOpenChange(false);
    } catch (error) {
      console.error('Print error:', error);
      toast.error('Failed to generate PDF');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <MobileBottomSheet
      isOpen={open}
      onClose={() => onOpenChange(false)}
      title="Print Documents"
    >
      <div className="space-y-4 pb-4">
        {/* Loan Info */}
        <div className="bg-muted/50 rounded-xl p-3">
          <p className="font-semibold">{loan.loan_number}</p>
          <p className="text-sm text-muted-foreground">{customer.full_name}</p>
        </div>

        {/* Document Selection */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground px-1">Select Documents</p>
          {documents.map((doc) => (
            <button
              key={doc.key}
              onClick={() => !doc.disabled && toggleDoc(doc.key)}
              disabled={doc.disabled}
              className={cn(
                "w-full flex items-center gap-3 p-3 rounded-xl transition-all tap-scale",
                doc.disabled 
                  ? "opacity-50 cursor-not-allowed bg-muted/30" 
                  : selectedDocs.has(doc.key)
                    ? "bg-primary/10 border-2 border-primary"
                    : "bg-card border border-border hover:bg-muted"
              )}
            >
              <div className={cn(
                "w-6 h-6 rounded-full flex items-center justify-center transition-all",
                selectedDocs.has(doc.key)
                  ? "bg-primary text-white"
                  : "bg-muted border border-border"
              )}>
                {selectedDocs.has(doc.key) && <Check className="w-4 h-4" />}
              </div>
              <div className="flex-1 text-left">
                <p className="font-medium text-sm">{doc.label}</p>
                <p className="text-xs text-muted-foreground">{doc.sublabel}</p>
              </div>
              <FileText className="w-5 h-5 text-muted-foreground" />
            </button>
          ))}
        </div>

        {terms.length === 0 && (
          <p className="text-xs text-muted-foreground text-center">
            Terms & Conditions not configured in Settings
          </p>
        )}

        {/* Action Buttons */}
        <div className="grid grid-cols-3 gap-2 pt-2">
          <Button
            variant="outline"
            onClick={handlePrint}
            disabled={generating || selectedDocs.size === 0}
            className="flex flex-col items-center gap-1 h-auto py-3"
          >
            {generating ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Printer className="w-5 h-5" />
            )}
            <span className="text-xs">Print</span>
          </Button>
          
          <Button
            variant="outline"
            onClick={handleDownload}
            disabled={generating || selectedDocs.size === 0}
            className="flex flex-col items-center gap-1 h-auto py-3"
          >
            {generating ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Download className="w-5 h-5" />
            )}
            <span className="text-xs">Download</span>
          </Button>
          
          <Button
            onClick={handleShare}
            disabled={generating || selectedDocs.size === 0}
            className="flex flex-col items-center gap-1 h-auto py-3 gradient-gold text-white"
          >
            {generating ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Share className="w-5 h-5" />
            )}
            <span className="text-xs">Share</span>
          </Button>
        </div>
      </div>
    </MobileBottomSheet>
  );
}
