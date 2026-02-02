import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Clock, ArrowRight, CheckCircle2, Banknote, Coins, ShoppingCart, RotateCcw, TrendingUp, FileText, Gavel, Users } from 'lucide-react';
import { useApprovalWorkflow, ApprovalRequest } from '@/hooks/useApprovalWorkflow';
import { ApprovalDialog } from './ApprovalDialog';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';

// Map workflow types to icons and labels
const WORKFLOW_CONFIG: Record<string, { icon: React.ComponentType<{ className?: string }>; label: string }> = {
  loan: { icon: Banknote, label: 'Loan' },
  redemption: { icon: Coins, label: 'Redemption' },
  voucher: { icon: FileText, label: 'Voucher' },
  auction: { icon: Gavel, label: 'Auction' },
  commission: { icon: Users, label: 'Commission' },
  sale_agreement: { icon: ShoppingCart, label: 'Sale Agreement' },
  repurchase: { icon: RotateCcw, label: 'Repurchase' },
  margin_renewal: { icon: TrendingUp, label: 'Margin' },
};

export function PendingApprovalsWidget() {
  const navigate = useNavigate();
  const { getPendingApprovals, getPendingCount, approveRequest, rejectRequest } = useApprovalWorkflow();
  const [pendingRequests, setPendingRequests] = useState<ApprovalRequest[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [selectedRequest, setSelectedRequest] = useState<ApprovalRequest | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [filterType, setFilterType] = useState<string>('all');

  const fetchData = async () => {
    const [requests, count] = await Promise.all([
      getPendingApprovals(),
      getPendingCount()
    ]);
    setPendingRequests(requests);
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

  // Group requests by type for counting
  const typeCounts = pendingRequests.reduce((acc, req) => {
    const type = req.workflow_type;
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Filter requests based on selected type
  const filteredRequests = filterType === 'all' 
    ? pendingRequests.slice(0, 5)
    : pendingRequests.filter(r => r.workflow_type === filterType).slice(0, 5);

  // Sale agreement related counts
  const saleAgreementCount = (typeCounts['sale_agreement'] || 0) + (typeCounts['repurchase'] || 0) + (typeCounts['margin_renewal'] || 0);
  const loanCount = (typeCounts['loan'] || 0) + (typeCounts['redemption'] || 0);

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
            <Badge variant="secondary" className="bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400">
              {pendingCount}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Quick Filter Tabs */}
          {pendingCount > 0 && (
            <Tabs value={filterType} onValueChange={setFilterType} className="w-full">
              <TabsList className="h-8 w-full grid grid-cols-3">
                <TabsTrigger value="all" className="text-xs">
                  All ({pendingCount})
                </TabsTrigger>
                {loanCount > 0 && (
                  <TabsTrigger value="loan" className="text-xs">
                    Loans ({loanCount})
                  </TabsTrigger>
                )}
                {saleAgreementCount > 0 && (
                  <TabsTrigger value="sale_agreement" className="text-xs">
                    Sales ({saleAgreementCount})
                  </TabsTrigger>
                )}
              </TabsList>
            </Tabs>
          )}

          <ScrollArea className="h-[220px] pr-4">
            <div className="space-y-2">
              {filteredRequests.map((request) => {
                const config = WORKFLOW_CONFIG[request.workflow_type] || WORKFLOW_CONFIG.loan;
                const Icon = config.icon;
                const metadata = request.metadata as Record<string, unknown> | null;
                return (
                  <div
                    key={request.id}
                    onClick={() => handleRequestClick(request)}
                    className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 cursor-pointer transition-colors"
                  >
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="mt-0.5 text-muted-foreground">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-sm truncate">
                            {request.entity_number || request.entity_type}
                          </span>
                          <Badge variant="outline" className="text-xs capitalize shrink-0">
                            {config.label}
                          </Badge>
                        </div>
                        {/* Show additional metadata for sale agreements */}
                        {metadata?.customer_name && (
                          <p className="text-xs text-muted-foreground truncate mt-0.5">
                            {metadata.customer_name as string}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-sm font-medium text-primary">
                            {formatAmount(request.amount)}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            • {formatDistanceToNow(new Date(request.requested_at), { addSuffix: true })}
                          </span>
                        </div>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0 ml-2" />
                  </div>
                );
              })}
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
