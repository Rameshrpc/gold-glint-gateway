import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { formatIndianCurrency } from '@/lib/interestCalculations';
import { Separator } from '@/components/ui/separator';
import { Calendar, FileText, User } from 'lucide-react';

interface Loan {
  id: string;
  loan_number: string;
  loan_date: string;
  principal_amount: number;
  shown_principal: number | null;
  actual_principal: number | null;
  interest_rate: number;
  tenure_days: number;
  maturity_date: string;
  net_disbursed: number;
  status: 'active' | 'closed' | 'overdue' | 'auctioned';
  remarks?: string | null;
  customer: {
    id: string;
    customer_code: string;
    full_name: string;
    phone: string;
  };
  scheme: {
    id: string;
    scheme_code: string;
    scheme_name: string;
    interest_rate: number;
    shown_rate: number | null;
  };
  branch_id: string;
}

interface LoanEditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loan: Loan | null;
  onSuccess: () => void;
}

export default function LoanEditDialog({ open, onOpenChange, loan, onSuccess }: LoanEditDialogProps) {
  const [status, setStatus] = useState<string>('active');
  const [remarks, setRemarks] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (loan) {
      setStatus(loan.status);
      setRemarks(loan.remarks || '');
    }
  }, [loan]);

  const handleSubmit = async () => {
    if (!loan) return;

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('loans')
        .update({
          status: status as 'active' | 'closed' | 'overdue' | 'auctioned',
          remarks,
          updated_at: new Date().toISOString(),
        })
        .eq('id', loan.id);

      if (error) throw error;

      toast.success('Loan updated successfully');
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to update loan');
    } finally {
      setSubmitting(false);
    }
  };

  if (!loan) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-amber-600" />
            Edit Loan - {loan.loan_number}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Loan Info (Read-only) */}
          <div className="rounded-lg border bg-muted/50 p-4 space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <User className="h-4 w-4" />
              Customer Details
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-muted-foreground">Customer</p>
                <p className="font-medium">{loan.customer.full_name}</p>
                <p className="text-xs text-muted-foreground">{loan.customer.customer_code}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Phone</p>
                <p className="font-medium">{loan.customer.phone}</p>
              </div>
            </div>
            
            <Separator />
            
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Calendar className="h-4 w-4" />
              Loan Details
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-muted-foreground">Principal Amount</p>
                <p className="font-medium">{formatIndianCurrency(loan.principal_amount)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Net Disbursed</p>
                <p className="font-medium text-green-600">{formatIndianCurrency(loan.net_disbursed)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Loan Date</p>
                <p className="font-medium">{format(new Date(loan.loan_date), 'dd MMM yyyy')}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Maturity Date</p>
                <p className="font-medium">{format(new Date(loan.maturity_date), 'dd MMM yyyy')}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Interest Rate</p>
                <p className="font-medium">{loan.scheme.shown_rate || loan.interest_rate}% p.a.</p>
              </div>
              <div>
                <p className="text-muted-foreground">Scheme</p>
                <p className="font-medium">{loan.scheme.scheme_name}</p>
              </div>
            </div>
          </div>

          {/* Editable Fields */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger id="status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                  <SelectItem value="auctioned">Auctioned</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Note: Changing status to "Closed" should typically be done through the Redemption process.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="remarks">Remarks</Label>
              <Textarea
                id="remarks"
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Add any notes or remarks about this loan..."
                rows={3}
              />
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={submitting}
            className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700"
          >
            {submitting ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
