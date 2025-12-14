import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';
import { formatDatePrint, formatIndianCurrencyPrint } from '@/lib/print-utils';

Font.register({
  family: 'Roboto',
  fonts: [
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular-webfont.ttf', fontWeight: 'normal' },
    { src: 'https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-bold-webfont.ttf', fontWeight: 'bold' },
  ],
});

interface DeclarationPDFProps {
  data: {
    loan_number?: string;
    loan_date?: string;
    principal_amount?: number;
    net_disbursed?: number;
    customer?: {
      full_name: string;
      customer_code: string;
      phone: string;
      address?: string;
    };
    scheme?: {
      scheme_name: string;
      shown_rate?: number;
    };
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
    padding: 40,
    fontFamily: 'Roboto',
    fontSize: 10,
  },
  header: {
    textAlign: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#B45309',
    marginBottom: 10,
    textDecoration: 'underline',
  },
  datePlace: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  body: {
    marginTop: 20,
    lineHeight: 1.8,
  },
  paragraph: {
    fontSize: 10,
    marginBottom: 15,
    textAlign: 'justify',
  },
  bold: {
    fontWeight: 'bold',
  },
  declarationList: {
    marginLeft: 20,
    marginBottom: 15,
  },
  listItem: {
    fontSize: 10,
    marginBottom: 8,
    lineHeight: 1.6,
  },
  acknowledgement: {
    marginTop: 20,
    padding: 15,
    borderWidth: 1,
    borderColor: '#B45309',
    backgroundColor: '#fffbeb',
  },
  signatureSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 60,
    paddingTop: 20,
  },
  signatureBox: {
    width: '40%',
    textAlign: 'center',
  },
  signatureLine: {
    borderTopWidth: 1,
    borderTopColor: '#000',
    paddingTop: 8,
    fontSize: 9,
  },
  signatureDetails: {
    fontSize: 8,
    color: '#666',
    marginTop: 3,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    fontSize: 8,
    color: '#666',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 10,
  },
});

export default function DeclarationPDF({ data, config }: DeclarationPDFProps) {
  const today = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{data.client?.company_name || 'Gold Loan Company'}</Text>
          <Text style={styles.subtitle}>BORROWER'S DECLARATION & UNDERTAKING</Text>
        </View>

        {/* Date and Place */}
        <View style={styles.datePlace}>
          <Text>Date: {today}</Text>
          <Text>Place: {data.branch?.branch_name || '_____________'}</Text>
        </View>

        {/* Reference */}
        <View style={{ marginBottom: 20 }}>
          <Text style={{ fontSize: 9 }}>Loan Reference: <Text style={styles.bold}>{data.loan_number || '-'}</Text></Text>
        </View>

        {/* Body */}
        <View style={styles.body}>
          <Text style={styles.paragraph}>
            I/We, <Text style={styles.bold}>{data.customer?.full_name || '_______________'}</Text>, 
            Customer Code: <Text style={styles.bold}>{data.customer?.customer_code || '_______________'}</Text>,
            residing at <Text style={styles.bold}>{data.customer?.address || '_______________'}</Text>, 
            do hereby solemnly declare and undertake as follows:
          </Text>

          <View style={styles.declarationList}>
            <Text style={styles.listItem}>
              1. I/We have availed a Gold Loan of <Text style={styles.bold}>{formatIndianCurrencyPrint(data.principal_amount || 0)}</Text> from 
              {data.client?.company_name || ' the Company'} under the scheme "{data.scheme?.scheme_name || '___'}" 
              at an interest rate of <Text style={styles.bold}>{data.scheme?.shown_rate || '___'}% per annum</Text>.
            </Text>
            
            <Text style={styles.listItem}>
              2. I/We confirm that the gold ornaments pledged as security are my/our own property, 
              legally acquired, and free from all encumbrances, liens, and claims.
            </Text>
            
            <Text style={styles.listItem}>
              3. I/We have read and understood all the terms and conditions of the loan agreement 
              and agree to abide by them.
            </Text>
            
            <Text style={styles.listItem}>
              4. I/We understand that in case of default in repayment, the Company has the right 
              to auction the pledged gold items to recover the outstanding amount.
            </Text>
            
            <Text style={styles.listItem}>
              5. I/We undertake to pay the interest on or before the due date and repay the 
              principal amount on or before the maturity date.
            </Text>
            
            <Text style={styles.listItem}>
              6. I/We confirm that all information provided in the loan application and KYC 
              documents is true and correct to the best of my/our knowledge.
            </Text>
            
            <Text style={styles.listItem}>
              7. I/We authorize the Company to contact me/us at the provided phone numbers and 
              address for any loan-related communications.
            </Text>
          </View>

          <View style={styles.acknowledgement}>
            <Text style={[styles.paragraph, { marginBottom: 0 }]}>
              <Text style={styles.bold}>ACKNOWLEDGEMENT:</Text> I/We acknowledge receiving 
              <Text style={styles.bold}> {formatIndianCurrencyPrint(data.net_disbursed || 0)} </Text> 
              as net disbursement amount after deducting applicable charges and advance interest 
              as per the loan terms.
            </Text>
          </View>
        </View>

        {/* Signature Section */}
        <View style={styles.signatureSection}>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureLine}>Borrower's Signature</Text>
            <Text style={styles.signatureDetails}>{data.customer?.full_name || ''}</Text>
            <Text style={styles.signatureDetails}>{data.customer?.phone || ''}</Text>
          </View>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureLine}>For {data.client?.company_name || 'Company'}</Text>
            <Text style={styles.signatureDetails}>Authorized Signatory</Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>This declaration is an integral part of the loan agreement and must be preserved.</Text>
        </View>
      </Page>
    </Document>
  );
}
