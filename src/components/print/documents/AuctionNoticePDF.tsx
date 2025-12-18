import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import '@/lib/pdf-fonts';
import { AuctionPrintData } from '@/types/print-data';
import { LanguageMode } from '@/lib/bilingual-utils';
import { translations } from '@/lib/translations';
import { formatDatePrint, formatIndianCurrencyPrint, formatWeight } from '@/lib/print-utils';

interface AuctionNoticePDFProps {
  data: AuctionPrintData;
  language?: LanguageMode;
}

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Roboto',
    fontSize: 10,
  },
  header: {
    textAlign: 'center',
    marginBottom: 25,
    borderBottomWidth: 3,
    borderBottomColor: '#dc2626',
    paddingBottom: 15,
  },
  companyName: {
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'Poppins',
    color: '#B45309',
  },
  branchDetails: {
    fontSize: 9,
    color: '#666',
    marginTop: 4,
  },
  noticeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 5,
    fontFamily: 'Poppins',
    color: '#dc2626',
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  noticeTitleTamil: {
    fontSize: 14,
    fontFamily: 'Noto Sans Tamil',
    textAlign: 'center',
    marginBottom: 20,
    color: '#dc2626',
  },
  urgentBadge: {
    backgroundColor: '#dc2626',
    color: '#fff',
    padding: '4 12',
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
    alignSelf: 'center',
  },
  addressSection: {
    marginBottom: 20,
  },
  toLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  addressText: {
    fontSize: 10,
    lineHeight: 1.5,
  },
  dateSection: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 20,
  },
  dateLabel: {
    fontSize: 9,
    color: '#666',
  },
  dateValue: {
    fontSize: 10,
    fontWeight: 'bold',
    marginLeft: 5,
  },
  refSection: {
    marginBottom: 15,
    padding: 10,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 4,
  },
  refRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  refLabel: {
    width: '30%',
    fontSize: 9,
    color: '#666',
  },
  refValue: {
    flex: 1,
    fontSize: 10,
    fontWeight: 'bold',
  },
  bodySection: {
    marginBottom: 20,
  },
  bodyText: {
    fontSize: 10,
    lineHeight: 1.6,
    textAlign: 'justify',
    marginBottom: 10,
  },
  bodyTextTamil: {
    fontSize: 9,
    fontFamily: 'Noto Sans Tamil',
    lineHeight: 1.7,
    textAlign: 'justify',
    color: '#444',
    marginBottom: 15,
  },
  detailsTable: {
    marginVertical: 15,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#fee2e2',
    padding: 8,
    fontWeight: 'bold',
    fontSize: 9,
  },
  tableRow: {
    flexDirection: 'row',
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    fontSize: 9,
  },
  tableRowAlt: {
    backgroundColor: '#fef2f2',
  },
  col1: { width: '40%' },
  col2: { width: '60%', textAlign: 'right' },
  highlightRow: {
    backgroundColor: '#dc2626',
  },
  highlightText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  goldItemsSection: {
    marginVertical: 15,
  },
  goldItemsTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#1E40AF',
  },
  goldTable: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  goldTableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f0f9ff',
    padding: 6,
    fontWeight: 'bold',
    fontSize: 8,
  },
  goldTableRow: {
    flexDirection: 'row',
    padding: 6,
    borderBottomWidth: 0.5,
    borderBottomColor: '#e5e7eb',
    fontSize: 8,
  },
  gcol1: { width: '5%', textAlign: 'center' },
  gcol2: { width: '30%' },
  gcol3: { width: '15%', textAlign: 'right' },
  gcol4: { width: '15%', textAlign: 'right' },
  gcol5: { width: '15%', textAlign: 'center' },
  gcol6: { width: '20%', textAlign: 'right' },
  warningSection: {
    marginVertical: 20,
    padding: 15,
    backgroundColor: '#fef3c7',
    borderWidth: 2,
    borderColor: '#f59e0b',
    borderRadius: 4,
  },
  warningText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#92400e',
    textAlign: 'center',
  },
  warningTextTamil: {
    fontSize: 9,
    fontFamily: 'Noto Sans Tamil',
    color: '#92400e',
    textAlign: 'center',
    marginTop: 5,
  },
  auctionDetails: {
    marginVertical: 15,
    padding: 12,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 4,
  },
  auctionRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  auctionLabel: {
    width: '35%',
    fontSize: 9,
    color: '#666',
  },
  auctionValue: {
    flex: 1,
    fontSize: 10,
    fontWeight: 'bold',
  },
  signatureSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 40,
  },
  signatureBox: {
    width: '40%',
  },
  signatureLine: {
    borderTopWidth: 1,
    borderTopColor: '#000',
    marginTop: 50,
    paddingTop: 5,
  },
  signatureLabel: {
    fontSize: 8,
    color: '#666',
  },
  footer: {
    position: 'absolute',
    bottom: 25,
    left: 40,
    right: 40,
    fontSize: 7,
    color: '#999',
    textAlign: 'center',
    borderTopWidth: 0.5,
    borderTopColor: '#ddd',
    paddingTop: 8,
  },
});

export default function AuctionNoticePDF({ data, language = 'bilingual' }: AuctionNoticePDFProps) {
  const showTamil = language !== 'english';
  
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.companyName}>{data.client.company_name}</Text>
          <Text style={styles.branchDetails}>
            {data.branch.branch_name} | {data.branch.address} | {data.branch.phone}
          </Text>
        </View>
        
        {/* Notice Title */}
        <Text style={styles.noticeTitle}>{translations.auctionNotice.en}</Text>
        {showTamil && (
          <Text style={styles.noticeTitleTamil}>{translations.auctionNotice.ta}</Text>
        )}
        
        {/* Urgent Badge */}
        <View style={styles.urgentBadge}>
          <Text>URGENT / அவசரம்</Text>
        </View>
        
        {/* Date */}
        <View style={styles.dateSection}>
          <Text style={styles.dateLabel}>Date / தேதி:</Text>
          <Text style={styles.dateValue}>{formatDatePrint(data.meta.print_timestamp, 'long')}</Text>
        </View>
        
        {/* To Address */}
        <View style={styles.addressSection}>
          <Text style={styles.toLabel}>To / க்கு:</Text>
          <Text style={styles.addressText}>{data.customer.full_name}</Text>
          {data.customer.address && (
            <Text style={styles.addressText}>{data.customer.address}</Text>
          )}
          {data.customer.city && data.customer.state && (
            <Text style={styles.addressText}>
              {data.customer.city}, {data.customer.state} - {data.customer.pincode}
            </Text>
          )}
        </View>
        
        {/* Reference Section */}
        <View style={styles.refSection}>
          <View style={styles.refRow}>
            <Text style={styles.refLabel}>Loan Number:</Text>
            <Text style={styles.refValue}>{data.loan_number}</Text>
          </View>
          <View style={styles.refRow}>
            <Text style={styles.refLabel}>Loan Date:</Text>
            <Text style={styles.refValue}>{formatDatePrint(data.loan_date, 'long')}</Text>
          </View>
          <View style={styles.refRow}>
            <Text style={styles.refLabel}>Maturity Date:</Text>
            <Text style={styles.refValue}>{formatDatePrint(data.maturity_date, 'long')}</Text>
          </View>
          <View style={styles.refRow}>
            <Text style={styles.refLabel}>Auction Lot No:</Text>
            <Text style={styles.refValue}>{data.auction_lot_number}</Text>
          </View>
        </View>
        
        {/* Body Text */}
        <View style={styles.bodySection}>
          <Text style={styles.bodyText}>{translations.auctionNoticeIntro.en}</Text>
          {showTamil && (
            <Text style={styles.bodyTextTamil}>{translations.auctionNoticeIntro.ta}</Text>
          )}
        </View>
        
        {/* Outstanding Details */}
        <View style={styles.detailsTable}>
          <View style={styles.tableHeader}>
            <Text style={styles.col1}>Description</Text>
            <Text style={styles.col2}>Amount</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.col1}>Outstanding Principal</Text>
            <Text style={styles.col2}>{formatIndianCurrencyPrint(data.outstanding_principal)}</Text>
          </View>
          <View style={[styles.tableRow, styles.tableRowAlt]}>
            <Text style={styles.col1}>Outstanding Interest</Text>
            <Text style={styles.col2}>{formatIndianCurrencyPrint(data.outstanding_interest)}</Text>
          </View>
          {data.outstanding_penalty && data.outstanding_penalty > 0 && (
            <View style={styles.tableRow}>
              <Text style={styles.col1}>Penalty Amount</Text>
              <Text style={styles.col2}>{formatIndianCurrencyPrint(data.outstanding_penalty)}</Text>
            </View>
          )}
          <View style={[styles.tableRow, styles.highlightRow]}>
            <Text style={[styles.col1, styles.highlightText]}>TOTAL OUTSTANDING</Text>
            <Text style={[styles.col2, styles.highlightText]}>{formatIndianCurrencyPrint(data.total_outstanding)}</Text>
          </View>
        </View>
        
        {/* Gold Items */}
        <View style={styles.goldItemsSection}>
          <Text style={styles.goldItemsTitle}>
            {translations.detailsOfPledgedGold.en}{showTamil ? ` / ${translations.detailsOfPledgedGold.ta}` : ''}
          </Text>
          <View style={styles.goldTable}>
            <View style={styles.goldTableHeader}>
              <Text style={styles.gcol1}>#</Text>
              <Text style={styles.gcol2}>Item</Text>
              <Text style={styles.gcol3}>Gross Wt</Text>
              <Text style={styles.gcol4}>Net Wt</Text>
              <Text style={styles.gcol5}>Purity</Text>
              <Text style={styles.gcol6}>Value</Text>
            </View>
            {data.gold_items.map((item, index) => (
              <View key={index} style={styles.goldTableRow}>
                <Text style={styles.gcol1}>{index + 1}</Text>
                <Text style={styles.gcol2}>{item.item_type}</Text>
                <Text style={styles.gcol3}>{formatWeight(item.gross_weight_grams)}</Text>
                <Text style={styles.gcol4}>{formatWeight(item.net_weight_grams)}</Text>
                <Text style={styles.gcol5}>{item.purity.toUpperCase()}</Text>
                <Text style={styles.gcol6}>{formatIndianCurrencyPrint(item.appraised_value)}</Text>
              </View>
            ))}
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 4 }}>
            <Text style={{ fontSize: 9, fontWeight: 'bold' }}>
              Total: {formatWeight(data.total_gold_weight_grams)} | Value: {formatIndianCurrencyPrint(data.total_appraised_value)}
            </Text>
          </View>
        </View>
        
        {/* Auction Details */}
        <View style={styles.auctionDetails}>
          <View style={styles.auctionRow}>
            <Text style={styles.auctionLabel}>Auction Date / ஏல தேதி:</Text>
            <Text style={styles.auctionValue}>{formatDatePrint(data.auction_date, 'long')}</Text>
          </View>
          {data.auction_time && (
            <View style={styles.auctionRow}>
              <Text style={styles.auctionLabel}>Auction Time / ஏல நேரம்:</Text>
              <Text style={styles.auctionValue}>{data.auction_time}</Text>
            </View>
          )}
          {data.auction_venue && (
            <View style={styles.auctionRow}>
              <Text style={styles.auctionLabel}>Venue / இடம்:</Text>
              <Text style={styles.auctionValue}>{data.auction_venue}</Text>
            </View>
          )}
          <View style={styles.auctionRow}>
            <Text style={styles.auctionLabel}>Reserve Price / குறைந்தபட்ச விலை:</Text>
            <Text style={styles.auctionValue}>{formatIndianCurrencyPrint(data.reserve_price)}</Text>
          </View>
          {data.last_date_to_pay && (
            <View style={styles.auctionRow}>
              <Text style={styles.auctionLabel}>Last Date to Pay / செலுத்த கடைசி தேதி:</Text>
              <Text style={styles.auctionValue}>{formatDatePrint(data.last_date_to_pay, 'long')}</Text>
            </View>
          )}
        </View>
        
        {/* Warning Section */}
        <View style={styles.warningSection}>
          <Text style={styles.warningText}>{translations.auctionWarning.en}</Text>
          {showTamil && (
            <Text style={styles.warningTextTamil}>{translations.auctionWarning.ta}</Text>
          )}
        </View>
        
        {/* Signature Section */}
        <View style={styles.signatureSection}>
          <View style={styles.signatureBox}>
            <View style={styles.signatureLine}>
              <Text style={styles.signatureLabel}>{translations.authorizedSignature.en}</Text>
            </View>
          </View>
          <View style={styles.signatureBox}>
            <View style={styles.signatureLine}>
              <Text style={styles.signatureLabel}>{translations.officeSeal.en}</Text>
            </View>
          </View>
        </View>
        
        {/* Footer */}
        <Text style={styles.footer}>
          This is an official notice issued under the Tamil Nadu Pawnbrokers Act. | 
          இது தமிழ்நாடு அடமானதாரர் சட்டத்தின் கீழ் வெளியிடப்பட்ட அதிகாரப்பூர்வ அறிவிப்பு.
        </Text>
      </Page>
    </Document>
  );
}
