export interface PrintOptions {
  paperSize: 'a4' | 'thermal';
  title?: string;
}

export async function printHTMLContent(
  content: string,
  options: PrintOptions
): Promise<void> {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    throw new Error('Could not open print window. Please allow popups.');
  }

  const pageStyles = options.paperSize === 'thermal' 
    ? `
      @page {
        size: 80mm auto;
        margin: 3mm;
      }
      body {
        width: 80mm;
        font-size: 10px;
      }
    `
    : `
      @page {
        size: A4;
        margin: 10mm;
      }
      body {
        width: 210mm;
        font-size: 12px;
      }
    `;

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${options.title || 'Print Receipt'}</title>
      <link href="https://fonts.googleapis.com/css2?family=Catamaran:wght@400;500;600;700&display=swap" rel="stylesheet">
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: 'Catamaran', sans-serif;
          line-height: 1.4;
          color: #000;
          background: #fff;
          padding: 10px;
        }
        ${pageStyles}
        .page-break {
          page-break-after: always;
        }
        .avoid-break {
          page-break-inside: avoid;
        }
        table {
          width: 100%;
          border-collapse: collapse;
        }
        th, td {
          border: 1px solid #333;
          padding: 4px 8px;
          text-align: left;
        }
        th {
          background: #f5f5f5;
          font-weight: 600;
        }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .font-bold { font-weight: 700; }
        .font-semibold { font-weight: 600; }
        .text-sm { font-size: 0.875em; }
        .text-xs { font-size: 0.75em; }
        .text-lg { font-size: 1.125em; }
        .text-xl { font-size: 1.25em; }
        .mt-2 { margin-top: 8px; }
        .mt-4 { margin-top: 16px; }
        .mb-2 { margin-bottom: 8px; }
        .mb-4 { margin-bottom: 16px; }
        .p-2 { padding: 8px; }
        .p-4 { padding: 16px; }
        .border { border: 1px solid #333; }
        .border-b { border-bottom: 1px solid #333; }
        .border-t { border-top: 1px solid #333; }
        .grid { display: grid; }
        .grid-cols-2 { grid-template-columns: repeat(2, 1fr); }
        .grid-cols-3 { grid-template-columns: repeat(3, 1fr); }
        .grid-cols-4 { grid-template-columns: repeat(4, 1fr); }
        .gap-2 { gap: 8px; }
        .gap-4 { gap: 16px; }
        .flex { display: flex; }
        .flex-col { flex-direction: column; }
        .justify-between { justify-content: space-between; }
        .items-center { align-items: center; }
        .w-full { width: 100%; }
        .section-title {
          font-size: 14px;
          font-weight: 700;
          text-align: center;
          padding: 8px;
          background: #f0f0f0;
          border: 1px solid #333;
          margin-bottom: 12px;
        }
        .signature-line {
          border-top: 1px solid #333;
          margin-top: 40px;
          padding-top: 4px;
          text-align: center;
          font-size: 11px;
        }
        img {
          max-width: 100%;
          height: auto;
        }
        @media print {
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      </style>
    </head>
    <body>
      ${content}
    </body>
    </html>
  `;

  printWindow.document.write(htmlContent);
  printWindow.document.close();

  // Wait for fonts and images to load
  await new Promise(resolve => setTimeout(resolve, 500));
  
  printWindow.focus();
  printWindow.print();
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
