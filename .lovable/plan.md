

## Plan: Fix Font Corruption in Sale Agreement PDF

### Problem Analysis

The Tamil fonts in the Sale Agreement PDF are appearing as corrupted/garbled text (e.g., `µ¿±ïµºï` instead of `விற்பவர்`). This happens because:

1. **Mixed text in single elements**: Lines like `1. THE SELLER (விற்பவர்)` combine English and Tamil in one `<Text>` element
2. **Wrong font applied**: The page uses `fontFamily: 'Roboto'` as default, but Roboto doesn't support Tamil characters
3. **No font switching**: Unlike other PDF components (LoanReceiptPDF, GoldDeclarationPDF) that use `BilingualLabel` components, this PDF renders mixed text directly

### Root Cause

In `@react-pdf/renderer`, a single `<Text>` element can only use one font family. When Tamil Unicode characters are rendered with Roboto font (which has no Tamil glyphs), they display as corrupted symbols.

### Corrupted Text Locations

| Line | Current Code | Issue |
|------|-------------|-------|
| 396 | `₹100 முத்திரைத்தாள் இங்கே ஒட்டவும்` | Stamp area Tamil text |
| 406 | `1. THE SELLER (விற்பவர்)` | Party header mixed text |
| 423 | `2. THE BUYER (வாங்குபவர்)` | Party header mixed text |
| 551 | `TERMS & CONDITIONS / விதிமுறைகள்:` | Section header mixed text |
| 629 | `⚠️ WARNING / எச்சரிக்கை:` | Warning title mixed text |

### Solution

Split all mixed English/Tamil text into separate `<Text>` elements with appropriate font families, following the pattern used in other working PDF components.

---

### Changes Required

#### File: `src/components/print/documents/SaleAgreementPDF.tsx`

**1. Add new style for Tamil text elements:**

```typescript
stampTextTamil: {
  fontSize: 10,
  fontFamily: 'Noto Sans Tamil',
  color: '#888',
  marginTop: 3,
},
partyTitleTamil: {
  fontSize: 9,
  fontFamily: 'Noto Sans Tamil',
  color: '#333',
},
clausesTitleTamil: {
  fontSize: 9,
  fontFamily: 'Noto Sans Tamil',
  marginBottom: 6,
  color: '#333',
},
warningTitleTamil: {
  fontSize: 8,
  fontFamily: 'Noto Sans Tamil',
  color: '#856404',
},
```

**2. Fix stamp area (line 394-397):**

Current:
```tsx
<View style={styles.stampArea}>
  <Text style={styles.stampText}>Affix ₹100 Stamp Paper Here</Text>
  <Text style={styles.stampSubText}>₹100 முத்திரைத்தாள் இங்கே ஒட்டவும்</Text>
</View>
```

Fixed:
```tsx
<View style={styles.stampArea}>
  <Text style={styles.stampText}>Affix ₹100 Stamp Paper Here</Text>
  <Text style={styles.stampTextTamil}>₹100 முத்திரைத்தாள் இங்கே ஒட்டவும்</Text>
</View>
```

**3. Fix party headers (lines 406 and 423):**

Current:
```tsx
<Text style={styles.partyTitle}>1. THE SELLER (விற்பவர்)</Text>
```

Fixed:
```tsx
<View style={styles.partyTitleContainer}>
  <Text style={styles.partyTitle}>1. THE SELLER </Text>
  <Text style={styles.partyTitleTamil}>(விற்பவர்)</Text>
</View>
```

**4. Fix Terms & Conditions header (line 551):**

Current:
```tsx
<Text style={styles.clausesTitle}>TERMS & CONDITIONS / விதிமுறைகள்:</Text>
```

Fixed:
```tsx
<View style={styles.clausesTitleContainer}>
  <Text style={styles.clausesTitle}>TERMS & CONDITIONS</Text>
  <Text style={styles.clausesTitleTamil}>விதிமுறைகள்:</Text>
</View>
```

**5. Fix Warning title (line 629):**

Current:
```tsx
<Text style={styles.warningTitle}>⚠️ WARNING / எச்சரிக்கை:</Text>
```

Fixed:
```tsx
<View style={styles.warningTitleContainer}>
  <Text style={styles.warningTitle}>WARNING</Text>
  <Text style={styles.warningTitleTamil}>எச்சரிக்கை:</Text>
</View>
```

---

### Visual Before/After

**Before (Corrupted):**
```
1. THE SELLER ()µ¿±ïµºï
TERMS & CONDITIONS / µ¿:µ®Á±Ë·ï
```

**After (Fixed):**
```
1. THE SELLER 
(விற்பவர்)

TERMS & CONDITIONS
விதிமுறைகள்:
```

---

### Technical Details

**New styles to add:**
```typescript
stampTextTamil: {
  fontSize: 10,
  fontFamily: 'Noto Sans Tamil',
  color: '#888',
  marginTop: 3,
},
partyTitleContainer: {
  flexDirection: 'row',
  alignItems: 'center',
  backgroundColor: '#f0f0f0',
  padding: 4,
  marginBottom: 3,
},
partyTitle: {
  fontSize: 10,
  fontWeight: 'bold',
},
partyTitleTamil: {
  fontSize: 9,
  fontFamily: 'Noto Sans Tamil',
  color: '#333',
},
clausesTitleContainer: {
  flexDirection: 'row',
  alignItems: 'center',
  marginBottom: 6,
  gap: 8,
},
clausesTitleTamil: {
  fontSize: 9,
  fontFamily: 'Noto Sans Tamil',
  textDecoration: 'underline',
  color: '#333',
},
warningTitleContainer: {
  flexDirection: 'row',
  alignItems: 'center',
  marginBottom: 5,
  gap: 6,
},
warningTitleTamil: {
  fontSize: 8,
  fontFamily: 'Noto Sans Tamil',
  color: '#856404',
},
```

---

### Files to Modify

| File | Action |
|------|--------|
| `src/components/print/documents/SaleAgreementPDF.tsx` | Fix all mixed English/Tamil text by splitting into separate font-specific elements |

---

### Expected Outcome

- All Tamil text will render correctly with proper Tamil characters
- English text will continue to use Roboto font
- Bilingual headers will display cleanly with proper font rendering
- Professional appearance matching other PDF documents in the system

