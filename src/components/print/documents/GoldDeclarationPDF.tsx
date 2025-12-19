import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import { formatDatePrint, formatIndianCurrencyPrint, formatWeight } from '@/lib/print-utils';
import { translations } from '@/lib/translations';
import '@/lib/pdf-fonts';

type LanguageMode = 'bilingual' | 'english' | 'tamil';

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
      logo_url?: string;
    };
    branch?: {
      branch_name: string;
    };
  };
  config?: {
    language?: LanguageMode;
  };
}

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: 'Roboto',
    fontSize: 9,
  },
  header: {
    flexDirection: 'row',
    marginBottom: 15,
    borderBottomWidth: 2,
    borderBottomColor: '#B45309',
    paddingBottom: 10,
  },
  logoContainer: {
    width: 50,
    marginRight: 10,
  },
  logo: {
    width: 45,
    height: 45,
    objectFit: 'contain',
  },
  headerContent: {
    flex: 1,
    textAlign: 'center',
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 3,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#B45309',
  },
  subtitleTamil: {
    fontSize: 10,
    fontFamily: 'Noto Sans Tamil',
    color: '#B45309',
    marginTop: 2,
  },
  branchText: {
    fontSize: 8,
    color: '#666',
    marginTop: 3,
  },
  section: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 6,
    color: '#333',
    backgroundColor: '#f5f5f5',
    padding: 5,
  },
  sectionTitleTamil: {
    fontSize: 8,
    fontFamily: 'Noto Sans Tamil',
    color: '#666',
  },
  row: {
    flexDirection: 'row',
    marginBottom: 4,
    alignItems: 'flex-start',
  },
  label: {
    width: '30%',
    fontSize: 8,
    color: '#666',
  },
  labelTamil: {
    fontSize: 7,
    fontFamily: 'Noto Sans Tamil',
    color: '#888',
  },
  value: {
    width: '70%',
    fontSize: 9,
  },
  table: {
    marginTop: 8,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#B45309',
    padding: 5,
  },
  tableHeaderCell: {
    color: 'white',
    fontSize: 7,
    fontWeight: 'bold',
  },
  tableHeaderCellTamil: {
    color: 'white',
    fontSize: 6,
    fontFamily: 'Noto Sans Tamil',
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: '#e5e7eb',
    padding: 5,
  },
  tableCell: {
    fontSize: 8,
  },
  totalRow: {
    flexDirection: 'row',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 2,
    borderTopColor: '#B45309',
  },
  declarationBox: {
    marginTop: 15,
    padding: 12,
    borderWidth: 2,
    borderColor: '#B45309',
    backgroundColor: '#fffbeb',
    borderRadius: 3,
  },
  declarationTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    color: '#B45309',
  },
  declarationTitleTamil: {
    fontSize: 9,
    fontFamily: 'Noto Sans Tamil',
    textAlign: 'center',
    color: '#B45309',
    marginTop: 2,
  },
  declarationText: {
    fontSize: 9,
    lineHeight: 1.5,
    marginBottom: 6,
    textAlign: 'justify',
  },
  declarationTamil: {
    fontSize: 8,
    fontFamily: 'Noto Sans Tamil',
    lineHeight: 1.4,
    color: '#555',
    marginTop: 4,
    marginBottom: 6,
  },
  declarationItem: {
    fontSize: 9,
    lineHeight: 1.5,
    marginBottom: 3,
    marginLeft: 10,
  },
  declarationItemTamil: {
    fontSize: 8,
    fontFamily: 'Noto Sans Tamil',
    lineHeight: 1.4,
    color: '#555',
    marginLeft: 15,
    marginBottom: 4,
  },
  signatureSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 30,
    paddingTop: 15,
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
  signatureTamil: {
    fontSize: 7,
    fontFamily: 'Noto Sans Tamil',
    color: '#666',
  },
});

// Bilingual label component
function BiLabel({ en, ta, mode, style }: { en: string; ta: string; mode: LanguageMode; style?: any }) {
  if (mode === 'english') return <Text style={style}>{en}</Text>;
  if (mode === 'tamil') return <Text style={[style, { fontFamily: 'Noto Sans Tamil' }]}>{ta}</Text>;
  return (
    <View>
      <Text style={style}>{en}</Text>
      <Text style={styles.labelTamil}>{ta}</Text>
    </View>
  );
}

export default function GoldDeclarationPDF({ data, config }: GoldDeclarationPDFProps) {
  const mode = config?.language || 'bilingual';
  const goldItems = data.gold_items || [];
  const totalGrossWeight = goldItems.reduce((sum, item) => sum + (item.gross_weight_grams || 0), 0);
  const totalNetWeight = goldItems.reduce((sum, item) => sum + (item.net_weight_grams || 0), 0);
  const totalValue = goldItems.reduce((sum, item) => sum + (item.appraised_value || 0), 0);
  const t = translations;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          {data.client?.logo_url && (
            <View style={styles.logoContainer}>
              <Image src={data.client.logo_url} style={styles.logo} />
            </View>
          )}
          <View style={styles.headerContent}>
            <Text style={styles.title}>{data.client?.company_name || 'Gold Loan Company'}</Text>
            <Text style={styles.subtitle}>{t.declarationOfGold.en.toUpperCase()}</Text>
            {mode !== 'english' && <Text style={styles.subtitleTamil}>{t.declarationOfGold.ta}</Text>}
            {data.branch && <Text style={styles.branchText}>{t.branchName.en}: {data.branch.branch_name}</Text>}
          </View>
        </View>

        {/* Loan & Customer Details */}
        <View style={styles.section}>
          <View style={{ flexDirection: 'row' }}>
            <View style={{ width: '50%' }}>
              <View style={styles.row}>
                <View style={styles.label}>
                  <BiLabel en={t.loanNumber.en} ta={t.loanNumber.ta} mode={mode} style={{ fontSize: 8, color: '#666' }} />
                </View>
                <Text style={[styles.value, { fontWeight: 'bold' }]}>{data.loan_number || '-'}</Text>
              </View>
              <View style={styles.row}>
                <View style={styles.label}>
                  <BiLabel en={t.date.en} ta={t.date.ta} mode={mode} style={{ fontSize: 8, color: '#666' }} />
                </View>
                <Text style={styles.value}>{data.loan_date ? formatDatePrint(data.loan_date) : '-'}</Text>
              </View>
            </View>
            <View style={{ width: '50%' }}>
              <View style={styles.row}>
                <View style={styles.label}>
                  <BiLabel en={t.customerName.en} ta={t.customerName.ta} mode={mode} style={{ fontSize: 8, color: '#666' }} />
                </View>
                <Text style={[styles.value, { fontWeight: 'bold' }]}>{data.customer?.full_name || '-'}</Text>
              </View>
              <View style={styles.row}>
                <View style={styles.label}>
                  <BiLabel en={t.customerId.en} ta={t.customerId.ta} mode={mode} style={{ fontSize: 8, color: '#666' }} />
                </View>
                <Text style={styles.value}>{data.customer?.customer_code || '-'}</Text>
              </View>
            </View>
          </View>
          {data.customer?.address && (
            <View style={styles.row}>
              <View style={styles.label}>
                <BiLabel en={t.address.en} ta={t.address.ta} mode={mode} style={{ fontSize: 8, color: '#666' }} />
              </View>
              <Text style={[styles.value, { fontSize: 8 }]}>{data.customer.address}</Text>
            </View>
          )}
        </View>

        {/* Gold Items Table */}
        <View style={styles.section}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Text style={[styles.sectionTitle, { flex: 1, marginBottom: 0 }]}>{t.detailsOfPledgedGold.en}</Text>
            {mode !== 'english' && <Text style={[styles.sectionTitleTamil, { marginLeft: 8 }]}>{t.detailsOfPledgedGold.ta}</Text>}
          </View>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <View style={{ width: '5%' }}>
                <Text style={styles.tableHeaderCell}>#</Text>
              </View>
              <View style={{ width: '25%' }}>
                <Text style={styles.tableHeaderCell}>{t.itemType.en}</Text>
                {mode !== 'english' && <Text style={styles.tableHeaderCellTamil}>{t.itemType.ta}</Text>}
              </View>
              <View style={{ width: '15%', alignItems: 'flex-end' }}>
                <Text style={styles.tableHeaderCell}>{t.grossWeight.en}</Text>
                {mode !== 'english' && <Text style={styles.tableHeaderCellTamil}>{t.grossWeight.ta}</Text>}
              </View>
              <View style={{ width: '15%', alignItems: 'flex-end' }}>
                <Text style={styles.tableHeaderCell}>{t.netWeight.en}</Text>
                {mode !== 'english' && <Text style={styles.tableHeaderCellTamil}>{t.netWeight.ta}</Text>}
              </View>
              <View style={{ width: '15%', alignItems: 'center' }}>
                <Text style={styles.tableHeaderCell}>{t.purity.en}</Text>
                {mode !== 'english' && <Text style={styles.tableHeaderCellTamil}>{t.purity.ta}</Text>}
              </View>
              <View style={{ width: '25%', alignItems: 'flex-end' }}>
                <Text style={styles.tableHeaderCell}>{t.appraisedValue.en}</Text>
                {mode !== 'english' && <Text style={styles.tableHeaderCellTamil}>{t.appraisedValue.ta}</Text>}
              </View>
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
              <Text style={[styles.tableCell, { width: '30%', fontWeight: 'bold' }]}>{t.total.en} / {mode !== 'english' ? t.total.ta : ''}</Text>
              <Text style={[styles.tableCell, { width: '15%', textAlign: 'right', fontWeight: 'bold' }]}>{formatWeight(totalGrossWeight)}</Text>
              <Text style={[styles.tableCell, { width: '15%', textAlign: 'right', fontWeight: 'bold' }]}>{formatWeight(totalNetWeight)}</Text>
              <Text style={[styles.tableCell, { width: '15%' }]}></Text>
              <Text style={[styles.tableCell, { width: '25%', textAlign: 'right', fontWeight: 'bold' }]}>{formatIndianCurrencyPrint(totalValue)}</Text>
            </View>
          </View>
        </View>

        {/* Declaration */}
        <View style={styles.declarationBox}>
          <Text style={styles.declarationTitle}>{t.herebyDeclare.en.toUpperCase()}</Text>
          {mode !== 'english' && <Text style={styles.declarationTitleTamil}>{t.herebyDeclare.ta}</Text>}
          
          <Text style={styles.declarationText}>
            I, {data.customer?.full_name || '_______________'}, hereby declare and affirm that:
          </Text>
          {mode !== 'english' && (
            <Text style={styles.declarationTamil}>
              நான், {data.customer?.full_name || '_______________'}, இதன்மூலம் உறுதியளிக்கிறேன்:
            </Text>
          )}
          
          <Text style={styles.declarationItem}>1. {t.goldDeclaration1.en}</Text>
          {mode !== 'english' && <Text style={styles.declarationItemTamil}>{t.goldDeclaration1.ta}</Text>}
          
          <Text style={styles.declarationItem}>2. {t.goldDeclaration2.en}</Text>
          {mode !== 'english' && <Text style={styles.declarationItemTamil}>{t.goldDeclaration2.ta}</Text>}
          
          <Text style={styles.declarationItem}>3. {t.goldDeclaration3.en}</Text>
          {mode !== 'english' && <Text style={styles.declarationItemTamil}>{t.goldDeclaration3.ta}</Text>}
          
          <Text style={styles.declarationItem}>4. {t.goldDeclaration4.en}</Text>
          {mode !== 'english' && <Text style={styles.declarationItemTamil}>{t.goldDeclaration4.ta}</Text>}
          
          <Text style={styles.declarationItem}>5. {t.goldDeclaration5.en}</Text>
          {mode !== 'english' && <Text style={styles.declarationItemTamil}>{t.goldDeclaration5.ta}</Text>}
          
          <View style={{ marginTop: 8, padding: 6, backgroundColor: '#fef2f2', borderRadius: 2 }}>
            <Text style={[styles.declarationText, { marginBottom: 0, color: '#991b1b' }]}>
              {t.goldDeclarationWarning.en}
            </Text>
            {mode !== 'english' && (
              <Text style={[styles.declarationTamil, { marginTop: 2, marginBottom: 0, color: '#991b1b' }]}>
                {t.goldDeclarationWarning.ta}
              </Text>
            )}
          </View>
        </View>

        {/* Signature Section */}
        <View style={styles.signatureSection}>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureLine}>{t.customerSignature.en}</Text>
            {mode !== 'english' && <Text style={styles.signatureTamil}>{t.customerSignature.ta}</Text>}
          </View>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureLine}>{t.witnessSignature.en}</Text>
            {mode !== 'english' && <Text style={styles.signatureTamil}>{t.witnessSignature.ta}</Text>}
          </View>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureLine}>{t.authorizedSignature.en}</Text>
            {mode !== 'english' && <Text style={styles.signatureTamil}>{t.authorizedSignature.ta}</Text>}
          </View>
        </View>
      </Page>
    </Document>
  );
}
