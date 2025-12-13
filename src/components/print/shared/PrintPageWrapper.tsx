import React from 'react';
import { Button } from '@/components/ui/button';
import { Printer, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface PrintPageWrapperProps {
  children: React.ReactNode;
  title?: string;
}

export const PrintPageWrapper: React.FC<PrintPageWrapperProps> = ({ children, title }) => {
  const navigate = useNavigate();

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-gray-100 print:bg-white">
      {/* Print controls - hidden during print */}
      <div className="no-print fixed top-0 left-0 right-0 bg-white border-b shadow-sm z-50 p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            {title && <span className="text-sm font-medium text-gray-600">{title}</span>}
          </div>
          <Button onClick={handlePrint} className="gap-2">
            <Printer className="h-4 w-4" />
            Print
          </Button>
        </div>
      </div>

      {/* Page content */}
      <div className="pt-20 pb-8 print:pt-0 print:pb-0">
        <div className="print-page-a4 bg-white shadow-lg print:shadow-none mx-auto">
          {children}
        </div>
      </div>
    </div>
  );
};
