

## Plan: Fix Empty Page 2 in Sale Agreement PDF

### Problem Analysis

The Sale Agreement PDF currently produces a blank-ish Page 2 because **Page 1 content overflows** to a new page.

**Current Page 1 Layout:**
| Section | Height (approx) |
|---------|-----------------|
| Stamp Area Blank | 320pt |
| Title + Tamil | ~30pt |
| Parties Section (Seller) | ~60pt |
| Parties Section (Buyer) | ~60pt |
| Summary Table (10 rows) | ~150pt |
| Signatures | ~70pt |
| **TOTAL** | **~690pt** |

**A4 Page usable height**: ~750pt (841pt - 60pt padding top/bottom)

The content is close to the limit, but with various browsers and PDF renderers, the signature section is being pushed to Page 2, creating the "blank page" effect you see.

### Solution

**Reduce the stamp area height from 320pt to 200pt** to provide enough margin for all Page 1 content to fit comfortably.

320pt = ~4.4 inches (too much space)
200pt = ~2.8 inches (sufficient for physical stamp affixing)

### Technical Changes

**File: `src/components/print/documents/SaleAgreementPDF.tsx`**

```typescript
// Line 68-72: Change stampAreaBlank height
stampAreaBlank: {
  height: 200,  // Reduced from 320pt to 200pt
  marginBottom: 15,
},
```

This single change will ensure:
1. Page 1: Stamp area + Title + Parties + Summary Table + Signatures (all fit on one page)
2. Page 2: Gold Buyback Agreement Terms (Ornaments + 13 Clauses + Signatures)
3. Page 3: Customer Selling Declaration (Details + Declaration + Warning + Signatures)

### Expected Result After Fix

| Page | Content |
|------|---------|
| Page 1 | Blank stamp area (200pt) + "GOLD BUY BACK AGREEMENT" title + Seller/Buyer parties + Summary table + Signatures |
| Page 2 | Agreement Terms title + Customer name + Ornaments table + 13 Tamil clauses + Signatures |
| Page 3 | Customer Selling Declaration + Customer details table + Declaration text + Warning box + Signatures |

### Files to Modify

| File | Change |
|------|--------|
| `src/components/print/documents/SaleAgreementPDF.tsx` | Reduce `stampAreaBlank.height` from 320 to 200 |

