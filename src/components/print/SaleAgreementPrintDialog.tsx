import React, { useState } from 'react';
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
import { useEffectivePrintSettings } from '@/hooks/useEffectivePrintSettings';
import { useAuth } from '@/hooks/useAuth';
import { getSignedCustomerDocumentUrl, getSignedLoanDocumentUrl } from '@/lib/storage-utils';

import { SaleAgreementPDF } from './documents/SaleAgreementPDF';
import { KYCDocumentsPDF } from './documents/KYCDocumentsPDF';
import { JewelImagePDF } from './documents/JewelImagePDF';

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

interface SaleAgreement {
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
  jewel_photo_url?: string | null;
  transaction_type?: string | null;
}

interface SaleAgreementPrintDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loan: SaleAgreement;
  customer: Customer;
  goldItems: GoldItem[];
}

interface DocumentSelection {
  billOfSale: boolean;
  kycDocuments: boolean;
  jewelImage: boolean;
}

interface CopyCounts {
  billOfSale: number;
  kycDocuments: number;
  jewelImage: number;
}

export function SaleAgreementPrintDialog({
  open,
  onOpenChange,
  loan,
  customer,
  goldItems,
}: SaleAgreementPrintDialogProps) {
  const { client, currentBranch } = useAuth();
  const { settings: effectiveSettings } = useEffectivePrintSettings(currentBranch?.id);
  
  const [generating, setGenerating] = useState(false);
  const [selection, setSelection] = useState<DocumentSelection>({
    billOfSale: true,
    kycDocuments: true,
    jewelImage: true,
  });
  
  const [copies, setCopies] = useState<CopyCounts>({
    billOfSale: 1, // Sale Agreement typically needs only 1 copy (stamp paper)
    kycDocuments: 1,
    jewelImage: 1,
  });

  const handleSelectionChange = (doc: keyof DocumentSelection) => {
    setSelection(prev => ({ ...prev, [doc]: !prev[doc] }));
  };

  const handleCopyChange = (doc: keyof CopyCounts, value: string) => {
    const num = parseInt(value) || 1;
    setCopies(prev => ({ ...prev, [doc]: Math.max(1, Math.min(10, num)) }));
  };

  const selectAll = () => {
    setSelection({
      billOfSale: true,
      kycDocuments: true,
      jewelImage: true,
    });
  };

  const deselectAll = () => {
    setSelection({
      billOfSale: false,
      kycDocuments: false,
      jewelImage: false,
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
      
      const blobs: Blob[] = [];

      // Generate Bill of Sale Agreement (Sale Agreement PDF)
      if (selection.billOfSale) {
        // Use sale agreement specific company name and address if configured
        const saleAgreementCompanyName = effectiveSettings.sale_agreement_company_name || companyName;
        const saleAgreementCompanyAddress = effectiveSettings.sale_agreement_company_address || (client as any)?.address || '';
        
        // Don't show branch name when dedicated address is configured
        const showBranchInSaleAgreement = !effectiveSettings.sale_agreement_company_address;
        
        // Calculate margin per month from interest_rate (which stores the margin rate)
        const marginPerMonth = loan.interest_rate;
        
        const saleAgreementDoc = (
          <SaleAgreementPDF
            loan={loan}
            customer={customer}
            goldItems={goldItems}
            companyName={saleAgreementCompanyName}
            companyAddress={saleAgreementCompanyAddress}
            gstin={(client as any)?.gstin}
            branchName={showBranchInSaleAgreement ? branchName : undefined}
            language={language}
            paperSize={paperSize}
            marginPerMonth={marginPerMonth}
          />
        );
        
        // Generate copies for Bill of Sale
        for (let i = 0; i < copies.billOfSale; i++) {
          const blob = await pdf(saleAgreementDoc).toBlob();
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
        
        // Use Zamin Gold branding for Sale Agreement documents
        const saleAgreementCompanyName = effectiveSettings.sale_agreement_company_name || companyName;
        const saleAgreementLogoUrl = effectiveSettings.sale_agreement_logo_url || effectiveSettings.logo_url;
        
        const doc = (
          <KYCDocumentsPDF
            customer={customerWithSignedUrls}
            loanNumber={loan.loan_number}
            companyName={saleAgreementCompanyName}
            language={language}
            paperSize={paperSize}
            logoUrl={saleAgreementLogoUrl}
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
        
        // Use Zamin Gold branding for Sale Agreement documents
        const saleAgreementCompanyName = effectiveSettings.sale_agreement_company_name || companyName;
        const saleAgreementLogoUrl = effectiveSettings.sale_agreement_logo_url || effectiveSettings.logo_url;
        
        const doc = (
          <JewelImagePDF
            jewelPhotoUrl={jewelPhotoSignedUrl}
            goldItems={goldItems}
            loanNumber={loan.loan_number}
            loanDate={loan.loan_date}
            customerName={customer.full_name}
            customerCode={customer.customer_code}
            companyName={saleAgreementCompanyName}
            language={language}
            paperSize={paperSize}
            logoUrl={saleAgreementLogoUrl}
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
        link.download = `SaleAgreement_${loan.loan_number}_${new Date().toISOString().split('T')[0]}.pdf`;
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
    { key: 'billOfSale' as const, label: 'Bill of Sale Agreement', icon: FileText },
    { key: 'kycDocuments' as const, label: 'KYC Documents', icon: FileText },
    { key: 'jewelImage' as const, label: 'Jewel Image', icon: FileText },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Printer className="h-5 w-5" />
            Print Sale Agreement Documents
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Agreement Info */}
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
              <div key={doc.key} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Checkbox
                    id={doc.key}
                    checked={selection[doc.key]}
                    onCheckedChange={() => handleSelectionChange(doc.key)}
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
                  disabled={!selection[doc.key]}
                />
              </div>
            ))}
          </div>
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
