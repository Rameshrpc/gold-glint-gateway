import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { formatDatePrint, formatIndianCurrencyPrint, formatWeight } from '@/lib/print-utils';
import '@/lib/pdf-fonts';

interface GoldDeclarationPDFProps {
  data: {
    loan_number?: string;
    loan_date?: string;
    principal_amount?: number;
    customer?: {
      full_name: string;
      customer_code: string;
      phone: string;
      address?: string;
    };
    gold_items?: Array<{
      item_type: string;
      description?: string;
      gross_weight_grams: number;
      net_weight_grams: number;
      purity: string;
      purity_percentage: number;
      appraised_value: number;
    }>;
    client?: {
      company_name: string;
      address?: string;
    };
    branch?: {
      branch_name: string;
    };
  };
  config?: any;
}

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: 'Roboto',
    fontSize: 10,
  },
  header: {
    textAlign: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#B45309',
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
    backgroundColor: '#f5f5f5',
    padding: 5,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  label: {
    width: '30%',
    fontSize: 9,
    color: '#666',
  },
  value: {
    width: '70%',
    fontSize: 9,
  },
  table: {
    marginTop: 10,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#B45309',
    padding: 5,
  },
  tableHeaderCell: {
    color: 'white',
    fontSize: 8,
    fontWeight: 'bold',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    padding: 5,
  },
  tableCell: {
    fontSize: 8,
  },
  declarationBox: {
    marginTop: 20,
    padding: 15,
    borderWidth: 2,
    borderColor: '#B45309',
    backgroundColor: '#fffbeb',
  },
  declarationTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    color: '#B45309',
  },
  declarationText: {
    fontSize: 9,
    lineHeight: 1.6,
    marginBottom: 8,
    textAlign: 'justify',
  },
  declarationItem: {
    fontSize: 9,
    lineHeight: 1.6,
    marginBottom: 4,
    marginLeft: 10,
  },
  signatureSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 40,
    paddingTop: 20,
  },
  signatureBox: {
    width: '30%',
    textAlign: 'center',
  },
  signatureLine: {
    borderTopWidth: 1,
    borderTopColor: '#000',
    paddingTop: 5,
    fontSize: 9,
  },
  totalRow: {
    flexDirection: 'row',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 2,
    borderTopColor: '#B45309',
  },
});

export default function GoldDeclarationPDF({ data, config }: GoldDeclarationPDFProps) {
  const goldItems = data.gold_items || [];
  const totalGrossWeight = goldItems.reduce((sum, item) => sum + (item.gross_weight_grams || 0), 0);
  const totalNetWeight = goldItems.reduce((sum, item) => sum + (item.net_weight_grams || 0), 0);
  const totalValue = goldItems.reduce((sum, item) => sum + (item.appraised_value || 0), 0);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{data.client?.company_name || 'Gold Loan Company'}</Text>
          <Text style={styles.subtitle}>GOLD OWNERSHIP DECLARATION</Text>
          {data.branch && <Text style={{ fontSize: 9, color: '#666' }}>Branch: {data.branch.branch_name}</Text>}
        </View>

        {/* Loan & Customer Details */}
        <View style={styles.section}>
          <View style={styles.row}>
            <Text style={styles.label}>Loan Number:</Text>
            <Text style={styles.value}>{data.loan_number || '-'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Date:</Text>
            <Text style={styles.value}>{data.loan_date ? formatDatePrint(data.loan_date) : '-'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Customer Name:</Text>
            <Text style={styles.value}>{data.customer?.full_name || '-'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Customer Code:</Text>
            <Text style={styles.value}>{data.customer?.customer_code || '-'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Address:</Text>
            <Text style={styles.value}>{data.customer?.address || '-'}</Text>
          </View>
        </View>

        {/* Gold Items Table */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Gold Items Pledged</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderCell, { width: '5%' }]}>#</Text>
              <Text style={[styles.tableHeaderCell, { width: '25%' }]}>Item</Text>
              <Text style={[styles.tableHeaderCell, { width: '15%', textAlign: 'right' }]}>Gross Wt</Text>
              <Text style={[styles.tableHeaderCell, { width: '15%', textAlign: 'right' }]}>Net Wt</Text>
              <Text style={[styles.tableHeaderCell, { width: '15%', textAlign: 'center' }]}>Purity</Text>
              <Text style={[styles.tableHeaderCell, { width: '25%', textAlign: 'right' }]}>Value</Text>
            </View>
            {goldItems.map((item, index) => (
              <View key={index} style={styles.tableRow}>
                <Text style={[styles.tableCell, { width: '5%' }]}>{index + 1}</Text>
                <Text style={[styles.tableCell, { width: '25%' }]}>{item.item_type}</Text>
                <Text style={[styles.tableCell, { width: '15%', textAlign: 'right' }]}>{formatWeight(item.gross_weight_grams)}</Text>
                <Text style={[styles.tableCell, { width: '15%', textAlign: 'right' }]}>{formatWeight(item.net_weight_grams)}</Text>
                <Text style={[styles.tableCell, { width: '15%', textAlign: 'center' }]}>{item.purity}</Text>
                <Text style={[styles.tableCell, { width: '25%', textAlign: 'right' }]}>{formatIndianCurrencyPrint(item.appraised_value)}</Text>
              </View>
            ))}
            <View style={styles.totalRow}>
              <Text style={[styles.tableCell, { width: '30%', fontWeight: 'bold' }]}>TOTAL</Text>
              <Text style={[styles.tableCell, { width: '15%', textAlign: 'right', fontWeight: 'bold' }]}>{formatWeight(totalGrossWeight)}</Text>
              <Text style={[styles.tableCell, { width: '15%', textAlign: 'right', fontWeight: 'bold' }]}>{formatWeight(totalNetWeight)}</Text>
              <Text style={[styles.tableCell, { width: '15%' }]}></Text>
              <Text style={[styles.tableCell, { width: '25%', textAlign: 'right', fontWeight: 'bold' }]}>{formatIndianCurrencyPrint(totalValue)}</Text>
            </View>
          </View>
        </View>

        {/* Declaration */}
        <View style={styles.declarationBox}>
          <Text style={styles.declarationTitle}>DECLARATION OF OWNERSHIP</Text>
          <Text style={styles.declarationText}>
            I, {data.customer?.full_name || '_______________'}, hereby declare and affirm that:
          </Text>
          <Text style={styles.declarationItem}>
            1. I am the sole and absolute owner of the gold ornaments/items described above.
          </Text>
          <Text style={styles.declarationItem}>
            2. The gold items are free from any encumbrance, lien, or charge.
          </Text>
          <Text style={styles.declarationItem}>
            3. The gold items have not been stolen or illegally acquired.
          </Text>
          <Text style={styles.declarationItem}>
            4. I have the full authority to pledge these items as security for the loan.
          </Text>
          <Text style={styles.declarationItem}>
            5. I understand that if any of the above statements are found to be false, I shall be liable for legal action.
          </Text>
          <Text style={[styles.declarationText, { marginTop: 10 }]}>
            I authorize {data.client?.company_name || 'the company'} to retain possession of the gold items until the loan 
            is fully repaid along with all applicable interest and charges.
          </Text>
        </View>

        {/* Signature Section */}
        <View style={styles.signatureSection}>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureLine}>Customer Signature</Text>
          </View>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureLine}>Witness Signature</Text>
          </View>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureLine}>Authorized Signatory</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}
