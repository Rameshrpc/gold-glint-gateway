import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { format, differenceInDays } from 'date-fns';
import { 
  User, Calendar, Banknote, Award, Scale, FileText, 
  Edit, Trash2, Printer, RotateCcw, RefreshCw, X 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import MobileBottomSheet from '../shared/MobileBottomSheet';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface LoanDetails {
  id: string;
  loan_number: string;
  loan_date: string;
  maturity_date: string;
  principal_amount: number;
  interest_rate: number;
  tenure_days: number;
  net_disbursed: number;
  status: string;
  remarks: string | null;
  customer: {
    id: string;
    full_name: string;
    phone: string;
    customer_code: string;
  };
  scheme: {
    scheme_name: string;
    shown_rate: number | null;
  };
  gold_items: Array<{
    id: string;
    item_type: string;
    net_weight_grams: number;
    purity: string;
    appraised_value: number;
  }>;
}

interface MobileLoanDetailsSheetProps {
  loanId: string | null;
  onClose: () => void;
  onRefresh: () => void;
  onPrint: () => void;
}

export default function MobileLoanDetailsSheet({ loanId, onClose, onRefresh, onPrint }: MobileLoanDetailsSheetProps) {
  const navigate = useNavigate();
  const [loan, setLoan] = useState<LoanDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showEdit, setShowEdit] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editStatus, setEditStatus] = useState('');
  const [editRemarks, setEditRemarks] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (loanId) {
      fetchLoanDetails();
    }
  }, [loanId]);

  const fetchLoanDetails = async () => {
    if (!loanId) return;
    setIsLoading(true);

    try {
      const { data, error } = await supabase
        .from('loans')
        .select(`
          *,
          customer:customers(id, full_name, phone, customer_code),
          scheme:schemes(scheme_name, shown_rate),
          gold_items(id, item_type, net_weight_grams, purity, appraised_value)
        `)
        .eq('id', loanId)
        .single();

      if (error) throw error;
      setLoan(data as LoanDetails);
      setEditStatus(data.status);
      setEditRemarks(data.remarks || '');
    } catch (error: any) {
      toast.error('Failed to load loan details');
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!loan) return;
    setIsUpdating(true);

    try {
      const { error } = await supabase
        .from('loans')
        .update({
          status: editStatus as 'active' | 'closed' | 'overdue' | 'auctioned',
          remarks: editRemarks || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', loan.id);
          updated_at: new Date().toISOString(),
        })
        .eq('id', loan.id);

      if (error) throw error;
      toast.success('Loan updated');
      setShowEdit(false);
      fetchLoanDetails();
      onRefresh();
    } catch (error: any) {
      toast.error('Failed to update loan');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!loan) return;

    try {
      // First delete gold items
      await supabase.from('gold_items').delete().eq('loan_id', loan.id);
      
      // Then delete disbursements
      await supabase.from('loan_disbursements').delete().eq('loan_id', loan.id);
      
      // Finally delete loan
      const { error } = await supabase.from('loans').delete().eq('id', loan.id);
      if (error) throw error;

      toast.success('Loan deleted');
      onClose();
      onRefresh();
    } catch (error: any) {
      toast.error('Failed to delete loan: ' + error.message);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const totalGoldWeight = loan?.gold_items?.reduce((sum, item) => sum + item.net_weight_grams, 0) || 0;
  const totalAppraisedValue = loan?.gold_items?.reduce((sum, item) => sum + item.appraised_value, 0) || 0;
  const daysRemaining = loan ? differenceInDays(new Date(loan.maturity_date), new Date()) : 0;
  const isOverdue = loan?.status === 'active' && daysRemaining < 0;

  const getStatusBadge = (status: string) => {
    const configs: Record<string, { bg: string; text: string }> = {
      active: { bg: 'bg-emerald-100', text: 'text-emerald-700' },
      closed: { bg: 'bg-gray-100', text: 'text-gray-700' },
      overdue: { bg: 'bg-red-100', text: 'text-red-700' },
      auctioned: { bg: 'bg-purple-100', text: 'text-purple-700' },
    };
    const config = configs[status] || configs.active;
    return (
      <span className={cn('px-2 py-0.5 rounded-full text-xs font-semibold', config.bg, config.text)}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  if (!loanId) return null;

  return (
    <>
      <MobileBottomSheet
        isOpen={!!loanId}
        onClose={onClose}
        title={loan?.loan_number || 'Loan Details'}
        snapPoints={['full']}
        footer={
          loan?.status === 'active' && !showEdit && (
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant="outline"
                className="text-emerald-600"
                onClick={() => navigate(`/interest?loan=${loan.loan_number}`)}
              >
                <Banknote className="h-4 w-4 mr-1" />
                Interest
              </Button>
              <Button
                variant="outline"
                className="text-amber-600"
                onClick={() => navigate(`/redemption?loan=${loan.loan_number}`)}
              >
                <Award className="h-4 w-4 mr-1" />
                Redeem
              </Button>
              <Button
                variant="outline"
                className="text-blue-600"
                onClick={() => navigate(`/reloan?loan=${loan.loan_number}`)}
              >
                <RotateCcw className="h-4 w-4 mr-1" />
                Reloan
              </Button>
            </div>
          )
        }
      >
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : loan ? (
          <div className="p-4 space-y-4">
            {/* Status and Actions */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getStatusBadge(isOverdue ? 'overdue' : loan.status)}
                {isOverdue && (
                  <span className="text-xs text-red-500">{Math.abs(daysRemaining)} days overdue</span>
                )}
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="ghost" onClick={() => setShowEdit(!showEdit)}>
                  <Edit className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="ghost" onClick={onPrint}>
                  <Printer className="h-4 w-4" />
                </Button>
                {loan.status === 'active' && (
                  <Button size="sm" variant="ghost" className="text-red-500" onClick={() => setShowDeleteConfirm(true)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            {/* Edit Form */}
            {showEdit && (
              <div className="p-4 bg-muted/50 rounded-xl space-y-3 border">
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={editStatus} onValueChange={setEditStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="overdue">Overdue</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                      <SelectItem value="auctioned">Auctioned</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Remarks</Label>
                  <Textarea
                    value={editRemarks}
                    onChange={(e) => setEditRemarks(e.target.value)}
                    placeholder="Add remarks..."
                    rows={2}
                  />
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={() => setShowEdit(false)}>
                    Cancel
                  </Button>
                  <Button className="flex-1" onClick={handleUpdate} disabled={isUpdating}>
                    {isUpdating ? 'Saving...' : 'Save'}
                  </Button>
                </div>
              </div>
            )}

            {/* Customer Info */}
            <div className="bg-card rounded-xl border p-4">
              <div className="flex items-center gap-2 mb-3">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Customer</span>
              </div>
              <p className="font-semibold">{loan.customer.full_name}</p>
              <p className="text-sm text-muted-foreground">{loan.customer.phone}</p>
              <p className="text-xs text-muted-foreground">{loan.customer.customer_code}</p>
            </div>

            {/* Loan Summary */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-card rounded-xl border p-3">
                <p className="text-xs text-muted-foreground">Principal</p>
                <p className="text-lg font-bold">{formatCurrency(loan.principal_amount)}</p>
              </div>
              <div className="bg-card rounded-xl border p-3">
                <p className="text-xs text-muted-foreground">Disbursed</p>
                <p className="text-lg font-bold text-emerald-600">{formatCurrency(loan.net_disbursed)}</p>
              </div>
              <div className="bg-card rounded-xl border p-3">
                <p className="text-xs text-muted-foreground">Interest Rate</p>
                <p className="text-lg font-bold">{loan.scheme?.shown_rate || loan.interest_rate}%</p>
              </div>
              <div className="bg-card rounded-xl border p-3">
                <p className="text-xs text-muted-foreground">Tenure</p>
                <p className="text-lg font-bold">{loan.tenure_days} days</p>
              </div>
            </div>

            {/* Dates */}
            <div className="bg-card rounded-xl border p-4">
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Dates</span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground">Loan Date</p>
                  <p className="font-medium">{format(new Date(loan.loan_date), 'dd MMM yyyy')}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Maturity Date</p>
                  <p className={cn('font-medium', isOverdue && 'text-red-500')}>
                    {format(new Date(loan.maturity_date), 'dd MMM yyyy')}
                  </p>
                </div>
              </div>
            </div>

            {/* Gold Items */}
            <div className="bg-card rounded-xl border p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Scale className="h-4 w-4 text-amber-500" />
                  <span className="text-sm font-medium">Gold Items</span>
                </div>
                <Badge variant="secondary">{loan.gold_items?.length || 0} items</Badge>
              </div>
              
              <div className="space-y-2">
                {loan.gold_items?.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-2 bg-muted/50 rounded-lg">
                    <div>
                      <p className="font-medium text-sm">{item.item_type}</p>
                      <p className="text-xs text-muted-foreground">{item.purity}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-sm">{item.net_weight_grams.toFixed(2)}g</p>
                      <p className="text-xs text-muted-foreground">{formatCurrency(item.appraised_value)}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-3 pt-3 border-t flex justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Total Weight</p>
                  <p className="font-semibold">{totalGoldWeight.toFixed(2)}g</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Total Value</p>
                  <p className="font-semibold text-amber-600">{formatCurrency(totalAppraisedValue)}</p>
                </div>
              </div>
            </div>

            {/* Scheme & Remarks */}
            <div className="bg-card rounded-xl border p-4">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Scheme</span>
              </div>
              <p className="text-sm">{loan.scheme?.scheme_name}</p>
              
              {loan.remarks && (
                <div className="mt-3 pt-3 border-t">
                  <p className="text-xs text-muted-foreground mb-1">Remarks</p>
                  <p className="text-sm">{loan.remarks}</p>
                </div>
              )}
            </div>
          </div>
        ) : null}
      </MobileBottomSheet>

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Loan?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete loan {loan?.loan_number} and all associated gold items. 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-500 hover:bg-red-600">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
