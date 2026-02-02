

## Plan: Increase Stamp Area to 300pt Without Overflow

### Current Situation

- Page 1 uses A4 size (842pt height) with 30pt padding = **782pt usable space**
- Current stamp area: 200pt + 5pt margin = 205pt
- Remaining space for content: ~577pt

### After Change

- New stamp area: 300pt + 5pt margin = 305pt  
- New remaining space: 782pt - 305pt = **477pt for content**

### Space Analysis

Current Page 1 content (approximate heights):
| Element | Height |
|---------|--------|
| Title (English + Tamil) | ~25pt |
| Parties section (Seller + Buyer) | ~75pt |
| Summary table (9 rows) | ~90pt |
| Signature section | ~60pt |
| Page footer | ~15pt |
| **Total** | **~265pt** |

With 477pt available, this should fit. However, to ensure no overflow and add safety margin, I will:

1. **Reduce signature section** (as user instructed):
   - Reduce `signatureLine marginTop` from 20 to 10
   - Reduce `signatureSection marginTop` from 8 to 4
   - Keep signatures (not remove entirely) since space allows

2. **Further compact spacing**:
   - Reduce `summaryTable marginBottom` from 4 to 2
   - Reduce `partiesSection marginBottom` from 12 to 6

### Technical Changes

**File: `src/components/print/documents/SaleAgreementPDF.tsx`**

| Style | Current | New |
|-------|---------|-----|
| `stampAreaBlank.height` | 200 | 300 |
| `signatureSection.marginTop` | 8 | 4 |
| `signatureLine.marginTop` | 20 | 10 |
| `partiesSection.marginBottom` | 12 | 6 |
| `summaryTable.marginBottom` | 4 | 2 |

Space saved from reductions: ~20pt extra buffer

### Files to Modify

| File | Changes |
|------|---------|
| `src/components/print/documents/SaleAgreementPDF.tsx` | Increase stamp area height to 300pt; reduce signature and table margins |

### Expected Result

- **Page 1**: 300pt stamp area + Title + Parties + Summary + Signatures (all fits)
- **Page 2**: Agreement Terms (ornaments + clauses)
- **Page 3**: Customer Declaration

No overflow to a blank Page 2.

