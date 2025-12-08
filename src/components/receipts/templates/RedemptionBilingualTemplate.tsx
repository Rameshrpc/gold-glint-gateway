import { Document, Page, Text, View, StyleSheet, Image, Font } from '@react-pdf/renderer';
import { getTranslation } from '@/lib/translations';

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: 'Roboto',
    fontSize: 10,
  },
  watermark: {
    position: 'absolute',
    top: '40%',
    left: '25%',
    fontSize: 60,
    color: '#cccccc',
    opacity: 0.3,
    transform: 'rotate(-45deg)',
  },
  header: {
    flexDirection: 'row',
    marginBottom: 20,
    borderBottomWidth: 2,
    borderBottomColor: '#B45309',
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
    fontSize: 18,
    fontWeight: 'bold',
    color: '#B45309',
    marginBottom: 3,
  },
  companyNameTamil: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 5,
  },
  companyDetails: {
    fontSize: 9,
    color: '#666666',
    lineHeight: 1.4,
  },
  title: {
    textAlign: 'center',
    marginBottom: 15,
  },
  titleText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1E40AF',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  titleTextTamil: {
    fontSize: 12,
    color: '#666666',
    marginTop: 3,
  },
  receiptInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
    backgroundColor: '#f8f9fa',
    padding: 10,
    borderRadius: 5,
  },
  infoColumn: {
    flex: 1,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 3,
  },
  infoLabel: {
    fontSize: 9,
    color: '#666666',
    width: 80,
  },
  infoValue: {
    fontSize: 9,
    fontWeight: 'bold',
  },
  section: {
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    backgroundColor: '#f0f9ff',
    padding: 6,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#1E40AF',
  },
  sectionTitleTamil: {
    fontSize: 9,
    color: '#666666',
    marginLeft: 5,
  },
  customerGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  customerField: {
    width: '50%',
    marginBottom: 6,
  },
  fieldLabel: {
    fontSize: 8,
    color: '#888888',
  },
  fieldValue: {
    fontSize: 9,
    fontWeight: 'bold',
  },
  settlementBox: {
    backgroundColor: '#fef3c7',
    padding: 12,
    borderRadius: 5,
    marginBottom: 15,
  },
  settlementRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#fcd34d',
    borderBottomStyle: 'dashed',
  },
  settlementLabel: {
    fontSize: 10,
    color: '#78350f',
  },
  settlementValue: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#78350f',
  },
  settlementTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 6,
    borderTopWidth: 2,
    borderTopColor: '#B45309',
    marginTop: 6,
  },
  totalLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#78350f',
  },
  totalValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#B45309',
  },
  goldReleaseBadge: {
    backgroundColor: '#22c55e',
    padding: 10,
    borderRadius: 5,
    marginBottom: 15,
    textAlign: 'center',
  },
  goldReleaseBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#ffffff',
    textTransform: 'uppercase',
  },
  goldReleaseBadgeTextTamil: {
    fontSize: 10,
    color: '#dcfce7',
    marginTop: 3,
  },
  declaration: {
    backgroundColor: '#f8f9fa',
    padding: 10,
    marginBottom: 15,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  declarationText: {
    fontSize: 8,
    color: '#666666',
    textAlign: 'justify',
    lineHeight: 1.5,
  },
  signatureSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 30,
    paddingTop: 15,
  },
  signatureBox: {
    width: '45%',
    alignItems: 'center',
  },
  signatureLine: {
    width: '100%',
    borderTopWidth: 1,
    borderTopColor: '#333333',
    marginBottom: 5,
    marginTop: 40,
  },
  signatureLabel: {
    fontSize: 9,
    textAlign: 'center',
  },
  signatureLabelTamil: {
    fontSize: 8,
    color: '#666666',
    textAlign: 'center',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: 'center',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 10,
  },
  footerText: {
    fontSize: 8,
    color: '#888888',
  },
  footerTextTamil: {
    fontSize: 7,
    color: '#aaaaaa',
    marginTop: 2,
  },
});

interface RedemptionBilingualTemplateProps {
  company: {
    name: string;
    nameTamil?: string;
    address?: string;
    phone?: string;
    email?: string;
  };
  redemption: {
    redemptionNumber: string;
    redemptionDate: string;
    paymentMode: string;
    paymentReference?: string;
  };
  customer: {
    name: string;
    code: string;
    phone: string;
    address?: string;
  };
  loan: {
    loanNumber: string;
    loanDate: string;
    principalAmount: number;
    interestRate: number;
  };
  settlement: {
    outstandingPrincipal: number;
    interestDue: number;
    penaltyAmount: number;
    rebateAmount: number;
    totalSettlement: number;
    amountReceived: number;
  };
  goldRelease: {
    released: boolean;
    releasedTo?: string;
    releasedDate?: string;
  };
  logoUrl?: string;
  watermark?: {
    type: 'text' | 'image';
    text?: string;
    imageUrl?: string;
    opacity?: number;
  };
  language?: 'en' | 'tamil' | 'bilingual';
}

export function RedemptionBilingualTemplate({
  company,
  redemption,
  customer,
  loan,
  settlement,
  goldRelease,
  logoUrl,
  watermark,
  language = 'bilingual',
}: RedemptionBilingualTemplateProps) {
  const isBilingual = language === 'bilingual';
  const isTamil = language === 'tamil';

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const getText = (key: Parameters<typeof getTranslation>[0]) => {
    const lang = language === 'bilingual' ? 'bilingual' : language === 'tamil' ? 'tamil' : 'english';
    return getTranslation(key, lang);
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Watermark */}
        {watermark?.type === 'text' && watermark.text && (
          <Text style={[styles.watermark, { opacity: (watermark.opacity || 10) / 100 }]}>
            {watermark.text}
          </Text>
        )}

        {/* Header */}
        <View style={styles.header}>
          {logoUrl && <Image src={logoUrl} style={styles.logo} />}
          <View style={styles.companyInfo}>
            <Text style={styles.companyName}>{company.name}</Text>
            {isBilingual && company.nameTamil && (
              <Text style={styles.companyNameTamil}>{company.nameTamil}</Text>
            )}
            <Text style={styles.companyDetails}>
              {company.address && `${company.address}\n`}
              {company.phone && `Phone: ${company.phone}`}
              {company.email && ` | Email: ${company.email}`}
            </Text>
          </View>
        </View>

        {/* Title */}
        <View style={styles.title}>
          <Text style={styles.titleText}>
            {isTamil ? 'மீட்பு ரசீது' : 'Redemption Receipt'}
          </Text>
          {isBilingual && (
            <Text style={styles.titleTextTamil}>மீட்பு ரசீது</Text>
          )}
        </View>

        {/* Receipt Info */}
        <View style={styles.receiptInfo}>
          <View style={styles.infoColumn}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>{getText('receiptNo')}:</Text>
              <Text style={styles.infoValue}>{redemption.redemptionNumber}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>{getText('date')}:</Text>
              <Text style={styles.infoValue}>{formatDate(redemption.redemptionDate)}</Text>
            </View>
          </View>
          <View style={styles.infoColumn}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>{getText('paymentMode')}:</Text>
              <Text style={styles.infoValue}>{redemption.paymentMode}</Text>
            </View>
            {redemption.paymentReference && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Ref No:</Text>
                <Text style={styles.infoValue}>{redemption.paymentReference}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Customer Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {isTamil ? 'வாடிக்கையாளர் விவரங்கள்' : 'Customer Details'}
            {isBilingual && <Text style={styles.sectionTitleTamil}> / வாடிக்கையாளர் விவரங்கள்</Text>}
          </Text>
          <View style={styles.customerGrid}>
            <View style={styles.customerField}>
              <Text style={styles.fieldLabel}>{getText('customerName')}</Text>
              <Text style={styles.fieldValue}>{customer.name}</Text>
            </View>
            <View style={styles.customerField}>
              <Text style={styles.fieldLabel}>{getText('customerId')}</Text>
              <Text style={styles.fieldValue}>{customer.code}</Text>
            </View>
            <View style={styles.customerField}>
              <Text style={styles.fieldLabel}>{getText('phone')}</Text>
              <Text style={styles.fieldValue}>{customer.phone}</Text>
            </View>
            <View style={styles.customerField}>
              <Text style={styles.fieldLabel}>{getText('address')}</Text>
              <Text style={styles.fieldValue}>{customer.address || '-'}</Text>
            </View>
          </View>
        </View>

        {/* Loan Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {isTamil ? 'கடன் விவரங்கள்' : 'Loan Details'}
            {isBilingual && <Text style={styles.sectionTitleTamil}> / கடன் விவரங்கள்</Text>}
          </Text>
          <View style={styles.customerGrid}>
            <View style={styles.customerField}>
              <Text style={styles.fieldLabel}>{getText('loanNumber')}</Text>
              <Text style={styles.fieldValue}>{loan.loanNumber}</Text>
            </View>
            <View style={styles.customerField}>
              <Text style={styles.fieldLabel}>{getText('loanDate')}</Text>
              <Text style={styles.fieldValue}>{formatDate(loan.loanDate)}</Text>
            </View>
            <View style={styles.customerField}>
              <Text style={styles.fieldLabel}>{getText('principalAmount')}</Text>
              <Text style={styles.fieldValue}>{formatCurrency(loan.principalAmount)}</Text>
            </View>
            <View style={styles.customerField}>
              <Text style={styles.fieldLabel}>{getText('interestRate')}</Text>
              <Text style={styles.fieldValue}>{loan.interestRate}% p.m.</Text>
            </View>
          </View>
        </View>

        {/* Settlement Calculation */}
        <View style={styles.settlementBox}>
          <Text style={[styles.sectionTitle, { backgroundColor: 'transparent', paddingLeft: 0 }]}>
            {isTamil ? 'தீர்வு கணக்கீடு' : 'Settlement Calculation'}
            {isBilingual && <Text style={styles.sectionTitleTamil}> / தீர்வு கணக்கீடு</Text>}
          </Text>
          
          <View style={styles.settlementRow}>
            <Text style={styles.settlementLabel}>{getText('outstandingPrincipal')}</Text>
            <Text style={styles.settlementValue}>{formatCurrency(settlement.outstandingPrincipal)}</Text>
          </View>
          <View style={styles.settlementRow}>
            <Text style={styles.settlementLabel}>{isTamil ? 'வட்டி நிலுவை' : 'Interest Due'}</Text>
            <Text style={styles.settlementValue}>{formatCurrency(settlement.interestDue)}</Text>
          </View>
          {settlement.penaltyAmount > 0 && (
            <View style={styles.settlementRow}>
              <Text style={styles.settlementLabel}>{getText('penaltyAmount')}</Text>
              <Text style={styles.settlementValue}>{formatCurrency(settlement.penaltyAmount)}</Text>
            </View>
          )}
          {settlement.rebateAmount > 0 && (
            <View style={styles.settlementRow}>
              <Text style={styles.settlementLabel}>{getText('rebateAmount')}</Text>
              <Text style={[styles.settlementValue, { color: '#22c55e' }]}>
                -{formatCurrency(settlement.rebateAmount)}
              </Text>
            </View>
          )}
          <View style={styles.settlementTotal}>
            <Text style={styles.totalLabel}>{getText('totalSettlement')}</Text>
            <Text style={styles.totalValue}>{formatCurrency(settlement.totalSettlement)}</Text>
          </View>
        </View>

        {/* Gold Release Badge */}
        {goldRelease.released && (
          <View style={styles.goldReleaseBadge}>
            <Text style={styles.goldReleaseBadgeText}>
              {isTamil ? 'தங்கம் வெளியிடப்பட்டது' : 'Gold Released Successfully'}
            </Text>
            {isBilingual && (
              <Text style={styles.goldReleaseBadgeTextTamil}>தங்கம் வெளியிடப்பட்டது</Text>
            )}
            {goldRelease.releasedTo && (
              <Text style={[styles.goldReleaseBadgeTextTamil, { color: '#ffffff' }]}>
                Released to: {goldRelease.releasedTo}
              </Text>
            )}
          </View>
        )}

        {/* Declaration */}
        <View style={styles.declaration}>
          <Text style={styles.declarationText}>
            {isTamil 
              ? 'நான் மேலே குறிப்பிட்ட தங்க பொருட்களை நல்ல நிலையில் பெற்றுக்கொண்டேன் என்பதை உறுதிப்படுத்துகிறேன். கடன் முழுவதுமாக தீர்க்கப்பட்டது மற்றும் எனக்கு எந்த கோரிக்கையும் இல்லை.'
              : 'I hereby confirm that I have received the gold items mentioned above in good condition. The loan has been fully settled and I have no further claims.'}
          </Text>
          {isBilingual && (
            <Text style={[styles.declarationText, { marginTop: 5, color: '#888888' }]}>
              நான் மேலே குறிப்பிட்ட தங்க பொருட்களை நல்ல நிலையில் பெற்றுக்கொண்டேன் என்பதை உறுதிப்படுத்துகிறேன். கடன் முழுவதுமாக தீர்க்கப்பட்டது மற்றும் எனக்கு எந்த கோரிக்கையும் இல்லை.
            </Text>
          )}
        </View>

        {/* Signatures */}
        <View style={styles.signatureSection}>
          <View style={styles.signatureBox}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>
              {isTamil ? 'வாடிக்கையாளர் கையொப்பம்' : 'Customer Signature'}
            </Text>
            {isBilingual && (
              <Text style={styles.signatureLabelTamil}>வாடிக்கையாளர் கையொப்பம்</Text>
            )}
          </View>
          <View style={styles.signatureBox}>
            <View style={styles.signatureLine} />
            <Text style={styles.signatureLabel}>
              {isTamil ? 'அங்கீகரிக்கப்பட்ட கையொப்பம்' : 'Authorized Signatory'}
            </Text>
            {isBilingual && (
              <Text style={styles.signatureLabelTamil}>அங்கீகரிக்கப்பட்ட கையொப்பம்</Text>
            )}
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            {isTamil 
              ? 'உங்கள் வணிகத்திற்கு நன்றி!'
              : 'Thank you for your business!'}
          </Text>
          {isBilingual && (
            <Text style={styles.footerTextTamil}>உங்கள் வணிகத்திற்கு நன்றி!</Text>
          )}
        </View>
      </Page>
    </Document>
  );
}
