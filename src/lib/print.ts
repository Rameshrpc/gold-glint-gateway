/**
 * Simple HTML-based print utility
 * Uses native browser printing for reliable cross-browser support
 */

export interface PrintOptions {
  title?: string;
  paperSize?: 'a4' | 'thermal';
}

export function printElement(elementId: string, options: PrintOptions = {}): void {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error('Print element not found:', elementId);
    return;
  }

  const printWindow = window.open('', '_blank', 'width=800,height=600');
  if (!printWindow) {
    alert('Please allow popups to print receipts');
    return;
  }

  const pageStyles = options.paperSize === 'thermal' 
    ? `
      @page { size: 80mm auto; margin: 3mm; }
      body { width: 76mm; font-size: 11px; }
    `
    : `
      @page { size: A4; margin: 10mm; }
      body { width: 190mm; font-size: 12px; }
    `;

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${options.title || 'Print'}</title>
      <link href="https://fonts.googleapis.com/css2?family=Catamaran:wght@400;500;600;700&display=swap" rel="stylesheet">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: 'Catamaran', -apple-system, BlinkMacSystemFont, sans-serif;
          line-height: 1.4;
          color: #000;
          background: #fff;
          padding: 10px;
        }
        ${pageStyles}
        
        /* Print utilities */
        .page-break { page-break-after: always; }
        .avoid-break { page-break-inside: avoid; }
        
        /* Typography */
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .text-left { text-align: left; }
        .font-bold { font-weight: 700; }
        .font-semibold { font-weight: 600; }
        .font-medium { font-weight: 500; }
        .text-xs { font-size: 0.75em; }
        .text-sm { font-size: 0.875em; }
        .text-lg { font-size: 1.125em; }
        .text-xl { font-size: 1.25em; }
        .text-2xl { font-size: 1.5em; }
        
        /* Spacing */
        .mt-1 { margin-top: 4px; }
        .mt-2 { margin-top: 8px; }
        .mt-3 { margin-top: 12px; }
        .mt-4 { margin-top: 16px; }
        .mt-6 { margin-top: 24px; }
        .mb-1 { margin-bottom: 4px; }
        .mb-2 { margin-bottom: 8px; }
        .mb-3 { margin-bottom: 12px; }
        .mb-4 { margin-bottom: 16px; }
        .p-2 { padding: 8px; }
        .p-3 { padding: 12px; }
        .p-4 { padding: 16px; }
        .px-2 { padding-left: 8px; padding-right: 8px; }
        .py-1 { padding-top: 4px; padding-bottom: 4px; }
        .py-2 { padding-top: 8px; padding-bottom: 8px; }
        
        /* Layout */
        .flex { display: flex; }
        .flex-col { flex-direction: column; }
        .justify-between { justify-content: space-between; }
        .justify-center { justify-content: center; }
        .items-center { align-items: center; }
        .gap-1 { gap: 4px; }
        .gap-2 { gap: 8px; }
        .gap-4 { gap: 16px; }
        .grid { display: grid; }
        .grid-cols-2 { grid-template-columns: repeat(2, 1fr); }
        .grid-cols-3 { grid-template-columns: repeat(3, 1fr); }
        .w-full { width: 100%; }
        
        /* Borders */
        .border { border: 1px solid #333; }
        .border-b { border-bottom: 1px solid #333; }
        .border-t { border-top: 1px solid #333; }
        .border-dashed { border-style: dashed; }
        .rounded { border-radius: 4px; }
        
        /* Tables */
        table { width: 100%; border-collapse: collapse; }
        th, td { border: 1px solid #333; padding: 6px 8px; text-align: left; }
        th { background: #f5f5f5; font-weight: 600; }
        
        /* Receipt specific */
        .receipt-header { text-align: center; padding-bottom: 12px; border-bottom: 2px solid #333; margin-bottom: 16px; }
        .receipt-title { font-size: 14px; font-weight: 700; text-align: center; padding: 8px; background: #f0f0f0; border: 1px solid #333; margin: 12px 0; }
        .info-row { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 4px; }
        .info-label { color: #666; font-size: 0.9em; }
        .info-value { font-weight: 600; }
        .signature-line { border-top: 1px solid #333; margin-top: 40px; padding-top: 4px; text-align: center; font-size: 11px; }
        .copy-type { font-size: 12px; font-weight: 600; text-align: center; background: #e0e0e0; padding: 4px; margin-bottom: 8px; }
        
        /* Tamil text */
        .tamil { font-family: 'Catamaran', 'Noto Sans Tamil', sans-serif; }
        
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      </style>
    </head>
    <body>
      ${element.innerHTML}
    </body>
    </html>
  `;

  printWindow.document.write(htmlContent);
  printWindow.document.close();

  // Wait for fonts to load before printing
  setTimeout(() => {
    printWindow.focus();
    printWindow.print();
  }, 300);
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

export function formatDateTime(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
}
