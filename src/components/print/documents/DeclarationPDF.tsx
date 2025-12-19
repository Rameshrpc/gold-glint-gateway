import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import { formatDatePrint, formatIndianCurrencyPrint } from '@/lib/print-utils';
import { translations } from '@/lib/translations';
import '@/lib/pdf-fonts';

type LanguageMode = 'bilingual' | 'english' | 'tamil';

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
    padding: 35,
    fontFamily: 'Roboto',
    fontSize: 9,
  },
  header: {
    flexDirection: 'row',
    marginBottom: 20,
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
    textDecoration: 'underline',
  },
  subtitleTamil: {
    fontSize: 10,
    fontFamily: 'Noto Sans Tamil',
    color: '#B45309',
    marginTop: 2,
  },
  datePlace: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
    fontSize: 9,
  },
  refSection: {
    backgroundColor: '#f3f4f6',
    padding: 8,
    marginBottom: 15,
    borderRadius: 2,
  },
  body: {
    marginTop: 10,
    lineHeight: 1.7,
  },
  paragraph: {
    fontSize: 10,
    marginBottom: 12,
    textAlign: 'justify',
  },
  paragraphTamil: {
    fontSize: 9,
    fontFamily: 'Noto Sans Tamil',
    marginTop: 4,
    marginBottom: 12,
    textAlign: 'justify',
    color: '#555',
  },
  bold: {
    fontWeight: 'bold',
  },
  declarationList: {
    marginLeft: 15,
    marginBottom: 12,
  },
  listItem: {
    fontSize: 9,
    marginBottom: 6,
    lineHeight: 1.5,
  },
  listItemTamil: {
    fontSize: 8,
    fontFamily: 'Noto Sans Tamil',
    marginLeft: 15,
    marginBottom: 8,
    lineHeight: 1.4,
    color: '#555',
  },
  acknowledgement: {
    marginTop: 15,
    padding: 12,
    borderWidth: 2,
    borderColor: '#B45309',
    backgroundColor: '#fffbeb',
    borderRadius: 3,
  },
  acknowledgementTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#B45309',
    marginBottom: 6,
  },
  acknowledgementTitleTamil: {
    fontSize: 9,
    fontFamily: 'Noto Sans Tamil',
    color: '#B45309',
  },
  signatureSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 40,
    paddingTop: 15,
  },
  signatureBox: {
    width: '40%',
    textAlign: 'center',
  },
  signatureLine: {
    borderTopWidth: 1,
    borderTopColor: '#000',
    paddingTop: 6,
    fontSize: 9,
  },
  signatureTamil: {
    fontSize: 7,
    fontFamily: 'Noto Sans Tamil',
    color: '#666',
    marginTop: 2,
  },
  signatureDetails: {
    fontSize: 8,
    color: '#666',
    marginTop: 3,
  },
  footer: {
    position: 'absolute',
    bottom: 25,
    left: 35,
    right: 35,
    textAlign: 'center',
    fontSize: 7,
    color: '#666',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 8,
  },
  footerTamil: {
    fontSize: 6,
    fontFamily: 'Noto Sans Tamil',
    color: '#888',
    marginTop: 2,
  },
});

export default function DeclarationPDF({ data, config }: DeclarationPDFProps) {
  const mode = config?.language || 'bilingual';
  const today = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
  const t = translations;

  // Declaration clauses in English and Tamil
  const clauses = [
    {
      en: `I/We have availed a Gold Loan of ${formatIndianCurrencyPrint(data.principal_amount || 0)} from ${data.client?.company_name || 'the Company'} under the scheme "${data.scheme?.scheme_name || '___'}" at an interest rate of ${data.scheme?.shown_rate || '___'}% per annum.`,
      ta: `நான்/நாங்கள் "${data.scheme?.scheme_name || '___'}" திட்டத்தின் கீழ் ${data.client?.company_name || 'நிறுவனத்திடமிருந்து'} ${formatIndianCurrencyPrint(data.principal_amount || 0)} தங்கக் கடன் பெற்றுள்ளேன்/ளோம், வட்டி விகிதம் ஆண்டுக்கு ${data.scheme?.shown_rate || '___'}%.`
    },
    {
      en: 'I/We confirm that the gold ornaments pledged as security are my/our own property, legally acquired, and free from all encumbrances, liens, and claims.',
      ta: 'அடமானமாக வைக்கப்பட்ட தங்க நகைகள் என்/எங்கள் சொந்த சொத்து, சட்டப்படி பெறப்பட்டவை, மற்றும் அனைத்து சுமைகள், உரிமைக் கோரல்கள் மற்றும் கோரிக்கைகளிலிருந்து விடுபட்டவை என்பதை உறுதிப்படுத்துகிறேன்/கிறோம்.'
    },
    {
      en: 'I/We have read and understood all the terms and conditions of the loan agreement and agree to abide by them.',
      ta: 'கடன் ஒப்பந்தத்தின் அனைத்து விதிமுறைகளையும் நிபந்தனைகளையும் படித்து புரிந்துகொண்டேன்/கொண்டோம், அவற்றைப் பின்பற்ற ஒப்புக்கொள்கிறேன்/கிறோம்.'
    },
    {
      en: 'I/We understand that in case of default in repayment, the Company has the right to auction the pledged gold items to recover the outstanding amount.',
      ta: 'திருப்பிச் செலுத்துவதில் தவறு ஏற்பட்டால், நிலுவைத் தொகையை வசூலிக்க அடமான தங்கப் பொருட்களை ஏலம் விடும் உரிமை நிறுவனத்திற்கு உள்ளது என்பதை புரிந்துகொள்கிறேன்/கிறோம்.'
    },
    {
      en: 'I/We undertake to pay the interest on or before the due date and repay the principal amount on or before the maturity date.',
      ta: 'குறித்த தேதியில் அல்லது அதற்கு முன் வட்டி செலுத்துவதாகவும், முதிர்வு தேதியில் அல்லது அதற்கு முன் அசல் தொகையை திருப்பிச் செலுத்துவதாகவும் உறுதியளிக்கிறேன்/கிறோம்.'
    },
    {
      en: 'I/We confirm that all information provided in the loan application and KYC documents is true and correct to the best of my/our knowledge.',
      ta: 'கடன் விண்ணப்பம் மற்றும் KYC ஆவணங்களில் வழங்கப்பட்ட அனைத்து தகவல்களும் எனக்கு/எங்களுக்கு தெரிந்தவரை உண்மையானவை மற்றும் சரியானவை என்பதை உறுதிப்படுத்துகிறேன்/கிறோம்.'
    },
    {
      en: 'I/We authorize the Company to contact me/us at the provided phone numbers and address for any loan-related communications.',
      ta: 'கடன் தொடர்பான தகவல் தொடர்புகளுக்கு கொடுக்கப்பட்ட தொலைபேசி எண்கள் மற்றும் முகவரியில் என்னை/எங்களை தொடர்பு கொள்ள நிறுவனத்திற்கு அங்கீகாரம் அளிக்கிறேன்/கிறோம்.'
    },
  ];

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
            <Text style={styles.subtitle}>BORROWER'S DECLARATION & UNDERTAKING</Text>
            {mode !== 'english' && <Text style={styles.subtitleTamil}>கடன் வாங்குபவரின் உறுதிமொழி மற்றும் பொறுப்பேற்பு</Text>}
          </View>
        </View>

        {/* Date and Place */}
        <View style={styles.datePlace}>
          <Text>{t.date.en}: {today}</Text>
          <Text>{t.place.en}: {data.branch?.branch_name || '_____________'}</Text>
        </View>

        {/* Reference */}
        <View style={styles.refSection}>
          <Text style={{ fontSize: 9 }}>
            {t.loanNumber.en}: <Text style={styles.bold}>{data.loan_number || '-'}</Text>
            {'    '}|{'    '}
            {t.loanDate.en}: <Text style={styles.bold}>{data.loan_date ? formatDatePrint(data.loan_date) : '-'}</Text>
          </Text>
        </View>

        {/* Body */}
        <View style={styles.body}>
          <Text style={styles.paragraph}>
            I/We, <Text style={styles.bold}>{data.customer?.full_name || '_______________'}</Text>, 
            Customer Code: <Text style={styles.bold}>{data.customer?.customer_code || '_______________'}</Text>,
            residing at <Text style={styles.bold}>{data.customer?.address || '_______________'}</Text>, 
            do hereby solemnly declare and undertake as follows:
          </Text>
          {mode !== 'english' && (
            <Text style={styles.paragraphTamil}>
              நான்/நாங்கள், <Text style={styles.bold}>{data.customer?.full_name || '_______________'}</Text>, 
              வாடிக்கையாளர் குறியீடு: <Text style={styles.bold}>{data.customer?.customer_code || '_______________'}</Text>,
              வசிக்கும் முகவரி: <Text style={styles.bold}>{data.customer?.address || '_______________'}</Text>, 
              பின்வருமாறு உறுதியளிக்கிறேன்/கிறோம்:
            </Text>
          )}

          <View style={styles.declarationList}>
            {clauses.map((clause, index) => (
              <View key={index}>
                <Text style={styles.listItem}>
                  {index + 1}. {clause.en}
                </Text>
                {mode !== 'english' && (
                  <Text style={styles.listItemTamil}>
                    {clause.ta}
                  </Text>
                )}
              </View>
            ))}
          </View>

          <View style={styles.acknowledgement}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
              <Text style={styles.acknowledgementTitle}>ACKNOWLEDGEMENT</Text>
              {mode !== 'english' && <Text style={[styles.acknowledgementTitleTamil, { marginLeft: 8 }]}>ஒப்புக்கொள்ளல்</Text>}
            </View>
            <Text style={[styles.paragraph, { marginBottom: 0 }]}>
              I/We acknowledge receiving <Text style={styles.bold}>{formatIndianCurrencyPrint(data.net_disbursed || 0)}</Text> as 
              net disbursement amount after deducting applicable charges and advance interest as per the loan terms.
            </Text>
            {mode !== 'english' && (
              <Text style={[styles.paragraphTamil, { marginBottom: 0 }]}>
                கடன் விதிமுறைகளின்படி பொருந்தும் கட்டணங்கள் மற்றும் முன்கூட்டி வட்டியைக் கழித்த பின் 
                நிகர வழங்கல் தொகையாக <Text style={styles.bold}>{formatIndianCurrencyPrint(data.net_disbursed || 0)}</Text> பெற்றுக்கொண்டேன்/கொண்டோம்.
              </Text>
            )}
          </View>
        </View>

        {/* Signature Section */}
        <View style={styles.signatureSection}>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureLine}>{t.customerSignature.en}</Text>
            {mode !== 'english' && <Text style={styles.signatureTamil}>{t.customerSignature.ta}</Text>}
            <Text style={styles.signatureDetails}>{data.customer?.full_name || ''}</Text>
            <Text style={styles.signatureDetails}>{data.customer?.phone || ''}</Text>
          </View>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureLine}>For {data.client?.company_name || 'Company'}</Text>
            <Text style={styles.signatureDetails}>{t.authorizedSignature.en}</Text>
            {mode !== 'english' && <Text style={styles.signatureTamil}>{t.authorizedSignature.ta}</Text>}
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text>This declaration is an integral part of the loan agreement and must be preserved.</Text>
          {mode !== 'english' && (
            <Text style={styles.footerTamil}>
              இந்த உறுதிமொழி கடன் ஒப்பந்தத்தின் ஒரு அங்கமாகும், இதை பாதுகாக்க வேண்டும்.
            </Text>
          )}
        </View>
      </Page>
    </Document>
  );
}
