

## Plan: Completely Remove Blank Page 2 from Sale Agreement PDF

### Problem Analysis

The blank Page 2 is caused by Page 1 content overflowing. Currently:
- Page 1 has a 320pt stamp area (mandatory for physical stamp paper)
- The remaining content (title, parties, summary table, signatures) is wrapped in `wrap={false}`
- When this content doesn't fit in the remaining ~480pt space, it creates an overflow page

The `wrap={false}` prevents content from splitting across pages, but it doesn't compress content. If the wrapped content is too tall, it still spills to a new page.

### Solution

Reduce the stamp area height from 320pt to a smaller value (200pt) that still provides adequate space for physical stamp paper while fitting all Page 1 content on a single sheet.

Additionally, further reduce vertical spacing in Page 1 elements to guarantee everything fits.

### Technical Changes

**File: `src/components/print/documents/SaleAgreementPDF.tsx`**

| Style Property | Current | New |
|----------------|---------|-----|
| `stampAreaBlank.height` | 320 | 200 |
| `stampAreaBlank.marginBottom` | 8 | 5 |
| `mainTitle.marginBottom` | 2 | 1 |
| `mainTitleTamil.marginBottom` | 6 | 3 |
| `partyTitleContainer.padding` | 3 | 2 |
| `partyTitleContainer.marginBottom` | 2 | 1 |
| `partyDetails.marginBottom` | 4 | 2 |
| `partyRow.marginBottom` | 2 | 1 |
| `summaryTable.marginTop` | 6 | 4 |
| `summaryTable.marginBottom` | 8 | 4 |
| `summaryRow padding` | 5 | 3 |
| `signatureSection.marginTop` | 15 | 8 |
| `signatureSection.paddingTop` | 8 | 4 |
| `signatureLine.marginTop` | 30 | 20 |

Total space saved: ~150pt (from stamp area reduction) + ~40pt (from spacing reductions) = ~190pt

### Page Footer Updates

After fix:
- Page 1: "Page 1 of 3"
- Page 2 (currently Page 3): "Page 2 of 3"
- Page 3 (currently Page 4): "Page 3 of 3"

### Files to Modify

| File | Changes |
|------|---------|
| `src/components/print/documents/SaleAgreementPDF.tsx` | 1. Reduce stamp area height from 320pt to 200pt<br>2. Reduce vertical spacing across all Page 1 elements<br>3. Keep `wrap={false}` as safety net |

### Expected Result

After fix:
- **Page 1**: Stamp area (200pt) + Title + Parties + Summary Table + Signatures (all fit on one page)
- **Page 2**: Agreement Terms (ornaments table + 13 clauses + signatures)
- **Page 3**: Customer Selling Declaration

No blank page will appear between Page 1 and Page 2.

