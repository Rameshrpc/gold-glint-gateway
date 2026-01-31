import React, { useState, useEffect } from 'react';
import { pdf } from '@react-pdf/renderer';
import { PDFDocument } from 'pdf-lib';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Printer, Download, FileText, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { usePrintSettings } from '@/hooks/usePrintSettings';
import { useEffectivePrintSettings } from '@/hooks/useEffectivePrintSettings';
import { useAuth } from '@/hooks/useAuth';
import { useClientTerms } from '@/hooks/useClientTerms';
import { useBillOfSaleContentForPDF } from '@/hooks/useBillOfSaleContent';
import { useTodayMarketRate } from '@/hooks/useMarketRates';
import { getSignedCustomerDocumentUrl, getSignedLoanDocumentUrl } from '@/lib/storage-utils';

import { LoanReceiptPDF } from './documents/LoanReceiptPDF';
import { KYCDocumentsPDF } from './documents/KYCDocumentsPDF';
import { JewelImagePDF } from './documents/JewelImagePDF';
import { GoldDeclarationPDF } from './documents/GoldDeclarationPDF';
import { TermsConditionsPDF } from './documents/TermsConditionsPDF';
import { BillOfSalePDF } from './documents/BillOfSalePDF';
import { SaleAgreementPDF } from './documents/SaleAgreementPDF';

interface GoldItem {
  id?: string;
  item_type: string;
  description?: string | null;
  gross_weight_grams: number;
  net_weight_grams: number;
  purity: string;
  purity_percentage: number;
  appraised_value: number;
  market_value?: number | null;
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
  nominee_name?: string | null;
  nominee_relation?: string | null;
  date_of_birth?: string | null;
  gender?: string | null;
  father_name?: string | null;
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
  actual_principal?: number | null;
  advance_interest_shown?: number | null;
  jewel_photo_url?: string | null;
  rebate_days?: number | null;
  rebate_amount?: number | null;
  differential_capitalized?: number | null;
  transaction_type?: string | null;
}

interface LoanPrintDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loan: Loan;
  customer: Customer;
  goldItems: GoldItem[];
}

interface DocumentSelection {
  loanReceipt: boolean;
  billOfSale: boolean;
  kycDocuments: boolean;
  jewelImage: boolean;
  goldDeclaration: boolean;
  termsConditions: boolean;
}

interface CopyCounts {
  loanReceipt: number;
  billOfSale: number;
  kycDocuments: number;
  jewelImage: number;
  goldDeclaration: number;
  termsConditions: number;
}

export function LoanPrintDialog({
  open,
  onOpenChange,
  loan,
  customer,
  goldItems,
}: LoanPrintDialogProps) {
  const { client, currentBranch } = useAuth();
  const { getBlocksByType } = usePrintSettings();
  // Use effective settings based on current branch
  const { settings: effectiveSettings } = useEffectivePrintSettings(currentBranch?.id);
  const { data: terms = [] } = useClientTerms('loan');
  const billOfSaleContent = useBillOfSaleContentForPDF();
  const { data: marketRate } = useTodayMarketRate();
  
  const [generating, setGenerating] = useState(false);
  const [selection, setSelection] = useState<DocumentSelection>({
    loanReceipt: true,
    billOfSale: false,
    kycDocuments: false,
    jewelImage: false,
    goldDeclaration: true,
    termsConditions: false,
  });
  
  const [copies, setCopies] = useState<CopyCounts>({
    loanReceipt: 2,
    billOfSale: 2,
    kycDocuments: 1,
    jewelImage: 1,
    goldDeclaration: 1,
    termsConditions: 1,
  });

  // Update defaults from effective settings
  useEffect(() => {
    if (effectiveSettings) {
      const useTradingFormat = (effectiveSettings as any).use_trading_format ?? false;
      setSelection({
        loanReceipt: useTradingFormat ? false : (effectiveSettings.include_loan_receipt ?? true),
        billOfSale: useTradingFormat ? true : ((effectiveSettings as any).include_bill_of_sale ?? false),
        kycDocuments: effectiveSettings.include_kyc_documents ?? false,
        jewelImage: effectiveSettings.include_jewel_image ?? false,
        goldDeclaration: effectiveSettings.include_gold_declaration ?? true,
        termsConditions: effectiveSettings.include_terms_conditions ?? false,
      });
      setCopies({
        loanReceipt: effectiveSettings.loan_receipt_copies ?? 2,
        billOfSale: (effectiveSettings as any).bill_of_sale_copies ?? 2,
        kycDocuments: effectiveSettings.kyc_documents_copies ?? 1,
        jewelImage: effectiveSettings.jewel_image_copies ?? 1,
        goldDeclaration: effectiveSettings.gold_declaration_copies ?? 1,
        termsConditions: effectiveSettings.terms_conditions_copies ?? 1,
      });
    }
  }, [effectiveSettings]);

  const handleSelectionChange = (doc: keyof DocumentSelection) => {
    setSelection(prev => ({ ...prev, [doc]: !prev[doc] }));
  };

  const handleCopyChange = (doc: keyof CopyCounts, value: string) => {
    const num = parseInt(value) || 1;
    setCopies(prev => ({ ...prev, [doc]: Math.max(1, Math.min(10, num)) }));
  };

  const selectAll = () => {
    setSelection({
      loanReceipt: true,
      billOfSale: true,
      kycDocuments: true,
      jewelImage: true,
      goldDeclaration: true,
      termsConditions: true,
    });
  };

  const deselectAll = () => {
    setSelection({
      loanReceipt: false,
      billOfSale: false,
      kycDocuments: false,
      jewelImage: false,
      goldDeclaration: false,
      termsConditions: false,
    });
  };

  const getSelectedCount = () => {
    return Object.values(selection).filter(Boolean).length;
  };

  const generatePDF = async (action: 'print' | 'download') => {
    if (getSelectedCount() === 0) {
      toast.error('Please select at least one document');
      return;
    }

    setGenerating(true);
    try {
      const language = effectiveSettings.language;
      const paperSize = effectiveSettings.paper_size;
      
      const companyName = client?.company_name || 'Company';
      const branchName = currentBranch?.branch_name;
      
      const declarations = getBlocksByType('gold_declaration');
      const warnings = getBlocksByType('warning');
      const acknowledgments = getBlocksByType('acknowledgment');
      const signatureLabels = getBlocksByType('signature_labels');
      
      const blobs: Blob[] = [];

      // Generate Loan Receipt - Customer Copy and Office Copy
      if (selection.loanReceipt) {
        // Generate customer copy
        const customerDoc = (
          <LoanReceiptPDF
            loan={loan}
            customer={customer}
            goldItems={goldItems}
            companyName={companyName}
            branchName={branchName}
            language={language}
            paperSize={paperSize}
            footerEnglish={effectiveSettings.footer_english}
            footerTamil={effectiveSettings.footer_tamil}
            sloganEnglish={effectiveSettings.company_slogan_english}
            sloganTamil={effectiveSettings.company_slogan_tamil}
            logoUrl={effectiveSettings.logo_url}
            copyType="customer"
            marketRate={marketRate}
          />
        );
        const customerBlob = await pdf(customerDoc).toBlob();
        blobs.push(customerBlob);
        
        // Generate office copy if copies > 1
        if (copies.loanReceipt > 1) {
          const officeDoc = (
            <LoanReceiptPDF
              loan={loan}
              customer={customer}
              goldItems={goldItems}
              companyName={companyName}
              branchName={branchName}
              language={language}
              paperSize={paperSize}
              footerEnglish={effectiveSettings.footer_english}
              footerTamil={effectiveSettings.footer_tamil}
              sloganEnglish={effectiveSettings.company_slogan_english}
              sloganTamil={effectiveSettings.company_slogan_tamil}
              logoUrl={effectiveSettings.logo_url}
              copyType="office"
              marketRate={marketRate}
            />
          );
          const officeBlob = await pdf(officeDoc).toBlob();
          blobs.push(officeBlob);
        }
      }

      // Generate Bill of Sale / Sale Agreement
      if (selection.billOfSale) {
        const isSaleAgreement = loan.transaction_type === 'sale_agreement';
        
        if (isSaleAgreement) {
          // Use new 3-page Sale Agreement PDF for sale_agreement transactions
          // Use sale agreement specific company name if configured
          const saleAgreementCompanyName = effectiveSettings.sale_agreement_company_name || companyName;
          
          const saleAgreementDoc = (
            <SaleAgreementPDF
              loan={loan}
              customer={customer}
              goldItems={goldItems}
              companyName={saleAgreementCompanyName}
              companyAddress={(client as any)?.address || ''}
              gstin={(client as any)?.gstin}
              branchName={branchName}
              language={language}
              paperSize={paperSize}
            />
          );
          const blob = await pdf(saleAgreementDoc).toBlob();
          blobs.push(blob);
          
          // For stamp paper format, typically only 1 copy is needed
          // (office retains photocopy, customer gets original on stamp paper)
        } else {
          // Use existing BillOfSalePDF for regular trading format
          // Transform content from hook to PDF format
          const billOfSaleContentForPDF = billOfSaleContent.hasContent ? {
            title: billOfSaleContent.title,
            legalRef: billOfSaleContent.legalRef,
            sellerTitle: billOfSaleContent.sellerTitle,
            buyerTitle: billOfSaleContent.buyerTitle,
            goodsTitle: billOfSaleContent.goodsTitle,
            goodsIntro: billOfSaleContent.goodsIntro,
            considerationTitle: billOfSaleContent.considerationTitle,
            considerationIntro: billOfSaleContent.considerationIntro,
            spotPriceLabel: billOfSaleContent.spotPriceLabel,
            repurchaseTitle: billOfSaleContent.repurchaseTitle,
            repurchaseIntro: billOfSaleContent.repurchaseIntro,
            expiryNote: billOfSaleContent.expiryNote,
            declarationsTitle: billOfSaleContent.declarationsTitle,
            declarations: billOfSaleContent.declarations,
            sellerSignature: billOfSaleContent.sellerSignature,
            sellerSignatureNote: billOfSaleContent.sellerSignatureNote,
            buyerSignature: billOfSaleContent.buyerSignature,
            buyerSignatureNote: billOfSaleContent.buyerSignatureNote,
            strikePeriodHeader: billOfSaleContent.strikePeriodHeader,
            strikePriceHeader: billOfSaleContent.strikePriceHeader,
            strikeStatusHeader: billOfSaleContent.strikeStatusHeader,
            strikePeriods: billOfSaleContent.strikePeriods,
          } : undefined;

          // Customer copy
          const customerDoc = (
            <BillOfSalePDF
              loan={loan}
              customer={customer}
              goldItems={goldItems}
              companyName={companyName}
              companyAddress={(client as any)?.address || ''}
              gstin={(client as any)?.gstin}
              stateCode={(client as any)?.state_code || '33'}
              branchName={branchName}
              language={language}
              paperSize={paperSize}
              sloganEnglish={effectiveSettings.company_slogan_english}
              sloganTamil={effectiveSettings.company_slogan_tamil}
              logoUrl={effectiveSettings.logo_url}
              copyType="customer"
              content={billOfSaleContentForPDF}
            />
          );
          const customerBlob = await pdf(customerDoc).toBlob();
          blobs.push(customerBlob);
          
          // Office copy if copies > 1
          if (copies.billOfSale > 1) {
            const officeDoc = (
              <BillOfSalePDF
                loan={loan}
                customer={customer}
                goldItems={goldItems}
                companyName={companyName}
                companyAddress={(client as any)?.address || ''}
                gstin={(client as any)?.gstin}
                stateCode={(client as any)?.state_code || '33'}
                branchName={branchName}
                language={language}
                paperSize={paperSize}
                sloganEnglish={effectiveSettings.company_slogan_english}
                sloganTamil={effectiveSettings.company_slogan_tamil}
                logoUrl={effectiveSettings.logo_url}
                copyType="office"
                content={billOfSaleContentForPDF}
              />
            );
            const officeBlob = await pdf(officeDoc).toBlob();
            blobs.push(officeBlob);
          }
        }
      }

      // Generate Gold Declaration
      if (selection.goldDeclaration) {
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
            sloganEnglish={effectiveSettings.company_slogan_english}
            sloganTamil={effectiveSettings.company_slogan_tamil}
            logoUrl={effectiveSettings.logo_url}
          />
        );
        for (let i = 0; i < copies.goldDeclaration; i++) {
          const blob = await pdf(doc).toBlob();
          blobs.push(blob);
        }
      }

      // Generate Terms & Conditions
      if (selection.termsConditions && terms.length > 0) {
        // Pass customer with nominee info and loan with principal for placeholder replacement
        const customerForTerms = {
          ...customer,
          nominee_name: customer.nominee_name,
          nominee_relation: customer.nominee_relation,
        };
        
        const loanForTerms = {
          ...loan,
          principal_amount: loan.principal_amount,
        };
        
        const doc = (
          <TermsConditionsPDF
            loan={loanForTerms}
            customer={customerForTerms}
            companyName={companyName}
            branchName={branchName}
            branchAddress={branchName}
            language={language}
            paperSize={paperSize}
            terms={terms}
            acknowledgments={acknowledgments}
            signatureLabels={signatureLabels}
            sloganEnglish={effectiveSettings.company_slogan_english}
            sloganTamil={effectiveSettings.company_slogan_tamil}
            logoUrl={effectiveSettings.logo_url}
          />
        );
        for (let i = 0; i < copies.termsConditions; i++) {
          const blob = await pdf(doc).toBlob();
          blobs.push(blob);
        }
      }

      // Generate KYC Documents - fetch signed URLs for private bucket
      if (selection.kycDocuments) {
        // Fetch signed URLs for all customer documents in parallel
        const [aadhaarFrontUrl, aadhaarBackUrl, panCardUrl] = await Promise.all([
          getSignedCustomerDocumentUrl(customer.aadhaar_front_url),
          getSignedCustomerDocumentUrl(customer.aadhaar_back_url),
          getSignedCustomerDocumentUrl(customer.pan_card_url),
        ]);
        
        const customerWithSignedUrls = {
          ...customer,
          aadhaar_front_url: aadhaarFrontUrl,
          aadhaar_back_url: aadhaarBackUrl,
          pan_card_url: panCardUrl,
        };
        
        const doc = (
          <KYCDocumentsPDF
            customer={customerWithSignedUrls}
            loanNumber={loan.loan_number}
            companyName={companyName}
            language={language}
            paperSize={paperSize}
            logoUrl={effectiveSettings.logo_url}
          />
        );
        for (let i = 0; i < copies.kycDocuments; i++) {
          const blob = await pdf(doc).toBlob();
          blobs.push(blob);
        }
      }

      // Generate Jewel Image - fetch signed URL for private bucket
      if (selection.jewelImage) {
        // Fetch signed URL for jewel photo
        const jewelPhotoSignedUrl = await getSignedLoanDocumentUrl(loan.jewel_photo_url);
        
        const doc = (
          <JewelImagePDF
            jewelPhotoUrl={jewelPhotoSignedUrl}
            goldItems={goldItems}
            loanNumber={loan.loan_number}
            loanDate={loan.loan_date}
            customerName={customer.full_name}
            customerCode={customer.customer_code}
            companyName={companyName}
            language={language}
            paperSize={paperSize}
            logoUrl={effectiveSettings.logo_url}
          />
        );
        for (let i = 0; i < copies.jewelImage; i++) {
          const blob = await pdf(doc).toBlob();
          blobs.push(blob);
        }
      }

      if (blobs.length === 0) {
        toast.error('No documents to generate');
        return;
      }

      // Merge all PDFs using pdf-lib
      const mergedPdf = await PDFDocument.create();
      
      for (const blob of blobs) {
        const arrayBuffer = await blob.arrayBuffer();
        const pdfDoc = await PDFDocument.load(arrayBuffer);
        const pages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());
        pages.forEach(page => mergedPdf.addPage(page));
      }
      
      const mergedPdfBytes = await mergedPdf.save();
      const finalBlob = new Blob([new Uint8Array(mergedPdfBytes)], { type: 'application/pdf' });
      const url = URL.createObjectURL(finalBlob);

      if (action === 'download') {
        const link = document.createElement('a');
        link.href = url;
        link.download = `Loan_${loan.loan_number}_${new Date().toISOString().split('T')[0]}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success(`PDF downloaded with ${blobs.length} document(s)`);
      } else {
        const printWindow = window.open(url, '_blank');
        if (printWindow) {
          printWindow.onload = () => {
            printWindow.print();
          };
        }
        toast.success(`Opening ${blobs.length} document(s) for print...`);
      }

      URL.revokeObjectURL(url);
      onOpenChange(false);
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF');
    } finally {
      setGenerating(false);
    }
  };

  const documents = [
    { key: 'loanReceipt' as const, label: 'Loan Receipt', icon: FileText },
    { key: 'billOfSale' as const, label: 'Bill of Sale Agreement', icon: FileText },
    { key: 'goldDeclaration' as const, label: 'Gold Declaration', icon: FileText },
    { key: 'termsConditions' as const, label: 'Terms & Conditions', icon: FileText, disabled: terms.length === 0 },
    { key: 'kycDocuments' as const, label: 'KYC Documents', icon: FileText },
    { key: 'jewelImage' as const, label: 'Jewel Image', icon: FileText },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Printer className="h-5 w-5" />
            Print Loan Documents
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Loan Info */}
          <div className="bg-muted/50 rounded-lg p-3">
            <p className="font-medium">{loan.loan_number}</p>
            <p className="text-sm text-muted-foreground">{customer.full_name}</p>
          </div>

          {/* Quick Actions */}
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={selectAll}>
              Select All
            </Button>
            <Button variant="outline" size="sm" onClick={deselectAll}>
              Deselect All
            </Button>
          </div>

          <Separator />

          {/* Document Selection */}
          <div className="space-y-3">
            {documents.map((doc) => (
              <div key={doc.key} className={`flex items-center justify-between ${doc.disabled ? 'opacity-50' : ''}`}>
                <div className="flex items-center gap-3">
                  <Checkbox
                    id={doc.key}
                    checked={selection[doc.key]}
                    onCheckedChange={() => handleSelectionChange(doc.key)}
                    disabled={doc.disabled}
                  />
                  <Label htmlFor={doc.key} className="cursor-pointer">
                    {doc.label}
                  </Label>
                </div>
                <Input
                  type="number"
                  min={1}
                  max={10}
                  value={copies[doc.key]}
                  onChange={(e) => handleCopyChange(doc.key, e.target.value)}
                  className="w-16 h-8 text-center"
                  disabled={!selection[doc.key] || doc.disabled}
                />
              </div>
            ))}
          </div>

          {terms.length === 0 && (
            <p className="text-xs text-muted-foreground">
              * Terms & Conditions not configured - add them in Settings → Print
            </p>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="outline"
            onClick={() => generatePDF('download')}
            disabled={generating || getSelectedCount() === 0}
          >
            {generating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Download className="h-4 w-4 mr-2" />}
            Download
          </Button>
          <Button
            onClick={() => generatePDF('print')}
            disabled={generating || getSelectedCount() === 0}
          >
            {generating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Printer className="h-4 w-4 mr-2" />}
            Print
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
