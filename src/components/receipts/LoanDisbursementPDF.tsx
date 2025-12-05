import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';
import { format } from 'date-fns';

Font.register({
  family: 'Roboto',
  fonts: [
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular-webfont.ttf', fontWeight: 400 },
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-bold-webfont.ttf', fontWeight: 700 },
  ],
});

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: 'Roboto',
    fontSize: 10,
  },
  header: {
    textAlign: 'center',
    marginBottom: 15,
    borderBottom: '2 solid #333',
    paddingBottom: 10,
  },
  companyName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#B45309',
  },
  companyDetails: {
    fontSize: 8,
    color: '#666',
    marginBottom: 2,
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 10,
    backgroundColor: '#DBEAFE',
    padding: 8,
    color: '#1E40AF',
  },
  loanInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
    borderBottom: '1 solid #ddd',
    paddingBottom: 8,
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 8,
    backgroundColor: '#F3F4F6',
    padding: 5,
    color: '#374151',
  },
  row: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  label: {
    width: '40%',
    color: '#666',
  },
  value: {
    width: '60%',
    fontWeight: 'bold',
  },
  goldTable: {
    marginTop: 5,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#FEF3C7',
    padding: 6,
    fontWeight: 'bold',
    borderBottom: '1 solid #F59E0B',
  },
  tableRow: {
    flexDirection: 'row',
    padding: 5,
    borderBottom: '1 solid #eee',
  },
  col1: { width: '25%' },
  col2: { width: '20%', textAlign: 'right' },
  col3: { width: '15%', textAlign: 'center' },
  col4: { width: '20%', textAlign: 'right' },
  col5: { width: '20%', textAlign: 'right' },
  totalRow: {
    flexDirection: 'row',
    padding: 6,
    backgroundColor: '#F9FAFB',
    fontWeight: 'bold',
  },
  calculationBox: {
    backgroundColor: '#F0FDF4',
    border: '1 solid #86EFAC',
    padding: 10,
    marginTop: 10,
  },
  calcRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  calcLabel: {
    color: '#374151',
  },
  calcValue: {
    fontWeight: 'bold',
  },
  netDisbursed: {
    backgroundColor: '#DCFCE7',
    padding: 8,
    marginTop: 5,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  netDisbursedLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#166534',
  },
  netDisbursedValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#166534',
  },
  rebateSection: {
    marginTop: 15,
    backgroundColor: '#FEF9C3',
    border: '1 solid #FCD34D',
    padding: 10,
  },
  rebateTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#92400E',
  },
  rebateTable: {
    marginTop: 5,
  },
  rebateHeader: {
    flexDirection: 'row',
    backgroundColor: '#FDE68A',
    padding: 5,
    fontWeight: 'bold',
  },
  rebateRow: {
    flexDirection: 'row',
    padding: 4,
    borderBottom: '1 solid #FDE68A',
  },
  rebateCol1: { width: '60%' },
  rebateCol2: { width: '40%', textAlign: 'right' },
  signatureSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 40,
  },
  signatureBox: {
    width: '30%',
    borderTop: '1 dashed #333',
    paddingTop: 5,
    textAlign: 'center',
    fontSize: 9,
  },
  declaration: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#FEF3C7',
    fontSize: 8,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: 'center',
    fontSize: 7,
    color: '#666',
  },
});

interface GoldItem {
  item_type: string;
  gross_weight_grams: number;
  net_weight_grams: number;
  purity: string;
  appraised_value: number;
}

interface RebateSlot {
  dayRange: string;
  rebateAmount: number;
}

interface LoanDisbursementPDFProps {
  company: {
    name: string;
    address?: string;
    phone?: string;
    email?: string;
  };
  loan: {
    number: string;
    date: string;
    maturityDate: string;
    tenureDays: number;
  };
  customer: {
    name: string;
    code: string;
    phone: string;
  };
  scheme: {
    name: string;
    rate: number;
    ltvPercentage: number;
  };
  goldItems: GoldItem[];
  calculation: {
    totalAppraisedValue: number;
    principalAmount: number;
    advanceInterest: number;
    processingFee: number;
    netDisbursed: number;
  };
  rebateSchedule?: {
    slots: RebateSlot[];
  };
}

export function LoanDisbursementPDF({ company, loan, customer, scheme, goldItems, calculation, rebateSchedule }: LoanDisbursementPDFProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const totalWeight = goldItems.reduce((sum, item) => sum + item.gross_weight_grams, 0);
  const totalNetWeight = goldItems.reduce((sum, item) => sum + item.net_weight_grams, 0);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.companyName}>{company.name}</Text>
          {company.address && <Text style={styles.companyDetails}>{company.address}</Text>}
          {company.phone && <Text style={styles.companyDetails}>Phone: {company.phone}</Text>}
          {company.email && <Text style={styles.companyDetails}>Email: {company.email}</Text>}
        </View>

        {/* Title */}
        <Text style={styles.title}>GOLD LOAN DISBURSEMENT VOUCHER</Text>

        {/* Loan Info */}
        <View style={styles.loanInfo}>
          <View>
            <Text>Loan No: {loan.number}</Text>
            <Text>Date: {format(new Date(loan.date), 'dd MMM yyyy')}</Text>
          </View>
          <View>
            <Text>Maturity: {format(new Date(loan.maturityDate), 'dd MMM yyyy')}</Text>
            <Text>Tenure: {loan.tenureDays} days</Text>
          </View>
        </View>

        {/* Customer Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>CUSTOMER DETAILS</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Name:</Text>
            <Text style={styles.value}>{customer.name}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Customer Code:</Text>
            <Text style={styles.value}>{customer.code}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Phone:</Text>
            <Text style={styles.value}>{customer.phone}</Text>
          </View>
        </View>

        {/* Scheme Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>SCHEME DETAILS</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Scheme:</Text>
            <Text style={styles.value}>{scheme.name}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Interest Rate:</Text>
            <Text style={styles.value}>{scheme.rate}% p.a.</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>LTV:</Text>
            <Text style={styles.value}>{scheme.ltvPercentage}%</Text>
          </View>
        </View>

        {/* Gold Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>GOLD ORNAMENTS PLEDGED</Text>
          <View style={styles.goldTable}>
            <View style={styles.tableHeader}>
              <Text style={styles.col1}>Item Type</Text>
              <Text style={styles.col2}>Gross Wt (g)</Text>
              <Text style={styles.col3}>Purity</Text>
              <Text style={styles.col4}>Net Wt (g)</Text>
              <Text style={styles.col5}>Value</Text>
            </View>
            {goldItems.map((item, index) => (
              <View key={index} style={styles.tableRow}>
                <Text style={styles.col1}>{item.item_type.charAt(0).toUpperCase() + item.item_type.slice(1)}</Text>
                <Text style={styles.col2}>{item.gross_weight_grams.toFixed(2)}</Text>
                <Text style={styles.col3}>{item.purity.toUpperCase()}</Text>
                <Text style={styles.col4}>{item.net_weight_grams.toFixed(2)}</Text>
                <Text style={styles.col5}>{formatCurrency(item.appraised_value)}</Text>
              </View>
            ))}
            <View style={styles.totalRow}>
              <Text style={styles.col1}>TOTAL</Text>
              <Text style={styles.col2}>{totalWeight.toFixed(2)}</Text>
              <Text style={styles.col3}>-</Text>
              <Text style={styles.col4}>{totalNetWeight.toFixed(2)}</Text>
              <Text style={styles.col5}>{formatCurrency(calculation.totalAppraisedValue)}</Text>
            </View>
          </View>
        </View>

        {/* Calculation */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>DISBURSEMENT CALCULATION</Text>
          <View style={styles.calculationBox}>
            <View style={styles.calcRow}>
              <Text style={styles.calcLabel}>Total Appraised Value</Text>
              <Text style={styles.calcValue}>{formatCurrency(calculation.totalAppraisedValue)}</Text>
            </View>
            <View style={styles.calcRow}>
              <Text style={styles.calcLabel}>Loan Amount (@ {scheme.ltvPercentage}% LTV)</Text>
              <Text style={styles.calcValue}>{formatCurrency(calculation.principalAmount)}</Text>
            </View>
            <View style={styles.calcRow}>
              <Text style={styles.calcLabel}>Less: Advance Interest (3 months @ {scheme.rate}%)</Text>
              <Text style={styles.calcValue}>- {formatCurrency(calculation.advanceInterest)}</Text>
            </View>
            {calculation.processingFee > 0 && (
              <View style={styles.calcRow}>
                <Text style={styles.calcLabel}>Less: Processing Fee</Text>
                <Text style={styles.calcValue}>- {formatCurrency(calculation.processingFee)}</Text>
              </View>
            )}
            <View style={styles.netDisbursed}>
              <Text style={styles.netDisbursedLabel}>NET CASH DISBURSED</Text>
              <Text style={styles.netDisbursedValue}>{formatCurrency(calculation.netDisbursed)}</Text>
            </View>
          </View>
        </View>

        {/* Early Release Rebate Schedule */}
        {rebateSchedule && rebateSchedule.slots.length > 0 && (
          <View style={styles.rebateSection}>
            <Text style={styles.rebateTitle}>EARLY RELEASE BENEFIT SCHEDULE</Text>
            <View style={styles.rebateTable}>
              <View style={styles.rebateHeader}>
                <Text style={styles.rebateCol1}>Release Period</Text>
                <Text style={styles.rebateCol2}>Rebate Amount</Text>
              </View>
              {rebateSchedule.slots.map((slot, index) => (
                <View key={index} style={styles.rebateRow}>
                  <Text style={styles.rebateCol1}>Within {slot.dayRange}</Text>
                  <Text style={styles.rebateCol2}>{formatCurrency(slot.rebateAmount)}</Text>
                </View>
              ))}
              <View style={styles.rebateRow}>
                <Text style={styles.rebateCol1}>After 75 days</Text>
                <Text style={styles.rebateCol2}>No rebate</Text>
              </View>
            </View>
          </View>
        )}

        {/* Declaration */}
        <View style={styles.declaration}>
          <Text>
            I, {customer.name}, hereby confirm that I have received the gold loan as per the above details. 
            I have pledged the gold ornaments mentioned above and agree to repay the loan as per the terms and conditions.
            I understand the early release benefit schedule mentioned above.
          </Text>
        </View>

        {/* Signatures */}
        <View style={styles.signatureSection}>
          <View style={styles.signatureBox}>
            <Text>Customer Signature</Text>
          </View>
          <View style={styles.signatureBox}>
            <Text>Appraiser Signature</Text>
          </View>
          <View style={styles.signatureBox}>
            <Text>Authorized Signature</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>This is a computer generated document. Subject to Terms & Conditions.</Text>
        </View>
      </Page>
    </Document>
  );
}
