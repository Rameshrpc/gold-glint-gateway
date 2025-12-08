import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import { translations, getBilingualText } from '@/lib/translations';
import '@/lib/fonts';

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Roboto',
    fontSize: 10,
    padding: 30,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    marginBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: '#B45309',
    paddingBottom: 15,
  },
  logo: {
    width: 60,
    height: 60,
    marginRight: 15,
  },
  companyInfo: {
    flex: 1,
  },
  companyName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#B45309',
  },
  companyNameTamil: {
    fontFamily: 'NotoSansTamil',
    fontSize: 12,
    color: '#7C3AED',
    marginTop: 2,
  },
  companyAddress: {
    fontSize: 9,
    color: '#666',
    marginTop: 4,
  },
  title: {
    textAlign: 'center',
    marginBottom: 20,
    paddingVertical: 10,
    backgroundColor: '#FEF3C7',
    borderRadius: 4,
  },
  titleText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#92400E',
  },
  titleTextTamil: {
    fontFamily: 'NotoSansTamil',
    fontSize: 11,
    color: '#7C3AED',
    marginTop: 2,
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#B45309',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
    paddingBottom: 4,
    marginBottom: 8,
  },
  sectionTitleTamil: {
    fontFamily: 'NotoSansTamil',
    fontSize: 9,
    color: '#7C3AED',
    marginLeft: 8,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  label: {
    width: '40%',
    fontSize: 9,
    color: '#666',
  },
  labelTamil: {
    fontFamily: 'NotoSansTamil',
    fontSize: 8,
    color: '#9CA3AF',
    marginLeft: 4,
  },
  value: {
    flex: 1,
    fontSize: 9,
    fontWeight: 'bold',
  },
  table: {
    marginTop: 8,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    paddingVertical: 6,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 4,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  tableCell: {
    fontSize: 8,
  },
  col1: { width: '25%' },
  col2: { width: '20%' },
  col3: { width: '20%' },
  col4: { width: '15%' },
  col5: { width: '20%', textAlign: 'right' },
  totalSection: {
    marginTop: 15,
    paddingTop: 10,
    borderTopWidth: 2,
    borderTopColor: '#B45309',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  totalLabel: {
    fontSize: 10,
    color: '#666',
  },
  totalValue: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  netAmount: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#FEF3C7',
    padding: 8,
    borderRadius: 4,
    marginTop: 8,
  },
  netLabel: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#92400E',
  },
  netValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#B45309',
  },
  declaration: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#F9FAFB',
    borderRadius: 4,
  },
  declarationTitle: {
    fontSize: 9,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  declarationText: {
    fontSize: 8,
    color: '#666',
    lineHeight: 1.4,
  },
  declarationTextTamil: {
    fontFamily: 'NotoSansTamil',
    fontSize: 7,
    color: '#7C3AED',
    marginTop: 4,
    lineHeight: 1.5,
  },
  signatures: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 40,
  },
  signatureBox: {
    width: '30%',
    textAlign: 'center',
  },
  signatureLine: {
    borderTopWidth: 1,
    borderTopColor: '#999',
    marginBottom: 4,
  },
  signatureLabel: {
    fontSize: 8,
    color: '#666',
  },
  signatureLabelTamil: {
    fontFamily: 'NotoSansTamil',
    fontSize: 7,
    color: '#9CA3AF',
  },
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 30,
    right: 30,
    textAlign: 'center',
    fontSize: 7,
    color: '#9CA3AF',
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
    paddingTop: 8,
  },
  watermark: {
    position: 'absolute',
    top: '40%',
    left: '25%',
    fontSize: 48,
    color: 'rgba(0,0,0,0.05)',
    transform: 'rotate(-30deg)',
  },
});

interface LoanBilingualTemplateProps {
  company: {
    name: string;
    nameTamil?: string;
    address: string;
    phone: string;
  };
  loan: {
    loan_number: string;
    loan_date: string;
    principal_amount: number;
    interest_rate: number;
    tenure_days: number;
    maturity_date: string;
    processing_fee?: number;
    document_charges?: number;
    advance_interest?: number;
    net_disbursed: number;
  };
  customer: {
    full_name: string;
    customer_code: string;
    phone: string;
    address?: string;
  };
  goldItems: Array<{
    item_type: string;
    gross_weight_grams: number;
    net_weight_grams: number;
    purity: string;
    appraised_value: number;
  }>;
  logoUrl?: string | null;
  watermark?: {
    type: 'text' | 'image';
    text?: string;
    imageUrl?: string;
    opacity: number;
  };
  language: string;
}

export function LoanBilingualTemplate({
  company,
  loan,
  customer,
  goldItems,
  logoUrl,
  watermark,
  language,
}: LoanBilingualTemplateProps) {
  const isBilingual = language === 'bilingual';
  const isTamil = language === 'tamil';

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const totalWeight = goldItems.reduce((sum, item) => sum + item.net_weight_grams, 0);
  const totalValue = goldItems.reduce((sum, item) => sum + item.appraised_value, 0);

  const t = getBilingualText;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Watermark */}
        {watermark?.type === 'text' && watermark.text && (
          <Text style={[styles.watermark, { opacity: watermark.opacity / 100 }]}>
            {watermark.text}
          </Text>
        )}

        {/* Header */}
        <View style={styles.header}>
          {logoUrl && <Image src={logoUrl} style={styles.logo} />}
          <View style={styles.companyInfo}>
            <Text style={styles.companyName}>{company.name}</Text>
            {(isBilingual || isTamil) && company.nameTamil && (
              <Text style={styles.companyNameTamil}>{company.nameTamil}</Text>
            )}
            <Text style={styles.companyAddress}>{company.address}</Text>
            <Text style={styles.companyAddress}>Phone: {company.phone}</Text>
          </View>
        </View>

        {/* Title */}
        <View style={styles.title}>
          <Text style={styles.titleText}>
            {isTamil ? t('loanDisbursement').ta : t('loanDisbursement').en}
          </Text>
          {isBilingual && (
            <Text style={styles.titleTextTamil}>{t('loanDisbursement').ta}</Text>
          )}
        </View>

        {/* Loan Info */}
        <View style={styles.section}>
          <View style={styles.row}>
            <Text style={styles.label}>
              {t('loanNumber').en}
              {isBilingual && <Text style={styles.labelTamil}> / {t('loanNumber').ta}</Text>}:
            </Text>
            <Text style={styles.value}>{loan.loan_number}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>
              {t('loanDate').en}
              {isBilingual && <Text style={styles.labelTamil}> / {t('loanDate').ta}</Text>}:
            </Text>
            <Text style={styles.value}>{formatDate(loan.loan_date)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>
              {t('maturityDate').en}
              {isBilingual && <Text style={styles.labelTamil}> / {t('maturityDate').ta}</Text>}:
            </Text>
            <Text style={styles.value}>{formatDate(loan.maturity_date)}</Text>
          </View>
        </View>

        {/* Customer Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {t('customerDetails').en}
            {isBilingual && <Text style={styles.sectionTitleTamil}> / {t('customerDetails').ta}</Text>}
          </Text>
          <View style={styles.row}>
            <Text style={styles.label}>{t('customerName').en}:</Text>
            <Text style={styles.value}>{customer.full_name}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>{t('customerId').en}:</Text>
            <Text style={styles.value}>{customer.customer_code}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>{t('phone').en}:</Text>
            <Text style={styles.value}>{customer.phone}</Text>
          </View>
        </View>

        {/* Gold Items */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {t('goldDetails').en}
            {isBilingual && <Text style={styles.sectionTitleTamil}> / {t('goldDetails').ta}</Text>}
          </Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableCell, styles.col1, { fontWeight: 'bold' }]}>Item</Text>
              <Text style={[styles.tableCell, styles.col2, { fontWeight: 'bold' }]}>Gross Wt</Text>
              <Text style={[styles.tableCell, styles.col3, { fontWeight: 'bold' }]}>Net Wt</Text>
              <Text style={[styles.tableCell, styles.col4, { fontWeight: 'bold' }]}>Purity</Text>
              <Text style={[styles.tableCell, styles.col5, { fontWeight: 'bold' }]}>Value</Text>
            </View>
            {goldItems.map((item, index) => (
              <View key={index} style={styles.tableRow}>
                <Text style={[styles.tableCell, styles.col1]}>{item.item_type}</Text>
                <Text style={[styles.tableCell, styles.col2]}>{item.gross_weight_grams}g</Text>
                <Text style={[styles.tableCell, styles.col3]}>{item.net_weight_grams}g</Text>
                <Text style={[styles.tableCell, styles.col4]}>{item.purity}</Text>
                <Text style={[styles.tableCell, styles.col5]}>{formatCurrency(item.appraised_value)}</Text>
              </View>
            ))}
            <View style={[styles.tableRow, { backgroundColor: '#F3F4F6' }]}>
              <Text style={[styles.tableCell, styles.col1, { fontWeight: 'bold' }]}>Total</Text>
              <Text style={[styles.tableCell, styles.col2]}></Text>
              <Text style={[styles.tableCell, styles.col3, { fontWeight: 'bold' }]}>{totalWeight.toFixed(2)}g</Text>
              <Text style={[styles.tableCell, styles.col4]}></Text>
              <Text style={[styles.tableCell, styles.col5, { fontWeight: 'bold' }]}>{formatCurrency(totalValue)}</Text>
            </View>
          </View>
        </View>

        {/* Calculation */}
        <View style={styles.totalSection}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>{t('principalAmount').en}:</Text>
            <Text style={styles.totalValue}>{formatCurrency(loan.principal_amount)}</Text>
          </View>
          {loan.processing_fee && loan.processing_fee > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Less: {t('processingFee').en}:</Text>
              <Text style={styles.totalValue}>- {formatCurrency(loan.processing_fee)}</Text>
            </View>
          )}
          {loan.document_charges && loan.document_charges > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Less: {t('documentCharges').en}:</Text>
              <Text style={styles.totalValue}>- {formatCurrency(loan.document_charges)}</Text>
            </View>
          )}
          {loan.advance_interest && loan.advance_interest > 0 && (
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Less: {t('advanceInterest').en}:</Text>
              <Text style={styles.totalValue}>- {formatCurrency(loan.advance_interest)}</Text>
            </View>
          )}
          <View style={styles.netAmount}>
            <Text style={styles.netLabel}>
              {t('netDisbursed').en}
              {isBilingual && ` / ${t('netDisbursed').ta}`}
            </Text>
            <Text style={styles.netValue}>{formatCurrency(loan.net_disbursed)}</Text>
          </View>
        </View>

        {/* Declaration */}
        <View style={styles.declaration}>
          <Text style={styles.declarationTitle}>
            {t('declaration').en}
            {isBilingual && ` / ${t('declaration').ta}`}
          </Text>
          <Text style={styles.declarationText}>{t('loanDeclaration').en}</Text>
          {isBilingual && (
            <Text style={styles.declarationTextTamil}>{t('loanDeclaration').ta}</Text>
          )}
        </View>

        {/* Signatures */}
        <View style={styles.signatures}>
          <View style={styles.signatureBox}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>{t('customerSignature').en}</Text>
            {isBilingual && (
              <Text style={styles.signatureLabelTamil}>{t('customerSignature').ta}</Text>
            )}
          </View>
          <View style={styles.signatureBox}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>{t('authorizedSignature').en}</Text>
            {isBilingual && (
              <Text style={styles.signatureLabelTamil}>{t('authorizedSignature').ta}</Text>
            )}
          </View>
          <View style={styles.signatureBox}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>{t('branchManagerSignature').en}</Text>
            {isBilingual && (
              <Text style={styles.signatureLabelTamil}>{t('branchManagerSignature').ta}</Text>
            )}
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>{t('computerGenerated').en}</Text>
          {isBilingual && <Text style={{ fontFamily: 'NotoSansTamil', marginTop: 2 }}>{t('computerGenerated').ta}</Text>}
        </View>
      </Page>
    </Document>
  );
}
