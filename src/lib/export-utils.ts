/**
 * Export utilities for generating Excel and CSV files
 */

export interface ExportColumn<T> {
  key: keyof T | string;
  header: string;
  formatter?: (value: any, row: T) => string | number;
  width?: number;
}

/**
 * Export data to CSV format and trigger download
 */
export function exportToCSV<T extends Record<string, any>>(
  data: T[],
  columns: ExportColumn<T>[],
  filename: string
): void {
  if (data.length === 0) {
    console.warn('No data to export');
    return;
  }

  // Generate header row
  const headers = columns.map(col => `"${col.header}"`).join(',');

  // Generate data rows
  const rows = data.map(row => {
    return columns.map(col => {
      const value = getNestedValue(row, col.key as string);
      const formatted = col.formatter ? col.formatter(value, row) : value;
      
      // Escape quotes and wrap in quotes if contains comma or newline
      const stringValue = String(formatted ?? '');
      if (stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('"')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    }).join(',');
  });

  const csvContent = [headers, ...rows].join('\n');
  
  // Create blob and trigger download
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
  downloadBlob(blob, `${filename}.csv`);
}

/**
 * Export data to Excel format (XLSX) and trigger download
 * Uses a simple XML-based format compatible with Excel
 */
export function exportToExcel<T extends Record<string, any>>(
  data: T[],
  columns: ExportColumn<T>[],
  filename: string,
  sheetName: string = 'Sheet1'
): void {
  if (data.length === 0) {
    console.warn('No data to export');
    return;
  }

  // Generate Excel XML
  const xmlHeader = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
  <Styles>
    <Style ss:ID="Header">
      <Font ss:Bold="1"/>
      <Interior ss:Color="#E0E0E0" ss:Pattern="Solid"/>
      <Borders>
        <Border ss:Position="Bottom" ss:LineStyle="Continuous" ss:Weight="1"/>
      </Borders>
    </Style>
    <Style ss:ID="Currency">
      <NumberFormat ss:Format="#,##0.00"/>
    </Style>
    <Style ss:ID="Date">
      <NumberFormat ss:Format="dd-mmm-yyyy"/>
    </Style>
  </Styles>
  <Worksheet ss:Name="${escapeXml(sheetName)}">
    <Table>`;

  // Column widths
  const columnDefs = columns.map(col => 
    `<Column ss:Width="${col.width || 100}"/>`
  ).join('\n      ');

  // Header row
  const headerRow = `
      <Row ss:StyleID="Header">
        ${columns.map(col => `<Cell><Data ss:Type="String">${escapeXml(col.header)}</Data></Cell>`).join('\n        ')}
      </Row>`;

  // Data rows
  const dataRows = data.map(row => {
    const cells = columns.map(col => {
      const value = getNestedValue(row, col.key as string);
      const formatted = col.formatter ? col.formatter(value, row) : value;
      
      if (formatted === null || formatted === undefined) {
        return '<Cell><Data ss:Type="String"></Data></Cell>';
      }
      
      if (typeof formatted === 'number') {
        return `<Cell><Data ss:Type="Number">${formatted}</Data></Cell>`;
      }
      
      return `<Cell><Data ss:Type="String">${escapeXml(String(formatted))}</Data></Cell>`;
    }).join('\n        ');
    
    return `<Row>
        ${cells}
      </Row>`;
  }).join('\n      ');

  const xmlFooter = `
    </Table>
  </Worksheet>
</Workbook>`;

  const xmlContent = xmlHeader + '\n      ' + columnDefs + headerRow + '\n      ' + dataRows + xmlFooter;

  // Create blob and trigger download
  const blob = new Blob([xmlContent], { type: 'application/vnd.ms-excel;charset=utf-8;' });
  downloadBlob(blob, `${filename}.xls`);
}

/**
 * Get nested value from object using dot notation
 */
function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((acc, part) => acc?.[part], obj);
}

/**
 * Escape XML special characters
 */
function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Trigger file download
 */
function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Format currency for export
 */
export function formatCurrencyForExport(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return '';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Format date for export
 */
export function formatDateForExport(date: string | Date | null | undefined): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Format number for export
 */
export function formatNumberForExport(num: number | null | undefined, decimals: number = 2): string {
  if (num === null || num === undefined) return '';
  return num.toFixed(decimals);
}
