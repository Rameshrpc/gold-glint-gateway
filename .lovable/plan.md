
## Plan: Enhanced Approval Workflow for Sale Agreements (Remote Control)

### Overview

As a Tenant Admin working remotely, you need to control and monitor all Sale Agreement transactions happening at your branches. This plan integrates a dedicated approval workflow for Sale Agreements that allows you to:

1. **Review & Approve** new Sale Agreements before disbursement
2. **Review & Approve** Repurchase transactions before releasing goods
3. **Review & Approve** high-value Margin Renewals (optional)
4. **Receive Notifications** when transactions need your attention
5. **Track** all pending, approved, and rejected requests from anywhere

---

### Implementation Status

| Phase | Status | Description |
|-------|--------|-------------|
| Phase 1 | ✅ Complete | Add dedicated workflow types (sale_agreement, repurchase, margin_renewal) |
| Phase 2 | ✅ Complete | Update Sale Agreement pages to use new workflow types |
| Phase 3 | ✅ Complete | Enhanced Dashboard Widget with type grouping and filters |
| Phase 4 | 🔲 Pending | SMS/WhatsApp notification integration |

---

### Completed Changes

#### Phase 1: Workflow Types ✅
- Added `sale_agreement`, `repurchase`, `margin_renewal` to `WorkflowType` in `useApprovalWorkflow.tsx`
- Updated `ApprovalWorkflowSettings.tsx` with new workflow cards for:
  - Sale Agreement Creation (ShoppingCart icon)
  - Repurchase/Buyback (RotateCcw icon)
  - Margin Renewal (TrendingUp icon)
- Updated entity status handler to support new entity types

#### Phase 2: Sale Agreement Integration ✅
- `SaleAgreements.tsx`: Uses `sale_agreement` workflow type with enriched metadata (customer_name, gold_weight)
- `SaleRepurchase.tsx`: Uses `repurchase` workflow type with enriched metadata
- Added approval filter tab for easy visibility

#### Phase 3: Dashboard Widget ✅
- `PendingApprovalsWidget.tsx`: Added type-based icons and grouping
- Quick filter tabs: All, Loans, Sales
- Shows customer name from metadata
- Displays amount prominently

---

### Remaining Work (Phase 4)

**SMS/WhatsApp Notification Integration:**
- Create `supabase/functions/approval-notifications/index.ts` edge function
- Triggered when new approval request is created
- Sends SMS/WhatsApp to configured approvers (tenant_admin roles)
- Templates:
  - "New Sale Agreement Pending" 
  - "Repurchase Request Pending"
  - "Approval Status Changed"

---

### Settings Configuration (for Tenant Admin)

Navigate to **Settings > Approval Workflows** to configure:

| Workflow | Recommended Settings |
|----------|---------------------|
| **Sale Agreement Creation** | Enabled, Threshold: ₹50,000+, L1: Branch Manager, L2: Admin |
| **Repurchase** | Enabled, Threshold: ₹50,000+, Dual Approval: Optional |
| **Margin Renewal** | Optional, Threshold: ₹25,000+ |

---

### Security Considerations

1. **RLS Protection**: Approval requests are scoped to `client_id`
2. **Role Validation**: Only users with L1/L2 approver roles can approve
3. **Dual Approval**: Same person cannot approve both L1 and L2
4. **Audit Trail**: All approvals/rejections logged with timestamps and user IDs
5. **Transaction Lock**: Pending agreements cannot be printed/disbursed
