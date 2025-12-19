import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Json } from '@/integrations/supabase/types';

export type WorkflowType = 'loan' | 'redemption' | 'voucher' | 'auction' | 'commission';
export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

export interface ApprovalWorkflow {
  id: string;
  client_id: string;
  workflow_type: string;
  is_enabled: boolean;
  threshold_amount: number;
  requires_dual_approval: boolean;
  auto_approve_roles: string[];
  l1_approver_roles: string[];
  l2_approver_roles: string[];
}

export interface ApprovalRequest {
  id: string;
  client_id: string;
  branch_id: string | null;
  workflow_type: string;
  entity_type: string;
  entity_id: string;
  entity_number: string | null;
  requested_by: string | null;
  requested_at: string;
  amount: number | null;
  description: string | null;
  metadata: Json;
  status: string;
  approved_by_l1: string | null;
  approved_at_l1: string | null;
  comments_l1: string | null;
  approved_by_l2: string | null;
  approved_at_l2: string | null;
  comments_l2: string | null;
  rejected_by: string | null;
  rejected_at: string | null;
  rejection_reason: string | null;
  created_at: string;
  updated_at: string;
}

interface SubmitApprovalParams {
  workflowType: WorkflowType;
  entityType: string;
  entityId: string;
  entityNumber?: string;
  branchId?: string;
  amount?: number;
  description?: string;
  metadata?: Record<string, unknown>;
}

export function useApprovalWorkflow() {
  const { profile, roles } = useAuth();
  const [loading, setLoading] = useState(false);
  const [workflows, setWorkflows] = useState<ApprovalWorkflow[]>([]);

  // Fetch workflows for the client
  const fetchWorkflows = useCallback(async () => {
    if (!profile?.client_id) return [];
    
    const { data, error } = await supabase
      .from('approval_workflows')
      .select('*')
      .eq('client_id', profile.client_id);
    
    if (error) {
      console.error('Error fetching workflows:', error);
      return [];
    }
    
    setWorkflows(data as ApprovalWorkflow[] || []);
    return data as ApprovalWorkflow[] || [];
  }, [profile?.client_id]);

  // Get workflow configuration for a type
  const getWorkflow = useCallback(async (type: WorkflowType): Promise<ApprovalWorkflow | null> => {
    if (!profile?.client_id) return null;
    
    // Check cached workflows first
    let workflow = workflows.find(w => w.workflow_type === type);
    if (workflow) return workflow;
    
    const { data, error } = await supabase
      .from('approval_workflows')
      .select('*')
      .eq('client_id', profile.client_id)
      .eq('workflow_type', type)
      .maybeSingle();
    
    if (error) {
      console.error('Error fetching workflow:', error);
      return null;
    }
    
    return data as ApprovalWorkflow | null;
  }, [profile?.client_id, workflows]);

  // Check if approval is required for a transaction
  const checkApprovalRequired = useCallback(async (
    type: WorkflowType,
    amount: number
  ): Promise<{ required: boolean; workflow: ApprovalWorkflow | null }> => {
    const workflow = await getWorkflow(type);
    
    if (!workflow || !workflow.is_enabled) {
      return { required: false, workflow: null };
    }
    
    // Check if amount exceeds threshold
    if (amount <= workflow.threshold_amount) {
      return { required: false, workflow };
    }
    
    return { required: true, workflow };
  }, [getWorkflow]);

  // Check if current user can auto-approve
  const canAutoApprove = useCallback(async (type: WorkflowType): Promise<boolean> => {
    if (!roles || roles.length === 0) return false;
    
    const workflow = await getWorkflow(type);
    if (!workflow || !workflow.is_enabled) return true; // No workflow = no approval needed
    
    // Check if user has any auto-approve role
    return workflow.auto_approve_roles.some(role => roles.includes(role as any));
  }, [getWorkflow, roles]);

  // Check if current user can approve requests
  const canApprove = useCallback(async (type: WorkflowType, level: 1 | 2 = 1): Promise<boolean> => {
    if (!roles || roles.length === 0) return false;
    
    const workflow = await getWorkflow(type);
    if (!workflow) return false;
    
    const approverRoles = level === 1 ? workflow.l1_approver_roles : workflow.l2_approver_roles;
    
    return approverRoles.some(role => roles.includes(role as any));
  }, [getWorkflow, roles]);

  // Submit for approval
  const submitForApproval = useCallback(async (params: SubmitApprovalParams): Promise<{ success: boolean; requestId?: string }> => {
    if (!profile?.client_id || !profile?.id) {
      toast.error('User profile not found');
      return { success: false };
    }
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('approval_requests')
        .insert({
          client_id: profile.client_id,
          branch_id: params.branchId || profile.branch_id,
          workflow_type: params.workflowType,
          entity_type: params.entityType,
          entity_id: params.entityId,
          entity_number: params.entityNumber,
          requested_by: profile.id,
          amount: params.amount,
          description: params.description,
          metadata: (params.metadata || {}) as Json,
          status: 'pending'
        })
        .select('id')
        .single();
      
      if (error) throw error;
      
      toast.success('Submitted for approval');
      return { success: true, requestId: data.id };
    } catch (error) {
      console.error('Error submitting for approval:', error);
      toast.error('Failed to submit for approval');
      return { success: false };
    } finally {
      setLoading(false);
    }
  }, [profile]);

  // Approve a request
  const approveRequest = useCallback(async (
    requestId: string,
    comments?: string
  ): Promise<boolean> => {
    if (!profile?.id) {
      toast.error('User profile not found');
      return false;
    }
    
    setLoading(true);
    try {
      // First fetch the request to check its current state
      const { data: request, error: fetchError } = await supabase
        .from('approval_requests')
        .select('*')
        .eq('id', requestId)
        .single();
      
      if (fetchError) throw fetchError;
      
      // Fetch workflow for this request
      const { data: workflow } = await supabase
        .from('approval_workflows')
        .select('*')
        .eq('client_id', request.client_id)
        .eq('workflow_type', request.workflow_type)
        .maybeSingle();
      
      const needsDualApproval = workflow?.requires_dual_approval;
      
      let updateData: Record<string, unknown>;
      
      if (!request.approved_by_l1) {
        // First level approval
        updateData = {
          approved_by_l1: profile.id,
          approved_at_l1: new Date().toISOString(),
          comments_l1: comments,
          status: needsDualApproval ? 'pending' : 'approved',
          updated_at: new Date().toISOString()
        };
      } else if (needsDualApproval && !request.approved_by_l2) {
        // Second level approval (can't be same person as L1)
        if (request.approved_by_l1 === profile.id) {
          toast.error('You already approved this request at Level 1');
          return false;
        }
        updateData = {
          approved_by_l2: profile.id,
          approved_at_l2: new Date().toISOString(),
          comments_l2: comments,
          status: 'approved',
          updated_at: new Date().toISOString()
        };
      } else {
        toast.error('This request has already been fully approved');
        return false;
      }
      
      const { error: updateError } = await supabase
        .from('approval_requests')
        .update(updateData)
        .eq('id', requestId);
      
      if (updateError) throw updateError;
      
      // Update the entity's approval_status if fully approved
      if (updateData.status === 'approved') {
        await updateEntityApprovalStatus(request.entity_type, request.entity_id, 'approved');
      }
      
      toast.success(updateData.status === 'approved' ? 'Request approved' : 'Level 1 approval complete');
      return true;
    } catch (error) {
      console.error('Error approving request:', error);
      toast.error('Failed to approve request');
      return false;
    } finally {
      setLoading(false);
    }
  }, [profile]);

  // Reject a request
  const rejectRequest = useCallback(async (
    requestId: string,
    reason: string
  ): Promise<boolean> => {
    if (!profile?.id) {
      toast.error('User profile not found');
      return false;
    }
    
    if (!reason.trim()) {
      toast.error('Rejection reason is required');
      return false;
    }
    
    setLoading(true);
    try {
      // Fetch the request first
      const { data: request, error: fetchError } = await supabase
        .from('approval_requests')
        .select('entity_type, entity_id')
        .eq('id', requestId)
        .single();
      
      if (fetchError) throw fetchError;
      
      const { error } = await supabase
        .from('approval_requests')
        .update({
          status: 'rejected',
          rejected_by: profile.id,
          rejected_at: new Date().toISOString(),
          rejection_reason: reason,
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId);
      
      if (error) throw error;
      
      // Update the entity's approval_status
      await updateEntityApprovalStatus(request.entity_type, request.entity_id, 'rejected');
      
      toast.success('Request rejected');
      return true;
    } catch (error) {
      console.error('Error rejecting request:', error);
      toast.error('Failed to reject request');
      return false;
    } finally {
      setLoading(false);
    }
  }, [profile]);

  // Helper to update entity approval status
  const updateEntityApprovalStatus = async (
    entityType: string,
    entityId: string,
    status: 'approved' | 'rejected'
  ) => {
    try {
      if (entityType === 'loan') {
        await supabase.from('loans').update({ approval_status: status }).eq('id', entityId);
      } else if (entityType === 'redemption') {
        await supabase.from('redemptions').update({ approval_status: status }).eq('id', entityId);
      } else if (entityType === 'voucher') {
        await supabase.from('vouchers').update({ approval_status: status }).eq('id', entityId);
      } else if (entityType === 'auction') {
        await supabase.from('auctions').update({ approval_status: status }).eq('id', entityId);
      }
    } catch (error) {
      console.error('Error updating entity approval status:', error);
    }
  };

  // Get pending approvals
  const getPendingApprovals = useCallback(async (
    branchId?: string
  ): Promise<ApprovalRequest[]> => {
    if (!profile?.client_id) return [];
    
    let query = supabase
      .from('approval_requests')
      .select('*')
      .eq('client_id', profile.client_id)
      .eq('status', 'pending')
      .order('requested_at', { ascending: false });
    
    if (branchId) {
      query = query.eq('branch_id', branchId);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching pending approvals:', error);
      return [];
    }
    
    return (data || []) as ApprovalRequest[];
  }, [profile?.client_id]);

  // Get pending approval count
  const getPendingCount = useCallback(async (): Promise<number> => {
    if (!profile?.client_id) return 0;
    
    const { count, error } = await supabase
      .from('approval_requests')
      .select('*', { count: 'exact', head: true })
      .eq('client_id', profile.client_id)
      .eq('status', 'pending');
    
    if (error) {
      console.error('Error fetching pending count:', error);
      return 0;
    }
    
    return count || 0;
  }, [profile?.client_id]);

  // Get approval request for an entity
  const getApprovalRequest = useCallback(async (
    entityType: string,
    entityId: string
  ): Promise<ApprovalRequest | null> => {
    const { data, error } = await supabase
      .from('approval_requests')
      .select('*')
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    
    if (error) {
      console.error('Error fetching approval request:', error);
      return null;
    }
    
    return data as ApprovalRequest | null;
  }, []);

  return {
    loading,
    workflows,
    fetchWorkflows,
    getWorkflow,
    checkApprovalRequired,
    canAutoApprove,
    canApprove,
    submitForApproval,
    approveRequest,
    rejectRequest,
    getPendingApprovals,
    getPendingCount,
    getApprovalRequest
  };
}
