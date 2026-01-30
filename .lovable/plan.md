
## Plan: Recompose Sale Agreement PDF (3-Page Stamp Paper Format)

### Overview

Create a new 3-page PDF structure for the Gold Buy Back Sale Agreement designed for printing on ₹100 stamp paper:

- **Page 1**: Party details (half-page blank for stamp affixing) + basic agreement info
- **Page 2**: Full agreement terms (Gold Buy Back Agreement with numbered clauses)
- **Page 3**: Customer Selling Declaration with signatures

---

### Document Structure Analysis

From the uploaded documents:

**Zenith_agrrement.docx** contains:
- Page 1: Summary table (Name, Agreement Number, Address, Amount, Date, Ornaments Details, Weights, Tenure, etc.)
- Page 2-3: 13 numbered Tamil clauses for the Gold Buy Back Agreement

**Zenith_gold.docx** contains:
- Customer Selling Declaration with Tamil text declarations
- Signature sections

---

### Page-by-Page Layout

#### Page 1: Cover Page (Stamp Paper Format)
- **Top Half (~350pt)**: BLANK AREA for ₹100 stamp paper affixing
- **Title**: "GOLD BUY BACK AGREEMENT / தங்க திரும்ப கொள்முதல் ஒப்பந்தம்"
- **Between Parties Section**:
  - THE SELLER (Customer details with address)
  - THE BUYER (Zenith Gold company details with address)
- **Summary Table**:
  - Agreement Number, Date, Tenure, Due Date
  - Total Gross Weight, Net Weight
  - Total Value / Purchase Price
  - Mobile Number
- **Signatures at bottom**

#### Page 2: Agreement Terms
- **Title**: "GOLD BUY BACK AGREEMENT TERMS / தங்க திரும்ப கொள்முதல் ஒப்பந்த விதிமுறைகள்"
- **Ornaments Details Table**: Item-wise gold listing
- **13 Numbered Clauses in Tamil/Bilingual**:
  1. I declare that I am voluntarily selling my gold jewellery to Zenith Gold...
  2. I acknowledge that once sold, I have no ownership rights...
  3. Zenith Gold has the right to return or exchange the jewellery...
  4. Tenure is 1-2 months, and trade margin applies...
  5. If full amount not paid, jewellery may be sold/exchanged...
  6. 10% loss per 2-month period applies after tenure...
  7. Company has full rights to sell/exchange if I fail to pay...
  8. All jewellery sold is my own property (22K/20K purity confirmed)...
  9. Identity proofs are genuine and no coercion involved...
  10. Company can claim from my assets if I fail to repay...
  11. Aadhaar, employment, and residence details are true...
  12. SMS/notification consent given...
  13. All rules read and understood, bound by agreement...
- **Footer signatures**

#### Page 3: Customer Selling Declaration
- **Title**: "CUSTOMER SELLING DECLARATION / வாடிக்கையாளர் விற்பனை அறிவிப்பு"
- **Customer Details Table**:
  - Name, Father Name, DOB, Sex
  - Scrap Jewels Details, Weight, Stone/Dust Weight
  - ID Proof, Address Proof
- **Tamil Declaration Text** (cleaned & corrected):
  - Declaration of ownership
  - Purity confirmation (22K/20K)
  - No coercion/force declaration
  - ID proof authenticity
  - Agreement to company terms
- **Warning Box**: Important notices
- **Signatures**: Customer Signature + Authorised Signatory

---

### Files to Create/Modify

#### 1. Create `src/components/print/documents/SaleAgreementPDF.tsx` (NEW FILE)

A new 3-page PDF component replacing the current single-page BillOfSalePDF for sale agreements:

```typescript
// Key structure:
export function SaleAgreementPDF({
  loan, customer, goldItems, companyName, companyAddress,
  branchName, language, paperSize, logoUrl, content
}) {
  return (
    <Document>
      {/* Page 1: Cover/Stamp Paper Page */}
      <Page>
        {/* Blank stamp area (half page) */}
        <View style={{ height: 350, borderBottom: 1 }}>
          <Text>Affix ₹100 Stamp Paper Here</Text>
        </View>
        
        {/* Parties Section */}
        <PartiesSection seller={customer} buyer={companyDetails} />
        
        {/* Summary Table */}
        <SummaryTable loan={loan} goldItems={goldItems} />
        
        {/* Signatures */}
        <SignatureSection />
      </Page>

      {/* Page 2: Agreement Terms */}
      <Page>
        <AgreementTitle />
        <OrnamentsTable goldItems={goldItems} />
        <AgreementClauses clauses={clauses13} />
        <SignatureSection />
      </Page>

      {/* Page 3: Declaration */}
      <Page>
        <DeclarationTitle />
        <CustomerDetailsTable customer={customer} />
        <DeclarationText declarations={tamilDeclarations} />
        <WarningBox />
        <SignatureSection />
      </Page>
    </Document>
  );
}
```

---

#### 2. Create Agreement Content (Tamil Clauses - Corrected Spelling)

**13 Agreement Clauses (English + Tamil)**:

1. **Voluntary Sale**: I declare that I am voluntarily selling my gold jewellery to Zenith Gold and receiving the agreed amount.
   - ஜெனித் கோல்ட் என்னுடைய தங்க நகைகளை அமானிதமாக விற்று அடைவிடை நிறுவனத்தின் மூலம் விற்று மொத்த தொகையை பெறுக்கிறேன்.

2. **No Ownership Rights**: Once sold, I have no ownership rights over the jewellery.
   - விற்கப்பட்ட தங்க நகைகளில் எனக்கு எந்த உரிமையும் இல்லை என்பதை ஒப்புக்கொள்கிறேன்.

3. **Company Rights**: Zenith Gold has the right to return or exchange the jewellery as per their terms.
   - தங்க நகைகளை திருப்பி கொடுக்கவோ அல்லது மாற்றுக்கொடுக்கவோ நிறுவனத்திற்கு உரிமை உண்டு என்பதை தெரிந்து கொண்டு ஒப்புக்கொள்கிறேன்.

4. **Tenure & Margin**: Tenure is 1-2 months. Trade margin applies as per agreement terms.
   - குறிப்பிட்டுள்ள ஒரு மாதத்திலிருந்து இரண்டு மாத தவணை வர்த்தக மார்ஜின் செலுத்த திருப்பி பெறும் தேதியில் செலுத்தக்கோரும் நஷ்டத் தொகையும் செலுத்த கோமா குறிப்பிட்டுள்ள நகைகளை திரும்ப பெற முடியும்.

5. **Default Terms**: If full payment not made, company may sell/exchange the jewellery.
   - முழு தொகை செலுத்தும் தவணை தவறும் நகைகளை கோய் அல்லது அதற்கு ஏற்ற நகைகளை கோய் மாற்றுக்கொள்ள நிறுவனத்திற்கு உரிமை உண்டு.

6. **Loss Rate**: 10% loss applies per 2-month period after initial tenure.
   - தவணை காலத்திற்கு மேல் இரண்டு மாத தவணைக்கு 10% நஷ்டத் தொகை செலுத்த ஒப்புக்கொள்கிறேன்.

7. **Full Company Rights**: Company has full rights to sell/melt/exchange if I fail to pay.
   - முழு தொகை செலுத்த தவறினால் நிறுவனத்திற்கு விற்கவும், மாற்றவும் அல்லது உருக்கவும் முழு உரிமை உண்டு என்பதை தெரிந்து கொண்டு ஒப்புக்கொள்கிறேன்.

8. **Purity Confirmation**: All jewellery is my own (22K/20K purity confirmed).
   - விற்பனை செய்த தங்க நகைகள் அனைத்தும் என்னுடைய சொந்த நகைகள் ஆகும். இவை அனைத்தும் 22 கேரட் மற்றும் 20 கேரட் தரமுள்ள தங்க நகைகள் என்றும் உறுதியளிக்கிறேன்.

9. **No Coercion**: Identity proofs genuine, no coercion/force involved.
   - என்னுடைய அடையாள தேவைகளுக்காகவும் சொந்த விருப்பத்தில் யாருடைய புறுத்தலும் இன்றி முழுமையாக விற்கிறேன்.

10. **Asset Claim**: Company can claim from my assets if I fail to repay.
    - விற்ற தொகையை திரும்ப செலுத்த தவறும் தருணத்தில் என்னுடைய அடையாளமும் மற்றும் அடைய சொத்துக்களில் இருந்து நிறுவனம் பெறுக்க உரிமை உண்டு.

11. **True Information**: Aadhaar, employment, residence details are true.
    - என்னுடைய அடையாள ஆவணங்கள், தொழில் முறை தகவல்கள் மற்றும் இருப்பிடம் அடையாளங்கள் உண்மையானவை.

12. **Notification Consent**: SMS/notification consent provided.
    - விற்பனை செய்த நகைகளை எந்த முன் அறிவிப்பின்றி நிறுவனம் விற்கவும் அல்லது SMS மூலம் தெரிவிக்கவும் நிறுவனம் செய்வது என்பதை தெரிந்து கொண்டு ஒப்புக்கொள்கிறேன்.

13. **Agreement Bound**: All rules read and understood, bound by agreement.
    - மேலே குறிப்பிட்ட அனைத்து விதிமுறைகளையும் படித்து மற்றும் புரிந்து தெரிந்து கொண்டு அடையாள ஆவணங்கள் மற்றும் தொழில் முறை சான்றிதழ்கள் அனைத்தும் உண்மையானவை என உறுதியளிக்கிறேன். தவறும் தருணத்தில் நிறுவனம் என் மேல் எடுக்கும் அனைத்து நடவடிக்கைகளுக்கும் கட்டுப்படுவேன் என உறுதியளிக்கிறேன்.

---

#### 3. Modify `src/components/print/LoanPrintDialog.tsx`

Add the new SaleAgreementPDF option for sale agreement loans:

```typescript
// Import new component
import { SaleAgreementPDF } from './documents/SaleAgreementPDF';

// In generatePDF function, detect transaction_type
if (selection.billOfSale) {
  // Use new 3-page format for sale agreements
  const doc = (
    <SaleAgreementPDF
      loan={loan}
      customer={customer}
      goldItems={goldItems}
      companyName={companyName}
      companyAddress={client?.address}
      branchName={branchName}
      language={language}
      paperSize={paperSize}
      logoUrl={effectiveSettings.logo_url}
    />
  );
  // ... generate blob
}
```

---

#### 4. Create Content Hook for Sale Agreement

Create `src/hooks/useSaleAgreementContent.tsx` to manage the 13 clauses and declaration content from the database, similar to `useBillOfSaleContent.tsx`.

---

### Visual Layout Reference

```text
┌─────────────────────────────────────────┐
│ PAGE 1: COVER / STAMP PAPER             │
├─────────────────────────────────────────┤
│                                         │
│    [BLANK AREA FOR ₹100 STAMP]          │
│           (350pt height)                │
│                                         │
├─────────────────────────────────────────┤
│ GOLD BUY BACK AGREEMENT                 │
├─────────────────────────────────────────┤
│ 1. THE SELLER (Customer)                │
│    Name: [Customer Name]                │
│    Address: [Full Address]              │
│    Mobile: [Phone]                      │
├─────────────────────────────────────────┤
│ 2. THE BUYER (Trading Entity)           │
│    M/s. Zenith Gold                     │
│    Address: [Company Address]           │
│    GSTIN: [Number]                      │
├─────────────────────────────────────────┤
│ ┌───────────────────┬─────────────────┐ │
│ │ Agreement No      │ ZG/2026/1234    │ │
│ │ Date              │ 30-Jan-2026     │ │
│ │ Amount            │ ₹1,50,000       │ │
│ │ Total Gross Wt    │ 25.500 g        │ │
│ │ Total Net Wt      │ 24.200 g        │ │
│ │ Tenure            │ 90 Days         │ │
│ │ Due Date          │ 30-Apr-2026     │ │
│ │ Mobile            │ 9876543210      │ │
│ └───────────────────┴─────────────────┘ │
├─────────────────────────────────────────┤
│ For Zenith Gold          Customer Sign: │
│ _______________          ______________ │
│ Authorised Signatory     Name:          │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ PAGE 2: AGREEMENT TERMS                 │
├─────────────────────────────────────────┤
│ GOLD BUY BACK AGREEMENT                 │
│ தங்க திரும்ப கொள்முதல் ஒப்பந்தம்         │
├─────────────────────────────────────────┤
│ ORNAMENTS DETAILS:                      │
│ ┌────┬────────────┬──────┬──────┬─────┐ │
│ │ # │ Item       │ Gross│ Net  │Purity│ │
│ ├────┼────────────┼──────┼──────┼─────┤ │
│ │ 1 │ Chain      │ 15.2 │ 14.8 │ 22K │ │
│ │ 2 │ Bangle     │ 10.3 │ 9.4  │ 22K │ │
│ └────┴────────────┴──────┴──────┴─────┘ │
├─────────────────────────────────────────┤
│ TERMS & CONDITIONS:                     │
│                                         │
│ 1. ஜெனித் கோல்ட் என்னுடைய தங்க          │
│    நகைகளை அமானிதமாக விற்று...           │
│                                         │
│ 2. விற்கப்பட்ட தங்க நகைகளில் எனக்கு     │
│    எந்த உரிமையும் இல்லை...              │
│                                         │
│ ... (clauses 3-13) ...                  │
│                                         │
├─────────────────────────────────────────┤
│ For Zenith Gold          Customer Sign: │
│ _______________          ______________ │
│ Authorised Signatory     Name:          │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ PAGE 3: CUSTOMER SELLING DECLARATION    │
├─────────────────────────────────────────┤
│ CUSTOMER SELLING DECLARATION            │
│ வாடிக்கையாளர் விற்பனை அறிவிப்பு         │
├─────────────────────────────────────────┤
│ ┌───────────────────┬─────────────────┐ │
│ │ Name of Customer  │ [Name]          │ │
│ │ Father Name       │ [Father]        │ │
│ │ Date of Birth     │ [DOB]           │ │
│ │ Sex               │ [M/F]           │ │
│ │ Scrap Jewels      │ [Details]       │ │
│ │ Scrap Gold Weight │ [Weight]        │ │
│ │ Stone/Dust Weight │ [Weight]        │ │
│ │ ID Proof          │ Aadhaar/PAN     │ │
│ │ Address Proof     │ [Type]          │ │
│ └───────────────────┴─────────────────┘ │
├─────────────────────────────────────────┤
│ DECLARATION (Tamil):                    │
│                                         │
│ மேலே குறிப்பிட்டுள்ள தங்க நகைகள்        │
│ அனைத்தும் என்னுடைய சொந்த தங்க           │
│ நகைகள் ஆகும். இவை அனைத்தும் 22          │
│ கேரட் மற்றும் 20 கேரட் தரமுள்ள          │
│ தங்க நகைகள் என்றும் உறுதி               │
│ கூறுகிறேன்...                           │
│                                         │
├─────────────────────────────────────────┤
│ ⚠️ WARNING / எச்சரிக்கை:                │
│ ஜெனித் கோல்ட் நிறுவனத்தின் மீது         │
│ எந்தவித காவல் நிலைய புகார்              │
│ அளிக்கமாட்டேன் என்று உறுதியளிக்கிறேன்.  │
├─────────────────────────────────────────┤
│ For Zenith Gold          Customer Sign: │
│ _______________          ______________ │
│ Authorised Signatory     Name:          │
└─────────────────────────────────────────┘
```

---

### Technical Implementation Details

1. **Stamp Paper Blank Area**:
   - Use `<View style={{ height: 350, minHeight: 350 }} />` to reserve space
   - Add light gray border or dashed line to indicate stamp placement area

2. **Font Handling**:
   - Continue using `Noto Sans Tamil` for Tamil text (already registered in `pdf-fonts.ts`)
   - Use `Roboto` for English text
   - BilingualLabel/BilingualText components for mixed content

3. **Page Breaks**:
   - Use `@react-pdf/renderer` `<Page>` components to force 3 distinct pages
   - Each page has consistent header and signature sections

4. **Dynamic Content**:
   - Loan data (principal, tenure, dates) from `loan` prop
   - Customer data (name, address, phone) from `customer` prop
   - Gold items from `goldItems` prop
   - Company details from `client` context

---

### Files Summary

| File | Action | Purpose |
|------|--------|---------|
| `src/components/print/documents/SaleAgreementPDF.tsx` | Create | New 3-page PDF component |
| `src/hooks/useSaleAgreementContent.tsx` | Create | Hook for managing agreement content |
| `src/components/print/LoanPrintDialog.tsx` | Modify | Use new component for sale agreements |
| `src/components/print/documents/index.ts` | Modify | Export new component |

---

### Expected Outcome

- 3-page professional Sale Agreement PDF
- Page 1 with half-page blank for ₹100 stamp paper
- Page 2 with complete agreement terms in Tamil/bilingual
- Page 3 with customer declaration and signatures
- All spelling corrected from uploaded documents
- Dynamic data population from ongoing loan
