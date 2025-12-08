import React, { useRef, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Printer, Download } from 'lucide-react';
import { TamilNaduPawnbrokerHTMLTemplate, TamilNaduPawnbrokerHTMLTemplateProps } from './html-templates/TamilNaduPawnbrokerHTMLTemplate';
import { printHTMLContent } from '@/lib/printUtils';
import { toast } from 'sonner';

interface HTMLPrintDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  templateData: TamilNaduPawnbrokerHTMLTemplateProps;
}

export const HTMLPrintDialog: React.FC<HTMLPrintDialogProps> = ({
  open,
  onOpenChange,
  title = 'Print Receipt',
  templateData,
}) => {
  const [paperSize, setPaperSize] = useState<'a4' | 'thermal'>('a4');
  const [isPrinting, setIsPrinting] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = async () => {
    if (!printRef.current) return;

    setIsPrinting(true);
    try {
      await printHTMLContent(printRef.current.innerHTML, {
        paperSize,
        title: `Receipt_${templateData.loan.loanNumber}`,
      });
      toast.success('Print dialog opened');
    } catch (error) {
      console.error('Print error:', error);
      toast.error('Failed to open print dialog');
    } finally {
      setIsPrinting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <div className="flex items-center justify-between">
            <DialogTitle>{title}</DialogTitle>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Paper Size:</span>
                <Select value={paperSize} onValueChange={(v) => setPaperSize(v as 'a4' | 'thermal')}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="a4">A4</SelectItem>
                    <SelectItem value="thermal">Thermal 80mm</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Tamil text renders correctly with native browser printing • தமிழ் எழுத்துக்கள் சரியாக அச்சிடப்படும்
          </div>
        </DialogHeader>

        {/* Preview Area */}
        <ScrollArea className="flex-1 border rounded-lg bg-gray-100">
          <div className="p-4">
            <div 
              ref={printRef}
              className="bg-white shadow-lg mx-auto"
              style={{ 
                width: paperSize === 'a4' ? '210mm' : '80mm',
                minHeight: paperSize === 'a4' ? '297mm' : 'auto',
              }}
            >
              <TamilNaduPawnbrokerHTMLTemplate
                {...templateData}
                paperSize={paperSize}
              />
            </div>
          </div>
        </ScrollArea>

        <DialogFooter className="flex-shrink-0 gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handlePrint} 
            disabled={isPrinting}
            className="gap-2"
          >
            <Printer className="h-4 w-4" />
            {isPrinting ? 'Preparing...' : 'Print'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
