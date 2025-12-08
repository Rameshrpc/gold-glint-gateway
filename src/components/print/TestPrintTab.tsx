import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, Printer, FileText, Eye } from 'lucide-react';
import { useTemplatesByType, PrintTemplate } from '@/hooks/usePrintTemplates';
import { usePrintSettings } from '@/hooks/usePrintSettings';
import { pdf } from '@react-pdf/renderer';
import { toast } from 'sonner';
import { LoanBilingualTemplate } from '@/components/receipts/templates/LoanBilingualTemplate';
import { InterestBilingualTemplate } from '@/components/receipts/templates/InterestBilingualTemplate';
import { AuctionBilingualTemplate } from '@/components/receipts/templates/AuctionBilingualTemplate';

const receiptTypes = [
  { key: 'loan', label: 'Loan Disbursement' },
  { key: 'interest', label: 'Interest Receipt' },
  { key: 'redemption', label: 'Redemption Receipt' },
  { key: 'auction', label: 'Auction Notice' },
];

// Sample data for test printing
const sampleData = {
  company: {
    name: 'Sample Gold Finance',
    nameTamil: 'மாதிரி தங்க நிதி',
    address: '123 Main Street, Chennai - 600001',
    phone: '+91 98765 43210',
  },
  loan: {
    loan_number: 'L-2025-SAMPLE',
    loan_date: new Date().toISOString(),
    principal_amount: 100000,
    interest_rate: 18,
    tenure_days: 90,
    maturity_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
    processing_fee: 500,
    document_charges: 100,
    advance_interest: 4500,
    net_disbursed: 94900,
  },
  customer: {
    full_name: 'Rajesh Kumar',
    customer_code: 'CUST-001',
    phone: '+91 98765 12345',
    address: '456 Sample Street, Chennai',
  },
  goldItems: [
    { item_type: 'Chain', gross_weight_grams: 25.5, net_weight_grams: 24.0, purity: '22K', appraised_value: 125000 },
    { item_type: 'Ring', gross_weight_grams: 8.2, net_weight_grams: 8.0, purity: '22K', appraised_value: 40000 },
  ],
  interest: {
    receipt_number: 'INT-2025-SAMPLE',
    payment_date: new Date().toISOString(),
    period_from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    period_to: new Date().toISOString(),
    days_covered: 30,
    amount_paid: 1500,
    penalty_amount: 0,
    outstanding_principal: 100000,
  },
  auction: {
    auction_lot_number: 'AUC-2025-SAMPLE',
    auction_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    outstanding_principal: 100000,
    outstanding_interest: 5400,
    total_outstanding: 105400,
    reserve_price: 110000,
    total_gold_weight_grams: 33.7,
    total_appraised_value: 165000,
  },
};

export function TestPrintTab() {
  const [selectedType, setSelectedType] = useState('loan');
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const { loanTemplates, interestTemplates, redemptionTemplates, auctionTemplates, isLoading } = useTemplatesByType();
  const { data: settings } = usePrintSettings();

  const getTemplatesForType = (type: string) => {
    switch (type) {
      case 'loan': return loanTemplates;
      case 'interest': return interestTemplates;
      case 'redemption': return redemptionTemplates;
      case 'auction': return auctionTemplates;
      default: return [];
    }
  };

  const templates = getTemplatesForType(selectedType);
  const selectedTemplate = templates.find(t => t.id === selectedTemplateId);

  // Get branding settings
  const brandingSettings = settings?.[0];

  const getDocumentComponent = () => {
    const props = {
      company: sampleData.company,
      customer: sampleData.customer,
      logoUrl: brandingSettings?.logo_url,
      watermark: brandingSettings?.watermark_type !== 'none' ? {
        type: brandingSettings?.watermark_type as 'text' | 'image',
        text: brandingSettings?.watermark_text,
        imageUrl: brandingSettings?.watermark_image_url,
        opacity: brandingSettings?.watermark_opacity || 15,
      } : undefined,
    };

    switch (selectedType) {
      case 'loan':
        return (
          <LoanBilingualTemplate
            {...props}
            loan={sampleData.loan}
            goldItems={sampleData.goldItems}
            language={selectedTemplate?.language || 'english'}
          />
        );
      case 'interest':
        return (
          <InterestBilingualTemplate
            {...props}
            loan={sampleData.loan}
            payment={sampleData.interest}
            language={selectedTemplate?.language || 'english'}
          />
        );
      case 'auction':
        return (
          <AuctionBilingualTemplate
            {...props}
            loan={sampleData.loan}
            auction={sampleData.auction}
            goldItems={sampleData.goldItems}
            language={selectedTemplate?.language || 'english'}
          />
        );
      default:
        return null;
    }
  };

  const handleDownload = async () => {
    const doc = getDocumentComponent();
    if (!doc) {
      toast.error('Please select a template');
      return;
    }

    setIsGenerating(true);
    try {
      const blob = await pdf(doc).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `test-${selectedType}-${selectedTemplate?.template_code || 'receipt'}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success('Test PDF downloaded');
    } catch (error) {
      toast.error('Failed to generate PDF');
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePrint = async () => {
    const doc = getDocumentComponent();
    if (!doc) {
      toast.error('Please select a template');
      return;
    }

    setIsGenerating(true);
    try {
      const blob = await pdf(doc).toBlob();
      const url = URL.createObjectURL(blob);
      const printWindow = window.open(url, '_blank');
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print();
        };
      }
    } catch (error) {
      toast.error('Failed to generate PDF');
      console.error(error);
    } finally {
      setIsGenerating(false);
    }
  };

  if (isLoading) {
    return <div className="text-center py-8 text-muted-foreground">Loading...</div>;
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Settings Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Test Print Settings
          </CardTitle>
          <CardDescription>
            Select a receipt type and template to generate a sample PDF
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Receipt Type</label>
            <Select value={selectedType} onValueChange={(v) => {
              setSelectedType(v);
              setSelectedTemplateId('');
            }}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {receiptTypes.map(type => (
                  <SelectItem key={type.key} value={type.key}>{type.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Template</label>
            <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a template..." />
              </SelectTrigger>
              <SelectContent>
                {templates.map(t => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.template_name} ({t.language === 'bilingual' ? 'EN+TA' : t.language})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedTemplate && (
            <div className="p-3 bg-muted/50 rounded-lg space-y-2">
              <h4 className="font-medium">Template Details</h4>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline">{selectedTemplate.paper_size.toUpperCase()}</Badge>
                <Badge variant="outline" className="capitalize">{selectedTemplate.layout_style}</Badge>
                <Badge variant="outline">
                  {selectedTemplate.language === 'bilingual' ? 'English + தமிழ்' : selectedTemplate.language}
                </Badge>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button 
              variant="outline" 
              onClick={handleDownload}
              disabled={!selectedTemplateId || isGenerating}
              className="flex-1"
            >
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
            <Button 
              onClick={handlePrint}
              disabled={!selectedTemplateId || isGenerating}
              className="flex-1 bg-gradient-to-r from-amber-500 to-orange-600"
            >
              <Printer className="h-4 w-4 mr-2" />
              Print Test
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Preview Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-primary" />
            Preview
          </CardTitle>
          <CardDescription>
            Sample preview with your branding settings applied
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-white dark:bg-gray-900 rounded-lg border aspect-[3/4] p-4 overflow-hidden">
            {selectedTemplateId ? (
              <div className="h-full flex flex-col text-xs">
                {/* Header Preview */}
                <div className="text-center border-b pb-2 mb-2">
                  {brandingSettings?.logo_url && (
                    <div className="w-12 h-12 mx-auto mb-1 bg-muted rounded flex items-center justify-center text-xs">
                      LOGO
                    </div>
                  )}
                  <div className="font-bold">{sampleData.company.name}</div>
                  {selectedTemplate?.language === 'bilingual' && (
                    <div className="text-purple-600 text-[10px]">{sampleData.company.nameTamil}</div>
                  )}
                  <div className="text-muted-foreground text-[9px]">{sampleData.company.address}</div>
                </div>

                {/* Title */}
                <div className="text-center font-bold mb-2 uppercase text-[10px]">
                  {selectedType === 'loan' && 'Loan Disbursement Voucher'}
                  {selectedType === 'interest' && 'Interest Receipt'}
                  {selectedType === 'auction' && 'Auction Notice'}
                  {selectedType === 'redemption' && 'Redemption Receipt'}
                </div>

                {/* Content Preview */}
                <div className="flex-1 space-y-1">
                  <div className="flex justify-between text-[9px]">
                    <span className="text-muted-foreground">Reference:</span>
                    <span>{selectedType === 'loan' ? sampleData.loan.loan_number : selectedType === 'interest' ? sampleData.interest.receipt_number : sampleData.auction.auction_lot_number}</span>
                  </div>
                  <div className="flex justify-between text-[9px]">
                    <span className="text-muted-foreground">Customer:</span>
                    <span>{sampleData.customer.full_name}</span>
                  </div>
                  <div className="h-px bg-border my-2" />
                  <div className="space-y-0.5">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className="h-2 bg-muted rounded w-full" />
                    ))}
                  </div>
                </div>

                {/* Footer */}
                <div className="border-t pt-2 mt-2 text-center text-[8px] text-muted-foreground">
                  Thank you for your business
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                Select a template to see preview
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
