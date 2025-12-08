import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { pdf } from '@react-pdf/renderer';
import { Download, Printer, FileText, Layout, Globe } from 'lucide-react';
import { toast } from 'sonner';
import { usePrintTemplates } from '@/hooks/usePrintTemplates';
import { usePrintSettings } from '@/hooks/usePrintSettings';
import { resolveTemplate, getTemplateCodeByPaperSize, TemplateData } from '@/lib/templateResolver';
import { HTMLPrintDialog } from './HTMLPrintDialog';
import { TamilNaduPawnbrokerHTMLTemplateProps } from './html-templates/TamilNaduPawnbrokerHTMLTemplate';

interface PDFViewerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  document: React.ReactElement;
  fileName: string;
  // Optional: For dynamic template selection
  templateData?: TemplateData;
  receiptType?: 'loan' | 'interest' | 'redemption' | 'auction';
  // Optional: HTML template data for bilingual support
  htmlTemplateData?: TamilNaduPawnbrokerHTMLTemplateProps;
}

export function PDFViewerDialog({ 
  open, 
  onOpenChange, 
  title, 
  document, 
  fileName,
  templateData,
  receiptType = 'loan',
  htmlTemplateData
}: PDFViewerDialogProps) {
  const [loading, setLoading] = useState(false);
  const [paperSize, setPaperSize] = useState<'a4' | 'a5' | 'thermal'>('a4');
  const [selectedTemplateCode, setSelectedTemplateCode] = useState<string>('');
  const [printMode, setPrintMode] = useState<'pdf' | 'html'>('pdf');
  
  // Fetch available templates and client print settings
  const { data: templates = [] } = usePrintTemplates(receiptType);
  const { data: printSettings = [] } = usePrintSettings(receiptType);
  
  // Set default template from client settings or first available template
  useEffect(() => {
    if (printSettings.length > 0 && printSettings[0].template_id) {
      const defaultTemplate = templates.find(t => t.id === printSettings[0].template_id);
      if (defaultTemplate) {
        setSelectedTemplateCode(defaultTemplate.template_code);
        // Set paper size from template
        if (defaultTemplate.paper_size === '80mm') {
          setPaperSize('thermal');
        } else if (defaultTemplate.paper_size === 'a5') {
          setPaperSize('a5');
        } else {
          setPaperSize('a4');
        }
        // Auto-switch to HTML mode for bilingual templates
        if (defaultTemplate.language === 'bilingual' && htmlTemplateData) {
          setPrintMode('html');
        }
        return;
      }
    }
    // Fall back to first template or default
    if (templates.length > 0) {
      setSelectedTemplateCode(templates[0].template_code);
    }
  }, [templates, printSettings, htmlTemplateData]);

  // Check if selected template is bilingual
  const selectedTemplate = templates.find(t => t.template_code === selectedTemplateCode);
  const isBilingualTemplate = selectedTemplate?.language === 'bilingual' || 
    selectedTemplateCode?.includes('BILINGUAL') || 
    selectedTemplateCode?.includes('TN_PAWNBROKER');

  // Get the document to render
  const getDocumentToRender = () => {
    // If templateData is provided and we have a selected template, use dynamic resolution
    if (templateData && selectedTemplateCode) {
      const adjustedCode = getTemplateCodeByPaperSize(selectedTemplateCode, paperSize);
      return resolveTemplate(adjustedCode, templateData);
    }
    // Otherwise use the static document prop
    return document;
  };

  const handleDownload = async () => {
    setLoading(true);
    try {
      const docToRender = getDocumentToRender();
      const blob = await pdf(docToRender).toBlob();
      const url = URL.createObjectURL(blob);
      const link = window.document.createElement('a');
      link.href = url;
      link.download = `${fileName}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success('PDF downloaded successfully');
    } catch (error) {
      toast.error('Failed to generate PDF');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = async () => {
    setLoading(true);
    try {
      const docToRender = getDocumentToRender();
      const blob = await pdf(docToRender).toBlob();
      const url = URL.createObjectURL(blob);
      const printWindow = window.open(url, '_blank');
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print();
        };
      }
    } catch (error) {
      toast.error('Failed to generate PDF for printing');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // If HTML mode is selected and we have htmlTemplateData, show HTMLPrintDialog
  if (printMode === 'html' && htmlTemplateData) {
    return (
      <HTMLPrintDialog
        open={open}
        onOpenChange={onOpenChange}
        title={title}
        templateData={htmlTemplateData}
      />
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            {title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Print Mode Toggle - Show only if htmlTemplateData is available */}
          {htmlTemplateData && (
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Print Mode
              </label>
              <Select value={printMode} onValueChange={(v) => setPrintMode(v as 'pdf' | 'html')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf" disabled={isBilingualTemplate}>
                    PDF Mode (English only)
                  </SelectItem>
                  <SelectItem value="html">HTML Mode (Tamil/Bilingual)</SelectItem>
                </SelectContent>
              </Select>
              {isBilingualTemplate && (
                <p className="text-xs text-amber-600">
                  ⚠️ Bilingual templates require HTML mode for proper Tamil font rendering.
                </p>
              )}
            </div>
          )}

          {/* Template Selection - Only show if templateData is provided */}
          {templateData && templates.length > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Layout className="h-4 w-4" />
                Template
              </label>
              <Select 
                value={selectedTemplateCode} 
                onValueChange={(code) => {
                  setSelectedTemplateCode(code);
                  // Auto-switch paper size based on template
                  const template = templates.find(t => t.template_code === code);
                  if (template?.paper_size === '80mm') {
                    setPaperSize('thermal');
                  } else if (template?.paper_size === 'a5') {
                    setPaperSize('a5');
                  } else {
                    setPaperSize('a4');
                  }
                  // Auto-switch to HTML for bilingual
                  if (template?.language === 'bilingual' && htmlTemplateData) {
                    setPrintMode('html');
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select template" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((template) => (
                    <SelectItem key={template.id} value={template.template_code}>
                      <div className="flex items-center gap-2">
                        <span>{template.template_name}</span>
                        <span className="text-xs text-muted-foreground">
                          ({template.paper_size === '80mm' ? 'Thermal' : template.paper_size?.toUpperCase()})
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Paper Size Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Paper Size</label>
            <Select value={paperSize} onValueChange={(v) => setPaperSize(v as 'a4' | 'a5' | 'thermal')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="a4">A4 (Standard)</SelectItem>
                <SelectItem value="a5">A5 (Half Page)</SelectItem>
                <SelectItem value="thermal">Thermal (80mm)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Template Info */}
          {selectedTemplate && (
            <div className="bg-muted/50 rounded-lg p-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Language:</span>
                <span className="font-medium capitalize">{selectedTemplate.language || 'English'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Layout:</span>
                <span className="font-medium capitalize">{selectedTemplate.layout_style || 'Classic'}</span>
              </div>
            </div>
          )}

          {/* Preview Info */}
          <div className="bg-muted/50 rounded-lg p-4 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              Click Download or Print to generate the PDF
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button 
              onClick={handleDownload} 
              disabled={loading}
              className="flex-1"
              variant="outline"
            >
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
            <Button 
              onClick={handlePrint} 
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700"
            >
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
