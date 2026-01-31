

## Plan: Add Sale Agreement Company Name Setting

### Overview
Add a configurable "Sale Agreement Company Name" field in print settings so Sale Agreement documents display "ZAMIN GOLD" (or any configured name) instead of the client's main company name.

---

### Technical Changes

#### 1. Database: Add New Column to `print_settings` Table

Add a new nullable column to store the alternate company name for Sale Agreements:

```sql
ALTER TABLE public.print_settings 
ADD COLUMN IF NOT EXISTS sale_agreement_company_name VARCHAR(255);
```

---

#### 2. File: `src/hooks/usePrintSettings.tsx`

**Update PrintSettings Interface (lines 6-29):**

Add the new field to the interface:

```typescript
export interface PrintSettings {
  // ... existing fields ...
  sale_agreement_company_name: string | null;  // ADD
}
```

**Update DEFAULT_SETTINGS (lines 41-62):**

Add default value:

```typescript
const DEFAULT_SETTINGS = {
  // ... existing fields ...
  sale_agreement_company_name: null,
};
```

---

#### 3. File: `src/components/print/PrintSettingsTab.tsx`

**Add Sale Agreement Settings Section:**

Create a new Card component in the settings UI for "Sale Agreement Settings" containing:
- Company Name input field for Sale Agreements
- Description explaining this is the company name shown on Sale Agreement documents

```tsx
<Card>
  <CardHeader>
    <CardTitle>Sale Agreement Settings</CardTitle>
    <CardDescription>
      Configure settings specific to Sale Agreement (Trading Format) documents
    </CardDescription>
  </CardHeader>
  <CardContent className="space-y-4">
    <div className="space-y-2">
      <Label>Company Name for Sale Agreements</Label>
      <Input
        value={settings.sale_agreement_company_name || ''}
        onChange={(e) => updateSettings({ sale_agreement_company_name: e.target.value || null })}
        placeholder="e.g., ZAMIN GOLD (leave empty to use main company name)"
      />
      <p className="text-sm text-muted-foreground">
        This name will appear on Sale Agreement documents. If left empty, the main company name will be used.
      </p>
    </div>
  </CardContent>
</Card>
```

---

#### 4. File: `src/hooks/useEffectivePrintSettings.tsx`

**Update EffectivePrintSettings Interface:**

Add the new field to ensure it flows through to the print dialog:

```typescript
export interface EffectivePrintSettings {
  // ... existing fields ...
  sale_agreement_company_name: string | null;
}
```

---

#### 5. File: `src/components/print/LoanPrintDialog.tsx`

**Update SaleAgreementPDF Call (lines 274-287):**

Use the sale agreement company name when available:

```typescript
// When generating Sale Agreement PDF
const saleAgreementCompanyName = effectiveSettings.sale_agreement_company_name || companyName;

const saleAgreementDoc = (
  <SaleAgreementPDF
    loan={loan}
    customer={customer}
    goldItems={goldItems}
    companyName={saleAgreementCompanyName}  // Use sale agreement specific name
    companyAddress={(client as any)?.address || ''}
    gstin={(client as any)?.gstin}
    branchName={branchName}
    language={language}
    paperSize={paperSize}
  />
);
```

---

### Files to Modify

| File | Changes |
|------|---------|
| Database migration | Add `sale_agreement_company_name` column to `print_settings` |
| `src/hooks/usePrintSettings.tsx` | Add field to interface and default settings |
| `src/hooks/useEffectivePrintSettings.tsx` | Add field to effective settings interface |
| `src/components/print/PrintSettingsTab.tsx` | Add Sale Agreement Settings section with company name input |
| `src/components/print/LoanPrintDialog.tsx` | Use sale agreement company name when printing Sale Agreements |

---

### User Flow

1. Navigate to **Settings → Print → General** (or dedicated Sale Agreement tab)
2. Find "Sale Agreement Settings" section
3. Enter "ZAMIN GOLD" in the "Company Name for Sale Agreements" field
4. Save settings
5. When printing a Sale Agreement, it will display "M/s. ZAMIN GOLD" instead of the main company name

---

### Expected Outcome

- New "Sale Agreement Company Name" field in print settings
- Sale Agreement PDFs show "ZAMIN GOLD" (or configured name) as the buyer
- If field is empty, falls back to main company name
- Other documents (Loan Receipt, etc.) continue using the main company name

