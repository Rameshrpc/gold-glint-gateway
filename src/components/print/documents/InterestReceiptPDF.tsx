import React from 'react';
import { Document, Page, View, Text } from '@react-pdf/renderer';
import { pdfStyles, PAPER_SIZES, formatCurrencyPrint, formatDatePrint } from '../shared/PDFStyles';
import { PDFHeader } from '../shared/PDFHeader';
import { PDFFooter } from '../shared/PDFFooter';
import { BilingualLabel, BilingualValueRow, LanguageMode } from '@/lib/bilingual-utils';
import { fontsRegistered } from '@/lib/pdf-fonts';

// Ensure fonts are loaded
const _fonts = fontsRegistered;

interface InterestPayment {
  receipt_number: string;
  payment_date: string;
  payment_mode: string;
  amount_paid: number;
  shown_interest?: number;
  actual_interest?: number;
  penalty_amount?: number;
  days_covered: number;
  period_from: string;
  period_to: string;
  principal_reduction?: number;
  remarks?: string | null;
}

interface Loan {
  loan_number: string;
  principal_amount: number;
  actual_principal?: number;
  interest_rate: number;
}

interface Customer {
  customer_code: string;
  full_name: string;
  phone: string;
}

interface InterestBreakdown {
  shownInterest?: number;
  penalty?: number;
  partPayment?: number;
  principalReduction?: number;
  newOutstanding?: number;
}

interface InterestReceiptPDFProps {
  payment: InterestPayment;
  loan: Loan;
  customer: Customer;
  breakdown?: InterestBreakdown;
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

export function InterestReceiptPDF({
  payment,
  loan,
  customer,
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
}: InterestReceiptPDFProps) {
  const pageSize = PAPER_SIZES[paperSize];
  
  // Use breakdown if provided, otherwise use payment values
  const shownInterest = breakdown?.shownInterest ?? payment.shown_interest ?? 0;
  const penaltyAmount = breakdown?.penalty ?? payment.penalty_amount ?? 0;
  const principalReduction = breakdown?.principalReduction ?? payment.principal_reduction ?? 0;
  const newOutstanding = breakdown?.newOutstanding ?? (loan.actual_principal ?? loan.principal_amount);
  
  return (
    <Document>
      <Page size={[pageSize.width, pageSize.height]} style={pdfStyles.page}>
        <PDFHeader
          companyName={companyName}
          branchName={branchName}
          date={payment.payment_date}
          documentNumber={payment.receipt_number}
          sloganEnglish={sloganEnglish}
          sloganTamil={sloganTamil}
          language={language}
          logoUrl={logoUrl}
        />
        
        {/* Document Title */}
        <View style={pdfStyles.documentTitle}>
          <BilingualLabel
            english="INTEREST PAYMENT RECEIPT"
            tamil="வட்டி செலுத்திய ரசீது"
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
                value={customer.phone}
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
                labelEn="Outstanding Principal"
                labelTa="நிலுவை அசல்"
                value={formatCurrencyPrint(loan.actual_principal ?? loan.principal_amount)}
                mode={language}
              />
              <BilingualValueRow
                labelEn="Interest Rate"
                labelTa="வட்டி விகிதம்"
                value={`${loan.interest_rate}% p.m.`}
                mode={language}
              />
            </View>
          </View>
        </View>
        
        {/* Payment Details */}
        <View style={pdfStyles.section}>
          <View style={pdfStyles.sectionTitle}>
            <BilingualLabel
              english="Payment Details"
              tamil="செலுத்தல் விவரங்கள்"
              mode={language}
              fontSize={11}
              fontWeight="bold"
            />
          </View>
          
          <View style={pdfStyles.twoColumn}>
            <View style={pdfStyles.column}>
              <BilingualValueRow
                labelEn="Receipt Number"
                labelTa="ரசீது எண்"
                value={payment.receipt_number}
                mode={language}
              />
              <BilingualValueRow
                labelEn="Payment Date"
                labelTa="செலுத்திய தேதி"
                value={formatDatePrint(payment.payment_date)}
                mode={language}
              />
              <BilingualValueRow
                labelEn="Payment Mode"
                labelTa="செலுத்தும் முறை"
                value={payment.payment_mode.toUpperCase()}
                mode={language}
              />
            </View>
            <View style={pdfStyles.column}>
              <BilingualValueRow
                labelEn="Period From"
                labelTa="காலம் தொடக்கம்"
                value={formatDatePrint(payment.period_from)}
                mode={language}
              />
              <BilingualValueRow
                labelEn="Period To"
                labelTa="காலம் முடிவு"
                value={formatDatePrint(payment.period_to)}
                mode={language}
              />
              <BilingualValueRow
                labelEn="Days Covered"
                labelTa="நாட்கள்"
                value={`${payment.days_covered} days`}
                mode={language}
              />
            </View>
          </View>
        </View>
        
        {/* Amount Summary */}
        <View style={pdfStyles.amountBox}>
          <View style={pdfStyles.sectionTitle}>
            <BilingualLabel
              english="Amount Summary"
              tamil="தொகை சுருக்கம்"
              mode={language}
              fontSize={11}
              fontWeight="bold"
            />
          </View>
          
          <View style={pdfStyles.amountRow}>
            <BilingualLabel english="Interest Amount" tamil="வட்டி தொகை" mode={language} fontSize={10} />
            <Text style={pdfStyles.amountValue}>{formatCurrencyPrint(shownInterest)}</Text>
          </View>
          
          {penaltyAmount > 0 && (
            <View style={pdfStyles.amountRow}>
              <BilingualLabel english="Penalty Amount" tamil="அபராத தொகை" mode={language} fontSize={10} color="#c00" />
              <Text style={[pdfStyles.amountValue, { color: '#c00' }]}>{formatCurrencyPrint(penaltyAmount)}</Text>
            </View>
          )}
          
          {principalReduction > 0 && (
            <View style={pdfStyles.amountRow}>
              <BilingualLabel english="Principal Reduction" tamil="அசல் குறைப்பு" mode={language} fontSize={10} color="#060" />
              <Text style={[pdfStyles.amountValue, { color: '#060' }]}>{formatCurrencyPrint(principalReduction)}</Text>
            </View>
          )}
          
          <View style={pdfStyles.amountTotal}>
            <BilingualLabel english="Total Paid" tamil="மொத்தம் செலுத்தியது" mode={language} fontSize={12} fontWeight="bold" />
            <Text style={pdfStyles.amountTotalValue}>{formatCurrencyPrint(payment.amount_paid)}</Text>
          </View>
        </View>
        
        {payment.remarks && (
          <View style={{ marginTop: 12, padding: 8, backgroundColor: '#f9f9f9', borderRadius: 4 }}>
            <Text style={{ fontSize: 9, color: '#555' }}>Remarks: {payment.remarks}</Text>
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
            { english: 'Authorized Signature', tamil: 'அங்கீகரிக்கப்பட்ட கையொப்பம்' },
          ]}
        />
        
        <Text style={pdfStyles.pageNumber} render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`} fixed />
      </Page>
    </Document>
  );
}
