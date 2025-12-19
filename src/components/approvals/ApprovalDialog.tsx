import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { ApprovalRequest } from '@/hooks/useApprovalWorkflow';
import { ApprovalBadge } from './ApprovalBadge';
import { formatDistanceToNow } from 'date-fns';

interface ApprovalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request: ApprovalRequest | null;
  onApprove: (requestId: string, comments?: string) => Promise<boolean>;
  onReject: (requestId: string, reason: string) => Promise<boolean>;
}

export function ApprovalDialog({
  open,
  onOpenChange,
  request,
  onApprove,
  onReject
}: ApprovalDialogProps) {
  const [mode, setMode] = useState<'view' | 'approve' | 'reject'>('view');
  const [comments, setComments] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [loading, setLoading] = useState(false);

  if (!request) return null;

  const handleApprove = async () => {
    setLoading(true);
    const success = await onApprove(request.id, comments);
    setLoading(false);
    if (success) {
      setComments('');
      setMode('view');
      onOpenChange(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) return;
    
    setLoading(true);
    const success = await onReject(request.id, rejectionReason);
    setLoading(false);
    if (success) {
      setRejectionReason('');
      setMode('view');
      onOpenChange(false);
    }
  };

  const formatAmount = (amount: number | null) => {
    if (!amount) return '-';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Approval Request
            <ApprovalBadge status={request.status} size="sm" />
          </DialogTitle>
          <DialogDescription>
            {request.entity_number || request.entity_type} - {request.workflow_type}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Request Details */}
          <div className="rounded-lg border bg-muted/50 p-4 space-y-3">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-muted-foreground">Type:</span>
                <p className="font-medium capitalize">{request.workflow_type}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Amount:</span>
                <p className="font-medium">{formatAmount(request.amount)}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Reference:</span>
                <p className="font-medium">{request.entity_number || '-'}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Requested:</span>
                <p className="font-medium">
                  {formatDistanceToNow(new Date(request.requested_at), { addSuffix: true })}
                </p>
              </div>
            </div>
            
            {request.description && (
              <div>
                <span className="text-sm text-muted-foreground">Description:</span>
                <p className="text-sm">{request.description}</p>
              </div>
            )}
          </div>

          {/* Approval Progress */}
          {(request.approved_by_l1 || request.rejected_by) && (
            <div className="rounded-lg border p-4 space-y-2">
              <span className="text-sm font-medium">Approval History</span>
              {request.approved_by_l1 && (
                <div className="flex items-center gap-2 text-sm text-emerald-600">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Level 1 approved {request.comments_l1 && `- "${request.comments_l1}"`}</span>
                </div>
              )}
              {request.approved_by_l2 && (
                <div className="flex items-center gap-2 text-sm text-emerald-600">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Level 2 approved {request.comments_l2 && `- "${request.comments_l2}"`}</span>
                </div>
              )}
              {request.rejected_by && (
                <div className="flex items-center gap-2 text-sm text-destructive">
                  <XCircle className="h-4 w-4" />
                  <span>Rejected: {request.rejection_reason}</span>
                </div>
              )}
            </div>
          )}

          {/* Action Forms */}
          {mode === 'approve' && request.status === 'pending' && (
            <div className="space-y-2">
              <Label htmlFor="comments">Comments (optional)</Label>
              <Textarea
                id="comments"
                placeholder="Add approval comments..."
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                rows={3}
              />
            </div>
          )}

          {mode === 'reject' && request.status === 'pending' && (
            <div className="space-y-2">
              <Label htmlFor="reason">Rejection Reason *</Label>
              <Textarea
                id="reason"
                placeholder="Provide a reason for rejection..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={3}
                required
              />
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          {request.status === 'pending' && mode === 'view' && (
            <>
              <Button
                variant="outline"
                className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                onClick={() => setMode('reject')}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Reject
              </Button>
              <Button onClick={() => setMode('approve')}>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Approve
              </Button>
            </>
          )}

          {mode === 'approve' && (
            <>
              <Button variant="outline" onClick={() => setMode('view')} disabled={loading}>
                Cancel
              </Button>
              <Button onClick={handleApprove} disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Confirm Approval
              </Button>
            </>
          )}

          {mode === 'reject' && (
            <>
              <Button variant="outline" onClick={() => setMode('view')} disabled={loading}>
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                onClick={handleReject} 
                disabled={loading || !rejectionReason.trim()}
              >
                {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Confirm Rejection
              </Button>
            </>
          )}

          {request.status !== 'pending' && (
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
