import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import { getBilingualText } from '@/lib/translations';
import '@/lib/fonts';

const styles = StyleSheet.create({
  page: {
    fontFamily: 'Roboto',
    fontSize: 10,
    padding: 25,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    marginBottom: 15,
    borderBottomWidth: 2,
    borderBottomColor: '#059669',
    paddingBottom: 12,
  },
  logo: {
    width: 50,
    height: 50,
    marginRight: 12,
  },
  companyInfo: {
    flex: 1,
  },
  companyName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#059669',
  },
  companyNameTamil: {
    fontFamily: 'NotoSansTamil',
    fontSize: 11,
    color: '#7C3AED',
    marginTop: 2,
  },
  companyAddress: {
    fontSize: 8,
    color: '#666',
    marginTop: 3,
  },
  title: {
    textAlign: 'center',
    marginBottom: 15,
    paddingVertical: 8,
    backgroundColor: '#D1FAE5',
    borderRadius: 4,
  },
  titleText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#065F46',
  },
  titleTextTamil: {
    fontFamily: 'NotoSansTamil',
    fontSize: 10,
    color: '#7C3AED',
    marginTop: 2,
  },
  receiptInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    padding: 8,
    backgroundColor: '#F9FAFB',
    borderRadius: 4,
  },
  receiptItem: {
    alignItems: 'center',
  },
  receiptLabel: {
    fontSize: 8,
    color: '#666',
  },
  receiptValue: {
    fontSize: 10,
    fontWeight: 'bold',
    marginTop: 2,
  },
  section: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#059669',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
    paddingBottom: 3,
    marginBottom: 6,
  },
  sectionTitleTamil: {
    fontFamily: 'NotoSansTamil',
    fontSize: 8,
    color: '#7C3AED',
    marginLeft: 6,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 3,
  },
  label: {
    width: '45%',
    fontSize: 9,
    color: '#666',
  },
  value: {
    flex: 1,
    fontSize: 9,
    fontWeight: 'bold',
  },
  periodBox: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#F3F4F6',
    padding: 8,
    borderRadius: 4,
    marginBottom: 12,
  },
  periodItem: {
    alignItems: 'center',
  },
  periodLabel: {
    fontSize: 8,
    color: '#666',
  },
  periodValue: {
    fontSize: 10,
    fontWeight: 'bold',
    marginTop: 2,
  },
  paymentBox: {
    backgroundColor: '#D1FAE5',
    padding: 12,
    borderRadius: 4,
    marginTop: 10,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  paymentLabel: {
    fontSize: 10,
    color: '#065F46',
  },
  paymentValue: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#065F46',
  },
  totalPaid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#059669',
    paddingTop: 8,
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#065F46',
  },
  totalValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#059669',
  },
  outstandingBox: {
    backgroundColor: '#FEF3C7',
    padding: 8,
    borderRadius: 4,
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  outstandingLabel: {
    fontSize: 9,
    color: '#92400E',
  },
  outstandingValue: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#B45309',
  },
  signatures: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 30,
  },
  signatureBox: {
    width: '40%',
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
    bottom: 15,
    left: 25,
    right: 25,
    textAlign: 'center',
    fontSize: 7,
    color: '#9CA3AF',
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
    paddingTop: 6,
  },
});

interface InterestBilingualTemplateProps {
  company: {
    name: string;
    nameTamil?: string;
    address: string;
    phone: string;
  };
  loan: {
    loan_number: string;
    principal_amount: number;
    interest_rate: number;
  };
  payment: {
    receipt_number: string;
    payment_date: string;
    period_from: string;
    period_to: string;
    days_covered: number;
    amount_paid: number;
    penalty_amount?: number;
    outstanding_principal: number;
  };
  customer: {
    full_name: string;
    customer_code: string;
    phone: string;
  };
  logoUrl?: string | null;
  watermark?: {
    type: 'text' | 'image';
    text?: string;
    opacity: number;
  };
  language: string;
}

export function InterestBilingualTemplate({
  company,
  loan,
  payment,
  customer,
  logoUrl,
  watermark,
  language,
}: InterestBilingualTemplateProps) {
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

  const t = getBilingualText;

  return (
    <Document>
      <Page size="A5" style={styles.page}>
        {/* Watermark */}
        {watermark?.type === 'text' && watermark.text && (
          <Text style={{
            position: 'absolute',
            top: '35%',
            left: '20%',
            fontSize: 36,
            color: `rgba(0,0,0,${watermark.opacity / 100})`,
            transform: 'rotate(-30deg)',
          }}>
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
            {isTamil ? t('interestReceipt').ta : t('interestReceipt').en}
          </Text>
          {isBilingual && (
            <Text style={styles.titleTextTamil}>{t('interestReceipt').ta}</Text>
          )}
        </View>

        {/* Receipt Info */}
        <View style={styles.receiptInfo}>
          <View style={styles.receiptItem}>
            <Text style={styles.receiptLabel}>{t('receiptNo').en}</Text>
            <Text style={styles.receiptValue}>{payment.receipt_number}</Text>
          </View>
          <View style={styles.receiptItem}>
            <Text style={styles.receiptLabel}>{t('paymentDate').en}</Text>
            <Text style={styles.receiptValue}>{formatDate(payment.payment_date)}</Text>
          </View>
          <View style={styles.receiptItem}>
            <Text style={styles.receiptLabel}>{t('loanNumber').en}</Text>
            <Text style={styles.receiptValue}>{loan.loan_number}</Text>
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
        </View>

        {/* Period */}
        <View style={styles.periodBox}>
          <View style={styles.periodItem}>
            <Text style={styles.periodLabel}>{t('periodFrom').en}</Text>
            <Text style={styles.periodValue}>{formatDate(payment.period_from)}</Text>
          </View>
          <View style={styles.periodItem}>
            <Text style={styles.periodLabel}>{t('periodTo').en}</Text>
            <Text style={styles.periodValue}>{formatDate(payment.period_to)}</Text>
          </View>
          <View style={styles.periodItem}>
            <Text style={styles.periodLabel}>{t('daysCovered').en}</Text>
            <Text style={styles.periodValue}>{payment.days_covered} days</Text>
          </View>
        </View>

        {/* Payment Details */}
        <View style={styles.paymentBox}>
          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>{t('principalAmount').en}:</Text>
            <Text style={styles.paymentValue}>{formatCurrency(loan.principal_amount)}</Text>
          </View>
          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>{t('interestRate').en}:</Text>
            <Text style={styles.paymentValue}>{loan.interest_rate}% p.a.</Text>
          </View>
          <View style={styles.paymentRow}>
            <Text style={styles.paymentLabel}>{t('interestPaid').en}:</Text>
            <Text style={styles.paymentValue}>{formatCurrency(payment.amount_paid - (payment.penalty_amount || 0))}</Text>
          </View>
          {payment.penalty_amount && payment.penalty_amount > 0 && (
            <View style={styles.paymentRow}>
              <Text style={styles.paymentLabel}>{t('penaltyAmount').en}:</Text>
              <Text style={styles.paymentValue}>{formatCurrency(payment.penalty_amount)}</Text>
            </View>
          )}
          <View style={styles.totalPaid}>
            <Text style={styles.totalLabel}>
              {t('total').en} {t('amount').en}
              {isBilingual && ` / ${t('total').ta}`}
            </Text>
            <Text style={styles.totalValue}>{formatCurrency(payment.amount_paid)}</Text>
          </View>
        </View>

        {/* Outstanding */}
        <View style={styles.outstandingBox}>
          <Text style={styles.outstandingLabel}>
            {t('outstandingPrincipal').en}
            {isBilingual && ` / ${t('outstandingPrincipal').ta}`}:
          </Text>
          <Text style={styles.outstandingValue}>{formatCurrency(payment.outstanding_principal)}</Text>
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
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>{t('thankYou').en}</Text>
          {isBilingual && <Text style={{ fontFamily: 'NotoSansTamil', marginTop: 2 }}>{t('thankYou').ta}</Text>}
        </View>
      </Page>
    </Document>
  );
}
