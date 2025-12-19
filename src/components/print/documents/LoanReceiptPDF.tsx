import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import { formatIndianCurrencyPrint, formatDatePrint, numberToWords, formatWeight } from '@/lib/print-utils';
import { translations } from '@/lib/translations';
import '@/lib/pdf-fonts';

type LanguageMode = 'bilingual' | 'english' | 'tamil';
type CopyType = 'customer' | 'office';

interface LoanReceiptPDFProps {
  data: {
    id: string;
    loan_number: string;
    loan_date: string;
    principal_amount: number;
    shown_principal?: number;
    actual_principal?: number;
    interest_rate: number;
    tenure_days: number;
    maturity_date: string;
    net_disbursed: number;
    processing_fee?: number;
    document_charges?: number;
    advance_interest_shown?: number;
    advance_interest_actual?: number;
    customer: {
      full_name: string;
      customer_code: string;
      phone: string;
      address?: string;
      photo_url?: string;
    };
    scheme: {
      scheme_name: string;
      interest_rate: number;
      shown_rate?: number;
      rebate_percentage?: number;
      min_days_for_rebate?: number;
    };
    gold_items?: Array<{
      item_type: string;
      gross_weight_grams: number;
      net_weight_grams: number;
      purity: string;
      appraised_value: number;
    }>;
    branch?: {
      branch_name: string;
      address?: string;
      phone?: string;
    };
    client?: {
      company_name: string;
      logo_url?: string;
      address?: string;
      phone?: string;
    };
  };
  config?: {
    fontFamily?: string;
    colorScheme?: { primary: string; secondary: string };
    language?: LanguageMode;
    copyType?: CopyType;
    showRebateDetails?: boolean;
  };
}

const styles = StyleSheet.create({
  page: {
    padding: 25,
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
    width: 60,
    marginRight: 12,
  },
  logo: {
    width: 55,
    height: 55,
    objectFit: 'contain',
  },
  headerContent: {
    flex: 1,
    textAlign: 'center',
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#B45309',
    marginBottom: 2,
  },
  titleTamil: {
    fontSize: 11,
    fontFamily: 'Noto Sans Tamil',
    color: '#B45309',
    marginBottom: 3,
  },
  subtitle: {
    fontSize: 9,
    color: '#666',
  },
  subtitleTamil: {
    fontSize: 8,
    fontFamily: 'Noto Sans Tamil',
    color: '#666',
  },
  copyBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#1E40AF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 2,
  },
  copyBadgeText: {
    color: 'white',
    fontSize: 8,
    fontWeight: 'bold',
  },
  copyBadgeTamil: {
    color: 'white',
    fontSize: 7,
    fontFamily: 'Noto Sans Tamil',
  },
  loanRefRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#fef3c7',
    padding: 6,
    marginBottom: 12,
    borderRadius: 2,
  },
  section: {
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    backgroundColor: '#f3f4f6',
    padding: 5,
    marginBottom: 6,
    color: '#1E40AF',
    flexDirection: 'row',
  },
  sectionTitleTamil: {
    fontSize: 8,
    fontFamily: 'Noto Sans Tamil',
    color: '#1E40AF',
    marginLeft: 6,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 3,
    alignItems: 'flex-start',
  },
  label: {
    width: '35%',
    color: '#666',
    fontSize: 8,
  },
  labelTamil: {
    fontSize: 7,
    fontFamily: 'Noto Sans Tamil',
    color: '#888',
  },
  value: {
    width: '65%',
    fontWeight: 'bold',
    fontSize: 9,
  },
  table: {
    marginTop: 6,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#B45309',
    padding: 4,
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
    padding: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: '#e5e7eb',
  },
  col1: { width: '28%' },
  col2: { width: '14%', textAlign: 'right' },
  col3: { width: '14%', textAlign: 'right' },
  col4: { width: '14%', textAlign: 'center' },
  col5: { width: '30%', textAlign: 'right' },
  totalRow: {
    flexDirection: 'row',
    padding: 5,
    backgroundColor: '#f3f4f6',
    fontWeight: 'bold',
  },
  highlight: {
    backgroundColor: '#fef3c7',
    padding: 8,
    marginTop: 8,
    borderRadius: 2,
    borderWidth: 1,
    borderColor: '#B45309',
  },
  amountInWords: {
    fontSize: 8,
    fontStyle: 'italic',
    marginTop: 4,
    color: '#666',
  },
  rebateSection: {
    marginTop: 8,
    padding: 8,
    backgroundColor: '#ecfdf5',
    borderRadius: 2,
    borderWidth: 1,
    borderColor: '#10b981',
  },
  rebateTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#047857',
    marginBottom: 4,
  },
  rebateTitleTamil: {
    fontSize: 8,
    fontFamily: 'Noto Sans Tamil',
    color: '#047857',
  },
  rebateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  signatureSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 25,
    paddingTop: 15,
  },
  signatureBox: {
    width: '28%',
    textAlign: 'center',
  },
  signatureLine: {
    borderTopWidth: 1,
    borderTopColor: '#000',
    marginTop: 35,
    paddingTop: 4,
  },
  signatureLabel: {
    fontSize: 7,
  },
  signatureLabelTamil: {
    fontSize: 6,
    fontFamily: 'Noto Sans Tamil',
    color: '#666',
  },
  declaration: {
    fontSize: 7,
    color: '#666',
    marginTop: 12,
    padding: 8,
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  declarationTamil: {
    fontSize: 7,
    fontFamily: 'Noto Sans Tamil',
    color: '#666',
    marginTop: 4,
  },
  footer: {
    position: 'absolute',
    bottom: 15,
    left: 25,
    right: 25,
    textAlign: 'center',
    fontSize: 7,
    color: '#999',
    borderTopWidth: 0.5,
    borderTopColor: '#e5e7eb',
    paddingTop: 5,
  },
});

// Bilingual label component
function BiLabel({ en, ta, mode, style }: { en: string; ta: string; mode: LanguageMode; style?: any }) {
  if (mode === 'english') return <Text style={style}>{en}</Text>;
  if (mode === 'tamil') return <Text style={[style, { fontFamily: 'Noto Sans Tamil' }]}>{ta}</Text>;
  return (
    <View style={{ flexDirection: 'column' }}>
      <Text style={style}>{en}</Text>
      <Text style={[styles.labelTamil]}>{ta}</Text>
    </View>
  );
}

export default function LoanReceiptPDF({ data, config }: LoanReceiptPDFProps) {
  const mode = config?.language || 'bilingual';
  const copyType = config?.copyType || 'customer';
  const showRebate = config?.showRebateDetails ?? true;
  
  const totalGoldWeight = data.gold_items?.reduce((sum, item) => sum + item.gross_weight_grams, 0) || 0;
  const totalAppraisedValue = data.gold_items?.reduce((sum, item) => sum + item.appraised_value, 0) || 0;
  
  const copyBadge = copyType === 'customer' 
    ? translations.customerCopy 
    : translations.officeCopy;

  const t = translations;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Copy Badge */}
        <View style={[styles.copyBadge, { backgroundColor: copyType === 'customer' ? '#1E40AF' : '#7c3aed' }]}>
          <Text style={styles.copyBadgeText}>{copyBadge.en}</Text>
          {mode !== 'english' && <Text style={styles.copyBadgeTamil}>{copyBadge.ta}</Text>}
        </View>

        {/* Header with Logo */}
        <View style={styles.header}>
          {data.client?.logo_url && (
            <View style={styles.logoContainer}>
              <Image src={data.client.logo_url} style={styles.logo} />
            </View>
          )}
          <View style={styles.headerContent}>
            <Text style={styles.title}>{data.client?.company_name || 'GOLD LOAN RECEIPT'}</Text>
            {mode !== 'english' && <Text style={styles.titleTamil}>{t.goldLoanReceipt.ta}</Text>}
            <Text style={styles.subtitle}>{data.branch?.branch_name || ''}</Text>
            {data.branch?.address && <Text style={styles.subtitle}>{data.branch.address}</Text>}
          </View>
        </View>

        {/* Loan Reference Row */}
        <View style={styles.loanRefRow}>
          <View>
            <Text style={{ fontWeight: 'bold', fontSize: 9 }}>{t.loanNumber.en}: {data.loan_number}</Text>
            {mode !== 'english' && <Text style={styles.labelTamil}>{t.loanNumber.ta}</Text>}
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={{ fontWeight: 'bold', fontSize: 9 }}>{t.date.en}: {formatDatePrint(data.loan_date, 'long')}</Text>
            {mode !== 'english' && <Text style={styles.labelTamil}>{t.date.ta}</Text>}
          </View>
        </View>

        {/* Customer Details */}
        <View style={styles.section}>
          <View style={styles.sectionTitle}>
            <Text>{t.customerDetails.en}</Text>
            {mode !== 'english' && <Text style={styles.sectionTitleTamil}>{t.customerDetails.ta}</Text>}
          </View>
          <View style={styles.row}>
            <View style={styles.label}>
              <BiLabel en={t.customerName.en} ta={t.customerName.ta} mode={mode} style={{ fontSize: 8, color: '#666' }} />
            </View>
            <Text style={styles.value}>{data.customer.full_name}</Text>
          </View>
          <View style={styles.row}>
            <View style={styles.label}>
              <BiLabel en={t.customerId.en} ta={t.customerId.ta} mode={mode} style={{ fontSize: 8, color: '#666' }} />
            </View>
            <Text style={styles.value}>{data.customer.customer_code}</Text>
          </View>
          <View style={styles.row}>
            <View style={styles.label}>
              <BiLabel en={t.phone.en} ta={t.phone.ta} mode={mode} style={{ fontSize: 8, color: '#666' }} />
            </View>
            <Text style={styles.value}>{data.customer.phone}</Text>
          </View>
          {data.customer.address && (
            <View style={styles.row}>
              <View style={styles.label}>
                <BiLabel en={t.address.en} ta={t.address.ta} mode={mode} style={{ fontSize: 8, color: '#666' }} />
              </View>
              <Text style={[styles.value, { fontSize: 8 }]}>{data.customer.address}</Text>
            </View>
          )}
        </View>

        {/* Loan Details */}
        <View style={styles.section}>
          <View style={styles.sectionTitle}>
            <Text>Loan Details</Text>
            {mode !== 'english' && <Text style={styles.sectionTitleTamil}>கடன் விவரங்கள்</Text>}
          </View>
          <View style={{ flexDirection: 'row' }}>
            <View style={{ width: '50%' }}>
              <View style={styles.row}>
                <View style={styles.label}>
                  <BiLabel en={t.loanScheme.en} ta={t.loanScheme.ta} mode={mode} style={{ fontSize: 8, color: '#666' }} />
                </View>
                <Text style={[styles.value, { fontSize: 8 }]}>{data.scheme.scheme_name}</Text>
              </View>
              <View style={styles.row}>
                <View style={styles.label}>
                  <BiLabel en={t.principalAmount.en} ta={t.principalAmount.ta} mode={mode} style={{ fontSize: 8, color: '#666' }} />
                </View>
                <Text style={styles.value}>{formatIndianCurrencyPrint(data.shown_principal || data.principal_amount)}</Text>
              </View>
              <View style={styles.row}>
                <View style={styles.label}>
                  <BiLabel en={t.interestRate.en} ta={t.interestRate.ta} mode={mode} style={{ fontSize: 8, color: '#666' }} />
                </View>
                <Text style={styles.value}>{data.scheme.shown_rate || data.interest_rate}% {t.perAnnum.en}</Text>
              </View>
            </View>
            <View style={{ width: '50%' }}>
              <View style={styles.row}>
                <View style={styles.label}>
                  <BiLabel en={t.tenure.en} ta={t.tenure.ta} mode={mode} style={{ fontSize: 8, color: '#666' }} />
                </View>
                <Text style={styles.value}>{data.tenure_days} {t.days.en}</Text>
              </View>
              <View style={styles.row}>
                <View style={styles.label}>
                  <BiLabel en={t.loanDate.en} ta={t.loanDate.ta} mode={mode} style={{ fontSize: 8, color: '#666' }} />
                </View>
                <Text style={[styles.value, { fontSize: 8 }]}>{formatDatePrint(data.loan_date)}</Text>
              </View>
              <View style={styles.row}>
                <View style={styles.label}>
                  <BiLabel en={t.maturityDate.en} ta={t.maturityDate.ta} mode={mode} style={{ fontSize: 8, color: '#666' }} />
                </View>
                <Text style={[styles.value, { fontSize: 8 }]}>{formatDatePrint(data.maturity_date)}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Gold Items */}
        {data.gold_items && data.gold_items.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionTitle}>
              <Text>{t.goldDetails.en}</Text>
              {mode !== 'english' && <Text style={styles.sectionTitleTamil}>{t.goldDetails.ta}</Text>}
            </View>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <View style={styles.col1}>
                  <Text style={styles.tableHeaderCell}>{t.itemType.en}</Text>
                  {mode !== 'english' && <Text style={styles.tableHeaderCellTamil}>{t.itemType.ta}</Text>}
                </View>
                <View style={styles.col2}>
                  <Text style={styles.tableHeaderCell}>{t.grossWeight.en}</Text>
                  {mode !== 'english' && <Text style={styles.tableHeaderCellTamil}>{t.grossWeight.ta}</Text>}
                </View>
                <View style={styles.col3}>
                  <Text style={styles.tableHeaderCell}>{t.netWeight.en}</Text>
                  {mode !== 'english' && <Text style={styles.tableHeaderCellTamil}>{t.netWeight.ta}</Text>}
                </View>
                <View style={styles.col4}>
                  <Text style={styles.tableHeaderCell}>{t.purity.en}</Text>
                  {mode !== 'english' && <Text style={styles.tableHeaderCellTamil}>{t.purity.ta}</Text>}
                </View>
                <View style={styles.col5}>
                  <Text style={styles.tableHeaderCell}>{t.appraisedValue.en}</Text>
                  {mode !== 'english' && <Text style={styles.tableHeaderCellTamil}>{t.appraisedValue.ta}</Text>}
                </View>
              </View>
              {data.gold_items.map((item, index) => (
                <View key={index} style={styles.tableRow}>
                  <Text style={[styles.col1, { fontSize: 8 }]}>{item.item_type}</Text>
                  <Text style={[styles.col2, { fontSize: 8 }]}>{formatWeight(item.gross_weight_grams)}</Text>
                  <Text style={[styles.col3, { fontSize: 8 }]}>{formatWeight(item.net_weight_grams)}</Text>
                  <Text style={[styles.col4, { fontSize: 8 }]}>{item.purity.toUpperCase()}</Text>
                  <Text style={[styles.col5, { fontSize: 8 }]}>{formatIndianCurrencyPrint(item.appraised_value)}</Text>
                </View>
              ))}
              <View style={styles.totalRow}>
                <Text style={[styles.col1, { fontSize: 8, fontWeight: 'bold' }]}>{t.total.en}</Text>
                <Text style={[styles.col2, { fontSize: 8, fontWeight: 'bold' }]}>{formatWeight(totalGoldWeight)}</Text>
                <Text style={styles.col3}></Text>
                <Text style={styles.col4}></Text>
                <Text style={[styles.col5, { fontSize: 8, fontWeight: 'bold' }]}>{formatIndianCurrencyPrint(totalAppraisedValue)}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Disbursement Summary */}
        <View style={styles.highlight}>
          <View style={styles.sectionTitle}>
            <Text>{t.disbursementSummary.en}</Text>
            {mode !== 'english' && <Text style={styles.sectionTitleTamil}>{t.disbursementSummary.ta}</Text>}
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <View style={{ width: '48%' }}>
              <View style={styles.row}>
                <Text style={{ fontSize: 8, color: '#666' }}>{t.principalAmount.en}:</Text>
                <Text style={{ fontSize: 8, fontWeight: 'bold', marginLeft: 4 }}>{formatIndianCurrencyPrint(data.shown_principal || data.principal_amount)}</Text>
              </View>
              {data.processing_fee && data.processing_fee > 0 && (
                <View style={styles.row}>
                  <Text style={{ fontSize: 8, color: '#666' }}>{t.less.en} {t.processingFee.en}:</Text>
                  <Text style={{ fontSize: 8, marginLeft: 4 }}>- {formatIndianCurrencyPrint(data.processing_fee)}</Text>
                </View>
              )}
              {data.document_charges && data.document_charges > 0 && (
                <View style={styles.row}>
                  <Text style={{ fontSize: 8, color: '#666' }}>{t.less.en} {t.documentCharges.en}:</Text>
                  <Text style={{ fontSize: 8, marginLeft: 4 }}>- {formatIndianCurrencyPrint(data.document_charges)}</Text>
                </View>
              )}
              {data.advance_interest_shown && data.advance_interest_shown > 0 && (
                <View style={styles.row}>
                  <Text style={{ fontSize: 8, color: '#666' }}>{t.less.en} {t.advanceInterest.en}:</Text>
                  <Text style={{ fontSize: 8, marginLeft: 4 }}>- {formatIndianCurrencyPrint(data.advance_interest_shown)}</Text>
                </View>
              )}
            </View>
            <View style={{ width: '48%', alignItems: 'flex-end' }}>
              <Text style={{ fontSize: 8, color: '#666' }}>{t.netDisbursed.en}</Text>
              {mode !== 'english' && <Text style={styles.labelTamil}>{t.netDisbursed.ta}</Text>}
              <Text style={{ fontSize: 14, fontWeight: 'bold', color: '#B45309' }}>{formatIndianCurrencyPrint(data.net_disbursed)}</Text>
              <Text style={styles.amountInWords}>({numberToWords(Math.round(data.net_disbursed))})</Text>
            </View>
          </View>
        </View>

        {/* Rebate Details */}
        {showRebate && data.scheme.rebate_percentage && data.scheme.rebate_percentage > 0 && (
          <View style={styles.rebateSection}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
              <Text style={styles.rebateTitle}>{t.earlyReleaseRebate.en}</Text>
              {mode !== 'english' && <Text style={[styles.rebateTitleTamil, { marginLeft: 6 }]}>{t.earlyReleaseRebate.ta}</Text>}
            </View>
            <View style={styles.rebateRow}>
              <Text style={{ fontSize: 8 }}>{t.rebate.en} {t.percent.en}:</Text>
              <Text style={{ fontSize: 8, fontWeight: 'bold' }}>{data.scheme.rebate_percentage}%</Text>
            </View>
            {data.scheme.min_days_for_rebate && (
              <View style={styles.rebateRow}>
                <Text style={{ fontSize: 8 }}>Minimum Days for Rebate:</Text>
                <Text style={{ fontSize: 8, fontWeight: 'bold' }}>{data.scheme.min_days_for_rebate} days</Text>
              </View>
            )}
            <Text style={{ fontSize: 7, color: '#666', marginTop: 4 }}>
              * Early redemption before maturity may be eligible for interest rebate as per scheme terms.
            </Text>
          </View>
        )}

        {/* Signature Section */}
        <View style={styles.signatureSection}>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureLine}>{t.customerSignature.en}</Text>
            <Text style={styles.signatureLabelTamil}>{t.customerSignature.ta}</Text>
          </View>
          <View style={styles.signatureBox}>
            <View style={styles.signatureLine}>
              <Text>{copyType === 'customer' ? 'Redemption Signature' : 'Gold Received By'}</Text>
            </View>
            <Text style={styles.signatureLabelTamil}>{copyType === 'customer' ? 'மீட்பு கையொப்பம்' : 'தங்கம் பெற்றவர்'}</Text>
          </View>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureLine}>{t.authorizedSignature.en}</Text>
            <Text style={styles.signatureLabelTamil}>{t.authorizedSignature.ta}</Text>
          </View>
        </View>

        {/* Declaration */}
        <View style={styles.declaration}>
          <Text>{t.loanDeclaration.en}</Text>
          {mode !== 'english' && <Text style={styles.declarationTamil}>{t.loanDeclaration.ta}</Text>}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>{t.computerGenerated.en} | {t.termsApply.en}</Text>
          {mode !== 'english' && <Text style={{ fontFamily: 'Noto Sans Tamil', fontSize: 6 }}>{t.computerGenerated.ta}</Text>}
        </View>
      </Page>
    </Document>
  );
}
