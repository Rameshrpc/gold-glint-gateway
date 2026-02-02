

## Plan: Remove Blank Page 2 in Sale Agreement PDF

### Problem

The blank Page 2 appears because the signature section on Page 1 is overflowing to a new page. With the 320pt stamp area, there's limited space, and the PDF renderer creates an empty overflow page.

### Solution

Wrap all Page 1 content (after the stamp area) in a single View with `wrap={false}` to prevent any content from breaking to a new page. This forces all elements (title, parties, summary table, signatures) to fit within Page 1's remaining space.

### Technical Changes

**File: `src/components/print/documents/SaleAgreementPDF.tsx`**

Wrap lines 429-537 (from Title to Signatures) in a View with `wrap={false}`:

```typescript
{/* Page 1: Cover / Stamp Paper Page */}
<Page size={paperSize as any} style={styles.page}>
  {/* Blank area for stamp paper */}
  <View style={styles.stampAreaBlank} />

  {/* Wrap all content after stamp area to prevent page break */}
  <View wrap={false}>
    {/* Title */}
    <Text style={styles.mainTitle}>GOLD BUY BACK AGREEMENT</Text>
    ...
    {/* Summary Table */}
    ...
    {/* Signatures */}
    ...
  </View>

  <Text style={styles.pageFooter}>Page 1 of 3</Text>
</Page>
```

This ensures the signature section stays on Page 1 instead of creating a blank overflow page.

### Files to Modify

| File | Change |
|------|--------|
| `src/components/print/documents/SaleAgreementPDF.tsx` | Add `<View wrap={false}>` wrapper around lines 429-537 (all content between stamp area and footer) |

### Expected Result

After fix:
- **Page 1**: Stamp area (320pt) + Title + Parties + Summary + Signatures (no overflow)
- **Page 2**: Agreement Terms (ornaments + clauses) 
- **Page 3**: Customer Selling Declaration

No blank Page 2 will appear.

