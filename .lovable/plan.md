

## Plan: Move Customer Selling Declaration to a New Page (Page 3)

### Issue Identified

Currently, the Sale Agreement PDF has 2 pages:
- **Page 1**: Stamp area + Parties + Summary + Signatures
- **Page 2**: Ornaments table + 13 Clauses + Customer Selling Declaration + Warning + Signatures

The user wants the "Customer Selling Declaration" section to be on its own fresh page.

### Solution

Restructure the PDF to 3 pages:
- **Page 1**: Stamp area + Parties + Summary + Signatures (unchanged)
- **Page 2**: Ornaments table + 13 Clauses + Signatures
- **Page 3**: Customer Selling Declaration + Declaration text + Warning box + Signatures (NEW)

---

### Technical Changes

#### File: `src/components/print/documents/SaleAgreementPDF.tsx`

**1. Update Page 2 (lines 543-673)**

Split the current Page 2:
- Keep ornaments table and clauses on Page 2
- Add signatures at end of Page 2
- Update footer to "Page 2 of 3"

**2. Create New Page 3**

Add a new `<Page>` component containing:
- Title: "CUSTOMER SELLING DECLARATION" with Tamil translation
- Customer details table (Name, Father Name, DOB, Gender, Scrap Jewels, etc.)
- Declaration text
- Warning box
- Signatures
- Footer: "Page 3 of 3"

**3. Fix Tamil Title**

The screenshot shows the Tamil text is garbled. Update the declaration title to use proper rendering with the Tamil font family.

---

### Page Structure After Changes

| Page | Content |
|------|---------|
| **Page 1** | Blank stamp area (320pt) + Title + Parties (Seller/Buyer) + Summary table + Signatures |
| **Page 2** | Title + Ornaments table + 13 Tamil Clauses + Signatures |
| **Page 3** | Customer Selling Declaration title + Customer details table + Declaration text + Warning box + Signatures |

---

### Code Changes Summary

```tsx
// Page 2: Terms page - ends with clauses and signatures
<Page size={paperSize} style={styles.page}>
  <Text style={styles.pageTitle}>GOLD BUY BACK AGREEMENT</Text>
  {/* Ornaments table */}
  {/* 13 Clauses */}
  {/* Signatures */}
  <Text style={styles.pageFooter}>Page 2 of 3</Text>
</Page>

// Page 3: Declaration page (NEW)
<Page size={paperSize} style={styles.page}>
  <Text style={styles.declarationTitle}>CUSTOMER SELLING DECLARATION</Text>
  <Text style={styles.declarationTitleTamil}>வாடிக்கையாளர் விற்பனை அறிவிப்பு</Text>
  {/* Customer details table */}
  {/* Declaration text */}
  {/* Warning box */}
  {/* Signatures */}
  <Text style={styles.pageFooter}>Page 3 of 3</Text>
</Page>
```

---

### Expected Outcome

- The document will be 3 pages total
- Page 3 will contain only the Customer Selling Declaration section
- The Tamil title will render correctly as "வாடிக்கையாளர் விற்பனை அறிவிப்பு"
- Clean, professional layout with dedicated declaration page for stamp paper

