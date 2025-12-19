import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Clock, ArrowRight, CheckCircle2 } from 'lucide-react';
import { useApprovalWorkflow, ApprovalRequest } from '@/hooks/useApprovalWorkflow';
import { ApprovalBadge } from './ApprovalBadge';
import { ApprovalDialog } from './ApprovalDialog';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';

export function PendingApprovalsWidget() {
  const navigate = useNavigate();
  const { getPendingApprovals, getPendingCount, approveRequest, rejectRequest } = useApprovalWorkflow();
  const [pendingRequests, setPendingRequests] = useState<ApprovalRequest[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [selectedRequest, setSelectedRequest] = useState<ApprovalRequest | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const fetchData = async () => {
    const [requests, count] = await Promise.all([
      getPendingApprovals(),
      getPendingCount()
    ]);
    setPendingRequests(requests.slice(0, 5)); // Show top 5
    setPendingCount(count);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRequestClick = (request: ApprovalRequest) => {
    setSelectedRequest(request);
    setDialogOpen(true);
  };

  const handleApprove = async (requestId: string, comments?: string) => {
    const success = await approveRequest(requestId, comments);
    if (success) {
      fetchData();
    }
    return success;
  };

  const handleReject = async (requestId: string, reason: string) => {
    const success = await rejectRequest(requestId, reason);
    if (success) {
      fetchData();
    }
    return success;
  };

  const formatAmount = (amount: number | null) => {
    if (!amount) return '';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  if (pendingCount === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            Approvals
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-6 text-muted-foreground">
            <CheckCircle2 className="h-8 w-8 mb-2 text-emerald-500" />
            <p className="text-sm">No pending approvals</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-500" />
              Pending Approvals
            </CardTitle>
            <Badge variant="secondary" className="bg-amber-100 text-amber-700">
              {pendingCount}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <ScrollArea className="h-[200px] pr-4">
            <div className="space-y-2">
              {pendingRequests.map((request) => (
                <div
                  key={request.id}
                  onClick={() => handleRequestClick(request)}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 cursor-pointer transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm truncate">
                        {request.entity_number || request.entity_type}
                      </span>
                      <Badge variant="outline" className="text-xs capitalize">
                        {request.workflow_type}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm text-muted-foreground">
                        {formatAmount(request.amount)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        • {formatDistanceToNow(new Date(request.requested_at), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                </div>
              ))}
            </div>
          </ScrollArea>

          {pendingCount > 5 && (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => navigate('/approvals')}
            >
              View All ({pendingCount})
            </Button>
          )}
        </CardContent>
      </Card>

      <ApprovalDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        request={selectedRequest}
        onApprove={handleApprove}
        onReject={handleReject}
      />
    </>
  );
}
