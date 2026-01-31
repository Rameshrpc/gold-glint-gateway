

## Plan: Add Address Field & Replace Tamil Text in Sale Agreement PDF

### Overview
Two changes are needed:
1. **Add Address field** for Sale Agreement company (e.g., ZAMIN GOLD's address) in the Settings
2. **Replace Tamil text** - Change all instances of "ஜெனித் கோல்ட்" (Zenith Gold) to "ஜமின் கோல்ட்" (Zamin Gold) in the Sale Agreement PDF clauses and declaration

---

### Current State Analysis

**Issue 1 - Address**: The Sale Agreement PDF currently passes `companyAddress={(client as any)?.address || ''}` which uses the main client's address. For ZAMIN GOLD (a separate entity), a dedicated address field is needed.

**Issue 2 - Tamil Text**: In `useSaleAgreementContent.tsx`, the Tamil text contains hardcoded "ஜெனித் கோல்ட்" (Zenith Gold in Tamil) in:
- 13 agreement clauses (lines 28-93)
- Declaration text (line 96)
- Warning text (line 98)
- Company signature label (line 109-110)

---

### Technical Changes

#### 1. Database: Add Address Column
Add a new column `sale_agreement_company_address` to `print_settings` table.

```sql
ALTER TABLE public.print_settings 
ADD COLUMN IF NOT EXISTS sale_agreement_company_address TEXT;
```

---

#### 2. Update Print Settings Hook
**File: `src/hooks/usePrintSettings.tsx`**

Add the new field to the interface and default settings:

```typescript
export interface PrintSettings {
  // ... existing fields ...
  sale_agreement_company_name: string | null;
  sale_agreement_company_address: string | null;  // ADD
}

const DEFAULT_SETTINGS = {
  // ... existing fields ...
  sale_agreement_company_name: null,
  sale_agreement_company_address: null,  // ADD
};
```

---

#### 3. Update Effective Print Settings Hook
**File: `src/hooks/useEffectivePrintSettings.tsx`**

Add the field to the effective settings interface.

---

#### 4. Update Sale Agreement Settings UI
**File: `src/components/print/SaleAgreementSettings.tsx`**

Add an address input field below the company name:

```tsx
<div className="space-y-2">
  <Label>Company Address for Sale Agreements</Label>
  <Input
    value={settings.sale_agreement_company_address || ''}
    onChange={(e) => updateSettings({ 
      sale_agreement_company_address: e.target.value || null 
    })}
    placeholder="Enter the full address for ZAMIN GOLD"
  />
  <p className="text-sm text-muted-foreground">
    This address will appear on Sale Agreement documents.
  </p>
</div>
```

---

#### 5. Update Loan Print Dialog
**File: `src/components/print/LoanPrintDialog.tsx`**

Pass the dedicated address to SaleAgreementPDF:

```typescript
const saleAgreementCompanyName = effectiveSettings.sale_agreement_company_name || companyName;
const saleAgreementCompanyAddress = effectiveSettings.sale_agreement_company_address || (client as any)?.address || '';

<SaleAgreementPDF
  companyName={saleAgreementCompanyName}
  companyAddress={saleAgreementCompanyAddress}  // Use dedicated address
  // ... other props
/>
```

---

#### 6. Replace Tamil Text in Sale Agreement Content
**File: `src/hooks/useSaleAgreementContent.tsx`**

Replace all instances of:
- "ஜெனித் கோல்ட்" → "ஜமின் கோல்ட்" (Zenith Gold → Zamin Gold in Tamil)
- "Zenith Gold" → "Zamin Gold" (in English comments/labels)

**Locations to update:**
| Line | Content |
|------|---------|
| 30 | Clause 1 Tamil text |
| 35 | Clause 2 Tamil text |
| 40 | Clause 3 Tamil text |
| 45 | Clause 4 Tamil text |
| 50 | Clause 5 Tamil text |
| 55 | Clause 6 Tamil text |
| 60 | Clause 7 Tamil text |
| 65 | Clause 8 Tamil text |
| 70 | Clause 9 Tamil text |
| 75 | Clause 10 Tamil text |
| 80 | Clause 11 Tamil text |
| 85 | Clause 12 Tamil text |
| 90 | Clause 13 Tamil text |
| 96 | Declaration text |
| 98 | Warning text |
| 109-110 | Company signature labels |

---

### Files to Modify/Create

| File | Action | Description |
|------|--------|-------------|
| Database migration | Create | Add `sale_agreement_company_address` column |
| `src/hooks/usePrintSettings.tsx` | Modify | Add address field to interface and defaults |
| `src/hooks/useEffectivePrintSettings.tsx` | Modify | Add address to effective settings |
| `src/components/print/SaleAgreementSettings.tsx` | Modify | Add address input field |
| `src/components/print/LoanPrintDialog.tsx` | Modify | Pass dedicated address to PDF |
| `src/hooks/useSaleAgreementContent.tsx` | Modify | Replace all Tamil text from ஜெனித் to ஜமின் |

---

### Expected Outcome

After implementation:
1. **Settings Page** (Settings → Print Setup → Sale Agreement) will have:
   - Company Name input (ZAMIN GOLD)
   - Company Address input (new field)

2. **Sale Agreement PDF** will display:
   - "M/s. ZAMIN GOLD" as company name
   - Configured address below the name
   - All Tamil clauses using "ஜமின் கோல்ட்" instead of "ஜெனித் கோல்ட்"

---

### Tamil Text Changes Preview

**Before:**
```
ஜெனித் கோல்ட்ல் என்னுடைய தங்க நகைகளை...
```

**After:**
```
ஜமின் கோல்ட்ல் என்னுடைய தங்க நகைகளை...
```

