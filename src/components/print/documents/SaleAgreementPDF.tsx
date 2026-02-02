import React from 'react';
import { Document, Page, View, Text, StyleSheet } from '@react-pdf/renderer';
import { format } from 'date-fns';
import { useSaleAgreementContent, AgreementClause } from '@/hooks/useSaleAgreementContent';
import '@/lib/pdf-fonts';
import { PDF_FONTS } from '@/lib/pdf-fonts';
import { LanguageMode } from '@/lib/bilingual-utils';
import { formatCurrencyPrint, formatWeightPrint, pdfStyles } from '../shared/PDFStyles';

interface GoldItem {
  id?: string;
  item_type: string;
  description?: string | null;
  gross_weight_grams: number;
  net_weight_grams: number;
  purity: string;
  purity_percentage: number;
  appraised_value: number;
  market_value?: number | null;
  image_url?: string | null;
}

interface Customer {
  id: string;
  customer_code: string;
  full_name: string;
  phone: string;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  date_of_birth?: string | null;
  gender?: string | null;
  nominee_name?: string | null;
  father_name?: string | null;
}

interface Loan {
  id: string;
  loan_number: string;
  loan_date: string;
  maturity_date: string;
  principal_amount: number;
  interest_rate: number;
  tenure_days: number;
  net_disbursed: number;
  shown_principal?: number | null;
}

interface SaleAgreementPDFProps {
  loan: Loan;
  customer: Customer;
  goldItems: GoldItem[];
  companyName: string;
  companyAddress?: string;
  gstin?: string;
  branchName?: string;
  language?: LanguageMode;
  paperSize?: string;
}

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: 'Roboto',
    fontSize: 9,
  },
  // Page 1 - Blank Stamp Paper Area (for physical stamp paper printing)
  stampAreaBlank: {
    height: 320,
    marginBottom: 8,
    // No border, no text - just blank space for physical stamp paper
  },
  // Title
  mainTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 2,
    textDecoration: 'underline',
  },
  mainTitleTamil: {
    fontSize: 12,
    fontFamily: 'Noto Sans Tamil',
    textAlign: 'center',
    marginBottom: 6,
    color: '#333',
  },
  // Parties Section
  partiesSection: {
    marginBottom: 12,
  },
  partyTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    padding: 3,
    marginBottom: 2,
  },
  partyTitle: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  partyTitleTamil: {
    fontSize: 9,
    fontFamily: 'Noto Sans Tamil',
    color: '#333',
  },
  partyDetails: {
    paddingLeft: 10,
    marginBottom: 4,
  },
  partyRow: {
    flexDirection: 'row',
    marginBottom: 2,
  },
  partyLabel: {
    width: 80,
    fontSize: 8,
    color: '#555',
  },
  partyValue: {
    flex: 1,
    fontSize: 9,
    fontWeight: 'bold',
  },
  // Summary Table
  summaryTable: {
    marginTop: 6,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#333',
  },
  summaryRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  summaryRowLast: {
    flexDirection: 'row',
  },
  summaryLabel: {
    width: '45%',
    padding: 5,
    fontSize: 8,
    backgroundColor: '#f5f5f5',
    borderRightWidth: 1,
    borderRightColor: '#ddd',
  },
  summaryValue: {
    width: '55%',
    padding: 5,
    fontSize: 9,
    fontWeight: 'bold',
  },
  // Signature Section
  signatureSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
    paddingTop: 8,
  },
  signatureBlock: {
    width: '40%',
    alignItems: 'center',
  },
  signatureLine: {
    borderTopWidth: 1,
    borderTopColor: '#333',
    width: '100%',
    marginTop: 30,
    marginBottom: 5,
  },
  signatureLabel: {
    fontSize: 8,
    textAlign: 'center',
  },
  signatureSublabel: {
    fontSize: 7,
    color: '#666',
    textAlign: 'center',
    marginTop: 2,
  },
  // Page 2 - Agreement Terms
  pageTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 3,
    textDecoration: 'underline',
  },
  pageTitleTamil: {
    fontSize: 11,
    fontFamily: 'Noto Sans Tamil',
    textAlign: 'center',
    marginBottom: 12,
    color: '#333',
  },
  // Ornaments Table
  ornamentsTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 5,
    textDecoration: 'underline',
  },
  ornamentsTable: {
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  ornamentsHeader: {
    flexDirection: 'row',
    backgroundColor: '#e8e8e8',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  ornamentsRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  ornamentsRowLast: {
    flexDirection: 'row',
  },
  ornamentCell: {
    padding: 4,
    fontSize: 8,
    borderRightWidth: 1,
    borderRightColor: '#ddd',
  },
  ornamentCellLast: {
    padding: 4,
    fontSize: 8,
  },
  ornamentCellHeader: {
    fontWeight: 'bold',
    fontSize: 7,
    backgroundColor: '#e8e8e8',
  },
  // Clauses
  clausesSection: {
    marginTop: 8,
  },
  clausesTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  clausesTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    textDecoration: 'underline',
  },
  clausesTitleTamil: {
    fontSize: 9,
    fontFamily: 'Noto Sans Tamil',
    marginLeft: 8,
    color: '#333',
  },
  clauseItem: {
    marginBottom: 10,
    paddingRight: 8,
  },
  clauseRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flexWrap: 'nowrap',
  },
  clauseNumber: {
    fontSize: 9,
    fontWeight: 'bold',
    fontFamily: 'Noto Sans Tamil',
    marginRight: 6,
    minWidth: 18,
  },
  clauseText: {
    fontSize: 9,
    fontFamily: 'Noto Sans Tamil',
    lineHeight: 1.8,
    textAlign: 'left',
    flex: 1,
    flexShrink: 1,
  },
  // Page 3 - Declaration
  declarationTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 3,
    textDecoration: 'underline',
  },
  declarationTitleTamil: {
    fontSize: 11,
    fontFamily: 'Noto Sans Tamil',
    textAlign: 'center',
    marginBottom: 12,
    color: '#333',
  },
  customerDetailsTable: {
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#333',
  },
  customerRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  customerLabel: {
    width: '40%',
    padding: 5,
    fontSize: 8,
    backgroundColor: '#f5f5f5',
    borderRightWidth: 1,
    borderRightColor: '#ddd',
  },
  customerValue: {
    width: '60%',
    padding: 5,
    fontSize: 9,
  },
  declarationText: {
    fontSize: 9,
    fontFamily: 'Noto Sans Tamil',
    lineHeight: 1.8,
    textAlign: 'left',
    marginBottom: 15,
    padding: 10,
    backgroundColor: '#fafafa',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  warningBox: {
    marginTop: 10,
    marginBottom: 15,
    padding: 10,
    backgroundColor: '#fff3cd',
    borderWidth: 1,
    borderColor: '#ffc107',
  },
  warningTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  warningTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#856404',
  },
  warningTitleTamil: {
    fontSize: 8,
    fontFamily: 'Noto Sans Tamil',
    color: '#856404',
    marginLeft: 6,
  },
  warningText: {
    fontSize: 9,
    fontFamily: 'Noto Sans Tamil',
    color: '#856404',
    lineHeight: 1.8,
    textAlign: 'left',
  },
  // Footer
  pageFooter: {
    position: 'absolute',
    bottom: 20,
    left: 30,
    right: 30,
    fontSize: 7,
    color: '#888',
    textAlign: 'center',
  },
});

// Helper to format date
const formatDate = (dateStr: string): string => {
  try {
    return format(new Date(dateStr), 'dd-MMM-yyyy');
  } catch {
    return dateStr;
  }
};

// Helper to add word-break hints for Tamil text
// Adds Zero-Width Space (U+200B) after each space to hint word boundaries
const addWordBreakHints = (text: string): string => {
  return text.replace(/ /g, ' \u200B');
};

// Calculate totals from gold items
const calculateTotals = (items: GoldItem[]) => {
  return items.reduce(
    (acc, item) => ({
      grossWeight: acc.grossWeight + item.gross_weight_grams,
      netWeight: acc.netWeight + item.net_weight_grams,
      value: acc.value + item.appraised_value,
      count: acc.count + 1,
    }),
    { grossWeight: 0, netWeight: 0, value: 0, count: 0 }
  );
};

export function SaleAgreementPDF({
  loan,
  customer,
  goldItems,
  companyName,
  companyAddress,
  gstin,
  branchName,
  language = 'bilingual',
  paperSize = 'A4',
}: SaleAgreementPDFProps) {
  const content = useSaleAgreementContent();
  const totals = calculateTotals(goldItems);
  const displayPrincipal = loan.shown_principal || loan.principal_amount;
  
  const customerAddress = [customer.address, customer.city, customer.state]
    .filter(Boolean)
    .join(', ');

  return (
    <Document>
      {/* Page 1: Cover / Stamp Paper Page */}
      <Page size={paperSize as any} style={styles.page}>
        {/* Blank area for stamp paper - no text, just reserved space */}
        <View style={styles.stampAreaBlank} />

        {/* Title */}
        <Text style={styles.mainTitle}>GOLD BUY BACK AGREEMENT</Text>
        <Text style={styles.mainTitleTamil}>தங்க திரும்ப கொள்முதல் ஒப்பந்தம்</Text>

        {/* Parties Section */}
        <View style={styles.partiesSection}>
          {/* Seller (Customer) */}
          <View style={styles.partyTitleContainer}>
            <Text style={styles.partyTitle}>1. THE SELLER </Text>
            <Text style={styles.partyTitleTamil}>(விற்பவர்)</Text>
          </View>
          <View style={styles.partyDetails}>
            <View style={styles.partyRow}>
              <Text style={styles.partyLabel}>Name:</Text>
              <Text style={styles.partyValue}>{customer.full_name}</Text>
            </View>
            <View style={styles.partyRow}>
              <Text style={styles.partyLabel}>Address:</Text>
              <Text style={styles.partyValue}>{customerAddress || 'N/A'}</Text>
            </View>
            <View style={styles.partyRow}>
              <Text style={styles.partyLabel}>Mobile:</Text>
              <Text style={styles.partyValue}>{customer.phone}</Text>
            </View>
          </View>

          {/* Buyer (Company) */}
          <View style={styles.partyTitleContainer}>
            <Text style={styles.partyTitle}>2. THE BUYER </Text>
            <Text style={styles.partyTitleTamil}>(வாங்குபவர்)</Text>
          </View>
          <View style={styles.partyDetails}>
            <View style={styles.partyRow}>
              <Text style={styles.partyLabel}>Name:</Text>
              <Text style={styles.partyValue}>M/s. {companyName}</Text>
            </View>
            {companyAddress && (
              <View style={styles.partyRow}>
                <Text style={styles.partyLabel}>Address:</Text>
                <Text style={styles.partyValue}>{companyAddress}</Text>
              </View>
            )}
            {gstin && (
              <View style={styles.partyRow}>
                <Text style={styles.partyLabel}>GSTIN:</Text>
                <Text style={styles.partyValue}>{gstin}</Text>
              </View>
            )}
            {branchName && (
              <View style={styles.partyRow}>
                <Text style={styles.partyLabel}>Branch:</Text>
                <Text style={styles.partyValue}>{branchName}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Summary Table */}
        <View style={styles.summaryTable}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Agreement Number</Text>
            <Text style={styles.summaryValue}>{loan.loan_number}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Date</Text>
            <Text style={styles.summaryValue}>{formatDate(loan.loan_date)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Amount (Purchase Price)</Text>
            <Text style={styles.summaryValue}>{formatCurrencyPrint(displayPrincipal)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Gross Weight</Text>
            <Text style={styles.summaryValue}>{formatWeightPrint(totals.grossWeight)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Net Weight</Text>
            <Text style={styles.summaryValue}>{formatWeightPrint(totals.netWeight)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Value of Ornaments</Text>
            <Text style={styles.summaryValue}>{formatCurrencyPrint(totals.value)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Tenure</Text>
            <Text style={styles.summaryValue}>{loan.tenure_days} Days</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Due Date</Text>
            <Text style={styles.summaryValue}>{formatDate(loan.maturity_date)}</Text>
          </View>
          <View style={styles.summaryRowLast}>
            <Text style={styles.summaryLabel}>Mobile Number</Text>
            <Text style={styles.summaryValue}>{customer.phone}</Text>
          </View>
        </View>

        {/* Signatures */}
        <View style={styles.signatureSection}>
          <View style={styles.signatureBlock}>
            <Text style={styles.signatureLabel}>For {companyName}</Text>
            <View style={styles.signatureLine} />
          </View>
          <View style={styles.signatureBlock}>
            <Text style={styles.signatureLabel}>Customer Signature:</Text>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureSublabel}>Name: {customer.full_name}</Text>
          </View>
        </View>

        <Text style={styles.pageFooter}>Page 1 of 3</Text>
      </Page>

      {/* Page 2: Agreement Terms */}
      <Page size={paperSize as any} style={styles.page}>
        <Text style={styles.pageTitle}>GOLD BUY BACK AGREEMENT</Text>
        <Text style={styles.pageTitleTamil}>தங்க திரும்ப கொள்முதல் ஒப்பந்தம்</Text>

        {/* Customer Info Row */}
        <View style={{ flexDirection: 'row', marginBottom: 10, fontSize: 8 }}>
          <Text>NAME OF THE CUSTOMER: <Text style={{ fontWeight: 'bold' }}>{customer.full_name}</Text></Text>
        </View>

        {/* Ornaments Details Table */}
        <Text style={styles.ornamentsTitle}>ORNAMENTS DETAILS:</Text>
        <View style={styles.ornamentsTable}>
          <View style={styles.ornamentsHeader}>
            <Text style={[styles.ornamentCell, styles.ornamentCellHeader, { width: '6%' }]}>#</Text>
            <Text style={[styles.ornamentCell, styles.ornamentCellHeader, { width: '34%' }]}>Item</Text>
            <Text style={[styles.ornamentCell, styles.ornamentCellHeader, { width: '15%' }]}>Gross (g)</Text>
            <Text style={[styles.ornamentCell, styles.ornamentCellHeader, { width: '15%' }]}>Net (g)</Text>
            <Text style={[styles.ornamentCell, styles.ornamentCellHeader, { width: '12%' }]}>Purity</Text>
            <Text style={[styles.ornamentCellLast, styles.ornamentCellHeader, { width: '18%' }]}>Value</Text>
          </View>
          {goldItems.map((item, index) => (
            <View key={item.id || index} style={index === goldItems.length - 1 ? styles.ornamentsRowLast : styles.ornamentsRow}>
              <Text style={[styles.ornamentCell, { width: '6%' }]}>{index + 1}</Text>
              <Text style={[styles.ornamentCell, { width: '34%' }]}>{item.item_type}</Text>
              <Text style={[styles.ornamentCell, { width: '15%' }]}>{item.gross_weight_grams.toFixed(3)}</Text>
              <Text style={[styles.ornamentCell, { width: '15%' }]}>{item.net_weight_grams.toFixed(3)}</Text>
              <Text style={[styles.ornamentCell, { width: '12%' }]}>{item.purity}</Text>
              <Text style={[styles.ornamentCellLast, { width: '18%' }]}>{formatCurrencyPrint(item.appraised_value)}</Text>
            </View>
          ))}
          {/* Totals Row */}
          <View style={[styles.ornamentsRow, { backgroundColor: '#f0f0f0' }]}>
            <Text style={[styles.ornamentCell, { width: '6%', fontWeight: 'bold' }]}></Text>
            <Text style={[styles.ornamentCell, { width: '34%', fontWeight: 'bold' }]}>TOTAL</Text>
            <Text style={[styles.ornamentCell, { width: '15%', fontWeight: 'bold' }]}>{totals.grossWeight.toFixed(3)}</Text>
            <Text style={[styles.ornamentCell, { width: '15%', fontWeight: 'bold' }]}>{totals.netWeight.toFixed(3)}</Text>
            <Text style={[styles.ornamentCell, { width: '12%' }]}></Text>
            <Text style={[styles.ornamentCellLast, { width: '18%', fontWeight: 'bold' }]}>{formatCurrencyPrint(totals.value)}</Text>
          </View>
        </View>

        {/* Terms & Conditions - 13 Clauses */}
        <View style={styles.clausesSection}>
          <View style={styles.clausesTitleContainer}>
            <Text style={styles.clausesTitle}>TERMS & CONDITIONS</Text>
            <Text style={styles.clausesTitleTamil}>விதிமுறைகள்:</Text>
          </View>
          {content.clauses.map((clause) => (
            <View key={clause.number} style={styles.clauseItem}>
              <View style={styles.clauseRow}>
                <Text style={styles.clauseNumber}>{clause.number}.</Text>
                <Text style={styles.clauseText}>{addWordBreakHints(clause.tamil)}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Signatures for Page 2 */}
        <View style={styles.signatureSection}>
          <View style={styles.signatureBlock}>
            <Text style={styles.signatureLabel}>For {companyName}</Text>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureSublabel}>Authorised Signatory</Text>
          </View>
          <View style={styles.signatureBlock}>
            <Text style={styles.signatureLabel}>Customer Signature:</Text>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureSublabel}>Name: {customer.full_name}</Text>
          </View>
        </View>

        <Text style={styles.pageFooter}>Page 2 of 3</Text>
      </Page>

      {/* Page 3: Customer Selling Declaration */}
      <Page size={paperSize as any} style={styles.page}>
        <Text style={styles.declarationTitle}>CUSTOMER SELLING DECLARATION</Text>
        <Text style={styles.declarationTitleTamil}>வாடிக்கையாளர் விற்பனை அறிவிப்பு</Text>

        {/* Customer Details Table */}
        <View style={styles.customerDetailsTable}>
          <View style={styles.customerRow}>
            <Text style={styles.customerLabel}>NAME OF THE CUSTOMER</Text>
            <Text style={styles.customerValue}>{customer.full_name}</Text>
          </View>
          <View style={styles.customerRow}>
            <Text style={styles.customerLabel}>FATHER NAME</Text>
            <Text style={styles.customerValue}>{customer.father_name || '-'}</Text>
          </View>
          <View style={styles.customerRow}>
            <Text style={styles.customerLabel}>DATE OF BIRTH</Text>
            <Text style={styles.customerValue}>{customer.date_of_birth ? formatDate(customer.date_of_birth) : '-'}</Text>
          </View>
          <View style={styles.customerRow}>
            <Text style={styles.customerLabel}>SEX</Text>
            <Text style={styles.customerValue}>{customer.gender || '-'}</Text>
          </View>
          <View style={styles.customerRow}>
            <Text style={styles.customerLabel}>SCRAP JEWELS DETAILS</Text>
            <Text style={styles.customerValue}>{goldItems.map(i => i.item_type).join(', ')}</Text>
          </View>
          <View style={styles.customerRow}>
            <Text style={styles.customerLabel}>SCRAP GOLD WEIGHT</Text>
            <Text style={styles.customerValue}>{formatWeightPrint(totals.netWeight)}</Text>
          </View>
          <View style={styles.customerRow}>
            <Text style={styles.customerLabel}>STONE/DUST WEIGHT</Text>
            <Text style={styles.customerValue}>{formatWeightPrint(totals.grossWeight - totals.netWeight)}</Text>
          </View>
          <View style={styles.customerRow}>
            <Text style={styles.customerLabel}>ID PROOF</Text>
            <Text style={styles.customerValue}>Aadhaar / PAN</Text>
          </View>
          <View style={[styles.customerRow, { borderBottomWidth: 0 }]}>
            <Text style={styles.customerLabel}>ADDRESS PROOF</Text>
            <Text style={styles.customerValue}>Aadhaar</Text>
          </View>
        </View>

        {/* Declaration Text */}
        <Text style={styles.declarationText}>{addWordBreakHints(content.declarationText)}</Text>

        {/* Warning Box */}
        <View style={styles.warningBox}>
          <View style={styles.warningTitleContainer}>
            <Text style={styles.warningTitle}>⚠️ WARNING</Text>
            <Text style={styles.warningTitleTamil}>எச்சரிக்கை:</Text>
          </View>
          <Text style={styles.warningText}>{addWordBreakHints(content.warningText)}</Text>
        </View>

        {/* Signatures */}
        <View style={styles.signatureSection}>
          <View style={styles.signatureBlock}>
            <Text style={styles.signatureLabel}>For {companyName}</Text>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureSublabel}>Authorised Signatory</Text>
          </View>
          <View style={styles.signatureBlock}>
            <Text style={styles.signatureLabel}>Customer Signature:</Text>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureSublabel}>Name: {customer.full_name}</Text>
          </View>
        </View>

        <Text style={styles.pageFooter}>Page 3 of 3</Text>
      </Page>
    </Document>
  );
}
