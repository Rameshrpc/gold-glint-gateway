
## Plan: Create Unique Print Dialog for Sale Agreements

### Problem Statement
Currently, Sale Agreements use the generic `LoanPrintDialog` component which shows all 6 document types (Loan Receipt, Bill of Sale, Gold Declaration, Terms & Conditions, KYC Documents, Jewel Image). For Sale Agreements, only 3 documents are needed:
1. Bill of Sale Agreement (Sale Agreement PDF)
2. KYC Documents
3. Jewel Image

### Solution Overview
Create a dedicated `SaleAgreementPrintDialog` component specifically for Sale Agreements with:
- Only 3 document options instead of 6
- Sale Agreement-appropriate terminology
- Title: "Print Sale Agreement Documents" instead of "Print Loan Documents"

---

### Technical Changes

#### 1. Create New Component: `src/components/print/SaleAgreementPrintDialog.tsx`

A simplified version of `LoanPrintDialog.tsx` that:
- Only includes 3 document types: Bill of Sale Agreement, KYC Documents, Jewel Image
- Uses appropriate terminology ("Sale Agreement" instead of "Loan")
- Uses `SaleAgreementPDF` for the Bill of Sale Agreement
- Sets Bill of Sale Agreement as selected by default

```typescript
interface DocumentSelection {
  billOfSale: boolean;
  kycDocuments: boolean;
  jewelImage: boolean;
}

interface CopyCounts {
  billOfSale: number;
  kycDocuments: number;
  jewelImage: number;
}

const documents = [
  { key: 'billOfSale', label: 'Bill of Sale Agreement', icon: FileText },
  { key: 'kycDocuments', label: 'KYC Documents', icon: FileText },
  { key: 'jewelImage', label: 'Jewel Image', icon: FileText },
];
```

**Key differences from LoanPrintDialog:**
- Removed: `loanReceipt`, `goldDeclaration`, `termsConditions`
- Dialog title: "Print Sale Agreement Documents"
- Default selection: `billOfSale: true`, `kycDocuments: true`, `jewelImage: true`
- Download filename: `SaleAgreement_${loan.loan_number}_...pdf`

#### 2. Update Component Exports: `src/components/print/index.ts`

Add export for the new component:
```typescript
export * from './SaleAgreementPrintDialog';
```

#### 3. Update Sale Agreements Page: `src/pages/SaleAgreements.tsx`

Replace `LoanPrintDialog` with `SaleAgreementPrintDialog`:

```typescript
// Change import
import { SaleAgreementPrintDialog } from '@/components/print/SaleAgreementPrintDialog';

// In JSX (around line 2310)
{printingAgreement && printingCustomer && (
  <SaleAgreementPrintDialog
    open={printDialogOpen}
    onOpenChange={setPrintDialogOpen}
    loan={printingAgreement as any}
    customer={printingCustomer}
    goldItems={printingGoldItems}
  />
)}
```

---

### Component Structure

```
SaleAgreementPrintDialog
├── Dialog Header: "Print Sale Agreement Documents"
├── Agreement Info Box (Number + Customer Name)
├── Quick Actions (Select All / Deselect All)
├── Document Selection (3 items only):
│   ├── ☑️ Bill of Sale Agreement [2]
│   ├── ☑️ KYC Documents         [1]
│   └── ☑️ Jewel Image           [1]
└── Footer (Cancel | Download | Print)
```

---

### PDF Generation Logic (Simplified)

```typescript
const generatePDF = async (action: 'print' | 'download') => {
  const blobs: Blob[] = [];

  // 1. Bill of Sale Agreement (uses SaleAgreementPDF)
  if (selection.billOfSale) {
    const doc = <SaleAgreementPDF ... />;
    blobs.push(await pdf(doc).toBlob());
  }

  // 2. KYC Documents
  if (selection.kycDocuments) {
    const signedUrls = await Promise.all([...]);
    const doc = <KYCDocumentsPDF ... />;
    blobs.push(await pdf(doc).toBlob());
  }

  // 3. Jewel Image
  if (selection.jewelImage) {
    const signedUrl = await getSignedLoanDocumentUrl(...);
    const doc = <JewelImagePDF ... />;
    blobs.push(await pdf(doc).toBlob());
  }

  // Merge and output
  const mergedPdf = await PDFDocument.create();
  // ... merge logic
};
```

---

### Files to Modify

| File | Change |
|------|--------|
| `src/components/print/SaleAgreementPrintDialog.tsx` | **NEW** - Create dedicated print dialog with 3 documents |
| `src/components/print/index.ts` | Add export for `SaleAgreementPrintDialog` |
| `src/pages/SaleAgreements.tsx` | Replace `LoanPrintDialog` with `SaleAgreementPrintDialog` |

---

### UI Comparison

| Current (LoanPrintDialog) | New (SaleAgreementPrintDialog) |
|---------------------------|--------------------------------|
| "Print Loan Documents" | "Print Sale Agreement Documents" |
| 6 document options | 3 document options |
| Loan Receipt (default) | Bill of Sale Agreement (default) |
| Bill of Sale Agreement | Bill of Sale Agreement |
| Gold Declaration | - |
| Terms & Conditions | - |
| KYC Documents | KYC Documents |
| Jewel Image | Jewel Image |

---

### Expected Behavior

1. User clicks Print icon on any Sale Agreement row
2. New simplified dialog appears with title "Print Sale Agreement Documents"
3. Shows agreement number and customer name
4. Only 3 documents available to select (all pre-selected by default)
5. User can adjust copies for each document
6. Download/Print generates merged PDF with only selected documents
7. Filename format: `SaleAgreement_SA202602020001_2026-02-02.pdf`
