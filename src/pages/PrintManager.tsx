import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Printer, FileText, Download, Search, Eye, 
  CreditCard, Wallet, Gavel, Settings2, RefreshCw 
} from 'lucide-react';
import { toast } from 'sonner';
import { TEMPLATE_REGISTRY } from '@/components/print/templates';
import PrintSettingsPanel from '@/components/print/PrintSettingsPanel';

// Import all templates for preview
import * as LoanTemplates from '@/components/print/templates/loans';
import * as InterestTemplates from '@/components/print/templates/interest';
import * as RedemptionTemplates from '@/components/print/templates/redemption';
import * as AuctionTemplates from '@/components/print/templates/auction';

type ModuleType = 'loans' | 'interest' | 'redemption' | 'auction';

const moduleConfig = {
  loans: { icon: FileText, label: 'Loans', color: 'bg-blue-500' },
  interest: { icon: CreditCard, label: 'Interest', color: 'bg-green-500' },
  redemption: { icon: Wallet, label: 'Redemption', color: 'bg-purple-500' },
  auction: { icon: Gavel, label: 'Auction', color: 'bg-orange-500' },
};

const templateComponents: Record<string, React.ComponentType<any>> = {
  // Loans
  'loan-standard-receipt': LoanTemplates.LoanStandardReceipt,
  'loan-detailed-statement': LoanTemplates.LoanDetailedStatement,
  'loan-disbursement-confirmation': LoanTemplates.LoanDisbursementConfirmation,
  'gold-pledge-certificate': LoanTemplates.GoldPledgeCertificate,
  'loan-mini-receipt': LoanTemplates.LoanMiniReceipt,
  'multiloan-summary': LoanTemplates.MultiloanSummary,
  // Interest
  'interest-payment-receipt': InterestTemplates.InterestPaymentReceipt,
  'interest-monthly-statement': InterestTemplates.InterestMonthlyStatement,
  'interest-quarterly-summary': InterestTemplates.InterestQuarterlySummary,
  'advance-interest-certificate': InterestTemplates.AdvanceInterestCertificate,
  'interest-waiver-notice': InterestTemplates.InterestWaiverNotice,
  'interest-annual-ledger': InterestTemplates.InterestAnnualLedger,
  // Redemption
  'redemption-receipt': RedemptionTemplates.RedemptionReceiptNew,
  'redemption-request-form': RedemptionTemplates.RedemptionRequestForm,
  'pre-redemption-statement': RedemptionTemplates.PreRedemptionStatement,
  'partial-redemption-certificate': RedemptionTemplates.PartialRedemptionCertificate,
  'redemption-ledger': RedemptionTemplates.RedemptionLedger,
  'final-settlement-statement': RedemptionTemplates.FinalSettlementStatement,
  // Auction
  'auction-notice': AuctionTemplates.AuctionNotice,
  'pre-auction-valuation': AuctionTemplates.PreAuctionValuation,
  'auction-catalog': AuctionTemplates.AuctionCatalog,
  'auction-result-certificate': AuctionTemplates.AuctionResultCertificate,
  'post-auction-settlement': AuctionTemplates.PostAuctionSettlement,
  'auction-clearance-certificate': AuctionTemplates.AuctionClearanceCertificate,
};

// Transform gold items from database format to template format
const transformGoldItems = (goldItems: any[] = []) => {
  return goldItems.map((item, index) => ({
    id: item.id || `item-${index}`,
    serialNumber: `GI${String(index + 1).padStart(3, '0')}`,
    itemType: item.item_type || 'Gold Item',
    itemTypeTamil: '',
    description: item.description || '',
    grossWeight: item.gross_weight_grams || 0,
    stoneWeight: item.stone_weight_grams || 0,
    netWeight: item.net_weight_grams || 0,
    purity: item.purity || '22KT',
    purityPercentage: item.purity_percentage || 91.6,
    marketRate: item.market_rate_per_gram || 0,
    marketValue: item.market_value || 0,
    appraisedValue: item.appraised_value || 0,
    imageUrl: item.image_url,
  }));
};

// Transform loan data for templates
const transformLoanData = (loan: any, client: any, branch: any) => {
  const goldItems = transformGoldItems(loan?.gold_items || []);
  return {
    loanNumber: loan?.loan_number || 'N/A',
    loanDate: loan?.loan_date || new Date().toISOString(),
    maturityDate: loan?.maturity_date || new Date().toISOString(),
    certificateNumber: `CERT-${loan?.loan_number || 'N/A'}`,
    customer: {
      name: loan?.customer?.full_name || 'Customer Name',
      nameTamil: '',
      code: loan?.customer?.customer_code || 'N/A',
      phone: loan?.customer?.phone || 'N/A',
      address: loan?.customer?.address || '',
    },
    scheme: {
      name: loan?.scheme?.scheme_name || 'Standard Scheme',
      interestRate: loan?.interest_rate || loan?.scheme?.interest_rate || 1.5,
      tenure: loan?.tenure_days || loan?.scheme?.tenure_days || 365,
    },
    schemeCode: loan?.scheme?.scheme_code,
    principal: loan?.principal_amount || 0,
    processingFee: loan?.processing_fee || 0,
    documentCharges: loan?.document_charges || 0,
    advanceInterest: loan?.advance_interest_shown || 0,
    netDisbursed: loan?.net_disbursed || loan?.principal_amount || 0,
    disbursementMode: loan?.disbursement_mode || 'Cash',
    goldItems,
    custodyLocation: branch?.branch_name || 'Main Branch',
    custodyLocationCode: branch?.branch_code || 'MB001',
    branch: {
      name: branch?.branch_name || 'Main Branch',
      nameTamil: '',
      address: branch?.address || '',
      phone: branch?.phone || '',
    },
    company: {
      name: client?.company_name || 'Company',
      nameTamil: '',
      address: client?.address || '',
      phone: client?.phone || '',
      email: client?.email || '',
      logoUrl: client?.logo_url || '',
    },
    appraiser: loan?.appraised_by ? { name: 'Appraiser', code: 'APP001' } : undefined,
    approvedBy: loan?.approved_by ? { name: 'Approver', designation: 'Manager' } : undefined,
    createdBy: loan?.created_by ? { name: 'Loan Officer' } : undefined,
  };
};

// Transform interest payment data for templates
const transformInterestData = (payment: any, client: any, branch: any) => {
  return {
    receiptNumber: payment?.receipt_number || 'N/A',
    paymentDate: payment?.payment_date || new Date().toISOString(),
    loanNumber: payment?.loan?.loan_number || 'N/A',
    customer: {
      name: payment?.loan?.customer?.full_name || 'Customer Name',
      nameTamil: '',
      code: payment?.loan?.customer?.customer_code || 'N/A',
      phone: payment?.loan?.customer?.phone || 'N/A',
    },
    periodFrom: payment?.period_from || new Date().toISOString(),
    periodTo: payment?.period_to || new Date().toISOString(),
    daysCovered: payment?.days_covered || 30,
    principal: payment?.loan?.principal_amount || 0,
    interestRate: payment?.loan?.interest_rate || 1.5,
    interestAmount: payment?.shown_interest || payment?.actual_interest || 0,
    penaltyAmount: payment?.penalty_amount || 0,
    totalPaid: payment?.amount_paid || 0,
    paymentMode: payment?.payment_mode || 'Cash',
    reference: payment?.payment_reference,
    nextDueDate: payment?.loan?.next_interest_due_date || new Date().toISOString(),
    branch: {
      name: branch?.branch_name || 'Main Branch',
      nameTamil: '',
    },
    company: {
      name: client?.company_name || 'Company',
      nameTamil: '',
      address: client?.address || '',
      phone: client?.phone || '',
      logoUrl: client?.logo_url || '',
    },
  };
};

// Transform redemption data for templates
const transformRedemptionData = (redemption: any, client: any, branch: any) => {
  const goldItems = transformGoldItems(redemption?.loan?.gold_items || []);
  return {
    redemptionNumber: redemption?.redemption_number || 'N/A',
    redemptionDate: redemption?.redemption_date || new Date().toISOString(),
    loanNumber: redemption?.loan?.loan_number || 'N/A',
    customer: {
      name: redemption?.loan?.customer?.full_name || 'Customer Name',
      code: redemption?.loan?.customer?.customer_code || 'N/A',
      phone: redemption?.loan?.customer?.phone || 'N/A',
    },
    principalOutstanding: redemption?.outstanding_principal || 0,
    interestDue: redemption?.interest_due || 0,
    penaltyAmount: redemption?.penalty_amount || 0,
    rebateAmount: redemption?.rebate_amount || 0,
    totalSettlement: redemption?.total_settlement || 0,
    amountReceived: redemption?.amount_received || 0,
    paymentMode: redemption?.payment_mode || 'Cash',
    goldItems,
    branch: {
      name: branch?.branch_name || 'Main Branch',
      nameTamil: '',
    },
    company: {
      name: client?.company_name || 'Company',
      nameTamil: '',
      address: client?.address || '',
      logoUrl: client?.logo_url || '',
    },
  };
};

// Transform auction data for templates
const transformAuctionData = (auction: any, client: any, branch: any) => {
  const goldItems = transformGoldItems(auction?.loan?.gold_items || []);
  return {
    auctionLotNumber: auction?.auction_lot_number || 'N/A',
    auctionDate: auction?.auction_date || new Date().toISOString(),
    noticeDate: new Date().toISOString(),
    auctionTime: '10:00 AM',
    venue: branch?.branch_name || 'Main Branch',
    loanNumber: auction?.loan?.loan_number || 'N/A',
    customer: {
      name: auction?.loan?.customer?.full_name || 'Customer Name',
      code: auction?.loan?.customer?.customer_code || 'N/A',
      phone: auction?.loan?.customer?.phone || 'N/A',
    },
    outstandingPrincipal: auction?.outstanding_principal || 0,
    outstandingInterest: auction?.outstanding_interest || 0,
    totalOutstanding: auction?.total_outstanding || 0,
    reservePrice: auction?.reserve_price || 0,
    soldPrice: auction?.sold_price || 0,
    totalGoldWeight: auction?.total_gold_weight_grams || 0,
    totalAppraisedValue: auction?.total_appraised_value || 0,
    goldItems,
    status: auction?.status || 'scheduled',
    branch: {
      name: branch?.branch_name || 'Main Branch',
      nameTamil: '',
      address: branch?.address || '',
    },
    company: {
      name: client?.company_name || 'Company',
      nameTamil: '',
      address: client?.address || '',
      phone: client?.phone || '',
      logoUrl: client?.logo_url || '',
    },
  };
};

export default function PrintManager() {
  const { client, currentBranch } = useAuth();
  const [selectedModule, setSelectedModule] = useState<ModuleType>('loans');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTransactionId, setSelectedTransactionId] = useState<string>('');
  const [showSettings, setShowSettings] = useState(false);
  const [watermarkType, setWatermarkType] = useState<'original' | 'duplicate' | 'draft' | 'none'>('none');

  // Fetch transactions based on selected module with related data
  const { data: transactions, isLoading } = useQuery({
    queryKey: ['print-transactions', selectedModule, client?.id, currentBranch?.id, searchQuery],
    queryFn: async () => {
      if (!client?.id) return [];

      let query;
      switch (selectedModule) {
        case 'loans':
          query = supabase
            .from('loans')
            .select(`
              *,
              customer:customers(*),
              scheme:schemes(*),
              gold_items:gold_items(*)
            `)
            .eq('client_id', client.id)
            .order('created_at', { ascending: false })
            .limit(50);
          break;
        case 'interest':
          query = supabase
            .from('interest_payments')
            .select(`
              *,
              loan:loans(*, customer:customers(*), gold_items:gold_items(*))
            `)
            .eq('client_id', client.id)
            .order('created_at', { ascending: false })
            .limit(50);
          break;
        case 'redemption':
          query = supabase
            .from('redemptions')
            .select(`
              *,
              loan:loans(*, customer:customers(*), gold_items:gold_items(*))
            `)
            .eq('client_id', client.id)
            .order('created_at', { ascending: false })
            .limit(50);
          break;
        case 'auction':
          query = supabase
            .from('auctions')
            .select(`
              *,
              loan:loans(*, customer:customers(*), gold_items:gold_items(*))
            `)
            .eq('client_id', client.id)
            .order('created_at', { ascending: false })
            .limit(50);
          break;
        default:
          return [];
      }

      if (currentBranch?.id) {
        query = query.eq('branch_id', currentBranch.id);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: !!client?.id,
  });

  // Get available templates for selected module
  const availableTemplates = TEMPLATE_REGISTRY[selectedModule] || [];

  // Handle print
  const handlePrint = () => {
    if (!selectedTemplate || !selectedTransactionId) {
      toast.error('Please select a template and transaction');
      return;
    }
    window.print();
    toast.success('Print dialog opened');
  };

  // Handle PDF download (simplified - opens print dialog)
  const handleDownloadPDF = () => {
    if (!selectedTemplate || !selectedTransactionId) {
      toast.error('Please select a template and transaction');
      return;
    }
    window.print();
    toast.info('Use "Save as PDF" in the print dialog');
  };

  // Get preview data with proper transformation
  const getPreviewData = () => {
    const transaction = transactions?.find((t: any) => t.id === selectedTransactionId);
    if (!transaction) {
      // Return default empty data structure
      return transformLoanData({}, client, currentBranch);
    }

    switch (selectedModule) {
      case 'loans':
        return transformLoanData(transaction, client, currentBranch);
      case 'interest':
        return transformInterestData(transaction, client, currentBranch);
      case 'redemption':
        return transformRedemptionData(transaction, client, currentBranch);
      case 'auction':
        return transformAuctionData(transaction, client, currentBranch);
      default:
        return transformLoanData(transaction, client, currentBranch);
    }
  };

  const TemplateComponent = selectedTemplate ? templateComponents[selectedTemplate] : null;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Printer className="h-6 w-6 text-primary" />
              Print Manager
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Generate and print professional bilingual documents
            </p>
          </div>
          <Button variant="outline" onClick={() => setShowSettings(true)}>
            <Settings2 className="h-4 w-4 mr-2" />
            Print Settings
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel - Selection */}
          <div className="lg:col-span-1 space-y-4">
            {/* Module Selector */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Select Module</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  {(Object.keys(moduleConfig) as ModuleType[]).map((module) => {
                    const config = moduleConfig[module];
                    const Icon = config.icon;
                    return (
                      <Button
                        key={module}
                        variant={selectedModule === module ? 'default' : 'outline'}
                        className="h-auto py-3 flex-col gap-1"
                        onClick={() => {
                          setSelectedModule(module);
                          setSelectedTemplate('');
                          setSelectedTransactionId('');
                        }}
                      >
                        <Icon className="h-5 w-5" />
                        <span className="text-xs">{config.label}</span>
                      </Button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Template Selector */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Select Template</CardTitle>
                <CardDescription className="text-xs">
                  {availableTemplates.length} templates available
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose template..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableTemplates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        <div className="flex flex-col">
                          <span>{template.name}</span>
                          <span className="text-xs text-muted-foreground">{template.nameTamil}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {/* Transaction Search */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Select Transaction</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by ID or name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <ScrollArea className="h-48">
                  {isLoading ? (
                    <div className="flex items-center justify-center h-full">
                      <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
                    </div>
                  ) : transactions?.length === 0 ? (
                    <p className="text-center text-sm text-muted-foreground py-8">
                      No transactions found
                    </p>
                  ) : (
                    <div className="space-y-1">
                      {transactions?.map((tx: any) => {
                        const displayId = tx.loan_number || tx.receipt_number || tx.redemption_number || tx.auction_lot_number;
                        const customerName = tx.customer?.full_name || tx.loan?.customer?.full_name || 'Unknown';
                        return (
                          <button
                            key={tx.id}
                            onClick={() => setSelectedTransactionId(tx.id)}
                            className={`w-full text-left p-2 rounded-lg text-sm transition-colors ${
                              selectedTransactionId === tx.id
                                ? 'bg-primary text-primary-foreground'
                                : 'hover:bg-muted'
                            }`}
                          >
                            <div className="font-medium">{displayId}</div>
                            <div className="text-xs opacity-80">{customerName}</div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Watermark Options */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Watermark</CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={watermarkType} onValueChange={(v: any) => setWatermarkType(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Watermark</SelectItem>
                    <SelectItem value="original">ORIGINAL</SelectItem>
                    <SelectItem value="duplicate">DUPLICATE</SelectItem>
                    <SelectItem value="draft">DRAFT</SelectItem>
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handlePrint}
                disabled={!selectedTemplate || !selectedTransactionId}
                className="flex-1"
              >
                <Printer className="h-4 w-4 mr-2" />
                Print
              </Button>
              <Button
                variant="outline"
                onClick={handleDownloadPDF}
                disabled={!selectedTemplate || !selectedTransactionId}
              >
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Right Panel - Preview */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Document Preview</CardTitle>
                {selectedTemplate && (
                  <Badge variant="secondary">
                    {availableTemplates.find(t => t.id === selectedTemplate)?.name}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg bg-white min-h-[600px] p-4 overflow-auto">
                {!selectedTemplate || !selectedTransactionId ? (
                  <div className="flex flex-col items-center justify-center h-[500px] text-muted-foreground">
                    <FileText className="h-16 w-16 mb-4 opacity-20" />
                    <p className="text-lg font-medium">Select a template and transaction</p>
                    <p className="text-sm">The preview will appear here</p>
                  </div>
                ) : TemplateComponent ? (
                  <div className="print-preview scale-75 origin-top-left">
                    <TemplateComponent 
                      data={getPreviewData()} 
                      watermark={watermarkType !== 'none' ? watermarkType : undefined}
                    />
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-[500px] text-muted-foreground">
                    <p>Template not found</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Template Gallery */}
        <Card>
          <CardHeader>
            <CardTitle>Template Gallery</CardTitle>
            <CardDescription>Browse all available print templates by module</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="loans">
              <TabsList className="mb-4">
                {(Object.keys(moduleConfig) as ModuleType[]).map((module) => (
                  <TabsTrigger key={module} value={module} className="capitalize">
                    {moduleConfig[module].label}
                  </TabsTrigger>
                ))}
              </TabsList>
              {(Object.keys(TEMPLATE_REGISTRY) as ModuleType[]).map((module) => (
                <TabsContent key={module} value={module}>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    {TEMPLATE_REGISTRY[module]?.map((template) => (
                      <button
                        key={template.id}
                        onClick={() => {
                          setSelectedModule(module);
                          setSelectedTemplate(template.id);
                        }}
                        className={`p-4 border rounded-lg text-left hover:border-primary hover:bg-primary/5 transition-colors ${
                          selectedTemplate === template.id ? 'border-primary bg-primary/5' : ''
                        }`}
                      >
                        <div className="aspect-[3/4] bg-muted rounded mb-2 flex items-center justify-center">
                          <FileText className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <div className="text-xs font-medium truncate">{template.name}</div>
                        <div className="text-xs text-muted-foreground truncate">{template.nameTamil}</div>
                      </button>
                    ))}
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>
      </div>

      <PrintSettingsPanel open={showSettings} onOpenChange={setShowSettings} />
    </DashboardLayout>
  );
}
