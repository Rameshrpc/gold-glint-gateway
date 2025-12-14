import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Printer, FileText, Shield, Package, User } from 'lucide-react';

interface PrintDocumentsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loanId: string;
  loanNumber: string;
  customerName: string;
}

const DOCUMENT_OPTIONS = [
  { id: 'loan_receipt', label: 'Loan Receipt', description: 'Customer + Office Copy', icon: FileText, path: '/print/loan-receipt' },
  { id: 'gold_declaration', label: 'Gold Declaration', description: 'Terms & Conditions', icon: Shield, path: '/print/gold-declaration' },
  { id: 'jewel_details', label: 'Jewel Details', description: 'Photo + Verification', icon: Package, path: '/print/jewel-details' },
  { id: 'kyc_documents', label: 'KYC Documents', description: 'Customer Documents', icon: User, path: '/print/kyc-documents' },
];

export default function PrintDocumentsDialog({
  open,
  onOpenChange,
  loanId,
  loanNumber,
  customerName,
}: PrintDocumentsDialogProps) {
  const [selectedDocs, setSelectedDocs] = useState<string[]>(['loan_receipt', 'gold_declaration']);

  const handleToggle = (docId: string) => {
    setSelectedDocs(prev => 
      prev.includes(docId) 
        ? prev.filter(id => id !== docId)
        : [...prev, docId]
    );
  };

  const handleSelectAll = () => {
    if (selectedDocs.length === DOCUMENT_OPTIONS.length) {
      setSelectedDocs([]);
    } else {
      setSelectedDocs(DOCUMENT_OPTIONS.map(d => d.id));
    }
  };

  const handlePrint = () => {
    const docsToOpen = DOCUMENT_OPTIONS.filter(doc => selectedDocs.includes(doc.id));
    
    docsToOpen.forEach((doc, index) => {
      setTimeout(() => {
        window.open(`${doc.path}/${loanId}`, '_blank');
      }, index * 300);
    });

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Printer className="h-5 w-5" />
            Print Loan Documents
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="p-3 bg-muted rounded-lg">
            <p className="font-medium">{loanNumber}</p>
            <p className="text-sm text-muted-foreground">{customerName}</p>
          </div>

          <div className="flex items-center justify-between">
            <Label className="text-sm text-muted-foreground">Select documents to print:</Label>
            <Button variant="link" size="sm" className="h-auto p-0" onClick={handleSelectAll}>
              {selectedDocs.length === DOCUMENT_OPTIONS.length ? 'Deselect All' : 'Select All'}
            </Button>
          </div>

          <div className="space-y-3">
            {DOCUMENT_OPTIONS.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                onClick={() => handleToggle(doc.id)}
              >
                <Checkbox
                  id={doc.id}
                  checked={selectedDocs.includes(doc.id)}
                  onCheckedChange={() => handleToggle(doc.id)}
                />
                <doc.icon className="h-4 w-4 text-muted-foreground" />
                <div className="flex-1">
                  <Label htmlFor={doc.id} className="font-medium cursor-pointer">
                    {doc.label}
                  </Label>
                  <p className="text-xs text-muted-foreground">{doc.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button 
            onClick={handlePrint} 
            disabled={selectedDocs.length === 0}
            className="gap-2"
          >
            <Printer className="h-4 w-4" />
            Print Selected ({selectedDocs.length})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
