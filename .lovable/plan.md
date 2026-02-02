
## Plan: Enhanced Approval Workflow for Sale Agreements (Remote Control)

### Overview

As a Tenant Admin working remotely, you need to control and monitor all Sale Agreement transactions happening at your branches. This plan integrates a dedicated approval workflow for Sale Agreements that allows you to:

1. **Review & Approve** new Sale Agreements before disbursement
2. **Review & Approve** Repurchase transactions before releasing goods
3. **Review & Approve** high-value Margin Renewals (optional)
4. **Receive Notifications** when transactions need your attention
5. **Track** all pending, approved, and rejected requests from anywhere

---

### Current State

The system already has an approval workflow infrastructure with:
- `approval_workflows` table (per-client configuration)
- `approval_requests` table (tracks individual approval instances)
- Workflow types: `loan`, `redemption`, `voucher`, `auction`, `commission`
- Support for threshold amounts, L1/L2 approvals, auto-approve roles

**What's Working:**
- Sale Agreement creation already uses the `loan` workflow type
- Repurchase uses the `redemption` workflow type
- `ApprovalBadge` and `ApprovalDialog` components exist
- Approvals page shows pending requests

**What's Missing:**
- Dedicated `sale_agreement` and `repurchase` workflow types for clear separation
- Better visibility of Sale Agreement approvals in the UI
- Push/SMS notifications when approvals are needed
- Mobile-friendly quick approval from dashboard

---

### Technical Changes

#### Phase 1: Add Dedicated Workflow Types

**Database Migration:**

```sql
-- Add new workflow types for sale agreements
-- The existing 'loan' type will be for standard loans only
-- Sale agreements get their own dedicated workflow type

-- Update approval_workflows to support new types
COMMENT ON TABLE approval_workflows IS 'Workflow types: loan, redemption, voucher, auction, commission, sale_agreement, repurchase';
```

**Update `useApprovalWorkflow.tsx`:**
- Add `sale_agreement` and `repurchase` to `WorkflowType`

**Update `ApprovalWorkflowSettings.tsx`:**
- Add "Sale Agreement Creation" workflow card with dedicated icon
- Add "Repurchase" workflow card
- Add "Margin Renewal" workflow card (optional)

#### Phase 2: Update Sale Agreement Pages

**`SaleAgreements.tsx` changes:**
- Use `sale_agreement` workflow type instead of `loan`
- Add prominent "Pending Approval" filter tab
- Show ApprovalBadge on agreement cards
- Block certain actions (print, edit) on pending agreements

**`SaleRepurchase.tsx` changes:**
- Already uses `redemption` workflow (can keep or switch to `repurchase`)
- Ensure goods are NOT released until approval is complete
- Show clear "Awaiting Approval" status

**`SaleMarginRenewal.tsx` changes:**
- Add optional approval workflow for high-value margin payments
- Configurable threshold in settings

#### Phase 3: Enhanced Dashboard Widget

**Update `PendingApprovalsWidget.tsx`:**
- Add visual distinction for Sale Agreement vs Loan approvals
- Show agreement details: Seller name, Gold weight, Amount
- Add quick-approve button for L1 approvals
- Group by transaction type

**Add to Dashboard:**
- Position widget prominently for remote admins
- Add "Sale Agreements" tab filter

#### Phase 4: Notification Integration

**Add approval notification templates:**
- "New Sale Agreement Pending" SMS/WhatsApp template
- "Repurchase Request Pending" template
- "Approval Status Changed" template

**Create edge function for approval notifications:**
- Triggered when new approval request is created
- Sends SMS/WhatsApp to configured approvers
- Includes deep link to approval page

---

### User Experience Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    BRANCH STAFF WORKFLOW                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. Staff creates Sale Agreement at branch                      │
│     └─► Amount: ₹1,50,000 (above threshold of ₹1,00,000)       │
│                                                                 │
│  2. System checks approval_workflows table                      │
│     └─► sale_agreement workflow enabled, threshold = 1,00,000  │
│                                                                 │
│  3. Agreement saved with approval_status = 'pending'            │
│     └─► Approval request created                                │
│     └─► SMS sent to Tenant Admin: "New SA pending approval"    │
│                                                                 │
│  4. Staff sees: "Agreement created - Pending Approval"          │
│     └─► Print disabled, funds NOT disbursed                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                   REMOTE ADMIN WORKFLOW                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. Admin receives SMS: "New Sale Agreement SA20260202xxxx      │
│     pending approval. Amount: ₹1,50,000. Seller: John Doe"     │
│                                                                 │
│  2. Admin opens app on mobile/desktop                           │
│     └─► Dashboard shows: "3 Pending Approvals"                 │
│                                                                 │
│  3. Admin clicks notification or widget                         │
│     └─► Sees full details: gold items, weight, customer info   │
│                                                                 │
│  4. Admin approves with optional comment                        │
│     └─► Agreement status changes to 'approved'                 │
│     └─► SMS sent to branch: "Agreement SA... approved"         │
│                                                                 │
│  5. Branch staff can now print documents & disburse funds       │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

### Files to Create/Modify

| File | Type | Changes |
|------|------|---------|
| `src/hooks/useApprovalWorkflow.tsx` | Modify | Add `sale_agreement`, `repurchase`, `margin_renewal` to WorkflowType |
| `src/components/settings/ApprovalWorkflowSettings.tsx` | Modify | Add Sale Agreement, Repurchase, Margin Renewal workflow cards |
| `src/pages/SaleAgreements.tsx` | Modify | Use `sale_agreement` workflow type; add approval filter tab |
| `src/pages/SaleRepurchase.tsx` | Modify | Use `repurchase` workflow type for clarity |
| `src/pages/SaleMarginRenewal.tsx` | Modify | Optional approval for high-value margins |
| `src/components/approvals/PendingApprovalsWidget.tsx` | Modify | Better grouping; quick-approve; sale agreement details |
| `src/pages/Dashboard.tsx` | Modify | Ensure widget is visible for admins |
| `supabase/functions/approval-notifications/index.ts` | Create | Send SMS/WhatsApp when approvals are needed |
| Database Migration | Create | Insert default `sale_agreement` and `repurchase` workflows |

---

### Settings Configuration (for you as Tenant Admin)

After implementation, navigate to **Settings > Approval Workflows**:

| Workflow | Recommended Settings |
|----------|---------------------|
| **Sale Agreement Creation** | Enabled, Threshold: ₹50,000+, Auto-approve: None, L1: Branch Manager, L2: Admin |
| **Repurchase** | Enabled, Threshold: ₹50,000+, Dual Approval: Optional |
| **Margin Renewal** | Optional, Threshold: ₹25,000+ |

**Auto-Approve Roles:**
- If you trust Branch Managers for smaller transactions, add them to auto-approve list
- Platform admin always bypasses approvals

---

### Security Considerations

1. **RLS Protection**: Approval requests are scoped to `client_id`
2. **Role Validation**: Only users with L1/L2 approver roles can approve
3. **Dual Approval**: Same person cannot approve both L1 and L2
4. **Audit Trail**: All approvals/rejections logged with timestamps and user IDs
5. **Transaction Lock**: Pending agreements cannot be printed/disbursed

---

### Expected Outcome

As a remote Tenant Admin, you will be able to:

1. **Set Thresholds**: Only review high-value transactions (e.g., >₹50,000)
2. **Receive Alerts**: SMS/WhatsApp when staff creates agreements above threshold
3. **Quick Review**: Dashboard widget shows pending items with key details
4. **Approve/Reject**: One-click approval from desktop or mobile
5. **Full Control**: Dual approval for very high-value transactions
6. **Peace of Mind**: Staff cannot disburse or release goods without your approval
