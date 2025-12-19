import { StyleSheet } from '@react-pdf/renderer';

// Black & White print-optimized styles
export const pdfStyles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: 'Roboto',
    fontSize: 10,
    color: '#000',
    backgroundColor: '#fff',
  },
  
  // Header styles
  header: {
    marginBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: '#000',
    paddingBottom: 10,
  },
  headerCompanyName: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 4,
  },
  headerSlogan: {
    fontSize: 9,
    textAlign: 'center',
    color: '#555',
    marginBottom: 4,
  },
  headerBranch: {
    fontSize: 10,
    textAlign: 'center',
    color: '#333',
  },
  headerDate: {
    fontSize: 9,
    textAlign: 'right',
    color: '#555',
  },
  
  // Document title
  documentTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 12,
    paddingVertical: 6,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#000',
    textTransform: 'uppercase',
  },
  
  // Section styles
  section: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 6,
    paddingBottom: 2,
    borderBottomWidth: 0.5,
    borderBottomColor: '#ccc',
  },
  
  // Row styles
  row: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  rowLabel: {
    width: '35%',
    color: '#555',
    fontSize: 9,
  },
  rowValue: {
    width: '65%',
    fontSize: 10,
  },
  
  // Table styles
  table: {
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#000',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    borderBottomWidth: 1,
    borderBottomColor: '#000',
    padding: 6,
  },
  tableHeaderCell: {
    fontSize: 9,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: '#ccc',
    padding: 6,
    minHeight: 24,
  },
  tableCell: {
    fontSize: 9,
    textAlign: 'center',
  },
  tableCellLeft: {
    fontSize: 9,
    textAlign: 'left',
  },
  
  // Amount summary
  amountBox: {
    marginTop: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#000',
    backgroundColor: '#f9f9f9',
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  amountLabel: {
    fontSize: 10,
    color: '#333',
  },
  amountValue: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  amountTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#000',
  },
  amountTotalLabel: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  amountTotalValue: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  
  // Signature section
  signatureSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 40,
    paddingTop: 20,
  },
  signatureBox: {
    width: '30%',
    alignItems: 'center',
  },
  signatureLine: {
    width: '100%',
    borderTopWidth: 1,
    borderTopColor: '#000',
    marginBottom: 6,
  },
  signatureLabel: {
    fontSize: 8,
    textAlign: 'center',
    color: '#555',
  },
  
  // Footer
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    borderTopWidth: 0.5,
    borderTopColor: '#ccc',
    paddingTop: 8,
  },
  footerText: {
    fontSize: 8,
    textAlign: 'center',
    color: '#555',
  },
  
  // Image styles
  imageContainer: {
    alignItems: 'center',
    marginVertical: 12,
  },
  jewelImage: {
    maxWidth: 300,
    maxHeight: 300,
    objectFit: 'contain',
  },
  
  // Credit card sized images (85.60 × 53.98 mm)
  creditCardImage: {
    width: 243, // 85.60mm at 72 DPI
    height: 153, // 53.98mm at 72 DPI
    objectFit: 'cover',
    borderWidth: 1,
    borderColor: '#000',
    marginBottom: 8,
  },
  
  // KYC document layout
  kycGrid: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 16,
  },
  kycItem: {
    alignItems: 'center',
    marginBottom: 16,
  },
  kycLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 6,
    textAlign: 'center',
  },
  
  // Declaration styles
  declarationItem: {
    flexDirection: 'row',
    marginBottom: 8,
    paddingLeft: 8,
  },
  declarationNumber: {
    width: 20,
    fontSize: 9,
    fontWeight: 'bold',
  },
  declarationText: {
    flex: 1,
    fontSize: 9,
  },
  
  // Warning box
  warningBox: {
    marginTop: 12,
    padding: 8,
    borderWidth: 2,
    borderColor: '#000',
    backgroundColor: '#f9f9f9',
  },
  warningText: {
    fontSize: 9,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  
  // Checkbox placeholder
  checkbox: {
    width: 12,
    height: 12,
    borderWidth: 1,
    borderColor: '#000',
    marginRight: 8,
  },
  
  // Two column layout
  twoColumn: {
    flexDirection: 'row',
    gap: 20,
  },
  column: {
    flex: 1,
  },
  
  // Page number
  pageNumber: {
    position: 'absolute',
    bottom: 15,
    right: 30,
    fontSize: 8,
    color: '#999',
  },
});

// Paper size dimensions in points (1 inch = 72 points)
export const PAPER_SIZES = {
  A4: { width: 595.28, height: 841.89 },
  Legal: { width: 612, height: 1008 },
  Letter: { width: 612, height: 792 },
};

// Format currency for print
export function formatCurrencyPrint(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// Format date for print
export function formatDatePrint(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

// Format weight for print
export function formatWeightPrint(grams: number): string {
  return `${grams.toFixed(3)} g`;
}
