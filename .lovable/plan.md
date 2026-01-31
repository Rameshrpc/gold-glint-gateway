

## Plan: Fix Word Alignment and Spacing in Sale Agreement PDF

### Problem Analysis

Looking at the screenshot, the Tamil text in the Terms & Conditions section has these issues:
1. **Words broken mid-character** - Tamil words are being split incorrectly across lines (incomplete words carrying to next line)
2. **Uneven spacing** - `textAlign: 'justify'` causes stretched gaps between words
3. **Poor readability** - Text appears messy and unprofessional

### Root Cause

In `@react-pdf/renderer`, the `textAlign: 'justify'` property combined with Tamil Unicode text causes problems because:
- The library doesn't understand Tamil word boundaries
- It breaks words at arbitrary character positions
- Justification stretches remaining characters unnaturally

### Solution

1. **Remove `textAlign: 'justify'`** - Use `textAlign: 'left'` instead for cleaner Tamil rendering
2. **Increase `lineHeight`** - From 1.4 to 1.6 for better spacing between lines
3. **Add proper text wrapping** - Add `flexWrap: 'wrap'` and `flexShrink: 1` to allow natural word wrapping
4. **Format long clauses** - Break long Tamil sentences into shorter wrapped segments using proper spacing

---

### Changes Required

#### File: `src/components/print/documents/SaleAgreementPDF.tsx`

**1. Update `clauseText` style (line ~282-287):**

```typescript
// Current
clauseText: {
  fontSize: 8,
  fontFamily: 'Noto Sans Tamil',
  lineHeight: 1.4,
  textAlign: 'justify',  // PROBLEM
},

// Fixed
clauseText: {
  fontSize: 9,
  fontFamily: 'Noto Sans Tamil',
  lineHeight: 1.6,
  textAlign: 'left',
  wordBreak: 'keep-all',
},
```

**2. Update `clauseItem` style for proper wrapping (line ~274-276):**

```typescript
// Current
clauseItem: {
  marginBottom: 6,
},

// Fixed
clauseItem: {
  marginBottom: 8,
  paddingRight: 5,
  flexWrap: 'wrap',
},
```

**3. Update `declarationText` style (line ~326-335):**

```typescript
// Current
declarationText: {
  fontSize: 9,
  fontFamily: 'Noto Sans Tamil',
  lineHeight: 1.5,
  textAlign: 'justify',  // PROBLEM
  marginBottom: 15,
  padding: 8,
  backgroundColor: '#fafafa',
  borderWidth: 1,
  borderColor: '#ddd',
},

// Fixed
declarationText: {
  fontSize: 9,
  fontFamily: 'Noto Sans Tamil',
  lineHeight: 1.7,
  textAlign: 'left',
  marginBottom: 15,
  padding: 10,
  backgroundColor: '#fafafa',
  borderWidth: 1,
  borderColor: '#ddd',
},
```

**4. Update `warningText` style (line ~361-364):**

```typescript
// Current
warningText: {
  fontSize: 9,
  fontFamily: 'Noto Sans Tamil',
  color: '#856404',
},

// Fixed
warningText: {
  fontSize: 9,
  fontFamily: 'Noto Sans Tamil',
  color: '#856404',
  lineHeight: 1.5,
  textAlign: 'left',
},
```

**5. Restructure clause rendering for better control (lines ~591-598):**

```typescript
// Current - simple rendering
{content.clauses.map((clause) => (
  <View key={clause.number} style={styles.clauseItem}>
    <Text style={styles.clauseText}>
      <Text style={styles.clauseNumber}>{clause.number}. </Text>
      {clause.tamil}
    </Text>
  </View>
))}

// Fixed - separate number from text for cleaner layout
{content.clauses.map((clause) => (
  <View key={clause.number} style={styles.clauseItem}>
    <View style={styles.clauseRow}>
      <Text style={styles.clauseNumber}>{clause.number}.</Text>
      <Text style={styles.clauseText}>{clause.tamil}</Text>
    </View>
  </View>
))}
```

**6. Add new style for clause row layout:**

```typescript
clauseRow: {
  flexDirection: 'row',
  flexWrap: 'wrap',
},
clauseNumber: {
  fontSize: 9,
  fontWeight: 'bold',
  fontFamily: 'Noto Sans Tamil',
  marginRight: 4,
  width: 15,
},
clauseText: {
  fontSize: 9,
  fontFamily: 'Noto Sans Tamil',
  lineHeight: 1.6,
  textAlign: 'left',
  flex: 1,
},
```

---

### Visual Before/After

**Before (Broken Words):**
```
1. ஜெனித் கோல்ட்ல் என்னுடைய தங்க நகைகளை அடமான
ம் செய்யவில்லை அவைகளை நிறுவனத்தின் மூலமாக விற்று மொ
த்த தொகைகளை பெற்றுக் கொள்ள சம்மதிக்கி றேன்.
```

**After (Clean Spacing):**
```
1. ஜெனித் கோல்ட்ல் என்னுடைய தங்க நகைகளை அடமானம் 
செய்யவில்லை அவைகளை நிறுவனத்தின் மூலமாக விற்று 
மொத்த தொகைகளை பெற்றுக் கொள்ள சம்மதிக்கிறேன்.
```

---

### Summary of Style Changes

| Style | Property | Before | After |
|-------|----------|--------|-------|
| `clauseText` | textAlign | `justify` | `left` |
| `clauseText` | lineHeight | 1.4 | 1.6 |
| `clauseText` | fontSize | 8 | 9 |
| `clauseItem` | marginBottom | 6 | 8 |
| `declarationText` | textAlign | `justify` | `left` |
| `declarationText` | lineHeight | 1.5 | 1.7 |
| `warningText` | lineHeight | (none) | 1.5 |

---

### Files to Modify

| File | Action |
|------|--------|
| `src/components/print/documents/SaleAgreementPDF.tsx` | Update text styles to use left alignment and improved line heights |

---

### Expected Outcome

- Tamil words will no longer be broken mid-character
- Even spacing between words without stretching
- Clean, professional appearance matching the uploaded document format
- Consistent line heights for better readability

