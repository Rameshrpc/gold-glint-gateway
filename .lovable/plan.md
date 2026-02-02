

## Plan: Fix Blank Page 2 in Sale Agreement PDF

### Problem

The blank Page 2 you see is caused by **content overflow from Page 1**. When the PDF renders:

1. Page 1 starts with 320pt stamp area + title + parties + summary table
2. The signatures don't fit on Page 1, so they spill to a new page (the blank Page 2)
3. The coded Page 2 (with ornaments + clauses) then appears as Page 3
4. The coded Page 3 (declaration) appears as Page 4

### Solution

Add `break="avoid"` to the signature section on Page 1 to prevent page breaks within it, AND ensure the View wrapping Page 1 content doesn't allow its children to break across pages.

However, since the stamp area is 320pt and must stay, the better solution is to **reduce vertical spacing** in Page 1 to fit all content including signatures.

### Technical Changes

**File: `src/components/print/documents/SaleAgreementPDF.tsx`**

| Change | Current | New |
|--------|---------|-----|
| Stamp area marginBottom | 15 | 8 |
| Main title marginBottom | 3 | 2 |
| Main title Tamil marginBottom | 12 | 6 |
| Party title container padding | 4 | 3 |
| Party details marginBottom | 8 | 4 |
| Summary table marginTop | 10 | 6 |
| Summary table marginBottom | 15 | 8 |
| Signature section marginTop | 25 | 15 |
| Signature line marginTop | 40 | 30 |

These small reductions (total ~40-50pt saved) will ensure Page 1 content (including signatures) fits within the page.

### Page Footer Updates

After fix, page numbering changes:
- Page 1: Stamp Paper Page → "Page 1 of 3"
- Page 2: Agreement Terms (ornaments + clauses) → "Page 2 of 3" 
- Page 3: Customer Declaration → "Page 3 of 3"

No actual page deletion needed - just fixing the overflow issue.

### Files to Modify

| File | Changes |
|------|---------|
| `src/components/print/documents/SaleAgreementPDF.tsx` | Reduce vertical spacing in styles to fit Page 1 content on single page |

### Expected Result

After fix:
- **Page 1**: Stamp area (320pt) + Title + Parties + Summary + Signatures (all on one page)
- **Page 2**: Agreement Terms (ornaments table + 13 clauses + signatures)
- **Page 3**: Customer Selling Declaration

No blank page between Page 1 and the Agreement Terms page.

