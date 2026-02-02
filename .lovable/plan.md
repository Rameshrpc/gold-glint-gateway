

## Plan: Add Mock Data for Sale Agreements Testing

### Purpose
Insert mock sale agreements at various dates to test:
- Overdue agreements (past maturity)
- Agreements maturing soon
- Recently created agreements
- Active agreements at different stages

### Mock Data Configuration

| Agreement | Date | Tenure | Status | Customer | Scheme | Gold Item | Purpose |
|-----------|------|--------|--------|----------|--------|-----------|---------|
| SA-90 days ago | 90 days ago | 60 days | **Overdue** | Senthil Kumar | SALE13 (₹13K/g) | 22K Chain 15g | Test overdue logic |
| SA-60 days ago | 60 days ago | 45 days | **Overdue** | Anand | SALE 12 (₹12K/g) | 22K Ring 8g | Test penalty calculation |
| SA-30 days ago | 30 days ago | 45 days | Active, maturing in 15 days | Kannan | SALE13 | 22K Bangle 25g | Test upcoming maturity |
| SA-15 days ago | 15 days ago | 30 days | Active, maturing in 15 days | Karthik | SALE 12 | 22K Necklace 12g | Test near maturity |
| SA-7 days ago | 7 days ago | 60 days | Active, fresh | Suresh GV | SALE13 | Gold Coin 10g | Test active agreement |
| SA-Today | Today | 90 days | Active, fresh | Stalin | SALE 12 | Gold Bar 20g | Test new agreement |

---

### Technical Details

**Target Client**: `2abc571d-ce56-4e32-ac8e-0761fafe8999` (has active sale schemes)
**Target Branch**: `e28769c4-3a51-4187-b6ee-2c53f8473561` (Main Branch)

**Schemes Available**:
- `SALE13` (id: `128eafb4-d2df-4f1e-b2a8-3c13e3fc303d`) - ₹13,000/g, ₹3,000 margin/month
- `SALE 12` (id: `a96b296a-f4a2-4237-b60e-411b40b7292a`) - ₹12,000/g, ₹2,000 margin/month

**Customers**:
| Customer | ID |
|----------|-----|
| Senthil Kumar | `8cfce6c5-bcc3-481b-b217-0ea8e3006611` |
| Anand | `e05f769d-a317-44fd-b741-8a83f443d060` |
| Kannan Moorthy | `690ac7b4-e445-4234-8725-6c12ff5cf245` |
| Karthik | `c3688d6b-7085-458d-9635-8fdcc7324760` |
| Suresh GV | `fd41cca3-1ff9-43db-8be4-2aa2da51f879` |
| Stalin | `58f30128-96a3-4fde-b32d-20c5ea9f80ec` |

**Items**: Gold items will be linked from existing items (COIN, BAR, HAARAM, etc.)

---

### SQL Migrations

#### 1. Insert Sale Agreements (loans table)

```sql
-- Mock Sale Agreements with various dates for testing
-- All for client: 2abc571d-ce56-4e32-ac8e-0761fafe8999

-- Agreement 1: 90 days ago (OVERDUE - matured 30 days ago)
INSERT INTO loans (
  client_id, branch_id, customer_id, scheme_id, scheme_version_id,
  loan_number, loan_date, principal_amount, interest_rate, tenure_days,
  maturity_date, net_disbursed, status, transaction_type, approval_status,
  shown_principal, actual_principal
) VALUES (
  '2abc571d-ce56-4e32-ac8e-0761fafe8999',
  'e28769c4-3a51-4187-b6ee-2c53f8473561',
  '8cfce6c5-bcc3-481b-b217-0ea8e3006611', -- Senthil Kumar
  '128eafb4-d2df-4f1e-b2a8-3c13e3fc303d', -- SALE13
  '89ed7826-0493-44ac-8b5f-6c39c9e17a30',
  'SA202511040001',
  CURRENT_DATE - INTERVAL '90 days',
  195000, -- 15g x 13000
  36,
  60,
  CURRENT_DATE - INTERVAL '30 days',
  195000,
  'overdue',
  'sale_agreement',
  'approved',
  195000,
  195000
);

-- Agreement 2: 60 days ago (OVERDUE - matured 15 days ago)
INSERT INTO loans (...) VALUES (...);

-- Agreement 3: 30 days ago (Active - matures in 15 days)
INSERT INTO loans (...) VALUES (...);

-- Agreement 4: 15 days ago (Active - matures in 15 days)
INSERT INTO loans (...) VALUES (...);

-- Agreement 5: 7 days ago (Active - fresh)
INSERT INTO loans (...) VALUES (...);

-- Agreement 6: Today (Active - brand new)
INSERT INTO loans (...) VALUES (...);
```

#### 2. Insert Gold Items

```sql
-- Gold items for each agreement
INSERT INTO gold_items (
  loan_id, item_type, item_id, item_group_id, description,
  gross_weight_grams, net_weight_grams, purity, purity_percentage,
  stone_weight_grams, market_rate_per_gram, appraised_value, market_value,
  market_rate_date
) VALUES (...);
```

#### 3. Insert Disbursement Records

```sql
-- Disbursement record for each agreement
INSERT INTO loan_disbursements (
  loan_id, payment_mode, amount, source_type
) VALUES (...);
```

---

### Test Scenarios After Implementation

| Test Case | Expected Behavior |
|-----------|-------------------|
| View overdue agreements | SA202511040001, SA202512040001 should show with red "Overdue" badge |
| View maturing soon | SA202601040001, SA202601180001 should highlight maturity countdown |
| Calculate trade margin | Agreements should show correct margin based on days elapsed |
| Strike price calculation | Spot price + (margin × months) should be accurate |
| Delete fresh agreement | Today's agreement can be deleted (no payments) |
| Delete overdue | Overdue agreements cannot be deleted if margin payments exist |

---

### Files to Modify

| File | Change |
|------|--------|
| **Database Migration** | Add SQL to insert 6 mock sale agreements with gold items and disbursements |

---

### Data Integrity

All mock data will use:
- Existing valid customer IDs
- Existing valid scheme IDs with version references
- Existing valid item IDs for gold items
- Proper status assignment (overdue for past maturity, active for future)
- Correct principal calculations based on gold weight × scheme rate

