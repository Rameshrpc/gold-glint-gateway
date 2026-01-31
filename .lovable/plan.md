

## Plan: Show Address Instead of Branch in Sale Agreement PDF

### Problem
Currently, the Sale Agreement PDF shows "Branch: Main Branch" in THE BUYER section. The user wants it to display "Address: 1175/1 TRICH ROAD, AUGUSTIN PET, COIMBATORE, TAMIL NADU-641045" instead.

---

### Solution
The PDF already has logic to show the company address (lines 465-470 in SaleAgreementPDF.tsx). The issue is that:
1. The branch name is also being passed and displayed
2. When a dedicated `sale_agreement_company_address` is configured, we should NOT show the branch name

---

### Technical Changes

#### File: `src/components/print/LoanPrintDialog.tsx`

**Lines 279-291**: When calling SaleAgreementPDF, don't pass `branchName` when a dedicated sale agreement address is configured:

```typescript
const saleAgreementCompanyName = effectiveSettings.sale_agreement_company_name || companyName;
const saleAgreementCompanyAddress = effectiveSettings.sale_agreement_company_address || (client as any)?.address || '';

// Don't show branch name when dedicated address is configured
const showBranchInSaleAgreement = !effectiveSettings.sale_agreement_company_address;

const saleAgreementDoc = (
  <SaleAgreementPDF
    loan={loan}
    customer={customer}
    goldItems={goldItems}
    companyName={saleAgreementCompanyName}
    companyAddress={saleAgreementCompanyAddress}
    gstin={(client as any)?.gstin}
    branchName={showBranchInSaleAgreement ? branchName : undefined}  // Hide branch when address configured
    language={language}
    paperSize={paperSize}
  />
);
```

---

### Result After Fix

**THE BUYER section will display:**

| Label | Value |
|-------|-------|
| Name: | M/s. ZAMIN GOLD |
| Address: | 1175/1 TRICH ROAD, AUGUSTIN PET, COIMBATORE, TAMIL NADU-641045 |

Instead of showing "Branch: Main Branch", it will show the configured address from Settings → Print Setup → Sale Agreement.

---

### Files to Modify

| File | Change |
|------|--------|
| `src/components/print/LoanPrintDialog.tsx` | Conditionally hide branchName when dedicated address is configured |

---

### User Action Required

After this change, ensure the address is configured in:
**Settings → Print Setup → Sale Agreement → Company Address for Sale Agreements**

Enter: `1175/1 TRICH ROAD, AUGUSTIN PET, COIMBATORE, TAMIL NADU-641045`

