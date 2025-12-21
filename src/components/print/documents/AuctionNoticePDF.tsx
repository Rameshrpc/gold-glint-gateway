import React from 'react';
import { Document, Page, View, Text } from '@react-pdf/renderer';
import { pdfStyles, PAPER_SIZES, formatCurrencyPrint, formatDatePrint, formatWeightPrint } from '../shared/PDFStyles';
import { PDFHeader } from '../shared/PDFHeader';
import { PDFFooter } from '../shared/PDFFooter';
import { BilingualLabel, BilingualValueRow, BilingualText, LanguageMode } from '@/lib/bilingual-utils';
import { fontsRegistered } from '@/lib/pdf-fonts';

// Ensure fonts are loaded
const _fonts = fontsRegistered;

interface GoldItem {
  id: string;
  item_type: string;
  gross_weight_grams: number;
  net_weight_grams: number;
  purity: string;
  appraised_value: number;
}

interface Auction {
  auction_lot_number: string;
  auction_date: string;
  outstanding_principal?: number;
  outstanding_interest?: number;
  outstanding_penalty?: number;
  total_outstanding: number;
  total_gold_weight_grams?: number;
  total_appraised_value?: number;
  reserve_price: number;
  buyer_name?: string | null;
  sold_price?: number | null;
  status?: string;
}

interface Loan {
  loan_number: string;
  loan_date?: string;
  maturity_date?: string;
  principal_amount: number;
}

interface Customer {
  customer_code: string;
  full_name: string;
  phone?: string;
  address?: string | null;
}

interface AuctionNoticePDFProps {
  auction: Auction;
  loan: Loan;
  customer: Customer;
  goldItems: GoldItem[];
  companyName: string;
  branchName?: string;
  branchAddress?: string;
  language?: LanguageMode;
  paperSize?: 'A4' | 'Legal' | 'Letter';
  footerEnglish?: string | null;
  footerTamil?: string | null;
  sloganEnglish?: string | null;
  sloganTamil?: string | null;
  logoUrl?: string | null;
  isNotice?: boolean; // true for pre-auction notice, false for completion receipt
}

export function AuctionNoticePDF({
  auction,
  loan,
  customer,
  goldItems,
  companyName,
  branchName,
  branchAddress,
  language = 'bilingual',
  paperSize = 'A4',
  footerEnglish,
  footerTamil,
  sloganEnglish,
  sloganTamil,
  logoUrl,
  isNotice = true,
}: AuctionNoticePDFProps) {
  const pageSize = PAPER_SIZES[paperSize];
  
  const totalGrossWeight = goldItems.reduce((sum, item) => sum + item.gross_weight_grams, 0);
  
  return (
    <Document>
      <Page size={[pageSize.width, pageSize.height]} style={pdfStyles.page}>
        <PDFHeader
          companyName={companyName}
          branchName={branchName}
          address={branchAddress}
          date={auction.auction_date}
          documentNumber={auction.auction_lot_number}
          sloganEnglish={sloganEnglish}
          sloganTamil={sloganTamil}
          language={language}
          logoUrl={logoUrl}
        />
        
        {/* Document Title */}
        <View style={pdfStyles.documentTitle}>
          {isNotice ? (
            <BilingualLabel
              english="AUCTION NOTICE"
              tamil="ஏல அறிவிப்பு"
              mode={language}
              fontSize={14}
              fontWeight="bold"
            />
          ) : (
            <BilingualLabel
              english="AUCTION COMPLETION RECEIPT"
              tamil="ஏலம் நிறைவு ரசீது"
              mode={language}
              fontSize={14}
              fontWeight="bold"
            />
          )}
        </View>
        
        {/* Notice Text */}
        {isNotice && loan.loan_date && (
          <View style={{ marginBottom: 12, padding: 10, borderWidth: 2, borderColor: '#c00' }}>
            <BilingualText
              english={`NOTICE is hereby given that the gold ornaments pledged against Loan No. ${loan.loan_number} dated ${formatDatePrint(loan.loan_date)} have become liable for auction due to non-payment of dues.`}
              tamil={`${formatDatePrint(loan.loan_date)} தேதியிட்ட கடன் எண் ${loan.loan_number} க்கு எதிராக அடமானம் வைக்கப்பட்ட தங்க நகைகள் நிலுவைத் தொகை செலுத்தாமையால் ஏலத்திற்கு உட்பட்டுள்ளன என்று இதன்மூலம் அறிவிக்கப்படுகிறது.`}
              mode={language}
              fontSize={10}
              textAlign="justify"
            />
          </View>
        )}
        
        {/* Customer & Loan Information */}
        <View style={pdfStyles.section}>
          <View style={pdfStyles.twoColumn}>
            <View style={pdfStyles.column}>
              <View style={pdfStyles.sectionTitle}>
                <BilingualLabel
                  english="Borrower Details"
                  tamil="கடன் வாங்கியவர் விவரங்கள்"
                  mode={language}
                  fontSize={11}
                  fontWeight="bold"
                />
              </View>
              <BilingualValueRow
                labelEn="Name"
                labelTa="பெயர்"
                value={customer.full_name}
                mode={language}
              />
              <BilingualValueRow
                labelEn="Customer ID"
                labelTa="வாடிக்கையாளர் எண்"
                value={customer.customer_code}
                mode={language}
              />
              <BilingualValueRow
                labelEn="Phone"
                labelTa="தொலைபேசி"
                value={customer.phone || '-'}
                mode={language}
              />
              {customer.address && (
                <BilingualValueRow
                  labelEn="Address"
                  labelTa="முகவரி"
                  value={customer.address}
                  mode={language}
                />
              )}
            </View>
            <View style={pdfStyles.column}>
              <View style={pdfStyles.sectionTitle}>
                <BilingualLabel
                  english="Loan Details"
                  tamil="கடன் விவரங்கள்"
                  mode={language}
                  fontSize={11}
                  fontWeight="bold"
                />
              </View>
              <BilingualValueRow
                labelEn="Loan Number"
                labelTa="கடன் எண்"
                value={loan.loan_number}
                mode={language}
              />
              {loan.loan_date && (
                <BilingualValueRow
                  labelEn="Loan Date"
                  labelTa="கடன் தேதி"
                  value={formatDatePrint(loan.loan_date)}
                  mode={language}
                />
              )}
              {loan.maturity_date && (
                <BilingualValueRow
                  labelEn="Maturity Date"
                  labelTa="முதிர்வு தேதி"
                  value={formatDatePrint(loan.maturity_date)}
                  mode={language}
                />
              )}
              <BilingualValueRow
                labelEn="Original Principal"
                labelTa="அசல் தொகை"
                value={formatCurrencyPrint(loan.principal_amount)}
                mode={language}
              />
            </View>
          </View>
        </View>
        
        {/* Gold Items */}
        <View style={pdfStyles.section}>
          <View style={pdfStyles.sectionTitle}>
            <BilingualLabel
              english="Pledged Gold Items"
              tamil="அடமான தங்க பொருட்கள்"
              mode={language}
              fontSize={11}
              fontWeight="bold"
            />
          </View>
          
          <View style={pdfStyles.table}>
            <View style={pdfStyles.tableHeader}>
              <Text style={[pdfStyles.tableHeaderCell, { width: '8%' }]}>S.No</Text>
              <Text style={[pdfStyles.tableHeaderCell, { width: '27%', textAlign: 'left' }]}>Item / பொருள்</Text>
              <Text style={[pdfStyles.tableHeaderCell, { width: '18%' }]}>Gross Wt</Text>
              <Text style={[pdfStyles.tableHeaderCell, { width: '18%' }]}>Net Wt</Text>
              <Text style={[pdfStyles.tableHeaderCell, { width: '12%' }]}>Purity</Text>
              <Text style={[pdfStyles.tableHeaderCell, { width: '17%' }]}>Value</Text>
            </View>
            
            {goldItems.map((item, index) => (
              <View key={item.id} style={pdfStyles.tableRow}>
                <Text style={[pdfStyles.tableCell, { width: '8%' }]}>{index + 1}</Text>
                <Text style={[pdfStyles.tableCellLeft, { width: '27%' }]}>{item.item_type}</Text>
                <Text style={[pdfStyles.tableCell, { width: '18%' }]}>{formatWeightPrint(item.gross_weight_grams)}</Text>
                <Text style={[pdfStyles.tableCell, { width: '18%' }]}>{formatWeightPrint(item.net_weight_grams)}</Text>
                <Text style={[pdfStyles.tableCell, { width: '12%' }]}>{item.purity}</Text>
                <Text style={[pdfStyles.tableCell, { width: '17%' }]}>{formatCurrencyPrint(item.appraised_value)}</Text>
              </View>
            ))}
            
            <View style={[pdfStyles.tableRow, { backgroundColor: '#f0f0f0' }]}>
              <Text style={[pdfStyles.tableHeaderCell, { width: '35%', textAlign: 'right' }]}>Total / மொத்தம்</Text>
              <Text style={[pdfStyles.tableHeaderCell, { width: '18%' }]}>{formatWeightPrint(totalGrossWeight)}</Text>
              <Text style={[pdfStyles.tableHeaderCell, { width: '18%' }]}>-</Text>
              <Text style={[pdfStyles.tableHeaderCell, { width: '12%' }]}>-</Text>
              <Text style={[pdfStyles.tableHeaderCell, { width: '17%' }]}>{formatCurrencyPrint(auction.total_appraised_value ?? 0)}</Text>
            </View>
          </View>
        </View>
        
        {/* Outstanding Amount */}
        <View style={pdfStyles.amountBox}>
          <View style={pdfStyles.sectionTitle}>
            <BilingualLabel
              english="Outstanding Amount"
              tamil="நிலுவைத் தொகை"
              mode={language}
              fontSize={11}
              fontWeight="bold"
            />
          </View>
          
          {auction.outstanding_principal && (
            <View style={pdfStyles.amountRow}>
              <BilingualLabel english="Principal Outstanding" tamil="நிலுவை அசல்" mode={language} fontSize={10} />
              <Text style={pdfStyles.amountValue}>{formatCurrencyPrint(auction.outstanding_principal)}</Text>
            </View>
          )}
          
          {auction.outstanding_interest && (
            <View style={pdfStyles.amountRow}>
              <BilingualLabel english="Interest Due" tamil="வட்டி நிலுவை" mode={language} fontSize={10} />
              <Text style={pdfStyles.amountValue}>{formatCurrencyPrint(auction.outstanding_interest)}</Text>
            </View>
          )}
          
          {(auction.outstanding_penalty ?? 0) > 0 && (
            <View style={pdfStyles.amountRow}>
              <BilingualLabel english="Penalty" tamil="அபராதம்" mode={language} fontSize={10} />
              <Text style={pdfStyles.amountValue}>{formatCurrencyPrint(auction.outstanding_penalty ?? 0)}</Text>
            </View>
          )}
          
          <View style={pdfStyles.amountTotal}>
            <BilingualLabel english="Total Outstanding" tamil="மொத்த நிலுவை" mode={language} fontSize={12} fontWeight="bold" />
            <Text style={pdfStyles.amountTotalValue}>{formatCurrencyPrint(auction.total_outstanding)}</Text>
          </View>
          
          <View style={{ marginTop: 8, flexDirection: 'row', justifyContent: 'space-between' }}>
            <BilingualLabel english="Reserve Price" tamil="குறைந்தபட்ச விலை" mode={language} fontSize={10} />
            <Text style={{ fontSize: 10, fontWeight: 'bold' }}>{formatCurrencyPrint(auction.reserve_price)}</Text>
          </View>
          
          {!isNotice && auction.sold_price && (
            <View style={{ marginTop: 4, flexDirection: 'row', justifyContent: 'space-between' }}>
              <BilingualLabel english="Sold Price" tamil="விற்பனை விலை" mode={language} fontSize={10} />
              <Text style={{ fontSize: 10, fontWeight: 'bold', color: '#060' }}>{formatCurrencyPrint(auction.sold_price)}</Text>
            </View>
          )}
          
          {!isNotice && auction.buyer_name && (
            <View style={{ marginTop: 4, flexDirection: 'row', justifyContent: 'space-between' }}>
              <BilingualLabel english="Buyer Name" tamil="கொள்முதல்காரர்" mode={language} fontSize={10} />
              <Text style={{ fontSize: 10 }}>{auction.buyer_name}</Text>
            </View>
          )}
        </View>
        
        {/* Warning */}
        {isNotice && (
          <View style={pdfStyles.warningBox}>
            <BilingualText
              english="WARNING: Please settle the outstanding amount before the auction date to redeem your gold ornaments. After auction, no claims will be entertained."
              tamil="எச்சரிக்கை: உங்கள் தங்க நகைகளை மீட்க ஏல தேதிக்கு முன் நிலுவைத் தொகையை செலுத்தவும். ஏலத்திற்குப் பிறகு, எந்த உரிமைகோரலும் ஏற்றுக்கொள்ளப்படாது."
              mode={language}
              fontSize={9}
              textAlign="center"
            />
          </View>
        )}
        
        {/* Signatures */}
        <PDFFooter
          footerEnglish={footerEnglish}
          footerTamil={footerTamil}
          language={language}
          showSignatures={true}
          signatureLabels={isNotice ? [
            { english: 'Branch Manager', tamil: 'கிளை மேலாளர்' },
            { english: 'Company Seal', tamil: 'நிறுவன முத்திரை' },
          ] : [
            { english: 'Buyer Signature', tamil: 'கொள்முதல்காரர் கையொப்பம்' },
            { english: 'Authorized Signature', tamil: 'அங்கீகரிக்கப்பட்ட கையொப்பம்' },
          ]}
        />
        
        <Text style={pdfStyles.pageNumber} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} fixed />
      </Page>
    </Document>
  );
}
