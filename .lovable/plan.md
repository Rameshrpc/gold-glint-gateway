

## Plan: Fix Sale Agreement PDF Issues

### Issues to Fix

1. **Remove blank Page 2** - Merge ornaments table and clauses with Page 1 content
2. **Fetch all customer details** - Update query in `SaleAgreements.tsx` to include `date_of_birth`, `gender`, `nominee_name`
3. **Add Father Name field** - Add `father_name` column to customers table and make it mandatory in the customer form

---

### Technical Changes

#### 1. Database: Add `father_name` Column to Customers Table

Add a new nullable column (for existing records) but make it mandatory in the form:

```sql
ALTER TABLE public.customers 
ADD COLUMN IF NOT EXISTS father_name VARCHAR(255);
```

---

#### 2. File: `src/pages/SaleAgreements.tsx`

**Update Customer Interface (lines 38-51):**

Add missing fields for proper PDF data:

```typescript
interface Customer {
  id: string;
  customer_code: string;
  full_name: string;
  phone: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  photo_url?: string;
  aadhaar_front_url?: string;
  aadhaar_back_url?: string;
  pan_card_url?: string;
  date_of_birth?: string;        // ADD
  gender?: string;               // ADD
  nominee_name?: string;         // ADD
  father_name?: string;          // ADD
}
```

**Update fetchCustomers Query (line 321):**

```typescript
const { data } = await supabase
  .from('customers')
  .select('id, customer_code, full_name, phone, address, city, state, pincode, photo_url, aadhaar_front_url, aadhaar_back_url, pan_card_url, date_of_birth, gender, nominee_name, father_name')
  .eq('client_id', client.id)
  .eq('is_active', true)
  .order('full_name');
```

---

#### 3. File: `src/components/print/LoanPrintDialog.tsx`

**Update Customer Interface (lines 41-55):**

```typescript
interface Customer {
  id: string;
  customer_code: string;
  full_name: string;
  phone: string;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  photo_url?: string | null;
  aadhaar_front_url?: string | null;
  aadhaar_back_url?: string | null;
  pan_card_url?: string | null;
  nominee_name?: string | null;
  nominee_relation?: string | null;
  date_of_birth?: string | null;  // ADD
  gender?: string | null;         // ADD
  father_name?: string | null;    // ADD
}
```

---

#### 4. File: `src/components/print/documents/SaleAgreementPDF.tsx`

**Update Customer Interface (lines 23-34):**

```typescript
interface Customer {
  id: string;
  customer_code: string;
  full_name: string;
  phone: string;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  date_of_birth?: string | null;
  gender?: string | null;
  nominee_name?: string | null;
  father_name?: string | null;    // ADD
}
```

**Fix Father Name Display (line 629-631):**

```typescript
<View style={styles.customerRow}>
  <Text style={styles.customerLabel}>FATHER NAME</Text>
  <Text style={styles.customerValue}>{customer.father_name || '-'}</Text>
</View>
```

**Restructure to Remove Blank Page 2:**

Currently:
- Page 1: Stamp area + Title + Parties + Summary + Signatures
- Page 2: Title + Customer name + Ornaments table + Clauses + Signatures
- Page 3: Declaration page

Change to (2 pages total):
- Page 1: Stamp area + Title + Parties + Summary + Ornaments table + Signatures
- Page 2: Title + Clauses (13 clauses) + Declaration section + Warning + Signatures

This merges Page 1 content with ornaments table and moves clauses + declaration to Page 2.

---

#### 5. File: `src/pages/Customers.tsx`

**Add Father Name Form Field:**

Add a new state variable and form field after the nominee section:

```typescript
// Add state (around line 121)
const [fatherName, setFatherName] = useState('');

// Add validation (around line 455-462)
if (!fatherName.trim()) {
  toast.error('Father name is required');
  return;
}

// Add to customerData object (around line 493-500)
father_name: fatherName.trim(),

// Add form field in the UI
```

**Add Form Field in Personal Details Section:**

```tsx
<div className="space-y-2">
  <Label htmlFor="fatherName">Father Name *</Label>
  <Input
    id="fatherName"
    value={fatherName}
    onChange={(e) => setFatherName(e.target.value)}
    placeholder="Enter father name"
    required
  />
</div>
```

---

### Page Structure After Changes

| Page | Content |
|------|---------|
| **Page 1** | Blank stamp area (320pt) + Title + Parties (Seller/Buyer) + Summary table + Ornaments table + Signatures |
| **Page 2** | Title + 13 Tamil Clauses + Customer Declaration table + Declaration text + Warning box + Signatures |

---

### Files to Modify

| File | Changes |
|------|---------|
| Database migration | Add `father_name` column to `customers` table |
| `src/pages/Customers.tsx` | Add father_name field to form, make mandatory, update resetForm, openEditDialog |
| `src/pages/SaleAgreements.tsx` | Update Customer interface and fetchCustomers query |
| `src/components/print/LoanPrintDialog.tsx` | Update Customer interface |
| `src/components/print/documents/SaleAgreementPDF.tsx` | Update interface, merge pages, use father_name |

---

### Expected Outcome

- Sale Agreement PDF will be 2 pages instead of 3 (no blank page)
- Customer details (Father Name, DOB, Gender) will display correctly
- Father Name will be a mandatory field in customer creation form
- All customer information properly fetched for print dialog

