import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ResponsiveTable } from '@/components/ui/responsive-table';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Search, 
  Eye,
  RefreshCw,
  AlertCircle,
  Send,
  Inbox
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useApprovalWorkflow, ApprovalRequest } from '@/hooks/useApprovalWorkflow';
import { ApprovalDialog } from '@/components/approvals/ApprovalDialog';
import { supabase } from '@/integrations/supabase/client';
import { format, formatDistanceToNow } from 'date-fns';

interface Profile {
  id: string;
  full_name: string;
}

export default function Approvals() {
  const { profile, isPlatformAdmin, hasRole } = useAuth();
  const { approveRequest, rejectRequest } = useApprovalWorkflow();
  
  const [requests, setRequests] = useState<ApprovalRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<ApprovalRequest | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('pending');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [activeTab, setActiveTab] = useState<string>('pending-review');

  const canApprove = isPlatformAdmin() || hasRole('tenant_admin') || hasRole('branch_manager');

  const fetchRequests = useCallback(async () => {
    if (!profile?.client_id) return;
    
    setLoading(true);
    try {
      let query = supabase
        .from('approval_requests')
        .select('*')
        .eq('client_id', profile.client_id)
        .order('requested_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }
      if (typeFilter !== 'all') {
        query = query.eq('workflow_type', typeFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      setRequests((data || []) as ApprovalRequest[]);

      // Fetch profiles for requesters
      const userIds = new Set<string>();
      data?.forEach(req => {
        if (req.requested_by) userIds.add(req.requested_by);
        if (req.approved_by_l1) userIds.add(req.approved_by_l1);
        if (req.approved_by_l2) userIds.add(req.approved_by_l2);
        if (req.rejected_by) userIds.add(req.rejected_by);
      });

      if (userIds.size > 0) {
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', Array.from(userIds));
        
        const profilesMap: Record<string, Profile> = {};
        profilesData?.forEach(p => {
          profilesMap[p.id] = p;
        });
        setProfiles(profilesMap);
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setLoading(false);
    }
  }, [profile?.client_id, statusFilter, typeFilter]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleApprove = async (requestId: string, comments?: string) => {
    const success = await approveRequest(requestId, comments);
    if (success) fetchRequests();
    return success;
  };

  const handleReject = async (requestId: string, reason: string) => {
    const success = await rejectRequest(requestId, reason);
    if (success) fetchRequests();
    return success;
  };

  const formatAmount = (amount: number | null) => {
    if (!amount) return '-';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case 'approved':
        return <Badge variant="outline" className="bg-green-50 dark:bg-green-950/50 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800"><CheckCircle2 className="h-3 w-3 mr-1" />Approved</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      loan: 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800',
      redemption: 'bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800',
      voucher: 'bg-teal-50 dark:bg-teal-950/50 text-teal-700 dark:text-teal-300 border-teal-200 dark:border-teal-800',
      auction: 'bg-orange-50 dark:bg-orange-950/50 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-800',
      commission: 'bg-pink-50 dark:bg-pink-950/50 text-pink-700 dark:text-pink-300 border-pink-200 dark:border-pink-800',
    };
    return (
      <Badge variant="outline" className={colors[type] || ''}>
        {type.charAt(0).toUpperCase() + type.slice(1)}
      </Badge>
    );
  };

  // Filter requests based on search
  const searchFilteredRequests = requests.filter(req => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      req.entity_number?.toLowerCase().includes(query) ||
      req.workflow_type.toLowerCase().includes(query) ||
      req.description?.toLowerCase().includes(query)
    );
  });

  // Split requests into "Pending Review" (user can approve) and "My Requests" (user submitted)
  const pendingReviewRequests = searchFilteredRequests.filter(
    req => req.status === 'pending' && req.requested_by !== profile?.id
  );
  const myRequests = searchFilteredRequests.filter(
    req => req.requested_by === profile?.id
  );
  
  // Get current display list based on active tab
  const filteredRequests = activeTab === 'pending-review' ? pendingReviewRequests : myRequests;

  const pendingCount = requests.filter(r => r.status === 'pending').length;
  const approvedCount = requests.filter(r => r.status === 'approved').length;
  const rejectedCount = requests.filter(r => r.status === 'rejected').length;
  const myPendingCount = myRequests.filter(r => r.status === 'pending').length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold">Approval Queue</h1>
            <p className="text-muted-foreground">Review and manage approval requests</p>
          </div>
          <Button onClick={fetchRequests} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-amber-700 dark:text-amber-300">Pending</p>
                  <p className="text-3xl font-bold text-amber-900 dark:text-amber-100">{pendingCount}</p>
                </div>
                <Clock className="h-10 w-10 text-amber-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-700 dark:text-green-300">Approved</p>
                  <p className="text-3xl font-bold text-green-900 dark:text-green-100">{approvedCount}</p>
                </div>
                <CheckCircle2 className="h-10 w-10 text-green-500" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-red-700 dark:text-red-300">Rejected</p>
                  <p className="text-3xl font-bold text-red-900 dark:text-red-100">{rejectedCount}</p>
                </div>
                <XCircle className="h-10 w-10 text-red-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs and Filters */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="pending-review" className="flex items-center gap-2">
              <Inbox className="h-4 w-4" />
              Pending Review
              {pendingReviewRequests.length > 0 && (
                <Badge variant="secondary" className="ml-1">{pendingReviewRequests.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="my-requests" className="flex items-center gap-2">
              <Send className="h-4 w-4" />
              My Requests
              {myPendingCount > 0 && (
                <Badge variant="outline" className="ml-1 bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300">{myPendingCount}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by entity number, type, or description..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-40">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-full sm:w-40">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="loan">Loan</SelectItem>
                    <SelectItem value="redemption">Redemption</SelectItem>
                    <SelectItem value="voucher">Voucher</SelectItem>
                    <SelectItem value="auction">Auction</SelectItem>
                    <SelectItem value="commission">Commission</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Requests Table */}
          <Card>
            <CardHeader>
              <CardTitle>
                {activeTab === 'pending-review' ? 'Requests Awaiting Your Review' : 'Your Submitted Requests'}
              </CardTitle>
            </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map(i => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : filteredRequests.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <AlertCircle className="h-12 w-12 mb-4" />
                <p className="text-lg font-medium">No approval requests found</p>
                <p className="text-sm">Try adjusting your filters</p>
              </div>
            ) : (
              <ResponsiveTable>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Entity</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Requested By</TableHead>
                      <TableHead>Requested At</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRequests.map((request) => (
                      <TableRow key={request.id} className="cursor-pointer hover:bg-muted/50">
                        <TableCell className="font-medium">
                          {request.entity_number || request.entity_type}
                          {request.description && (
                            <p className="text-xs text-muted-foreground mt-1 truncate max-w-[200px]">
                              {request.description}
                            </p>
                          )}
                        </TableCell>
                        <TableCell>{getTypeBadge(request.workflow_type)}</TableCell>
                        <TableCell>{formatAmount(request.amount)}</TableCell>
                        <TableCell>
                          <div>
                            <p className="text-sm">{profiles[request.requested_by || '']?.full_name || 'Unknown'}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="text-sm">{format(new Date(request.requested_at), 'dd MMM yyyy')}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(request.requested_at), { addSuffix: true })}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(request.status)}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedRequest(request);
                              setDialogOpen(true);
                            }}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ResponsiveTable>
            )}
          </CardContent>
        </Card>
        </Tabs>
      </div>

      <ApprovalDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        request={selectedRequest}
        onApprove={handleApprove}
        onReject={handleReject}
      />
    </DashboardLayout>
  );
}
