import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import { getBilingualText } from '@/lib/translations';
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
    borderBottomWidth: 3,
    borderBottomColor: '#DC2626',
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
    color: '#DC2626',
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
  urgentBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#DC2626',
    padding: 6,
    borderRadius: 4,
  },
  urgentText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: 'bold',
  },
  title: {
    textAlign: 'center',
    marginBottom: 20,
    paddingVertical: 12,
    backgroundColor: '#FEE2E2',
    borderWidth: 2,
    borderColor: '#DC2626',
    borderRadius: 4,
  },
  titleText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#991B1B',
  },
  titleTextTamil: {
    fontFamily: 'NotoSansTamil',
    fontSize: 12,
    color: '#7C3AED',
    marginTop: 4,
  },
  noticeBox: {
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#F59E0B',
    marginBottom: 15,
  },
  noticeText: {
    fontSize: 9,
    color: '#92400E',
    lineHeight: 1.5,
  },
  noticeTextTamil: {
    fontFamily: 'NotoSansTamil',
    fontSize: 8,
    color: '#7C3AED',
    marginTop: 6,
    lineHeight: 1.6,
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#DC2626',
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
    backgroundColor: '#FEE2E2',
    paddingVertical: 6,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#DC2626',
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
  col1: { width: '30%' },
  col2: { width: '20%' },
  col3: { width: '20%' },
  col4: { width: '30%', textAlign: 'right' },
  outstandingBox: {
    backgroundColor: '#FEE2E2',
    padding: 12,
    borderRadius: 4,
    marginTop: 15,
  },
  outstandingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  outstandingLabel: {
    fontSize: 10,
    color: '#991B1B',
  },
  outstandingValue: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#991B1B',
  },
  totalOutstanding: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 2,
    borderTopColor: '#DC2626',
    paddingTop: 8,
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#991B1B',
  },
  totalValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#DC2626',
  },
  auctionDetails: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#FECACA',
    padding: 12,
    borderRadius: 4,
    marginTop: 15,
  },
  auctionItem: {
    alignItems: 'center',
  },
  auctionLabel: {
    fontSize: 8,
    color: '#991B1B',
  },
  auctionValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#DC2626',
    marginTop: 2,
  },
  actionRequired: {
    backgroundColor: '#DC2626',
    padding: 10,
    borderRadius: 4,
    marginTop: 15,
  },
  actionText: {
    color: '#FFFFFF',
    fontSize: 9,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  actionTextTamil: {
    fontFamily: 'NotoSansTamil',
    color: '#FFFFFF',
    fontSize: 8,
    textAlign: 'center',
    marginTop: 4,
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
});

interface AuctionBilingualTemplateProps {
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
    maturity_date: string;
  };
  auction: {
    auction_lot_number: string;
    auction_date: string;
    outstanding_principal: number;
    outstanding_interest: number;
    total_outstanding: number;
    reserve_price: number;
    total_gold_weight_grams: number;
    total_appraised_value: number;
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
    opacity: number;
  };
  language: string;
}

export function AuctionBilingualTemplate({
  company,
  loan,
  auction,
  customer,
  goldItems,
  logoUrl,
  language,
}: AuctionBilingualTemplateProps) {
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
      <Page size="A4" style={styles.page}>
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
          <View style={styles.urgentBadge}>
            <Text style={styles.urgentText}>URGENT</Text>
          </View>
        </View>

        {/* Title */}
        <View style={styles.title}>
          <Text style={styles.titleText}>
            {isTamil ? t('auctionNotice').ta : t('auctionNotice').en}
          </Text>
          {isBilingual && (
            <Text style={styles.titleTextTamil}>{t('auctionNotice').ta}</Text>
          )}
        </View>

        {/* Notice */}
        <View style={styles.noticeBox}>
          <Text style={styles.noticeText}>
            This is to inform you that the gold ornaments pledged against Loan No. {loan.loan_number} 
            are scheduled for auction due to non-payment of dues. Please settle the outstanding amount 
            before the auction date to redeem your ornaments.
          </Text>
          {isBilingual && (
            <Text style={styles.noticeTextTamil}>
              கடன் எண் {loan.loan_number}-க்கு எதிராக அடமானம் வைக்கப்பட்ட தங்க நகைகள் நிலுவைத் தொகை செலுத்தாததால் 
              ஏலத்திற்கு திட்டமிடப்பட்டுள்ளன என்பதை உங்களுக்குத் தெரிவிக்கிறோம். உங்கள் நகைகளை மீட்க ஏல தேதிக்கு 
              முன் நிலுவைத் தொகையை செலுத்தவும்.
            </Text>
          )}
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
          {customer.address && (
            <View style={styles.row}>
              <Text style={styles.label}>{t('address').en}:</Text>
              <Text style={styles.value}>{customer.address}</Text>
            </View>
          )}
        </View>

        {/* Loan Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Loan Details / கடன் விவரங்கள்
          </Text>
          <View style={styles.row}>
            <Text style={styles.label}>{t('loanNumber').en}:</Text>
            <Text style={styles.value}>{loan.loan_number}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>{t('loanDate').en}:</Text>
            <Text style={styles.value}>{formatDate(loan.loan_date)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>{t('maturityDate').en}:</Text>
            <Text style={styles.value}>{formatDate(loan.maturity_date)}</Text>
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
              <Text style={[styles.tableCell, styles.col1, { fontWeight: 'bold' }]}>Item Type</Text>
              <Text style={[styles.tableCell, styles.col2, { fontWeight: 'bold' }]}>Weight</Text>
              <Text style={[styles.tableCell, styles.col3, { fontWeight: 'bold' }]}>Purity</Text>
              <Text style={[styles.tableCell, styles.col4, { fontWeight: 'bold' }]}>Value</Text>
            </View>
            {goldItems.map((item, index) => (
              <View key={index} style={styles.tableRow}>
                <Text style={[styles.tableCell, styles.col1]}>{item.item_type}</Text>
                <Text style={[styles.tableCell, styles.col2]}>{item.net_weight_grams}g</Text>
                <Text style={[styles.tableCell, styles.col3]}>{item.purity}</Text>
                <Text style={[styles.tableCell, styles.col4]}>{formatCurrency(item.appraised_value)}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Outstanding Amount */}
        <View style={styles.outstandingBox}>
          <View style={styles.outstandingRow}>
            <Text style={styles.outstandingLabel}>{t('outstandingPrincipal').en}:</Text>
            <Text style={styles.outstandingValue}>{formatCurrency(auction.outstanding_principal)}</Text>
          </View>
          <View style={styles.outstandingRow}>
            <Text style={styles.outstandingLabel}>Outstanding Interest:</Text>
            <Text style={styles.outstandingValue}>{formatCurrency(auction.outstanding_interest)}</Text>
          </View>
          <View style={styles.totalOutstanding}>
            <Text style={styles.totalLabel}>
              {t('total').en} Outstanding
              {isBilingual && ` / மொத்த நிலுவை`}
            </Text>
            <Text style={styles.totalValue}>{formatCurrency(auction.total_outstanding)}</Text>
          </View>
        </View>

        {/* Auction Details */}
        <View style={styles.auctionDetails}>
          <View style={styles.auctionItem}>
            <Text style={styles.auctionLabel}>{t('auctionDate').en}</Text>
            <Text style={styles.auctionValue}>{formatDate(auction.auction_date)}</Text>
          </View>
          <View style={styles.auctionItem}>
            <Text style={styles.auctionLabel}>{t('auctionLotNo').en}</Text>
            <Text style={styles.auctionValue}>{auction.auction_lot_number}</Text>
          </View>
          <View style={styles.auctionItem}>
            <Text style={styles.auctionLabel}>{t('reservePrice').en}</Text>
            <Text style={styles.auctionValue}>{formatCurrency(auction.reserve_price)}</Text>
          </View>
        </View>

        {/* Action Required */}
        <View style={styles.actionRequired}>
          <Text style={styles.actionText}>
            Please settle the outstanding amount of {formatCurrency(auction.total_outstanding)} before {formatDate(auction.auction_date)} to avoid auction.
          </Text>
          {isBilingual && (
            <Text style={styles.actionTextTamil}>
              ஏலத்தைத் தவிர்க்க {formatDate(auction.auction_date)}-க்கு முன் {formatCurrency(auction.total_outstanding)} நிலுவைத் தொகையை செலுத்தவும்.
            </Text>
          )}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>This is an official notice from {company.name}</Text>
          {isBilingual && (
            <Text style={{ fontFamily: 'NotoSansTamil', marginTop: 2 }}>
              இது {company.name} நிறுவனத்தின் அதிகாரப்பூர்வ அறிவிப்பு
            </Text>
          )}
        </View>
      </Page>
    </Document>
  );
}
