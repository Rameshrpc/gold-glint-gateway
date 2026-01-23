import React from 'react';
import { Document, Page, View, Text } from '@react-pdf/renderer';
import { pdfStyles, PAPER_SIZES, formatCurrencyPrint, formatDatePrint, formatWeightPrint } from '../shared/PDFStyles';
import { PDFHeader } from '../shared/PDFHeader';
import { PDFFooter } from '../shared/PDFFooter';
import { BilingualLabel, BilingualValueRow, LanguageMode } from '@/lib/bilingual-utils';
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
  market_value?: number | null;
  item_count?: number;
  remarks?: string | null;
}

interface Redemption {
  redemption_number: string;
  redemption_date: string;
  outstanding_principal?: number;
  interest_due?: number;
  penalty_amount?: number;
  rebate_amount?: number;
  total_settlement?: number;
  amount_received?: number;
  payment_mode: string;
  released_to?: string;
}

interface Loan {
  loan_number: string;
  loan_date?: string;
  principal_amount: number;
}

interface Customer {
  customer_code: string;
  full_name: string;
  phone?: string;
  address?: string | null;
}

interface RedemptionBreakdown {
  principal: number;
  interest: number;
  penalty: number;
  rebate: number;
  total: number;
}

interface RedemptionReceiptPDFProps {
  redemption: Redemption;
  loan: Loan;
  customer: Customer;
  goldItems: GoldItem[];
  breakdown?: RedemptionBreakdown;
  companyName: string;
  branchName?: string;
  language?: LanguageMode;
  paperSize?: 'A4' | 'Legal' | 'Letter';
  footerEnglish?: string | null;
  footerTamil?: string | null;
  sloganEnglish?: string | null;
  sloganTamil?: string | null;
  logoUrl?: string | null;
}

export function RedemptionReceiptPDF({
  redemption,
  loan,
  customer,
  goldItems,
  breakdown,
  companyName,
  branchName,
  language = 'bilingual',
  paperSize = 'A4',
  footerEnglish,
  footerTamil,
  sloganEnglish,
  sloganTamil,
  logoUrl,
}: RedemptionReceiptPDFProps) {
  const pageSize = PAPER_SIZES[paperSize];
  
  // Use breakdown if provided, otherwise use redemption values
  const principal = breakdown?.principal ?? redemption.outstanding_principal ?? 0;
  const interest = breakdown?.interest ?? redemption.interest_due ?? 0;
  const penalty = breakdown?.penalty ?? redemption.penalty_amount ?? 0;
  const rebate = breakdown?.rebate ?? redemption.rebate_amount ?? 0;
  const total = breakdown?.total ?? redemption.total_settlement ?? 0;
  
  const totalGrossWeight = goldItems.reduce((sum, item) => sum + item.gross_weight_grams, 0);
  const totalNetWeight = goldItems.reduce((sum, item) => sum + item.net_weight_grams, 0);
  const totalItemCount = goldItems.reduce((sum, item) => sum + (item.item_count || 1), 0);
  
  return (
    <Document>
      <Page size={[pageSize.width, pageSize.height]} style={pdfStyles.page}>
        <PDFHeader
          companyName={companyName}
          branchName={branchName}
          date={redemption.redemption_date}
          documentNumber={redemption.redemption_number}
          sloganEnglish={sloganEnglish}
          sloganTamil={sloganTamil}
          language={language}
          logoUrl={logoUrl}
        />
        
        {/* Document Title */}
        <View style={pdfStyles.documentTitle}>
          <BilingualLabel
            english="LOAN REDEMPTION RECEIPT"
            tamil="கடன் மீட்பு ரசீது"
            mode={language}
            fontSize={14}
            fontWeight="bold"
          />
        </View>
        
        {/* Customer & Loan Information */}
        <View style={pdfStyles.section}>
          <View style={pdfStyles.twoColumn}>
            <View style={pdfStyles.column}>
              <View style={pdfStyles.sectionTitle}>
                <BilingualLabel
                  english="Customer Details"
                  tamil="வாடிக்கையாளர் விவரங்கள்"
                  mode={language}
                  fontSize={11}
                  fontWeight="bold"
                />
              </View>
              <BilingualValueRow
                labelEn="Customer ID"
                labelTa="வாடிக்கையாளர் எண்"
                value={customer.customer_code}
                mode={language}
              />
              <BilingualValueRow
                labelEn="Name"
                labelTa="பெயர்"
                value={customer.full_name}
                mode={language}
              />
              <BilingualValueRow
                labelEn="Phone"
                labelTa="தொலைபேசி"
                value={customer.phone || '-'}
                mode={language}
              />
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
              <BilingualValueRow
                labelEn="Loan Date"
                labelTa="கடன் தேதி"
                value={loan.loan_date ? formatDatePrint(loan.loan_date) : '-'}
                mode={language}
              />
              <BilingualValueRow
                labelEn="Original Principal"
                labelTa="அசல் தொகை"
                value={formatCurrencyPrint(loan.principal_amount)}
                mode={language}
              />
            </View>
          </View>
        </View>
        
        {/* Gold Items Released */}
        <View style={pdfStyles.section}>
          <View style={pdfStyles.sectionTitle}>
            <BilingualLabel
              english="Gold Items Released"
              tamil="வெளியிடப்பட்ட தங்க பொருட்கள்"
              mode={language}
              fontSize={11}
              fontWeight="bold"
            />
          </View>
          
          <View style={pdfStyles.table}>
            <View style={pdfStyles.tableHeader}>
              <Text style={[pdfStyles.tableHeaderCell, { width: '6%' }]}>S.No</Text>
              <Text style={[pdfStyles.tableHeaderCell, { width: '22%', textAlign: 'left' }]}>Item / பொருள்</Text>
              <Text style={[pdfStyles.tableHeaderCell, { width: '8%' }]}>Nos</Text>
              <Text style={[pdfStyles.tableHeaderCell, { width: '14%' }]}>Gross Wt</Text>
              <Text style={[pdfStyles.tableHeaderCell, { width: '14%' }]}>Net Wt</Text>
              <Text style={[pdfStyles.tableHeaderCell, { width: '10%' }]}>Purity</Text>
              <Text style={[pdfStyles.tableHeaderCell, { width: '26%' }]}>Remarks</Text>
            </View>
            
            {goldItems.map((item, index) => (
              <View key={item.id} style={pdfStyles.tableRow}>
                <Text style={[pdfStyles.tableCell, { width: '6%' }]}>{index + 1}</Text>
                <Text style={[pdfStyles.tableCellLeft, { width: '22%' }]}>{item.item_type}</Text>
                <Text style={[pdfStyles.tableCell, { width: '8%' }]}>{item.item_count || 1}</Text>
                <Text style={[pdfStyles.tableCell, { width: '14%' }]}>{formatWeightPrint(item.gross_weight_grams)}</Text>
                <Text style={[pdfStyles.tableCell, { width: '14%' }]}>{formatWeightPrint(item.net_weight_grams)}</Text>
                <Text style={[pdfStyles.tableCell, { width: '10%' }]}>{item.purity}</Text>
                <Text style={[pdfStyles.tableCellLeft, { width: '26%', fontSize: 8 }]}>{item.remarks || '-'}</Text>
              </View>
            ))}
            
            <View style={[pdfStyles.tableRow, { backgroundColor: '#f0f0f0' }]}>
              <Text style={[pdfStyles.tableHeaderCell, { width: '28%', textAlign: 'right' }]}>Total / மொத்தம்</Text>
              <Text style={[pdfStyles.tableHeaderCell, { width: '8%' }]}>{totalItemCount}</Text>
              <Text style={[pdfStyles.tableHeaderCell, { width: '14%' }]}>{formatWeightPrint(totalGrossWeight)}</Text>
              <Text style={[pdfStyles.tableHeaderCell, { width: '14%' }]}>{formatWeightPrint(totalNetWeight)}</Text>
              <Text style={[pdfStyles.tableHeaderCell, { width: '10%' }]}>-</Text>
              <Text style={[pdfStyles.tableHeaderCell, { width: '26%' }]}></Text>
            </View>
          </View>
        </View>
        
        {/* Settlement Summary */}
        <View style={pdfStyles.amountBox}>
          <View style={pdfStyles.sectionTitle}>
            <BilingualLabel
              english="Settlement Summary"
              tamil="தீர்வு சுருக்கம்"
              mode={language}
              fontSize={11}
              fontWeight="bold"
            />
          </View>
          
          <View style={pdfStyles.amountRow}>
            <BilingualLabel english="Outstanding Principal" tamil="நிலுவை அசல்" mode={language} fontSize={10} />
            <Text style={pdfStyles.amountValue}>{formatCurrencyPrint(principal)}</Text>
          </View>
          
          <View style={pdfStyles.amountRow}>
            <BilingualLabel english="Interest Due" tamil="நிலுவை வட்டி" mode={language} fontSize={10} />
            <Text style={pdfStyles.amountValue}>{formatCurrencyPrint(interest)}</Text>
          </View>
          
          {penalty > 0 && (
            <View style={pdfStyles.amountRow}>
              <BilingualLabel english="Penalty Amount" tamil="அபராத தொகை" mode={language} fontSize={10} color="#c00" />
              <Text style={[pdfStyles.amountValue, { color: '#c00' }]}>+ {formatCurrencyPrint(penalty)}</Text>
            </View>
          )}
          
          {rebate > 0 && (
            <View style={pdfStyles.amountRow}>
              <BilingualLabel english="Rebate (Early Closure)" tamil="தள்ளுபடி" mode={language} fontSize={10} color="#060" />
              <Text style={[pdfStyles.amountValue, { color: '#060' }]}>- {formatCurrencyPrint(rebate)}</Text>
            </View>
          )}
          
          <View style={pdfStyles.amountTotal}>
            <BilingualLabel english="Total Settlement" tamil="மொத்த தீர்வு" mode={language} fontSize={12} fontWeight="bold" />
            <Text style={pdfStyles.amountTotalValue}>{formatCurrencyPrint(total)}</Text>
          </View>
          
          <View style={{ marginTop: 8, flexDirection: 'row', justifyContent: 'space-between' }}>
            <BilingualLabel english="Payment Mode" tamil="செலுத்தும் முறை" mode={language} fontSize={9} color="#555" />
            <Text style={{ fontSize: 9 }}>{redemption.payment_mode.toUpperCase()}</Text>
          </View>
        </View>
        
        {/* Gold Release Confirmation */}
        {redemption.released_to && (
          <View style={{ marginTop: 12, padding: 10, borderWidth: 1, borderColor: '#000', backgroundColor: '#f9f9f9' }}>
            <BilingualLabel
              english="Gold Released To"
              tamil="தங்கம் வழங்கப்பட்டவர்"
              mode={language}
              fontSize={10}
              fontWeight="bold"
            />
            <Text style={{ fontSize: 11, fontWeight: 'bold', marginTop: 4 }}>{redemption.released_to}</Text>
          </View>
        )}
        
        {/* Signatures */}
        <PDFFooter
          footerEnglish={footerEnglish}
          footerTamil={footerTamil}
          language={language}
          showSignatures={true}
          signatureLabels={[
            { english: 'Customer Signature', tamil: 'வாடிக்கையாளர் கையொப்பம்' },
            { english: 'Gold Received By', tamil: 'தங்கம் பெற்றவர்' },
            { english: 'Authorized Signature', tamil: 'அங்கீகரிக்கப்பட்ட கையொப்பம்' },
          ]}
        />
        
        <Text style={pdfStyles.pageNumber} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} fixed />
      </Page>
    </Document>
  );
}
