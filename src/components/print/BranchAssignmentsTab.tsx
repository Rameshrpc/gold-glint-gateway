import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Lock, Unlock, Building2, Save } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useTemplatesByType } from '@/hooks/usePrintTemplates';
import { useBranchAssignments, useSaveBranchAssignment } from '@/hooks/usePrintSettings';

const receiptTypes = ['loan', 'interest', 'redemption', 'auction'];

interface Assignment {
  branch_id: string;
  receipt_type: string;
  template_id: string;
  is_locked: boolean;
}

export function BranchAssignmentsTab() {
  const { profile } = useAuth();
  const { loanTemplates, interestTemplates, redemptionTemplates, auctionTemplates, isLoading: templatesLoading } = useTemplatesByType();
  const { data: existingAssignments, isLoading: assignmentsLoading } = useBranchAssignments();
  const saveMutation = useSaveBranchAssignment();

  const [pendingChanges, setPendingChanges] = useState<Record<string, Assignment>>({});

  const { data: branches, isLoading: branchesLoading } = useQuery({
    queryKey: ['branches-for-assignment', profile?.client_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('branches')
        .select('id, branch_name, branch_code')
        .eq('client_id', profile?.client_id)
        .eq('is_active', true)
        .order('branch_name');

      if (error) throw error;
      return data;
    },
    enabled: !!profile?.client_id,
  });

  const getTemplatesForType = (type: string) => {
    switch (type) {
      case 'loan': return loanTemplates;
      case 'interest': return interestTemplates;
      case 'redemption': return redemptionTemplates;
      case 'auction': return auctionTemplates;
      default: return [];
    }
  };

  const getExistingAssignment = (branchId: string, receiptType: string) => {
    const key = `${branchId}-${receiptType}`;
    if (pendingChanges[key]) return pendingChanges[key];
    
    const existing = existingAssignments?.find(
      a => a.branch_id === branchId && a.receipt_type === receiptType
    );
    return existing ? {
      branch_id: branchId,
      receipt_type: receiptType,
      template_id: existing.template_id,
      is_locked: existing.is_locked,
    } : null;
  };

  const handleChange = (branchId: string, receiptType: string, field: 'template_id' | 'is_locked', value: string | boolean) => {
    const key = `${branchId}-${receiptType}`;
    const existing = getExistingAssignment(branchId, receiptType);
    
    setPendingChanges(prev => ({
      ...prev,
      [key]: {
        branch_id: branchId,
        receipt_type: receiptType,
        template_id: field === 'template_id' ? (value as string) : (existing?.template_id || ''),
        is_locked: field === 'is_locked' ? (value as boolean) : (existing?.is_locked || true),
      }
    }));
  };

  const handleSaveAll = () => {
    Object.values(pendingChanges).forEach(assignment => {
      if (assignment.template_id) {
        saveMutation.mutate(assignment);
      }
    });
    setPendingChanges({});
  };

  const isLoading = templatesLoading || branchesLoading || assignmentsLoading;

  if (isLoading) {
    return <div className="text-center py-8 text-muted-foreground">Loading...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-primary" />
          Branch Template Assignments
        </CardTitle>
        <CardDescription>
          Assign specific templates to each branch. Lock templates to prevent branch managers from changing them.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="min-w-[150px]">Branch</TableHead>
                {receiptTypes.map(type => (
                  <TableHead key={type} className="min-w-[200px] capitalize">{type}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {branches?.map(branch => (
                <TableRow key={branch.id}>
                  <TableCell className="font-medium">
                    <div>
                      {branch.branch_name}
                      <Badge variant="outline" className="ml-2 text-xs">
                        {branch.branch_code}
                      </Badge>
                    </div>
                  </TableCell>
                  {receiptTypes.map(type => {
                    const assignment = getExistingAssignment(branch.id, type);
                    const templates = getTemplatesForType(type);
                    
                    return (
                      <TableCell key={type}>
                        <div className="flex items-center gap-2">
                          <Select
                            value={assignment?.template_id || ''}
                            onValueChange={(v) => handleChange(branch.id, type, 'template_id', v)}
                          >
                            <SelectTrigger className="w-[140px]">
                              <SelectValue placeholder="Select..." />
                            </SelectTrigger>
                            <SelectContent>
                              {templates.map(t => (
                                <SelectItem key={t.id} value={t.id}>
                                  {t.template_name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <button
                            onClick={() => handleChange(branch.id, type, 'is_locked', !assignment?.is_locked)}
                            className={`p-1.5 rounded transition-colors ${
                              assignment?.is_locked 
                                ? 'text-amber-600 hover:bg-amber-500/10' 
                                : 'text-muted-foreground hover:bg-muted'
                            }`}
                            title={assignment?.is_locked ? 'Locked - Branch cannot change' : 'Unlocked - Branch can change'}
                          >
                            {assignment?.is_locked ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                          </button>
                        </div>
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {Object.keys(pendingChanges).length > 0 && (
          <div className="mt-4 flex items-center justify-between p-3 bg-amber-500/10 rounded-lg border border-amber-500/20">
            <span className="text-sm text-amber-700 dark:text-amber-400">
              You have unsaved changes
            </span>
            <Button 
              onClick={handleSaveAll}
              disabled={saveMutation.isPending}
              className="bg-amber-600 hover:bg-amber-700"
            >
              <Save className="h-4 w-4 mr-2" />
              Save All Changes
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
