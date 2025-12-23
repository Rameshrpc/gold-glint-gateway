# Gold Loan Management System - Test Cases

## Table of Contents
1. [Authentication Tests](#1-authentication-tests)
2. [Customer Management Tests](#2-customer-management-tests)
3. [Loan Creation Tests](#3-loan-creation-tests)
4. [Interest Collection Tests](#4-interest-collection-tests)
5. [Redemption Tests](#5-redemption-tests)
6. [Reloan Tests](#6-reloan-tests)
7. [Auction Tests](#7-auction-tests)
8. [Mobile-Specific Tests](#8-mobile-specific-tests)
9. [Voucher & Accounting Tests](#9-voucher--accounting-tests)
10. [Security Tests](#10-security-tests)

---

## 1. Authentication Tests

### TC-AUTH-001: Valid Login
| Field | Value |
|-------|-------|
| **Priority** | Critical |
| **Preconditions** | User account exists, client is active |

**Steps:**
1. Navigate to `/auth`
2. Enter valid client code (e.g., "DEMO001")
3. Click "Continue"
4. Enter valid email address
5. Enter valid password (min 6 characters)
6. Click "Sign In"

**Expected Results:**
- ✅ User is redirected to Dashboard (`/`)
- ✅ User name appears in header/profile
- ✅ Navigation menu is accessible
- ✅ Session persists on page refresh

---

### TC-AUTH-002: Invalid Client Code
| Field | Value |
|-------|-------|
| **Priority** | Critical |
| **Preconditions** | None |

**Steps:**
1. Navigate to `/auth`
2. Enter invalid client code (e.g., "INVALID123")
3. Click "Continue"

**Expected Results:**
- ✅ Error toast appears: "Invalid client code"
- ✅ User remains on auth page
- ✅ Client code field is cleared or highlighted

---

### TC-AUTH-003: Invalid Credentials
| Field | Value |
|-------|-------|
| **Priority** | Critical |
| **Preconditions** | Valid client code exists |

**Steps:**
1. Navigate to `/auth`
2. Enter valid client code
3. Click "Continue"
4. Enter valid email but wrong password
5. Click "Sign In"

**Expected Results:**
- ✅ Error toast appears: "Invalid login credentials"
- ✅ User remains on auth page
- ✅ Password field is cleared

---

### TC-AUTH-004: New User Signup
| Field | Value |
|-------|-------|
| **Priority** | Critical |
| **Preconditions** | Valid client code exists |

**Steps:**
1. Navigate to `/auth`
2. Enter valid client code
3. Click "Continue"
4. Click "Sign Up" tab
5. Enter full name
6. Enter new email address
7. Enter password (min 6 characters)
8. Click "Sign Up"

**Expected Results:**
- ✅ Success toast appears: "Account created successfully"
- ✅ User is logged in automatically (auto-confirm enabled)
- ✅ User is redirected to Dashboard
- ✅ Profile is created in `profiles` table

---

### TC-AUTH-005: Logout
| Field | Value |
|-------|-------|
| **Priority** | High |
| **Preconditions** | User is logged in |

**Steps:**
1. Click on profile/avatar in header
2. Click "Logout" or navigate to logout action
3. Confirm logout if prompted

**Expected Results:**
- ✅ User is redirected to `/auth`
- ✅ Session is cleared
- ✅ Protected routes redirect to `/auth`
- ✅ Browser refresh shows auth page

---

### TC-AUTH-006: Session Persistence
| Field | Value |
|-------|-------|
| **Priority** | High |
| **Preconditions** | User is logged in |

**Steps:**
1. Login successfully
2. Close browser tab (don't logout)
3. Reopen the application URL
4. Navigate to Dashboard

**Expected Results:**
- ✅ User is still logged in
- ✅ Dashboard loads with user data
- ✅ No redirect to auth page

---

## 2. Customer Management Tests

### TC-CUST-001: Create New Customer
| Field | Value |
|-------|-------|
| **Priority** | Critical |
| **Preconditions** | User logged in with loan_officer or higher role |

**Steps:**
1. Navigate to Customers page (`/customers`)
2. Click "Add Customer" or "+" button
3. Fill in required fields:
   - Full Name: "Test Customer"
   - Phone: "9876543210"
   - Address: "123 Test Street, Chennai"
4. Upload documents:
   - Photo (capture or upload)
   - Aadhaar Front
   - Aadhaar Back
   - PAN Card (optional)
5. Fill optional fields:
   - Email, Date of Birth, Gender
   - Nominee Name, Nominee Relation
6. Click "Save" or "Create Customer"

**Expected Results:**
- ✅ Customer code is auto-generated (format: BRCH241223XXXX)
- ✅ Success toast appears
- ✅ Customer appears in list
- ✅ Documents are uploaded to storage bucket
- ✅ Customer record created in `customers` table

---

### TC-CUST-002: Search Customer by Name
| Field | Value |
|-------|-------|
| **Priority** | High |
| **Preconditions** | Multiple customers exist |

**Steps:**
1. Navigate to Customers page
2. In search bar, type partial name "Test"
3. Press Enter or wait for auto-search

**Expected Results:**
- ✅ List filters to show matching customers
- ✅ "Test Customer" appears in results
- ✅ Non-matching customers are hidden
- ✅ Clear search shows all customers again

---

### TC-CUST-003: Search Customer by Phone
| Field | Value |
|-------|-------|
| **Priority** | High |
| **Preconditions** | Customer with known phone exists |

**Steps:**
1. Navigate to Customers page
2. In search bar, type phone number "987654"
3. Press Enter or wait for auto-search

**Expected Results:**
- ✅ Customer with matching phone appears
- ✅ Partial phone match works

---

### TC-CUST-004: View Customer Details
| Field | Value |
|-------|-------|
| **Priority** | High |
| **Preconditions** | Customer exists with documents |

**Steps:**
1. Navigate to Customers page
2. Click on a customer row/card
3. View customer details panel/dialog

**Expected Results:**
- ✅ All customer information displayed
- ✅ Document images load (signed URLs)
- ✅ Loan history section visible
- ✅ Active loans highlighted

---

### TC-CUST-005: Edit Customer
| Field | Value |
|-------|-------|
| **Priority** | High |
| **Preconditions** | Customer exists |

**Steps:**
1. Navigate to Customers page
2. Click on customer to view details
3. Click "Edit" button
4. Modify phone number to "9876543211"
5. Click "Save"

**Expected Results:**
- ✅ Success toast appears
- ✅ Updated phone number displayed
- ✅ `updated_at` timestamp changed in database

---

### TC-CUST-006: Filter Customers by Status
| Field | Value |
|-------|-------|
| **Priority** | Medium |
| **Preconditions** | Both active and inactive customers exist |

**Steps:**
1. Navigate to Customers page
2. Click "Active" filter chip
3. Observe list
4. Click "Inactive" filter chip
5. Observe list
6. Click "All" filter chip

**Expected Results:**
- ✅ Active filter shows only `is_active = true`
- ✅ Inactive filter shows only `is_active = false`
- ✅ All filter shows complete list
- ✅ Count badges update correctly

---

## 3. Loan Creation Tests

### TC-LOAN-001: Create New Loan - Complete Flow
| Field | Value |
|-------|-------|
| **Priority** | Critical |
| **Preconditions** | Customer exists, Schemes exist, Market rates set |

**Steps:**
1. Navigate to New Loan page (`/loans/new` or mobile `/new-loan`)
2. Search and select customer
3. Select scheme (e.g., "Standard Gold Loan - 12%")
4. Add gold items:
   - Item Type: "Necklace"
   - Gross Weight: 10.5g
   - Stone Weight: 0.5g
   - Purity: 22KT
   - Click "Add Item"
5. Verify calculations:
   - Net Weight: 10.0g
   - Appraised Value calculated
6. Enter Principal Amount: ₹50,000
7. Review fees:
   - Processing Fee (auto-calculated)
   - Document Charges
   - Advance Interest (if applicable)
8. Select disbursement mode: "Cash"
9. Click "Create Loan"

**Expected Results:**
- ✅ Loan number generated (format: LN241223XXXX)
- ✅ Success message/animation displayed
- ✅ Loan appears in Loans list with "Active" status
- ✅ Gold items linked to loan in `gold_items` table
- ✅ Disbursement record created
- ✅ Voucher auto-generated
- ✅ Net disbursed = Principal - Fees - Advance Interest
- ✅ Maturity date = Loan date + Tenure days

---

### TC-LOAN-002: Gold Value Calculation by Purity
| Field | Value |
|-------|-------|
| **Priority** | Critical |
| **Preconditions** | Market rates are set for today |

**Steps:**
1. Start new loan creation
2. Add gold item with:
   - Gross Weight: 10g
   - Stone Weight: 0g
   - Purity: 24KT
3. Note the appraised value
4. Change purity to 22KT
5. Note the new appraised value
6. Change purity to 18KT
7. Note the final appraised value

**Expected Results:**
- ✅ 24KT uses 100% of market rate
- ✅ 22KT uses 91.67% of market rate
- ✅ 18KT uses 75% of market rate
- ✅ Appraised value = Net Weight × Market Rate × Purity %

---

### TC-LOAN-003: Multiple Gold Items
| Field | Value |
|-------|-------|
| **Priority** | High |
| **Preconditions** | None |

**Steps:**
1. Start new loan creation
2. Add first gold item:
   - Type: Ring, Weight: 5g, Purity: 22KT
3. Click "Add Item"
4. Add second gold item:
   - Type: Chain, Weight: 15g, Purity: 22KT
5. Add third gold item:
   - Type: Bangle, Weight: 20g, Purity: 18KT
6. Verify totals

**Expected Results:**
- ✅ All three items listed
- ✅ Total Gold Weight = 5 + 15 + 20 = 40g
- ✅ Total Appraised Value = Sum of individual values
- ✅ Can remove individual items
- ✅ Totals update on add/remove

---

### TC-LOAN-004: Scheme Interest Rate Applied
| Field | Value |
|-------|-------|
| **Priority** | High |
| **Preconditions** | Multiple schemes exist with different rates |

**Steps:**
1. Start new loan creation
2. Select Scheme A (12% annual rate)
3. Note displayed interest rate
4. Change to Scheme B (18% annual rate)
5. Note new displayed interest rate

**Expected Results:**
- ✅ Interest rate changes with scheme selection
- ✅ Monthly interest calculation updates
- ✅ Advance interest (if any) recalculates

---

### TC-LOAN-005: Print Loan Receipt
| Field | Value |
|-------|-------|
| **Priority** | High |
| **Preconditions** | Loan created successfully |

**Steps:**
1. After loan creation, click "Print Receipt"
2. Select documents to print:
   - Loan Receipt ✓
   - Terms & Conditions ✓
   - Gold Declaration ✓
3. Click "Generate PDF"
4. Review PDF in viewer

**Expected Results:**
- ✅ PDF generates with company header/logo
- ✅ Loan details are correct
- ✅ Gold items listed with weights
- ✅ Tamil translations appear (bilingual)
- ✅ Signature areas present
- ✅ Terms and conditions included
- ✅ PDF can be downloaded/printed

---

### TC-LOAN-006: Loan with Agent Commission
| Field | Value |
|-------|-------|
| **Priority** | Medium |
| **Preconditions** | Agent exists with commission rate |

**Steps:**
1. Start new loan creation
2. Select customer
3. Select an Agent from dropdown
4. Complete loan creation with principal ₹100,000
5. Verify commission calculation

**Expected Results:**
- ✅ Agent linked to loan
- ✅ Commission record created in `agent_commissions`
- ✅ Commission amount = Principal × Agent Rate %
- ✅ Commission status = "pending"

---

## 4. Interest Collection Tests

### TC-INT-001: Collect Interest - Full Period
| Field | Value |
|-------|-------|
| **Priority** | Critical |
| **Preconditions** | Active loan exists, 30+ days since last payment |

**Steps:**
1. Navigate to Interest Collection (`/interest`)
2. Search for active loan by loan number
3. Select the loan
4. Review calculated interest:
   - Period: Last payment date to today
   - Days: calculated days
   - Interest amount at shown rate
5. Select payment mode: "Cash"
6. Click "Collect Interest"

**Expected Results:**
- ✅ Receipt number generated
- ✅ Success message displayed
- ✅ `interest_payments` record created
- ✅ Loan's `last_interest_paid_date` updated
- ✅ Loan's `next_interest_due_date` updated
- ✅ Voucher auto-generated
- ✅ Interest receipt printable

---

### TC-INT-002: Interest with Overdue Penalty
| Field | Value |
|-------|-------|
| **Priority** | High |
| **Preconditions** | Loan overdue by 90+ days |

**Steps:**
1. Navigate to Interest Collection
2. Select overdue loan
3. Observe overdue days displayed
4. Verify penalty calculation
5. Complete interest collection

**Expected Results:**
- ✅ Overdue badge/indicator shown
- ✅ Penalty amount calculated based on scheme
- ✅ Total = Interest + Penalty
- ✅ Penalty recorded in payment record

---

### TC-INT-003: Partial Period Interest
| Field | Value |
|-------|-------|
| **Priority** | Medium |
| **Preconditions** | Active loan with recent payment |

**Steps:**
1. Navigate to Interest Collection
2. Select loan paid 15 days ago
3. Review calculated interest for 15 days
4. Complete collection

**Expected Results:**
- ✅ Interest pro-rated for 15 days
- ✅ Period from/to dates correct
- ✅ No minimum period enforced (or as per scheme)

---

### TC-INT-004: Interest Collection - Bank Transfer
| Field | Value |
|-------|-------|
| **Priority** | Medium |
| **Preconditions** | Bank accounts configured |

**Steps:**
1. Navigate to Interest Collection
2. Select a loan
3. Select payment mode: "Bank Transfer"
4. Select source bank/account
5. Enter reference number: "UTR123456"
6. Complete collection

**Expected Results:**
- ✅ Bank/account recorded in payment
- ✅ Reference number stored
- ✅ Voucher includes bank details

---

### TC-INT-005: Mobile Interest Collection
| Field | Value |
|-------|-------|
| **Priority** | Critical |
| **Preconditions** | Active loan exists, using mobile device |

**Steps:**
1. Open app on mobile (or resize to mobile width)
2. Navigate to Interest tab in bottom navigation
3. Search for loan
4. Tap on loan card
5. Review interest calculation in bottom sheet
6. Select payment mode
7. Tap "Collect Interest"

**Expected Results:**
- ✅ Bottom sheet opens with details
- ✅ Haptic feedback on button tap
- ✅ Success animation plays
- ✅ Toast notification appears
- ✅ Loan list refreshes

---

## 5. Redemption Tests

### TC-RED-001: Full Redemption
| Field | Value |
|-------|-------|
| **Priority** | Critical |
| **Preconditions** | Active loan with some interest paid |

**Steps:**
1. Navigate to Redemption (`/redemption`)
2. Search for active loan
3. Select the loan
4. Review outstanding amounts:
   - Principal
   - Pending Interest
   - Penalty (if any)
   - Total Due
5. Check "Gold Verified & Released" checkbox
6. Select payment mode: "Cash"
7. Enter amount received = Total Due
8. Click "Process Redemption"

**Expected Results:**
- ✅ Redemption number generated
- ✅ Loan status changes to "closed"
- ✅ Loan `closed_date` set to today
- ✅ Loan `closure_type` = "redemption"
- ✅ Redemption record created
- ✅ Final interest payment recorded (if pending)
- ✅ Vouchers generated
- ✅ Redemption receipt printable

---

### TC-RED-002: Redemption with Rebate
| Field | Value |
|-------|-------|
| **Priority** | Medium |
| **Preconditions** | Loan with interest paid ahead, scheme allows rebate |

**Steps:**
1. Navigate to Redemption
2. Select loan with pre-paid interest
3. Verify rebate calculation displayed
4. Complete redemption

**Expected Results:**
- ✅ Rebate amount shown
- ✅ Net amount = Total Due - Rebate
- ✅ Rebate recorded in redemption

---

### TC-RED-003: Mobile Redemption
| Field | Value |
|-------|-------|
| **Priority** | Critical |
| **Preconditions** | Active loan, mobile view |

**Steps:**
1. Open mobile view
2. Navigate to Redemption (via More menu or direct link)
3. Search for loan
4. Tap to select
5. Review amounts in bottom sheet
6. Toggle gold verification switch
7. Complete redemption

**Expected Results:**
- ✅ Mobile-optimized UI
- ✅ Gold verification toggle works
- ✅ Success animation plays
- ✅ Can print receipt from success screen

---

### TC-RED-004: Cannot Redeem Without Gold Verification
| Field | Value |
|-------|-------|
| **Priority** | High |
| **Preconditions** | Active loan selected for redemption |

**Steps:**
1. Navigate to Redemption
2. Select a loan
3. Do NOT check gold verification
4. Try to click "Process Redemption"

**Expected Results:**
- ✅ Button disabled OR error shown
- ✅ Message: "Please verify gold release"
- ✅ Redemption blocked

---

## 6. Reloan Tests

### TC-REL-001: Complete Reloan Flow
| Field | Value |
|-------|-------|
| **Priority** | Critical |
| **Preconditions** | Active loan exists |

**Steps:**
1. Navigate to Reloan (`/reloan`)
2. Search for active loan
3. Select the loan
4. Review settlement amount:
   - Outstanding Principal
   - Pending Interest
   - Total Settlement
5. Select new scheme
6. Enter new principal: ₹75,000
7. Review net amount:
   - New Principal - Settlement = Net Amount
8. If positive: Amount to disburse
9. If negative: Amount to collect
10. Click "Process Reloan"

**Expected Results:**
- ✅ Old loan status → "closed"
- ✅ Old loan `closure_type` = "reloan"
- ✅ New loan created with new number
- ✅ New loan `is_reloan` = true
- ✅ New loan `previous_loan_id` = old loan id
- ✅ Gold items transferred to new loan
- ✅ Vouchers generated for both transactions
- ✅ Net disbursement/collection handled

---

### TC-REL-002: Reloan with Higher Principal
| Field | Value |
|-------|-------|
| **Priority** | High |
| **Preconditions** | Loan with ₹50,000 principal, ₹5,000 pending interest |

**Steps:**
1. Select loan for reloan
2. Settlement = ₹55,000
3. Enter new principal: ₹80,000
4. Net to disburse: ₹25,000
5. Complete reloan

**Expected Results:**
- ✅ Customer receives ₹25,000 (new - settlement)
- ✅ Disbursement voucher for ₹25,000

---

### TC-REL-003: Reloan with Lower Principal
| Field | Value |
|-------|-------|
| **Priority** | High |
| **Preconditions** | Loan with ₹100,000 principal |

**Steps:**
1. Select loan for reloan
2. Settlement = ₹105,000
3. Enter new principal: ₹80,000
4. Net to collect: ₹25,000
5. Complete reloan

**Expected Results:**
- ✅ Customer pays ₹25,000 (settlement - new)
- ✅ Receipt voucher for ₹25,000

---

## 7. Auction Tests

### TC-AUC-001: List Auction-Eligible Loans
| Field | Value |
|-------|-------|
| **Priority** | High |
| **Preconditions** | Loans overdue beyond auction threshold |

**Steps:**
1. Navigate to Auction (`/auction`)
2. View list of eligible loans

**Expected Results:**
- ✅ Only loans past maturity + grace period shown
- ✅ Each loan shows:
  - Loan number, Customer name
  - Outstanding amount
  - Days overdue
  - Gold weight

---

### TC-AUC-002: Create Auction Record
| Field | Value |
|-------|-------|
| **Priority** | High |
| **Preconditions** | Auction-eligible loan exists |

**Steps:**
1. Navigate to Auction
2. Select a loan
3. Click "Schedule Auction"
4. Enter auction date
5. Enter reserve price
6. Save

**Expected Results:**
- ✅ Auction lot number generated
- ✅ Auction record created with status "scheduled"
- ✅ Loan linked to auction

---

### TC-AUC-003: Complete Auction Sale
| Field | Value |
|-------|-------|
| **Priority** | High |
| **Preconditions** | Auction scheduled |

**Steps:**
1. Navigate to Auction
2. Select scheduled auction
3. Enter sale details:
   - Buyer Name: "ABC Jewelers"
   - Buyer Contact: "9876543210"
   - Sold Price: ₹120,000
4. Verify surplus/shortfall:
   - If sold > outstanding: Surplus
   - If sold < outstanding: Shortfall
5. Click "Complete Auction"

**Expected Results:**
- ✅ Auction status → "completed"
- ✅ Loan status → "auctioned"
- ✅ Surplus/shortfall calculated correctly
- ✅ Vouchers generated
- ✅ Buyer details recorded

---

### TC-AUC-004: Auction with Surplus Return
| Field | Value |
|-------|-------|
| **Priority** | Medium |
| **Preconditions** | Completed auction with surplus |

**Steps:**
1. Find auction with surplus amount
2. Mark "Surplus Returned"
3. Enter return details:
   - Returned to: "Customer Name"
   - Return date
4. Save

**Expected Results:**
- ✅ `surplus_returned` = true
- ✅ Return date recorded
- ✅ Payment voucher generated

---

## 8. Mobile-Specific Tests

### TC-MOB-001: Pull-to-Refresh
| Field | Value |
|-------|-------|
| **Priority** | High |
| **Preconditions** | Mobile view, list page loaded |

**Steps:**
1. Open Loans list on mobile
2. Pull down from top of list
3. Hold briefly
4. Release

**Expected Results:**
- ✅ Refresh indicator appears
- ✅ Data reloads
- ✅ New/updated records appear
- ✅ Haptic feedback (on supported devices)

---

### TC-MOB-002: Bottom Sheet Interaction
| Field | Value |
|-------|-------|
| **Priority** | High |
| **Preconditions** | Mobile view |

**Steps:**
1. Navigate to Loans
2. Tap on a loan card
3. Bottom sheet opens
4. Scroll within bottom sheet
5. Drag to dismiss
6. Reopen and tap backdrop to close

**Expected Results:**
- ✅ Sheet opens smoothly
- ✅ Content scrollable
- ✅ Can dismiss by dragging down
- ✅ Can dismiss by tapping backdrop
- ✅ No page scroll when sheet is open

---

### TC-MOB-003: Offline Indicator
| Field | Value |
|-------|-------|
| **Priority** | Medium |
| **Preconditions** | Mobile view |

**Steps:**
1. Open app on mobile
2. Turn off internet/airplane mode
3. Observe indicator
4. Turn internet back on
5. Observe indicator disappear

**Expected Results:**
- ✅ Offline banner/indicator appears
- ✅ Message indicates no connection
- ✅ Indicator hides when back online
- ✅ Data operations blocked while offline

---

### TC-MOB-004: Success Animation
| Field | Value |
|-------|-------|
| **Priority** | Medium |
| **Preconditions** | Mobile view |

**Steps:**
1. Complete interest collection on mobile
2. Observe success animation

**Expected Results:**
- ✅ Checkmark animation plays
- ✅ "Payment Successful" message
- ✅ Animation auto-hides after 2-3 seconds
- ✅ Can tap to dismiss early

---

### TC-MOB-005: Navigation Flow
| Field | Value |
|-------|-------|
| **Priority** | High |
| **Preconditions** | Mobile view |

**Steps:**
1. Start at Dashboard
2. Tap Loans in bottom nav
3. Tap a loan card
4. From loan details, tap customer name/link
5. Use back button/gesture
6. Navigate to More menu
7. Select Settings

**Expected Results:**
- ✅ All navigation works
- ✅ Back navigation returns to previous screen
- ✅ State preserved on navigation
- ✅ No duplicate pages in history

---

### TC-MOB-006: FAB Actions
| Field | Value |
|-------|-------|
| **Priority** | Medium |
| **Preconditions** | Mobile dashboard |

**Steps:**
1. On Dashboard, tap floating action button (+)
2. Select "New Loan"
3. Verify navigation to new loan page

**Expected Results:**
- ✅ FAB is visible and tappable
- ✅ Action sheet opens with options
- ✅ Each action navigates correctly

---

## 9. Voucher & Accounting Tests

### TC-VCH-001: Auto-Generated Voucher on Loan
| Field | Value |
|-------|-------|
| **Priority** | High |
| **Preconditions** | Create a new loan |

**Steps:**
1. Create a new loan with principal ₹50,000
2. Navigate to Vouchers (`/vouchers`)
3. Search for the voucher by date/loan number

**Expected Results:**
- ✅ Disbursement voucher exists
- ✅ Type: "loan_disbursement"
- ✅ Amount: ₹50,000 (or net disbursed)
- ✅ Accounts debited/credited correctly:
  - Debit: Loan Receivable
  - Credit: Cash/Bank

---

### TC-VCH-002: Auto-Generated Voucher on Interest
| Field | Value |
|-------|-------|
| **Priority** | High |
| **Preconditions** | Collect interest on a loan |

**Steps:**
1. Collect interest of ₹1,500
2. Navigate to Vouchers
3. Find the interest voucher

**Expected Results:**
- ✅ Interest collection voucher exists
- ✅ Type: "interest_collection"
- ✅ Amount: ₹1,500
- ✅ Accounts:
  - Debit: Cash/Bank
  - Credit: Interest Income

---

### TC-VCH-003: Trial Balance
| Field | Value |
|-------|-------|
| **Priority** | High |
| **Preconditions** | Multiple transactions exist |

**Steps:**
1. Navigate to Trial Balance (`/trial-balance`)
2. Select date range
3. Generate report

**Expected Results:**
- ✅ All accounts with balances listed
- ✅ Debit total = Credit total
- ✅ Balance = 0 (books are balanced)

---

### TC-VCH-004: Day Book
| Field | Value |
|-------|-------|
| **Priority** | Medium |
| **Preconditions** | Transactions on specific date |

**Steps:**
1. Navigate to Day Book (`/day-book`)
2. Select today's date
3. View transactions

**Expected Results:**
- ✅ All vouchers for the day listed
- ✅ Opening + Transactions = Closing
- ✅ Can filter by type

---

### TC-VCH-005: Balance Sheet
| Field | Value |
|-------|-------|
| **Priority** | Medium |
| **Preconditions** | Accounting data exists |

**Steps:**
1. Navigate to Balance Sheet (`/balance-sheet`)
2. Select as-of date
3. Generate report

**Expected Results:**
- ✅ Assets listed with totals
- ✅ Liabilities listed with totals
- ✅ Equity shown
- ✅ Assets = Liabilities + Equity

---

## 10. Security Tests

### TC-SEC-001: RLS - Cross-Client Data Isolation
| Field | Value |
|-------|-------|
| **Priority** | Critical |
| **Preconditions** | Two client accounts exist |

**Steps:**
1. Login as User A (Client 1)
2. Note loan numbers visible
3. Logout
4. Login as User B (Client 2)
5. Attempt to view Client 1's loans via URL manipulation

**Expected Results:**
- ✅ User B cannot see Client 1's loans
- ✅ Direct URL access returns empty/error
- ✅ No cross-client data leakage

---

### TC-SEC-002: Role-Based Access - Loan Officer
| Field | Value |
|-------|-------|
| **Priority** | High |
| **Preconditions** | User with loan_officer role |

**Steps:**
1. Login as loan_officer
2. Verify can: Create customers, Create loans, Collect interest
3. Verify cannot: Access Settings, Delete users

**Expected Results:**
- ✅ Create operations succeed
- ✅ Admin pages hidden or blocked
- ✅ Error on unauthorized actions

---

### TC-SEC-003: Role-Based Access - Viewer
| Field | Value |
|-------|-------|
| **Priority** | High |
| **Preconditions** | User with viewer role |

**Steps:**
1. Login as viewer
2. Attempt to create a loan
3. Attempt to collect interest

**Expected Results:**
- ✅ View access works
- ✅ Create/Update buttons hidden or disabled
- ✅ API calls fail with permission error

---

### TC-SEC-004: Document Access via Signed URLs
| Field | Value |
|-------|-------|
| **Priority** | High |
| **Preconditions** | Customer with uploaded documents |

**Steps:**
1. View customer details
2. Click on document (Aadhaar, Photo)
3. Note the URL format
4. Wait 1 hour and try URL again

**Expected Results:**
- ✅ Documents load via signed URL
- ✅ URLs contain expiry token
- ✅ Expired URLs return 403/error
- ✅ Cannot access documents without login

---

### TC-SEC-005: SQL Injection Prevention
| Field | Value |
|-------|-------|
| **Priority** | Critical |
| **Preconditions** | None |

**Steps:**
1. In customer search, enter: `'; DROP TABLE customers; --`
2. In loan number search, enter: `1 OR 1=1`
3. Submit searches

**Expected Results:**
- ✅ No SQL errors
- ✅ Query treated as literal string
- ✅ Tables remain intact
- ✅ Proper parameterized queries used

---

### TC-SEC-006: XSS Prevention
| Field | Value |
|-------|-------|
| **Priority** | Critical |
| **Preconditions** | None |

**Steps:**
1. Create customer with name: `<script>alert('XSS')</script>`
2. View customer details
3. Check if script executes

**Expected Results:**
- ✅ Script does NOT execute
- ✅ Text displayed as literal
- ✅ Proper escaping in place

---

## Test Execution Checklist

### Pre-Test Setup
- [ ] Test database seeded with sample data
- [ ] Multiple user accounts with different roles
- [ ] Market rates configured for today
- [ ] At least 2 schemes configured
- [ ] At least 1 branch configured
- [ ] Storage buckets accessible

### Test Environment
- [ ] Desktop browser (Chrome/Firefox/Safari)
- [ ] Mobile browser (iOS Safari, Android Chrome)
- [ ] Mobile device width simulation (Chrome DevTools)

### Post-Test Verification
- [ ] All critical tests passed
- [ ] No console errors during tests
- [ ] Database integrity maintained
- [ ] No orphaned records

---

## Bug Report Template

```markdown
**Bug ID:** BUG-XXX
**Test Case:** TC-XXX-XXX
**Severity:** Critical/High/Medium/Low
**Status:** Open/In Progress/Fixed/Verified

**Description:**
Brief description of the bug

**Steps to Reproduce:**
1. Step 1
2. Step 2
3. Step 3

**Expected Result:**
What should happen

**Actual Result:**
What actually happened

**Screenshots/Logs:**
Attach relevant evidence

**Environment:**
- Browser: Chrome 120
- Device: Desktop/Mobile
- OS: Windows/macOS/iOS/Android
```

---

*Last Updated: December 23, 2024*
*Version: 1.0*
