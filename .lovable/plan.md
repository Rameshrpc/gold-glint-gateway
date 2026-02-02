

## Plan: Add Strike Price Schedule to Page 2 of Sale Agreement PDF

### Overview

Add a simple, easy-to-understand Strike Price Schedule section on Page 2 of the Sale Agreement PDF. This will explain the repurchase prices at different time intervals, written simply enough for a child to understand.

### Strike Price Calculation Logic

The strike price follows a simple formula:

**Strike Price = Purchase Price + (Monthly Margin x Number of Months)**

Where:
- **Purchase Price** = The amount paid for the gold ornaments
- **Monthly Margin** = A fixed fee charged per month (derived from scheme)
- **Number of Months** = `ceil(Days / 30)` - rounded up to the nearest month

Example with ₹1,30,000 purchase and ₹3,000/month margin:
| Days | Months (ceil) | Margin | Strike Price |
|------|---------------|--------|--------------|
| 0-15 | 1 | ₹3,000 | ₹1,33,000 |
| 16-30 | 1 | ₹3,000 | ₹1,33,000 |
| 31-45 | 2 | ₹6,000 | ₹1,36,000 |
| 46-60 | 2 | ₹6,000 | ₹1,36,000 |
| 61-75 | 3 | ₹9,000 | ₹1,39,000 |
| 76-90 | 3 | ₹9,000 | ₹1,39,000 |

### Technical Changes

**File: `src/components/print/SaleAgreementPrintDialog.tsx`**

1. Pass scheme data (margin_per_month) to the SaleAgreementPDF component

**File: `src/components/print/documents/SaleAgreementPDF.tsx`**

1. Add new props to receive margin_per_month
2. Import `calculateSimpleStrikePrices` from `saleAgreementCalculations.ts`
3. Calculate strike prices using loan data (principal, loan_date, tenure_days)
4. Add new styles for the Strike Price Schedule section
5. Add a new section on Page 2 before the Terms & Conditions that displays:
   - A simple title: "Repurchase Price Schedule" (with Tamil translation)
   - A child-friendly explanation paragraph
   - A clean table showing each 15-day period and its strike price
   - Option expiry date

### Page 2 Layout After Change

```
+------------------------------------------+
|        GOLD BUY BACK AGREEMENT           |
|    தங்க திரும்ப கொள்முதல் ஒப்பந்தம்          |
+------------------------------------------+
| NAME OF THE CUSTOMER: [Name]             |
+------------------------------------------+
| ORNAMENTS DETAILS:                       |
| [Table with gold items...]               |
+------------------------------------------+
| REPURCHASE PRICE SCHEDULE (NEW!)         |
| திரும்ப வாங்கும் விலை அட்டவணை                |
|                                          |
| "If you want to buy back your gold,      |
| here's how much you need to pay..."      |
|                                          |
| Days     | Months | Repurchase Price     |
| 0-15     | 1      | ₹1,33,000           |
| 16-30    | 1      | ₹1,33,000           |
| 31-45    | 2      | ₹1,36,000           |
| 46-60    | 2      | ₹1,36,000           |
| 61-75    | 3      | ₹1,39,000           |
| 76-90    | 3      | ₹1,39,000           |
|                                          |
| Option Expiry: 04/05/2026                |
+------------------------------------------+
| TERMS & CONDITIONS விதிமுறைகள்:            |
| [13 clauses...]                          |
+------------------------------------------+
| [Signatures]                             |
+------------------------------------------+
```

### Simple Explanation Text (8-year-old friendly)

**English:**
> "When you want to buy back your gold, the price depends on how many days have passed. Each month, a small fee is added. Pay early to save money!"

**Tamil:**
> "உங்கள் தங்கத்தை திரும்ப வாங்க விரும்பும்போது, எத்தனை நாட்கள் கடந்தன என்பதை பொறுத்து விலை இருக்கும். ஒவ்வொரு மாதமும் ஒரு சிறிய கட்டணம் சேர்க்கப்படும். பணத்தை சேமிக்க சீக்கிரம் செலுத்துங்கள்!"

### Files to Modify

| File | Changes |
|------|---------|
| `src/components/print/SaleAgreementPrintDialog.tsx` | Add scheme prop to SaleAgreementPDF, derive margin from loan.interest_rate |
| `src/components/print/documents/SaleAgreementPDF.tsx` | 1. Add marginPerMonth prop<br>2. Import calculateSimpleStrikePrices<br>3. Add strike price schedule styles<br>4. Add strike price section on Page 2 before Terms |

### Expected Result

Page 2 of the Sale Agreement PDF will now include a clear, simple table showing:
- What price to pay if repurchasing within 0-15 days
- What price to pay if repurchasing within 16-30 days
- And so on up to the full tenure (typically 90 days)

The explanation is written simply so anyone can understand that paying early costs less, and each month adds a fixed margin amount.

