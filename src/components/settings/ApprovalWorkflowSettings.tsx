import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Loader2, ChevronDown, ChevronRight, Save, ShieldCheck, Users, Banknote, FileText, Gavel, Coins } from 'lucide-react';

type WorkflowType = 'loan' | 'redemption' | 'voucher' | 'auction' | 'commission';
type AppRole = 'tenant_admin' | 'branch_manager' | 'loan_officer' | 'appraiser' | 'collection_agent' | 'auditor';

interface ApprovalWorkflow {
  id?: string;
  client_id: string;
  workflow_type: string;
  is_enabled: boolean;
  threshold_amount: number;
  requires_dual_approval: boolean;
  auto_approve_roles: AppRole[];
  l1_approver_roles: AppRole[];
  l2_approver_roles: AppRole[];
}

const WORKFLOW_TYPES: { key: WorkflowType; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: 'loan', label: 'Loan Creation', icon: Banknote },
  { key: 'redemption', label: 'Redemption', icon: Coins },
  { key: 'voucher', label: 'Voucher', icon: FileText },
  { key: 'auction', label: 'Auction', icon: Gavel },
  { key: 'commission', label: 'Commission Payment', icon: Users },
];

const ALL_ROLES: { value: AppRole; label: string }[] = [
  { value: 'tenant_admin', label: 'Admin' },
  { value: 'branch_manager', label: 'Branch Manager' },
  { value: 'loan_officer', label: 'Loan Officer' },
  { value: 'appraiser', label: 'Appraiser' },
  { value: 'collection_agent', label: 'Collection Agent' },
  { value: 'auditor', label: 'Auditor' },
];

const DEFAULT_WORKFLOW: Omit<ApprovalWorkflow, 'client_id'> = {
  workflow_type: '',
  is_enabled: false,
  threshold_amount: 0,
  requires_dual_approval: false,
  auto_approve_roles: ['tenant_admin'],
  l1_approver_roles: ['branch_manager'],
  l2_approver_roles: ['tenant_admin'],
};

export function ApprovalWorkflowSettings() {
  const { client } = useAuth();
  const [workflows, setWorkflows] = useState<Record<WorkflowType, ApprovalWorkflow>>({} as Record<WorkflowType, ApprovalWorkflow>);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<WorkflowType | null>(null);
  const [expandedWorkflow, setExpandedWorkflow] = useState<WorkflowType | null>('loan');

  useEffect(() => {
    if (client?.id) {
      fetchWorkflows();
    }
  }, [client?.id]);

  const fetchWorkflows = async () => {
    if (!client?.id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('approval_workflows')
        .select('*')
        .eq('client_id', client.id);

      if (error) throw error;

      // Initialize all workflow types with defaults or fetched data
      const workflowMap: Record<WorkflowType, ApprovalWorkflow> = {} as Record<WorkflowType, ApprovalWorkflow>;
      
      WORKFLOW_TYPES.forEach(({ key }) => {
        const existing = data?.find(w => w.workflow_type === key);
        if (existing) {
          workflowMap[key] = {
            ...existing,
            auto_approve_roles: (existing.auto_approve_roles || []) as AppRole[],
            l1_approver_roles: (existing.l1_approver_roles || []) as AppRole[],
            l2_approver_roles: (existing.l2_approver_roles || []) as AppRole[],
          };
        } else {
          workflowMap[key] = {
            ...DEFAULT_WORKFLOW,
            workflow_type: key,
            client_id: client.id,
          };
        }
      });

      setWorkflows(workflowMap);
    } catch (error) {
      console.error('Error fetching workflows:', error);
      toast.error('Failed to load approval workflows');
    } finally {
      setLoading(false);
    }
  };

  const updateWorkflow = (type: WorkflowType, updates: Partial<ApprovalWorkflow>) => {
    setWorkflows(prev => ({
      ...prev,
      [type]: { ...prev[type], ...updates },
    }));
  };

  const toggleRole = (type: WorkflowType, field: 'auto_approve_roles' | 'l1_approver_roles' | 'l2_approver_roles', role: AppRole) => {
    const currentRoles = workflows[type][field];
    const newRoles = currentRoles.includes(role)
      ? currentRoles.filter(r => r !== role)
      : [...currentRoles, role];
    updateWorkflow(type, { [field]: newRoles });
  };

  const saveWorkflow = async (type: WorkflowType) => {
    if (!client?.id) return;
    setSaving(type);
    
    try {
      const workflow = workflows[type];
      
      if (workflow.id) {
        // Update existing
        const { error } = await supabase
          .from('approval_workflows')
          .update({
            is_enabled: workflow.is_enabled,
            threshold_amount: workflow.threshold_amount,
            requires_dual_approval: workflow.requires_dual_approval,
            auto_approve_roles: workflow.auto_approve_roles,
            l1_approver_roles: workflow.l1_approver_roles,
            l2_approver_roles: workflow.l2_approver_roles,
            updated_at: new Date().toISOString(),
          })
          .eq('id', workflow.id);
        
        if (error) throw error;
      } else {
        // Insert new
        const { data, error } = await supabase
          .from('approval_workflows')
          .insert({
            client_id: client.id,
            workflow_type: type,
            is_enabled: workflow.is_enabled,
            threshold_amount: workflow.threshold_amount,
            requires_dual_approval: workflow.requires_dual_approval,
            auto_approve_roles: workflow.auto_approve_roles,
            l1_approver_roles: workflow.l1_approver_roles,
            l2_approver_roles: workflow.l2_approver_roles,
          })
          .select()
          .single();
        
        if (error) throw error;
        
        // Update local state with new ID
        updateWorkflow(type, { id: data.id });
      }
      
      toast.success(`${WORKFLOW_TYPES.find(w => w.key === type)?.label} workflow saved`);
    } catch (error) {
      console.error('Error saving workflow:', error);
      toast.error('Failed to save workflow');
    } finally {
      setSaving(null);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" />
            Approval Workflows
          </CardTitle>
          <CardDescription>
            Configure approval requirements for different transaction types. When enabled, transactions above the threshold will require approval before processing.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {WORKFLOW_TYPES.map(({ key, label, icon: Icon }) => {
            const workflow = workflows[key];
            const isExpanded = expandedWorkflow === key;
            
            return (
              <Collapsible
                key={key}
                open={isExpanded}
                onOpenChange={(open) => setExpandedWorkflow(open ? key : null)}
              >
                <div className="border rounded-lg">
                  <CollapsibleTrigger className="flex items-center justify-between w-full p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <Icon className="h-5 w-5 text-muted-foreground" />
                      <div className="text-left">
                        <p className="font-medium">{label}</p>
                        <p className="text-sm text-muted-foreground">
                          {workflow.is_enabled 
                            ? `Enabled • Threshold: ₹${workflow.threshold_amount.toLocaleString()}`
                            : 'Disabled - All transactions auto-approved'
                          }
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={workflow.is_enabled ? 'default' : 'secondary'}>
                        {workflow.is_enabled ? 'Active' : 'Inactive'}
                      </Badge>
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  </CollapsibleTrigger>
                  
                  <CollapsibleContent>
                    <div className="px-4 pb-4 pt-2 space-y-6 border-t">
                      {/* Enable Toggle */}
                      <div className="flex items-center justify-between">
                        <div>
                          <Label htmlFor={`${key}-enabled`}>Enable Approval Workflow</Label>
                          <p className="text-sm text-muted-foreground">
                            When disabled, all {label.toLowerCase()}s are auto-approved
                          </p>
                        </div>
                        <Switch
                          id={`${key}-enabled`}
                          checked={workflow.is_enabled}
                          onCheckedChange={(checked) => updateWorkflow(key, { is_enabled: checked })}
                        />
                      </div>

                      {workflow.is_enabled && (
                        <>
                          <Separator />
                          
                          {/* Threshold */}
                          <div className="space-y-2">
                            <Label>Threshold Amount (₹)</Label>
                            <p className="text-sm text-muted-foreground mb-2">
                              Transactions above this amount will require approval
                            </p>
                            <Input
                              type="number"
                              value={workflow.threshold_amount}
                              onChange={(e) => updateWorkflow(key, { threshold_amount: parseFloat(e.target.value) || 0 })}
                              placeholder="0 = all transactions need approval"
                              className="max-w-xs"
                            />
                          </div>

                          <Separator />

                          {/* Dual Approval Toggle */}
                          <div className="flex items-center justify-between">
                            <div>
                              <Label htmlFor={`${key}-dual`}>Require Dual Approval</Label>
                              <p className="text-sm text-muted-foreground">
                                Two separate approvers must approve (L1 then L2)
                              </p>
                            </div>
                            <Switch
                              id={`${key}-dual`}
                              checked={workflow.requires_dual_approval}
                              onCheckedChange={(checked) => updateWorkflow(key, { requires_dual_approval: checked })}
                            />
                          </div>

                          <Separator />

                          {/* Auto-Approve Roles */}
                          <div className="space-y-3">
                            <div>
                              <Label>Auto-Approve Roles</Label>
                              <p className="text-sm text-muted-foreground">
                                Users with these roles can bypass approval requirements
                              </p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {ALL_ROLES.map((role) => (
                                <label
                                  key={`${key}-auto-${role.value}`}
                                  className="flex items-center gap-2 px-3 py-1.5 border rounded-md cursor-pointer hover:bg-muted/50 transition-colors"
                                >
                                  <Checkbox
                                    checked={workflow.auto_approve_roles.includes(role.value)}
                                    onCheckedChange={() => toggleRole(key, 'auto_approve_roles', role.value)}
                                  />
                                  <span className="text-sm">{role.label}</span>
                                </label>
                              ))}
                            </div>
                          </div>

                          <Separator />

                          {/* L1 Approver Roles */}
                          <div className="space-y-3">
                            <div>
                              <Label>Level 1 Approver Roles</Label>
                              <p className="text-sm text-muted-foreground">
                                Users with these roles can provide first-level approval
                              </p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {ALL_ROLES.map((role) => (
                                <label
                                  key={`${key}-l1-${role.value}`}
                                  className="flex items-center gap-2 px-3 py-1.5 border rounded-md cursor-pointer hover:bg-muted/50 transition-colors"
                                >
                                  <Checkbox
                                    checked={workflow.l1_approver_roles.includes(role.value)}
                                    onCheckedChange={() => toggleRole(key, 'l1_approver_roles', role.value)}
                                  />
                                  <span className="text-sm">{role.label}</span>
                                </label>
                              ))}
                            </div>
                          </div>

                          {workflow.requires_dual_approval && (
                            <>
                              <Separator />
                              
                              {/* L2 Approver Roles */}
                              <div className="space-y-3">
                                <div>
                                  <Label>Level 2 Approver Roles</Label>
                                  <p className="text-sm text-muted-foreground">
                                    Users with these roles can provide final approval (cannot be same as L1 approver)
                                  </p>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  {ALL_ROLES.map((role) => (
                                    <label
                                      key={`${key}-l2-${role.value}`}
                                      className="flex items-center gap-2 px-3 py-1.5 border rounded-md cursor-pointer hover:bg-muted/50 transition-colors"
                                    >
                                      <Checkbox
                                        checked={workflow.l2_approver_roles.includes(role.value)}
                                        onCheckedChange={() => toggleRole(key, 'l2_approver_roles', role.value)}
                                      />
                                      <span className="text-sm">{role.label}</span>
                                    </label>
                                  ))}
                                </div>
                              </div>
                            </>
                          )}
                        </>
                      )}

                      {/* Save Button */}
                      <div className="flex justify-end pt-2">
                        <Button
                          onClick={() => saveWorkflow(key)}
                          disabled={saving === key}
                          size="sm"
                        >
                          {saving === key ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : (
                            <Save className="h-4 w-4 mr-2" />
                          )}
                          Save Changes
                        </Button>
                      </div>
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
