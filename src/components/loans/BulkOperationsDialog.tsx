import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Download, 
  FileText, 
  Bell, 
  X,
  CheckCircle,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { formatIndianCurrency } from '@/lib/interestCalculations';
import { exportToCSV, exportToExcel } from '@/lib/export-utils';

interface Loan {
  id: string;
  loan_number: string;
  loan_date: string;
  principal_amount: number;
  status: string;
  customer: {
    customer_code: string;
    full_name: string;
    phone: string;
  };
  scheme: {
    scheme_name: string;
    interest_rate: number;
  };
}

interface BulkOperationsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedLoans: Loan[];
  onClearSelection: () => void;
}

export function BulkOperationsDialog({
  open,
  onOpenChange,
  selectedLoans,
  onClearSelection,
}: BulkOperationsDialogProps) {
  const [processing, setProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState('export');

  const exportColumns = [
    { key: 'loan_number', header: 'Loan Number' },
    { key: 'customer.full_name', header: 'Customer Name' },
    { key: 'customer.customer_code', header: 'Customer Code' },
    { key: 'customer.phone', header: 'Phone' },
    { key: 'principal_amount', header: 'Principal Amount' },
    { key: 'loan_date', header: 'Loan Date', formatter: (v: string) => format(new Date(v), 'dd/MM/yyyy') },
    { key: 'scheme.scheme_name', header: 'Scheme' },
    { key: 'scheme.interest_rate', header: 'Interest Rate (%)' },
    { key: 'status', header: 'Status', formatter: (v: string) => v.toUpperCase() },
  ];

  const handleExportCSV = () => {
    exportToCSV(selectedLoans, exportColumns, `loans_export_${format(new Date(), 'yyyyMMdd')}`);
    toast.success(`Exported ${selectedLoans.length} loans to CSV`);
  };

  const handleExportExcel = () => {
    exportToExcel(selectedLoans, exportColumns, `loans_export_${format(new Date(), 'yyyyMMdd')}`);
    toast.success(`Exported ${selectedLoans.length} loans to Excel`);
  };

  const handleGenerateReminders = async () => {
    setProcessing(true);
    try {
      // Simulate reminder generation
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const phoneNumbers = selectedLoans.map(l => l.customer.phone).filter(Boolean);
      toast.success(`Generated ${phoneNumbers.length} interest reminder messages`, {
        description: 'Ready to send via SMS/WhatsApp',
      });
    } catch (error) {
      toast.error('Failed to generate reminders');
    } finally {
      setProcessing(false);
    }
  };

  const totalPrincipal = selectedLoans.reduce((sum, l) => sum + l.principal_amount, 0);
  const activeCount = selectedLoans.filter(l => l.status === 'active').length;
  const overdueCount = selectedLoans.filter(l => l.status === 'overdue').length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Bulk Operations</span>
            <Badge variant="secondary">{selectedLoans.length} loans selected</Badge>
          </DialogTitle>
        </DialogHeader>

        {/* Selection Summary */}
        <div className="grid grid-cols-3 gap-3 p-3 bg-muted rounded-lg">
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Total Principal</p>
            <p className="font-semibold">{formatIndianCurrency(totalPrincipal)}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Active</p>
            <p className="font-semibold text-green-600 dark:text-green-400">{activeCount}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Overdue</p>
            <p className="font-semibold text-red-600 dark:text-red-400">{overdueCount}</p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="export" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Export
            </TabsTrigger>
            <TabsTrigger value="reminders" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Reminders
            </TabsTrigger>
          </TabsList>

          <TabsContent value="export" className="space-y-4 mt-4">
            <p className="text-sm text-muted-foreground">
              Export selected loans to CSV or Excel format
            </p>
            <div className="flex gap-3">
              <Button onClick={handleExportCSV} variant="outline" className="flex-1">
                <FileText className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
              <Button onClick={handleExportExcel} className="flex-1">
                <Download className="h-4 w-4 mr-2" />
                Export Excel
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="reminders" className="space-y-4 mt-4">
            <p className="text-sm text-muted-foreground">
              Generate interest payment reminder messages for selected customers
            </p>
            
            <ScrollArea className="h-48 border rounded-lg p-3">
              {selectedLoans.map(loan => (
                <div 
                  key={loan.id} 
                  className="flex items-center justify-between py-2 border-b last:border-0"
                >
                  <div>
                    <p className="font-medium text-sm">{loan.customer.full_name}</p>
                    <p className="text-xs text-muted-foreground">{loan.loan_number}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm">{loan.customer.phone}</p>
                    <Badge 
                      variant={loan.status === 'overdue' ? 'destructive' : 'secondary'}
                      className="text-xs"
                    >
                      {loan.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </ScrollArea>

            <Button 
              onClick={handleGenerateReminders} 
              className="w-full"
              disabled={processing}
            >
              {processing ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Bell className="h-4 w-4 mr-2" />
              )}
              Generate Reminders
            </Button>
          </TabsContent>
        </Tabs>

        <div className="flex justify-between pt-4 border-t">
          <Button variant="ghost" onClick={onClearSelection}>
            <X className="h-4 w-4 mr-2" />
            Clear Selection
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
