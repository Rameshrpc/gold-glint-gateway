import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import { formatDatePrint } from '@/lib/print-utils';
import { translations } from '@/lib/translations';
import '@/lib/pdf-fonts';

type LanguageMode = 'bilingual' | 'english' | 'tamil';

interface KycDocumentPDFProps {
  data: {
    customer?: {
      full_name: string;
      customer_code: string;
      phone: string;
      address?: string;
      city?: string;
      state?: string;
      pincode?: string;
      date_of_birth?: string;
      gender?: string;
      occupation?: string;
      photo_url?: string;
      aadhaar_front_url?: string;
      aadhaar_back_url?: string;
      pan_card_url?: string;
      nominee_name?: string;
      nominee_relation?: string;
    };
    loan_number?: string;
    loan_date?: string;
    client?: {
      company_name: string;
      address?: string;
      phone?: string;
      logo_url?: string;
    };
    branch?: {
      branch_name: string;
      address?: string;
    };
  };
  config?: {
    language?: LanguageMode;
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
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 11,
    color: '#B45309',
    marginBottom: 3,
  },
  subtitleTamil: {
    fontSize: 10,
    fontFamily: 'Noto Sans Tamil',
    color: '#B45309',
  },
  branchText: {
    fontSize: 8,
    color: '#666',
  },
  loanRefRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#f3f4f6',
    padding: 6,
    marginBottom: 12,
    borderRadius: 2,
  },
  mainContent: {
    flexDirection: 'row',
    gap: 15,
  },
  leftColumn: {
    width: '65%',
  },
  rightColumn: {
    width: '35%',
    alignItems: 'center',
  },
  section: {
    marginBottom: 12,
    padding: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 3,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 6,
    color: '#B45309',
    borderBottomWidth: 1,
    borderBottomColor: '#fef3c7',
    paddingBottom: 3,
  },
  sectionTitleTamil: {
    fontSize: 8,
    fontFamily: 'Noto Sans Tamil',
    color: '#B45309',
  },
  row: {
    flexDirection: 'row',
    marginBottom: 4,
    alignItems: 'flex-start',
  },
  label: {
    width: '40%',
    fontSize: 8,
    color: '#666',
  },
  labelTamil: {
    fontSize: 7,
    fontFamily: 'Noto Sans Tamil',
    color: '#888',
  },
  value: {
    width: '60%',
    fontSize: 9,
    fontWeight: 'bold',
  },
  photoContainer: {
    width: 100,
    height: 120,
    borderWidth: 2,
    borderColor: '#B45309',
    marginBottom: 8,
    backgroundColor: '#f9fafb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photo: {
    width: 96,
    height: 116,
    objectFit: 'cover',
  },
  photoPlaceholder: {
    fontSize: 8,
    color: '#999',
    textAlign: 'center',
  },
  photoLabel: {
    fontSize: 8,
    color: '#666',
    textAlign: 'center',
    marginBottom: 4,
  },
  photoLabelTamil: {
    fontSize: 7,
    fontFamily: 'Noto Sans Tamil',
    color: '#888',
    textAlign: 'center',
  },
  documentSection: {
    marginTop: 15,
  },
  documentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  documentBox: {
    width: '48%',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 3,
    padding: 5,
  },
  documentImage: {
    width: '100%',
    height: 100,
    objectFit: 'contain',
    backgroundColor: '#f9fafb',
  },
  documentPlaceholder: {
    width: '100%',
    height: 100,
    backgroundColor: '#f9fafb',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderStyle: 'dashed',
  },
  documentLabel: {
    fontSize: 8,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 4,
    color: '#333',
  },
  documentLabelTamil: {
    fontSize: 7,
    fontFamily: 'Noto Sans Tamil',
    textAlign: 'center',
    color: '#666',
  },
  declarationSection: {
    marginTop: 15,
    padding: 10,
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fcd34d',
    borderRadius: 3,
  },
  declarationText: {
    fontSize: 8,
    lineHeight: 1.5,
  },
  declarationTamil: {
    fontSize: 7,
    fontFamily: 'Noto Sans Tamil',
    lineHeight: 1.4,
    marginTop: 4,
    color: '#666',
  },
  signatureSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 30,
    paddingTop: 15,
  },
  signatureBox: {
    width: '45%',
    textAlign: 'center',
  },
  signatureLine: {
    borderTopWidth: 1,
    borderTopColor: '#000',
    paddingTop: 5,
    fontSize: 9,
  },
  signatureTamil: {
    fontSize: 7,
    fontFamily: 'Noto Sans Tamil',
    color: '#666',
  },
});

// Bilingual label component
function BiLabel({ en, ta, mode, style }: { en: string; ta: string; mode: LanguageMode; style?: any }) {
  if (mode === 'english') return <Text style={style}>{en}</Text>;
  if (mode === 'tamil') return <Text style={[style, { fontFamily: 'Noto Sans Tamil' }]}>{ta}</Text>;
  return (
    <View>
      <Text style={style}>{en}</Text>
      <Text style={styles.labelTamil}>{ta}</Text>
    </View>
  );
}

export default function KycDocumentPDF({ data, config }: KycDocumentPDFProps) {
  const mode = config?.language || 'bilingual';
  const customer = data.customer;
  const client = data.client;
  const branch = data.branch;
  const t = translations;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          {client?.logo_url && (
            <View style={styles.logoContainer}>
              <Image src={client.logo_url} style={styles.logo} />
            </View>
          )}
          <View style={styles.headerContent}>
            <Text style={styles.title}>{client?.company_name || 'Gold Loan Company'}</Text>
            <Text style={styles.subtitle}>{t.kycDocuments.en}</Text>
            {mode !== 'english' && <Text style={styles.subtitleTamil}>{t.kycDocuments.ta}</Text>}
            {branch && <Text style={styles.branchText}>{t.branchName.en}: {branch.branch_name}</Text>}
          </View>
        </View>

        {/* Loan Reference */}
        {data.loan_number && (
          <View style={styles.loanRefRow}>
            <View>
              <Text style={{ fontWeight: 'bold', fontSize: 9 }}>{t.loanNumber.en}: {data.loan_number}</Text>
              {mode !== 'english' && <Text style={styles.labelTamil}>{t.loanNumber.ta}</Text>}
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={{ fontSize: 8 }}>{t.date.en}: {data.loan_date ? formatDatePrint(data.loan_date) : '-'}</Text>
              {mode !== 'english' && <Text style={styles.labelTamil}>{t.date.ta}</Text>}
            </View>
          </View>
        )}

        {/* Main Content - Two Columns */}
        <View style={styles.mainContent}>
          {/* Left Column - Details */}
          <View style={styles.leftColumn}>
            {/* Personal Information */}
            <View style={styles.section}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                <Text style={styles.sectionTitle}>Personal Information</Text>
                {mode !== 'english' && <Text style={[styles.sectionTitleTamil, { marginLeft: 8 }]}>தனிப்பட்ட தகவல்</Text>}
              </View>
              <View style={styles.row}>
                <View style={styles.label}>
                  <BiLabel en={t.customerId.en} ta={t.customerId.ta} mode={mode} style={{ fontSize: 8, color: '#666' }} />
                </View>
                <Text style={styles.value}>{customer?.customer_code || '-'}</Text>
              </View>
              <View style={styles.row}>
                <View style={styles.label}>
                  <BiLabel en={t.customerName.en} ta={t.customerName.ta} mode={mode} style={{ fontSize: 8, color: '#666' }} />
                </View>
                <Text style={styles.value}>{customer?.full_name || '-'}</Text>
              </View>
              <View style={styles.row}>
                <View style={styles.label}>
                  <BiLabel en={t.dateOfBirth.en} ta={t.dateOfBirth.ta} mode={mode} style={{ fontSize: 8, color: '#666' }} />
                </View>
                <Text style={styles.value}>{customer?.date_of_birth ? formatDatePrint(customer.date_of_birth) : '-'}</Text>
              </View>
              <View style={styles.row}>
                <View style={styles.label}>
                  <BiLabel en={t.gender.en} ta={t.gender.ta} mode={mode} style={{ fontSize: 8, color: '#666' }} />
                </View>
                <Text style={styles.value}>{customer?.gender || '-'}</Text>
              </View>
            </View>

            {/* Contact Information */}
            <View style={styles.section}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                <Text style={styles.sectionTitle}>Contact Information</Text>
                {mode !== 'english' && <Text style={[styles.sectionTitleTamil, { marginLeft: 8 }]}>தொடர்பு தகவல்</Text>}
              </View>
              <View style={styles.row}>
                <View style={styles.label}>
                  <BiLabel en={t.phone.en} ta={t.phone.ta} mode={mode} style={{ fontSize: 8, color: '#666' }} />
                </View>
                <Text style={styles.value}>{customer?.phone || '-'}</Text>
              </View>
              <View style={styles.row}>
                <View style={styles.label}>
                  <BiLabel en={t.address.en} ta={t.address.ta} mode={mode} style={{ fontSize: 8, color: '#666' }} />
                </View>
                <Text style={[styles.value, { fontSize: 8 }]}>{customer?.address || '-'}</Text>
              </View>
              <View style={styles.row}>
                <View style={styles.label}>
                  <Text style={{ fontSize: 8, color: '#666' }}>City/State/PIN</Text>
                </View>
                <Text style={[styles.value, { fontSize: 8 }]}>
                  {[customer?.city, customer?.state, customer?.pincode].filter(Boolean).join(', ') || '-'}
                </Text>
              </View>
            </View>

            {/* Nominee Information */}
            <View style={styles.section}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
                <Text style={styles.sectionTitle}>Nominee Information</Text>
                {mode !== 'english' && <Text style={[styles.sectionTitleTamil, { marginLeft: 8 }]}>வாரிசு தகவல்</Text>}
              </View>
              <View style={styles.row}>
                <View style={styles.label}>
                  <Text style={{ fontSize: 8, color: '#666' }}>Nominee Name</Text>
                  {mode !== 'english' && <Text style={styles.labelTamil}>வாரிசு பெயர்</Text>}
                </View>
                <Text style={styles.value}>{customer?.nominee_name || '-'}</Text>
              </View>
              <View style={styles.row}>
                <View style={styles.label}>
                  <Text style={{ fontSize: 8, color: '#666' }}>Relation</Text>
                  {mode !== 'english' && <Text style={styles.labelTamil}>உறவு</Text>}
                </View>
                <Text style={styles.value}>{customer?.nominee_relation || '-'}</Text>
              </View>
            </View>
          </View>

          {/* Right Column - Photo */}
          <View style={styles.rightColumn}>
            <Text style={styles.photoLabel}>{t.passportPhoto.en}</Text>
            {mode !== 'english' && <Text style={styles.photoLabelTamil}>{t.passportPhoto.ta}</Text>}
            <View style={styles.photoContainer}>
              {customer?.photo_url ? (
                <Image src={customer.photo_url} style={styles.photo} />
              ) : (
                <Text style={styles.photoPlaceholder}>{t.noImageAvailable.en}</Text>
              )}
            </View>
            <Text style={{ fontSize: 7, color: '#666', textAlign: 'center' }}>
              {customer?.customer_code}
            </Text>
          </View>
        </View>

        {/* Identity Documents Section */}
        <View style={styles.documentSection}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
            <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>{t.identityDocuments.en}</Text>
            {mode !== 'english' && <Text style={[styles.sectionTitleTamil, { marginLeft: 8 }]}>{t.identityDocuments.ta}</Text>}
          </View>

          {/* Aadhaar Cards */}
          <View style={styles.documentRow}>
            <View style={styles.documentBox}>
              <Text style={styles.documentLabel}>{t.aadhaarFront.en}</Text>
              {mode !== 'english' && <Text style={styles.documentLabelTamil}>{t.aadhaarFront.ta}</Text>}
              {customer?.aadhaar_front_url ? (
                <Image src={customer.aadhaar_front_url} style={styles.documentImage} />
              ) : (
                <View style={styles.documentPlaceholder}>
                  <Text style={{ fontSize: 8, color: '#999' }}>{t.noImageAvailable.en}</Text>
                </View>
              )}
            </View>
            <View style={styles.documentBox}>
              <Text style={styles.documentLabel}>{t.aadhaarBack.en}</Text>
              {mode !== 'english' && <Text style={styles.documentLabelTamil}>{t.aadhaarBack.ta}</Text>}
              {customer?.aadhaar_back_url ? (
                <Image src={customer.aadhaar_back_url} style={styles.documentImage} />
              ) : (
                <View style={styles.documentPlaceholder}>
                  <Text style={{ fontSize: 8, color: '#999' }}>{t.noImageAvailable.en}</Text>
                </View>
              )}
            </View>
          </View>

          {/* PAN Card */}
          <View style={[styles.documentRow, { justifyContent: 'flex-start' }]}>
            <View style={styles.documentBox}>
              <Text style={styles.documentLabel}>{t.panCard.en}</Text>
              {mode !== 'english' && <Text style={styles.documentLabelTamil}>{t.panCard.ta}</Text>}
              {customer?.pan_card_url ? (
                <Image src={customer.pan_card_url} style={styles.documentImage} />
              ) : (
                <View style={styles.documentPlaceholder}>
                  <Text style={{ fontSize: 8, color: '#999' }}>{t.noImageAvailable.en}</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Declaration */}
        <View style={styles.declarationSection}>
          <Text style={styles.declarationText}>
            I hereby declare that the information provided above is true and correct to the best of my knowledge. 
            I understand that any false information may result in rejection of my application or termination of services.
          </Text>
          {mode !== 'english' && (
            <Text style={styles.declarationTamil}>
              மேலே கொடுக்கப்பட்ட தகவல்கள் எனக்கு தெரிந்தவரை உண்மையானவை மற்றும் சரியானவை என்று இதன்மூலம் உறுதிப்படுத்துகிறேன்.
              தவறான தகவல்கள் எனது விண்ணப்பத்தை நிராகரிக்க அல்லது சேவைகளை நிறுத்த காரணமாக இருக்கலாம் என்பதை புரிந்துகொள்கிறேன்.
            </Text>
          )}
        </View>

        {/* Signature Section */}
        <View style={styles.signatureSection}>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureLine}>{t.customerSignature.en}</Text>
            {mode !== 'english' && <Text style={styles.signatureTamil}>{t.customerSignature.ta}</Text>}
          </View>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureLine}>{t.verifiedBy.en}</Text>
            {mode !== 'english' && <Text style={styles.signatureTamil}>{t.verifiedBy.ta}</Text>}
          </View>
        </View>
      </Page>
    </Document>
  );
}
