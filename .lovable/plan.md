
## Plan: Update Page 1 Signatures and Stamp Area Height

### Changes Required

| Item | Current | Required |
|------|---------|----------|
| Stamp Area Height | 200pt | 320pt (revert) |
| Left Signature Block | "For {companyName}" + "Authorised Signatory" | "For {companyName}" only (remove sublabel) |
| Right Signature Block | "Customer Signature:" + "Name: {customer}" | Keep as is |

### Technical Changes

**File: `src/components/print/documents/SaleAgreementPDF.tsx`**

#### Change 1: Revert stamp area height to 320pt (Line 69)

```typescript
stampAreaBlank: {
  height: 320,  // Reverted from 200pt back to 320pt
  marginBottom: 15,
},
```

#### Change 2: Remove "Authorised Signatory" sublabel (Lines 526-538)

**Current:**
```typescript
<View style={styles.signatureSection}>
  <View style={styles.signatureBlock}>
    <Text style={styles.signatureLabel}>For {companyName}</Text>
    <View style={styles.signatureLine} />
    <Text style={styles.signatureSublabel}>Authorised Signatory</Text>  // DELETE
  </View>
  <View style={styles.signatureBlock}>
    <Text style={styles.signatureLabel}>Customer Signature:</Text>
    <View style={styles.signatureLine} />
    <Text style={styles.signatureSublabel}>Name: {customer.full_name}</Text>
  </View>
</View>
```

**After:**
```typescript
<View style={styles.signatureSection}>
  <View style={styles.signatureBlock}>
    <Text style={styles.signatureLabel}>For {companyName}</Text>
    <View style={styles.signatureLine} />
    {/* Authorised Signatory label removed */}
  </View>
  <View style={styles.signatureBlock}>
    <Text style={styles.signatureLabel}>Customer Signature:</Text>
    <View style={styles.signatureLine} />
    <Text style={styles.signatureSublabel}>Name: {customer.full_name}</Text>
  </View>
</View>
```

### Expected Result

Page 1 Signatures will look like:

```
For ZAMIN GOLD                         Customer Signature:
______________________                 ______________________
                                       Name: Lingasamy
```

The left side will only show "For ZAMIN GOLD" above the signature line, with no sublabel underneath.

### Files to Modify

| File | Changes |
|------|---------|
| `src/components/print/documents/SaleAgreementPDF.tsx` | 1. Change stampAreaBlank height from 200 to 320 (line 69)<br>2. Remove "Authorised Signatory" Text element (line 531) |
