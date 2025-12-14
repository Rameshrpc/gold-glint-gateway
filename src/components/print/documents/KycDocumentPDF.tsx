import { Document, Page, Text, View, StyleSheet, Image } from '@react-pdf/renderer';
import { formatDatePrint } from '@/lib/print-utils';
import '@/lib/pdf-fonts';

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
    };
    branch?: {
      branch_name: string;
      address?: string;
    };
  };
  config?: any;
}

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: 'Roboto',
    fontSize: 10,
  },
  header: {
    textAlign: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 12,
    color: '#666',
    marginBottom: 10,
  },
  section: {
    marginBottom: 15,
    padding: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#B45309',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 4,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  label: {
    width: '35%',
    fontSize: 9,
    color: '#666',
  },
  value: {
    width: '65%',
    fontSize: 9,
    fontWeight: 'bold',
  },
  photoSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
  },
  photoBox: {
    width: '30%',
    alignItems: 'center',
  },
  photoPlaceholder: {
    width: 80,
    height: 100,
    borderWidth: 1,
    borderColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 5,
  },
  photoLabel: {
    fontSize: 8,
    color: '#666',
    textAlign: 'center',
  },
  declarationSection: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#f5f5f5',
  },
  declarationText: {
    fontSize: 8,
    lineHeight: 1.4,
    marginBottom: 10,
  },
  signatureSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 40,
    paddingTop: 20,
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
});

export default function KycDocumentPDF({ data, config }: KycDocumentPDFProps) {
  const customer = data.customer;
  const client = data.client;
  const branch = data.branch;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{client?.company_name || 'Gold Loan Company'}</Text>
          <Text style={styles.subtitle}>Know Your Customer (KYC) Document</Text>
          {branch && <Text style={{ fontSize: 9, color: '#666' }}>Branch: {branch.branch_name}</Text>}
        </View>

        {/* Loan Reference */}
        {data.loan_number && (
          <View style={[styles.row, { marginBottom: 15 }]}>
            <Text style={styles.label}>Loan Number:</Text>
            <Text style={styles.value}>{data.loan_number}</Text>
            <Text style={[styles.label, { width: '20%' }]}>Date:</Text>
            <Text style={[styles.value, { width: '30%' }]}>{data.loan_date ? formatDatePrint(data.loan_date) : '-'}</Text>
          </View>
        )}

        {/* Customer Personal Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Customer Code:</Text>
            <Text style={styles.value}>{customer?.customer_code || '-'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Full Name:</Text>
            <Text style={styles.value}>{customer?.full_name || '-'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Date of Birth:</Text>
            <Text style={styles.value}>{customer?.date_of_birth ? formatDatePrint(customer.date_of_birth) : '-'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Gender:</Text>
            <Text style={styles.value}>{customer?.gender || '-'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Occupation:</Text>
            <Text style={styles.value}>{customer?.occupation || '-'}</Text>
          </View>
        </View>

        {/* Contact Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Information</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Phone:</Text>
            <Text style={styles.value}>{customer?.phone || '-'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Address:</Text>
            <Text style={styles.value}>{customer?.address || '-'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>City:</Text>
            <Text style={styles.value}>{customer?.city || '-'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>State:</Text>
            <Text style={styles.value}>{customer?.state || '-'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Pincode:</Text>
            <Text style={styles.value}>{customer?.pincode || '-'}</Text>
          </View>
        </View>

        {/* Nominee Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Nominee Information</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Nominee Name:</Text>
            <Text style={styles.value}>{customer?.nominee_name || '-'}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Relation:</Text>
            <Text style={styles.value}>{customer?.nominee_relation || '-'}</Text>
          </View>
        </View>

        {/* Document Photos Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Identity Documents (Attach copies below)</Text>
          <View style={styles.photoSection}>
            <View style={styles.photoBox}>
              <View style={styles.photoPlaceholder}>
                <Text style={{ fontSize: 7, color: '#999' }}>Photo</Text>
              </View>
              <Text style={styles.photoLabel}>Customer Photo</Text>
            </View>
            <View style={styles.photoBox}>
              <View style={styles.photoPlaceholder}>
                <Text style={{ fontSize: 7, color: '#999' }}>Aadhaar</Text>
              </View>
              <Text style={styles.photoLabel}>Aadhaar Card</Text>
            </View>
            <View style={styles.photoBox}>
              <View style={styles.photoPlaceholder}>
                <Text style={{ fontSize: 7, color: '#999' }}>PAN</Text>
              </View>
              <Text style={styles.photoLabel}>PAN Card</Text>
            </View>
          </View>
        </View>

        {/* Declaration */}
        <View style={styles.declarationSection}>
          <Text style={styles.declarationText}>
            I hereby declare that the information provided above is true and correct to the best of my knowledge. 
            I understand that any false information may result in rejection of my application or termination of services.
          </Text>
        </View>

        {/* Signature Section */}
        <View style={styles.signatureSection}>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureLine}>Customer Signature</Text>
          </View>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureLine}>Verified By</Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}
