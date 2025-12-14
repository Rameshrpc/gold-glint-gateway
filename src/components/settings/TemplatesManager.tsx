import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Search, Eye, Edit, Copy, Loader2, FileText } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { PrintTemplate } from '@/hooks/usePrintSettings';
import { TemplateEditorSheet } from './TemplateEditorSheet';
import { TemplatePreviewDialog } from './TemplatePreviewDialog';

interface TemplatesManagerProps {
  templates: PrintTemplate[];
  loading: boolean;
  updateTemplate: (id: string, updates: Partial<PrintTemplate>) => Promise<boolean>;
  createTemplate: (template: Partial<PrintTemplate>) => Promise<boolean>;
}

const RECEIPT_TYPES = [
  { value: 'all', label: 'All Types' },
  { value: 'loan', label: 'Loan Receipt' },
  { value: 'interest', label: 'Interest Receipt' },
  { value: 'redemption', label: 'Redemption Receipt' },
  { value: 'auction', label: 'Auction Notice' },
  { value: 'kyc', label: 'KYC Documents' },
  { value: 'declaration', label: 'Gold Declaration' },
];

export function TemplatesManager({
  templates,
  loading,
  updateTemplate,
  createTemplate
}: TemplatesManagerProps) {
  const { isPlatformAdmin } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [selectedTemplate, setSelectedTemplate] = useState<PrintTemplate | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const canManageTemplates = isPlatformAdmin();

  const filteredTemplates = templates.filter(t => {
    const matchesSearch = t.template_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.template_code.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || t.receipt_type === filterType;
    return matchesSearch && matchesType;
  });

  const handleToggleActive = async (template: PrintTemplate) => {
    await updateTemplate(template.id, { is_active: !template.is_active });
  };

  const handleEdit = (template: PrintTemplate) => {
    setSelectedTemplate(template);
    setIsCreating(false);
    setEditorOpen(true);
  };

  const handleCreate = () => {
    setSelectedTemplate(null);
    setIsCreating(true);
    setEditorOpen(true);
  };

  const handlePreview = (template: PrintTemplate) => {
    setSelectedTemplate(template);
    setPreviewOpen(true);
  };

  const handleDuplicate = async (template: PrintTemplate) => {
    const newTemplate = {
      template_code: `${template.template_code}_COPY`,
      template_name: `${template.template_name} (Copy)`,
      receipt_type: template.receipt_type,
      language: template.language,
      layout_style: template.layout_style,
      paper_size: template.paper_size,
      color_scheme: template.color_scheme,
      is_active: false
    };
    await createTemplate(newTemplate);
  };

  const getReceiptTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      loan: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      interest: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      redemption: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
      auction: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
      kyc: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300',
      declaration: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300',
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
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
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Print Templates</CardTitle>
              <CardDescription>
                Manage document templates for receipts and notices
              </CardDescription>
            </div>
            {canManageTemplates && (
              <Button onClick={handleCreate} className="gap-2">
                <Plus className="h-4 w-4" />
                New Template
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by type" />
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

          {filteredTemplates.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">No templates found</p>
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Template</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Language</TableHead>
                    <TableHead>Layout</TableHead>
                    <TableHead>Paper</TableHead>
                    <TableHead>Active</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTemplates.map(template => (
                    <TableRow key={template.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{template.template_name}</p>
                          <p className="text-xs text-muted-foreground">{template.template_code}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getReceiptTypeBadge(template.receipt_type)} variant="secondary">
                          {template.receipt_type}
                        </Badge>
                      </TableCell>
                      <TableCell className="capitalize">
                        {template.language || 'English'}
                      </TableCell>
                      <TableCell className="capitalize">
                        {template.layout_style || 'Classic'}
                      </TableCell>
                      <TableCell className="uppercase">
                        {template.paper_size || 'A4'}
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={template.is_active || false}
                          onCheckedChange={() => handleToggleActive(template)}
                          disabled={!canManageTemplates}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handlePreview(template)}
                            title="Preview"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {canManageTemplates && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEdit(template)}
                                title="Edit"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDuplicate(template)}
                                title="Duplicate"
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <TemplateEditorSheet
        open={editorOpen}
        onOpenChange={setEditorOpen}
        template={selectedTemplate}
        isCreating={isCreating}
        onSave={async (data) => {
          if (isCreating) {
            await createTemplate(data);
          } else if (selectedTemplate) {
            await updateTemplate(selectedTemplate.id, data);
          }
          setEditorOpen(false);
        }}
      />

      <TemplatePreviewDialog
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        template={selectedTemplate}
      />
    </>
  );
}
