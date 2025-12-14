import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, FileText, Eye } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { RECEIPT_TYPES, FONT_OPTIONS } from '@/lib/print-utils';
import TemplatePreviewDialog from './TemplatePreviewDialog';

interface PrintTemplate {
  id: string;
  template_code: string;
  template_name: string;
  receipt_type: string;
  language: string | null;
  layout_style: string | null;
  paper_size: string | null;
  font_family: string | null;
  color_scheme: any;
  is_active: boolean | null;
}

export default function TemplatesGallery() {
  const { client } = useAuth();
  const [templates, setTemplates] = useState<PrintTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('all');
  const [previewOpen, setPreviewOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<PrintTemplate | null>(null);

  const handlePreviewClick = (template: PrintTemplate) => {
    setSelectedTemplate(template);
    setPreviewOpen(true);
  };

  useEffect(() => {
    fetchTemplates();
  }, [client?.id]);

  const fetchTemplates = async () => {
    if (!client?.id) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('print_templates')
        .select('*')
        .order('receipt_type', { ascending: true });

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error('Error fetching templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTemplates = templates.filter(t => 
    filterType === 'all' || t.receipt_type === filterType
  );

  const getReceiptTypeLabel = (type: string) => {
    return RECEIPT_TYPES.find(r => r.value === type)?.label || type;
  };

  const getFontLabel = (font: string) => {
    return FONT_OPTIONS.find(f => f.value === font)?.label || font;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {RECEIPT_TYPES.map(type => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-sm text-muted-foreground">
            {filteredTemplates.length} template(s)
          </span>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredTemplates.map((template) => (
          <Card key={template.id} className="hover:border-primary/50 transition-colors">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div 
                    className="h-10 w-10 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: template.color_scheme?.primary || '#B45309' }}
                  >
                    <FileText className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-base">{template.template_name}</CardTitle>
                    <CardDescription className="text-xs">
                      {template.template_code}
                    </CardDescription>
                  </div>
                </div>
                <Badge variant={template.is_active ? 'default' : 'secondary'}>
                  {template.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Type: </span>
                  <span className="font-medium">{getReceiptTypeLabel(template.receipt_type)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Language: </span>
                  <span className="font-medium capitalize">{template.language}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Font: </span>
                  <span className="font-medium">{getFontLabel(template.font_family || 'Roboto')}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Paper: </span>
                  <span className="font-medium uppercase">{template.paper_size}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div 
                  className="h-4 w-4 rounded border"
                  style={{ backgroundColor: template.color_scheme?.primary || '#B45309' }}
                  title="Primary Color"
                />
                <div 
                  className="h-4 w-4 rounded border"
                  style={{ backgroundColor: template.color_scheme?.secondary || '#1E40AF' }}
                  title="Secondary Color"
                />
                <span className="text-xs text-muted-foreground ml-1">Color scheme</span>
              </div>

              <Button 
                variant="outline" 
                size="sm" 
                className="w-full gap-2"
                onClick={() => handlePreviewClick(template)}
              >
                <Eye className="h-4 w-4" />
                Preview
              </Button>
            </CardContent>
          </Card>
        ))}

        {filteredTemplates.length === 0 && (
          <div className="col-span-full text-center py-12 text-muted-foreground">
            No templates found for the selected type
          </div>
        )}
      </div>

      <TemplatePreviewDialog
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        template={selectedTemplate}
      />
    </div>
  );
}
