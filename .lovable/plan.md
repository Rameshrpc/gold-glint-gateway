
## Plan: Fix Sale Agreement PDF Layout and Separate Company Branding for Zamin Gold

### Issues Identified

| Issue | Current State | Required State |
|-------|---------------|----------------|
| **Page 2 is empty** | The Sale Agreement PDF has Page 1 (Summary) ending with signature, then Page 2 starts fresh with "GOLD BUY BACK AGREEMENT" title | Page 1 should contain the summary AND the Gold Buyback Agreement content if it fits |
| **Gold Buyback Agreement** | Currently on Page 2 with ornaments + 13 clauses | Should remain on a separate page (as requested) |
| **Gold Declaration** | Part of Page 3 | Should remain on a separate page (already separate) |
| **KYC Documents header** | Uses `companyName` (Zenith Finance) from main client | Should use Zamin Gold company name for Sale Agreements |
| **Jewel Image header** | Uses `companyName` (Zenith Finance) from main client | Should use Zamin Gold company name for Sale Agreements |
| **Zamin Gold logo** | No separate logo field exists | Add `sale_agreement_logo_url` field in print_settings |

---

### Technical Analysis

#### Current PDF Structure (3 pages):

```
Page 1: Stamp Paper Page
├── 320pt blank stamp area
├── "GOLD BUY BACK AGREEMENT" title
├── Parties (Seller/Buyer)
├── Summary table
└── Signatures + "Page 1 of 3"

Page 2: Agreement Terms (CURRENTLY MOSTLY EMPTY - BUG)
├── "GOLD BUY BACK AGREEMENT" title
├── Customer info
├── Ornaments table
├── 13 Clauses
└── Signatures + "Page 2 of 3"

Page 3: Customer Declaration
├── Declaration title
├── Customer details table
├── Declaration text
├── Warning box
└── Signatures + "Page 3 of 3"
```

#### Root Cause of Empty Page 2:
Looking at the code, Page 1 has content (stamp area + parties + summary + signatures), and Page 2 has different content (ornaments table + clauses). The issue is that Page 1's content ends with signatures at line 538, and the "Page 1 of 3" footer at line 540. Page 2 starts fresh at line 543.

The user sees Page 2 as "empty" because they're likely seeing just the title with ornament table (which is blank if no items), but the actual structure should work. Let me verify the actual issue - it could be that:
1. The stamp area (320pt) takes too much space, and content flows to next page unexpectedly
2. Or the PDF renderer is splitting incorrectly

The user's request is to:
1. Fit Page 1 content properly (stamp area + summary should complete in 1 page)
2. Keep Gold Buyback Agreement terms on a fresh page (Page 2 with ornaments + clauses)
3. Keep Gold Declaration on Page 3

---

### Solution Design

#### Part 1: Database Migration - Add Zamin Gold Logo Field

Add new column to `print_settings`:

```sql
ALTER TABLE print_settings 
ADD COLUMN IF NOT EXISTS sale_agreement_logo_url TEXT DEFAULT NULL;
```

#### Part 2: Update Print Settings Types and Hooks

**Files to modify:**
- `src/hooks/usePrintSettings.tsx` - Add `sale_agreement_logo_url` to interface
- `src/hooks/useEffectivePrintSettings.tsx` - Add `sale_agreement_logo_url` to effective settings

#### Part 3: Add Logo Upload in Sale Agreement Settings

**File:** `src/components/print/SaleAgreementSettings.tsx`

Add logo upload field similar to main logo upload:
- Label: "Logo for Sale Agreements (Zamin Gold)"
- Description: "This logo will appear on KYC Documents and Jewel Image when printing Sale Agreements"

#### Part 4: Fix SaleAgreementPDF Layout

**File:** `src/components/print/documents/SaleAgreementPDF.tsx`

Current structure needs adjustment:
- Page 1 currently has: stamp area (320pt) + title + parties + summary table + signatures
- The 320pt blank area for stamp paper consumes most of the page

**Fix:** The user wants the current Page 1 content to fit on one page. The stamp area (320pt ≈ 4.4 inches) combined with content may be too much. 

Looking at the user's request more carefully:
> "page 2 of sale agreement pdf is empty and should get over within page1"

This means the user wants the content that's currently going to Page 2 (because it doesn't fit) to be condensed into Page 1.

**Solution:** Reduce spacing/padding, and potentially combine the stamp page summary into a more compact layout.

Actually, reviewing the PDF structure again:
- Page 1 is the **Stamp Paper Cover** (minimal content, mostly blank for physical stamp)
- Page 2 is the **Agreement Terms** (ornaments + 13 clauses)
- Page 3 is the **Declaration**

The user says Page 2 is "empty" - this likely means the ornaments table is showing no items (mock data issue) or the clauses aren't rendering. But based on code, it should work.

**Clarification needed**: The user wants:
1. ✅ Gold Buyback Agreement on a fresh page (current Page 2 → keep as is)
2. ✅ Gold Declaration on a separate page (current Page 3 → keep as is)
3. ❓ "Page 2 is empty" → Need to investigate if this is a rendering issue

Let me re-interpret: The user wants the **Stamp Paper Page (Page 1)** content to be more compact so there's no wasted space. The current Page 1 has a 320pt blank area for physical stamp paper printing, then summary. If the user wants this to fit better, we can reduce the stamp area height.

#### Part 5: Update SaleAgreementPrintDialog to Use Zamin Gold Branding

**File:** `src/components/print/SaleAgreementPrintDialog.tsx`

Currently, KYC and Jewel Image use main `companyName`:
```typescript
const companyName = client?.company_name || 'Company';
// ...
<KYCDocumentsPDF companyName={companyName} ... />
<JewelImagePDF companyName={companyName} ... />
```

**Fix:** Use `sale_agreement_company_name` for KYC and Jewel Image in Sale Agreement print:
```typescript
const saleAgreementCompanyName = effectiveSettings.sale_agreement_company_name || companyName;
const saleAgreementLogoUrl = effectiveSettings.sale_agreement_logo_url || effectiveSettings.logo_url;

<KYCDocumentsPDF 
  companyName={saleAgreementCompanyName}
  logoUrl={saleAgreementLogoUrl}
  ... 
/>
<JewelImagePDF 
  companyName={saleAgreementCompanyName}
  logoUrl={saleAgreementLogoUrl}
  ... 
/>
```

---

### Files to Modify

| File | Changes |
|------|---------|
| **Database** | Add `sale_agreement_logo_url` column to `print_settings` |
| `src/hooks/usePrintSettings.tsx` | Add `sale_agreement_logo_url` to `PrintSettings` interface |
| `src/hooks/useEffectivePrintSettings.tsx` | Add `sale_agreement_logo_url` to `EffectivePrintSettings` |
| `src/components/print/SaleAgreementSettings.tsx` | Add logo upload field for Zamin Gold |
| `src/components/print/SaleAgreementPrintDialog.tsx` | Pass Zamin Gold company name and logo to KYC and Jewel PDFs |
| `src/components/print/documents/SaleAgreementPDF.tsx` | Compact Page 1 stamp area (reduce height from 320pt to ~200pt if needed) |

---

### UI Changes

#### Sale Agreement Print Settings

```
Sale Agreement Settings
─────────────────────────────────────────────────────

Logo for Sale Agreements
[Upload] [Preview: zamin-gold-logo.png]
This logo will appear on KYC Documents and Jewel Image 
when printing Sale Agreements. If not set, the main logo 
will be used.

Company Name for Sale Agreements
[ZAMIN GOLD                                          ]
This name will appear on Sale Agreement documents...

Company Address for Sale Agreements  
[No. 123, Main Road, Chennai - 600001               ]
This address will appear on Sale Agreement documents...
```

#### Expected PDF Output

**KYC Documents (for Sale Agreements):**
- Header: "Zamin Gold" (instead of "Zenith Finance")
- Logo: Zamin Gold logo (if configured)
- Title: "KYC DOCUMENTS / கேஒய்சி ஆவணங்கள்"

**Jewel Image (for Sale Agreements):**
- Header: "Zamin Gold" (instead of "Zenith Finance")
- Logo: Zamin Gold logo (if configured)
- Title: "JEWEL IMAGE / நகை படம்"

---

### Implementation Order

1. **Database migration** - Add `sale_agreement_logo_url` column
2. **Update hooks** - Add new field to PrintSettings and EffectivePrintSettings interfaces
3. **Update SaleAgreementSettings** - Add logo upload UI
4. **Update SaleAgreementPrintDialog** - Pass correct company name and logo for KYC/Jewel PDFs
5. **Fix SaleAgreementPDF** - Adjust Page 1 stamp area if needed (compact layout)

---

### Technical Details

#### Logo Storage

The logo will be uploaded to Supabase storage (existing `print-assets` bucket) and stored as a URL path in `sale_agreement_logo_url`. The existing logo upload pattern from the main print settings will be reused.

#### Fallback Logic

```typescript
// In SaleAgreementPrintDialog
const saleAgreementCompanyName = effectiveSettings.sale_agreement_company_name || companyName;
const saleAgreementLogoUrl = effectiveSettings.sale_agreement_logo_url || effectiveSettings.logo_url;
```

If no Zamin Gold logo is configured, it falls back to the main company logo.
If no Zamin Gold company name is configured, it falls back to the main company name.

