

## Plan: Remove Stamp Text and Fix Tamil Word-Breaking in Sale Agreement PDF

### Issues Identified

1. **Stamp Area Has Text**: The stamp area shows "Affix ₹100 Stamp Paper Here" text, but since this document will be printed on actual stamp paper, the area should be completely blank with just reserved margin space.

2. **Tamil Words Breaking Mid-Character**: Looking at the uploaded screenshots (clauses 3 and 7), Tamil words are splitting in the middle and continuing on the next line (e.g., `உரிமை உண` splitting to next line with `:டு`). This is unreadable and unprofessional.

### Root Cause Analysis

**For Word Breaking:**
- In `@react-pdf/renderer`, the `flex: 1` property on `clauseText` combined with the fixed `width: 18` on the clause number creates layout issues
- The library doesn't properly handle Tamil Unicode word boundaries
- Long Tamil sentences without explicit line breaks cause the renderer to cut words at arbitrary positions

### Solution

---

#### 1. Remove Stamp Text - Make Stamp Area Completely Blank

**Current (lines 434-437):**
```tsx
<View style={styles.stampArea}>
  <Text style={styles.stampText}>Affix ₹100 Stamp Paper Here</Text>
  <Text style={styles.stampTextTamil}>₹100 முத்திரைத்தாள் இங்கே ஒட்டவும்</Text>
</View>
```

**Fixed:**
```tsx
<View style={styles.stampAreaBlank} />
```

**New style:**
```typescript
stampAreaBlank: {
  height: 320,
  marginBottom: 15,
  // No border, no text - just blank space for physical stamp paper
},
```

---

#### 2. Fix Tamil Word Breaking

The key issue is that `@react-pdf/renderer` does not understand Tamil word boundaries. The solution is to:

**A. Remove flex layout from clause text and use block layout instead:**

**Current clauseRow style:**
```typescript
clauseRow: {
  flexDirection: 'row',
  alignItems: 'flex-start',
},
clauseNumber: {
  fontSize: 9,
  fontWeight: 'bold',
  fontFamily: 'Noto Sans Tamil',
  marginRight: 4,
  width: 18,
},
clauseText: {
  fontSize: 9,
  fontFamily: 'Noto Sans Tamil',
  lineHeight: 1.6,
  textAlign: 'left',
  flex: 1,  // This causes issues
},
```

**Fixed styles:**
```typescript
clauseRow: {
  flexDirection: 'row',
  alignItems: 'flex-start',
  flexWrap: 'nowrap',
},
clauseNumber: {
  fontSize: 9,
  fontWeight: 'bold',
  fontFamily: 'Noto Sans Tamil',
  marginRight: 6,
  minWidth: 18,
},
clauseText: {
  fontSize: 9,
  fontFamily: 'Noto Sans Tamil',
  lineHeight: 1.8,  // Increased for better spacing
  textAlign: 'left',
  flex: 1,
  flexShrink: 1,
  flexWrap: 'wrap',
},
```

**B. Add Zero-Width Space characters after each Tamil word to help the renderer understand word boundaries:**

Create a utility function to insert invisible word-break hints:

```typescript
// Helper to add word-break hints for Tamil text
const addWordBreakHints = (text: string): string => {
  // Add Zero-Width Space (U+200B) after each space to hint word boundaries
  return text.replace(/ /g, ' \u200B');
};
```

Then use it in the rendering:
```tsx
<Text style={styles.clauseText}>{addWordBreakHints(clause.tamil)}</Text>
```

**C. Increase line height and add padding for better legibility:**

```typescript
clauseItem: {
  marginBottom: 10,
  paddingRight: 8,
},
clauseText: {
  fontSize: 9,
  fontFamily: 'Noto Sans Tamil',
  lineHeight: 1.8,  // Increased from 1.6
  textAlign: 'left',
  flex: 1,
},
```

---

### Files to Modify

| File | Change |
|------|--------|
| `src/components/print/documents/SaleAgreementPDF.tsx` | Remove stamp text, add word-break helper, fix clause styles |

---

### Technical Changes Summary

1. **Stamp Area**: Remove all text content, make it a blank `View` with just height margin
2. **Word Breaking Fix**: 
   - Add `addWordBreakHints()` helper function to insert Zero-Width Space (U+200B) after each word
   - Apply this to all Tamil clause text and declaration text
   - Increase lineHeight to 1.8 for better spacing
   - Add `flexWrap: 'wrap'` and `flexShrink: 1` to prevent forced line breaks

---

### Visual Before/After

**Stamp Area Before:**
```
┌─────────────────────────────────┐
│                                 │
│   Affix ₹100 Stamp Paper Here   │
│   ₹100 முத்திரைத்தாள் இங்கே ஒட்டவும் │
│                                 │
└─────────────────────────────────┘
```

**Stamp Area After:**
```
┌─────────────────────────────────┐
│                                 │
│         (blank space)           │
│                                 │
│                                 │
└─────────────────────────────────┘
```

**Clause Text Before (broken words):**
```
7.  ஜெனித் கோல்ட் நிறுவனத்திற்கு நான் கொடுத்த தங்கநகையின் மூலம் நஷ்டம் ஏற்படும் ப
    ட்சத்தில் நிறுவனம் எந்த நேரத்திலும்...
```

**Clause Text After (clean wrapping):**
```
7.  ஜெனித் கோல்ட் நிறுவனத்திற்கு நான் கொடுத்த தங்கநகையின் 
    மூலம் நஷ்டம் ஏற்படும் பட்சத்தில் நிறுவனம் எந்த 
    நேரத்திலும்...
```

---

### Expected Outcome

- Stamp area will be completely blank (ready for physical ₹100 stamp paper printing)
- Tamil words will wrap correctly at word boundaries, not mid-character
- Professional, readable layout for all 13 clauses and declaration text

