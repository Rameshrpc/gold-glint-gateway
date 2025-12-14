import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, Building2, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useBranchTemplateAssignments } from '@/hooks/usePrintTemplate';
import { RECEIPT_TYPES } from '@/lib/print-utils';
import { toast } from 'sonner';

interface Branch {
  id: string;
  branch_code: string;
  branch_name: string;
}

interface PrintTemplate {
  id: string;
  template_code: string;
  template_name: string;
  receipt_type: string;
}

export default function BranchAssignments() {
  const { client } = useAuth();
  const { assignments, loading: assignmentsLoading, assignTemplate, refetch } = useBranchTemplateAssignments();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [templates, setTemplates] = useState<PrintTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReceiptType, setSelectedReceiptType] = useState<string>('loan_receipt');
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    if (client?.id) {
      fetchData();
    }
  }, [client?.id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [branchesRes, templatesRes] = await Promise.all([
        supabase
          .from('branches')
          .select('id, branch_code, branch_name')
          .eq('client_id', client!.id)
          .eq('is_active', true)
          .order('branch_name'),
        supabase
          .from('print_templates')
          .select('id, template_code, template_name, receipt_type')
          .eq('is_active', true)
          .order('template_name'),
      ]);

      if (branchesRes.error) throw branchesRes.error;
      if (templatesRes.error) throw templatesRes.error;

      setBranches(branchesRes.data || []);
      setTemplates(templatesRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAssignedTemplate = (branchId: string, receiptType: string) => {
    const assignment = assignments.find(
      a => a.branch_id === branchId && a.receipt_type === receiptType
    );
    return assignment?.template_id || '';
  };

  const handleAssign = async (branchId: string, templateId: string) => {
    setSaving(branchId);
    const success = await assignTemplate(branchId, templateId, selectedReceiptType);
    if (success) {
      toast.success('Template assigned successfully');
    } else {
      toast.error('Failed to assign template');
    }
    setSaving(null);
  };

  const templatesForType = templates.filter(t => t.receipt_type === selectedReceiptType);

  if (loading || assignmentsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Receipt Type:</span>
          <Select value={selectedReceiptType} onValueChange={setSelectedReceiptType}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {RECEIPT_TYPES.map(type => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <span className="text-sm text-muted-foreground">
          {templatesForType.length} template(s) available
        </span>
      </div>

      <Card>
        <CardContent className="pt-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Branch</TableHead>
                <TableHead>Assigned Template</TableHead>
                <TableHead className="w-24">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {branches.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                    No branches found
                  </TableCell>
                </TableRow>
              ) : (
                branches.map((branch) => {
                  const assignedTemplateId = getAssignedTemplate(branch.id, selectedReceiptType);
                  const isSaving = saving === branch.id;

                  return (
                    <TableRow key={branch.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center">
                            <Building2 className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{branch.branch_name}</p>
                            <p className="text-xs text-muted-foreground">{branch.branch_code}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={assignedTemplateId || 'none'}
                          onValueChange={(value) => handleAssign(branch.id, value === 'none' ? '' : value)}
                          disabled={isSaving}
                        >
                          <SelectTrigger className="w-64">
                            <SelectValue placeholder="Select template..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">
                              <span className="text-muted-foreground">Default Template</span>
                            </SelectItem>
                            {templatesForType.map(template => (
                              <SelectItem key={template.id} value={template.id}>
                                {template.template_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        {isSaving ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : assignedTemplateId ? (
                          <Badge variant="default" className="gap-1">
                            <Check className="h-3 w-3" />
                            Assigned
                          </Badge>
                        ) : (
                          <Badge variant="secondary">Default</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
