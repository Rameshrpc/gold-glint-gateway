import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Printer, FileText, Download, Mail, Search, Eye, 
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

export default function PrintManager() {
  const { client, currentBranch } = useAuth();
  const [selectedModule, setSelectedModule] = useState<ModuleType>('loans');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTransactionId, setSelectedTransactionId] = useState<string>('');
  const [showPreview, setShowPreview] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [watermarkType, setWatermarkType] = useState<'original' | 'duplicate' | 'draft' | 'none'>('none');

  // Fetch transactions based on selected module
  const { data: transactions, isLoading } = useQuery({
    queryKey: ['print-transactions', selectedModule, client?.id, currentBranch?.id, searchQuery],
    queryFn: async () => {
      if (!client?.id) return [];

      let query;
      switch (selectedModule) {
        case 'loans':
          query = supabase
            .from('loans')
            .select('id, loan_number, principal_amount, loan_date, customer:customers(full_name)')
            .eq('client_id', client.id)
            .order('created_at', { ascending: false })
            .limit(50);
          break;
        case 'interest':
          query = supabase
            .from('interest_payments')
            .select('id, receipt_number, amount_paid, payment_date, loan:loans(loan_number, customer:customers(full_name))')
            .eq('client_id', client.id)
            .order('created_at', { ascending: false })
            .limit(50);
          break;
        case 'redemption':
          query = supabase
            .from('redemptions')
            .select('id, redemption_number, total_settlement, redemption_date, loan:loans(loan_number, customer:customers(full_name))')
            .eq('client_id', client.id)
            .order('created_at', { ascending: false })
            .limit(50);
          break;
        case 'auction':
          query = supabase
            .from('auctions')
            .select('id, auction_lot_number, sold_price, auction_date, loan:loans(loan_number, customer:customers(full_name))')
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

  // Get preview data
  const getPreviewData = () => {
    const transaction = transactions?.find((t: any) => t.id === selectedTransactionId);
    return {
      company: client,
      branch: currentBranch,
      transaction,
      loan: transaction,
      customer: transaction?.customer || transaction?.loan?.customer,
    };
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
                className="flex-1"
                onClick={() => setShowPreview(true)}
                disabled={!selectedTemplate || !selectedTransactionId}
              >
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </Button>
              <Button
                variant="outline"
                onClick={handlePrint}
                disabled={!selectedTemplate || !selectedTransactionId}
              >
                <Printer className="h-4 w-4" />
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
                      watermark={watermarkType !== 'none' ? { type: watermarkType } : undefined}
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
                        className={`p-4 rounded-lg border text-left transition-all hover:border-primary hover:shadow-md ${
                          selectedTemplate === template.id ? 'border-primary bg-primary/5' : ''
                        }`}
                      >
                        <div className="aspect-[3/4] bg-muted rounded mb-2 flex items-center justify-center">
                          <FileText className="h-8 w-8 text-muted-foreground/50" />
                        </div>
                        <p className="text-xs font-medium line-clamp-2">{template.name}</p>
                        <p className="text-xs text-muted-foreground line-clamp-1">{template.nameTamil}</p>
                      </button>
                    ))}
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Full Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Document Preview</DialogTitle>
          </DialogHeader>
          <div className="bg-white p-4">
            {TemplateComponent && (
              <TemplateComponent 
                data={getPreviewData()} 
                watermark={watermarkType !== 'none' ? { type: watermarkType } : undefined}
              />
            )}
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setShowPreview(false)}>
              Close
            </Button>
            <Button onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Settings Panel */}
      <PrintSettingsPanel open={showSettings} onOpenChange={setShowSettings} />
    </DashboardLayout>
  );
}
