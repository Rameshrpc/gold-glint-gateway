import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Loader2, Building2, Lock, Unlock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { PrintTemplate, BranchTemplateAssignment } from '@/hooks/usePrintSettings';

interface TemplateAssignmentsProps {
  templates: PrintTemplate[];
  branchAssignments: BranchTemplateAssignment[];
  loading: boolean;
  saveBranchAssignment: (branchId: string, receiptType: string, templateId: string, isLocked?: boolean) => Promise<boolean>;
  deleteBranchAssignment: (branchId: string, receiptType: string) => Promise<boolean>;
}

interface Branch {
  id: string;
  branch_code: string;
  branch_name: string;
  is_active: boolean | null;
}

const RECEIPT_TYPES = [
  { value: 'loan', label: 'Loan Receipt' },
  { value: 'interest', label: 'Interest Receipt' },
  { value: 'redemption', label: 'Redemption Receipt' },
  { value: 'auction', label: 'Auction Notice' },
];

export function TemplateAssignments({
  templates,
  branchAssignments,
  loading,
  saveBranchAssignment,
  deleteBranchAssignment
}: TemplateAssignmentsProps) {
  const { client } = useAuth();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loadingBranches, setLoadingBranches] = useState(true);

  useEffect(() => {
    const fetchBranches = async () => {
      if (!client?.id) return;

      setLoadingBranches(true);
      const { data, error } = await supabase
        .from('branches')
        .select('id, branch_code, branch_name, is_active')
        .eq('client_id', client.id)
        .order('branch_name');

      if (!error && data) {
        setBranches(data);
      }
      setLoadingBranches(false);
    };

    fetchBranches();
  }, [client?.id]);

  const getAssignment = (branchId: string, receiptType: string) => {
    return branchAssignments.find(
      a => a.branch_id === branchId && a.receipt_type === receiptType
    );
  };

  const getTemplatesForType = (receiptType: string) => {
    return templates.filter(t => t.receipt_type === receiptType && t.is_active);
  };

  const handleTemplateChange = async (branchId: string, receiptType: string, templateId: string) => {
    if (templateId === 'default') {
      await deleteBranchAssignment(branchId, receiptType);
    } else {
      const existing = getAssignment(branchId, receiptType);
      await saveBranchAssignment(branchId, receiptType, templateId, existing?.is_locked || false);
    }
  };

  const handleLockToggle = async (branchId: string, receiptType: string) => {
    const existing = getAssignment(branchId, receiptType);
    if (!existing) return;

    await saveBranchAssignment(branchId, receiptType, existing.template_id, !existing.is_locked);
  };

  if (loading || loadingBranches) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (branches.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <Building2 className="h-12 w-12 text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground">No branches found</p>
          <p className="text-sm text-muted-foreground">Create branches to assign templates</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Template Assignments</CardTitle>
          <CardDescription>
            Assign specific templates to branches. Branches without assignments use the client default.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {branches.map(branch => (
            <div key={branch.id} className="border rounded-lg p-4 space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium">{branch.branch_name}</h3>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">{branch.branch_code}</Badge>
                    {!branch.is_active && (
                      <Badge variant="secondary" className="text-xs">Inactive</Badge>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid gap-3">
                {RECEIPT_TYPES.map(receiptType => {
                  const assignment = getAssignment(branch.id, receiptType.value);
                  const availableTemplates = getTemplatesForType(receiptType.value);

                  return (
                    <div
                      key={receiptType.value}
                      className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 py-2 border-b last:border-0"
                    >
                      <Label className="w-full sm:w-32 text-sm font-normal">
                        {receiptType.label}
                      </Label>
                      <div className="flex items-center gap-2 flex-1">
                        <Select
                          value={assignment?.template_id || 'default'}
                          onValueChange={(v) => handleTemplateChange(branch.id, receiptType.value, v)}
                        >
                          <SelectTrigger className="flex-1">
                            <SelectValue placeholder="Use Default" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="default">
                              <span className="text-muted-foreground">Use Default</span>
                            </SelectItem>
                            {availableTemplates.map(t => (
                              <SelectItem key={t.id} value={t.id}>
                                {t.template_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>

                        {assignment && (
                          <button
                            onClick={() => handleLockToggle(branch.id, receiptType.value)}
                            className="p-2 hover:bg-muted rounded-md transition-colors"
                            title={assignment.is_locked ? 'Unlock template' : 'Lock template'}
                          >
                            {assignment.is_locked ? (
                              <Lock className="h-4 w-4 text-amber-600" />
                            ) : (
                              <Unlock className="h-4 w-4 text-muted-foreground" />
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Assignment Legend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 text-sm">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded bg-muted flex items-center justify-center">
                <Lock className="h-4 w-4 text-amber-600" />
              </div>
              <div>
                <p className="font-medium">Locked Assignment</p>
                <p className="text-muted-foreground">Branch staff cannot change this template</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded bg-muted flex items-center justify-center">
                <Unlock className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium">Unlocked Assignment</p>
                <p className="text-muted-foreground">Branch staff can select a different template</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded bg-muted flex items-center justify-center text-xs text-muted-foreground">
                —
              </div>
              <div>
                <p className="font-medium">Use Default</p>
                <p className="text-muted-foreground">Uses the client-level default template setting</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
