
## Plan: Activate Delete Functionality for Sale Agreements

### Current State
The Sale Agreements page has a delete button (trash icon) that currently shows "Delete functionality coming soon" when clicked (line 2065). The button already has permission checks using `canDelete` and `attemptDelete()`.

### What We'll Add

| Component | Description |
|-----------|-------------|
| **State** | `agreementToDelete` to track which agreement is being deleted |
| **Handler** | `handleDeleteAgreement` function to delete agreement and related data |
| **UI** | AlertDialog for delete confirmation |

---

### Technical Changes

#### File: `src/pages/SaleAgreements.tsx`

**1. Add AlertDialog Import (line 10)**
```typescript
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
```

**2. Add State for Delete Confirmation (around line 267)**
```typescript
const [agreementToDelete, setAgreementToDelete] = useState<SaleAgreement | null>(null);
```

**3. Add Delete Handler Function (after line 874)**
```typescript
const handleDeleteAgreement = async () => {
  if (!agreementToDelete) return;
  
  try {
    // Check if agreement has any payments (margin renewals)
    const { count: paymentCount } = await supabase
      .from('interest_payments')
      .select('id', { count: 'exact', head: true })
      .eq('loan_id', agreementToDelete.id);
    
    if (paymentCount && paymentCount > 0) {
      toast.error('Cannot delete agreement with existing margin payments', {
        description: `${paymentCount} payment(s) found. Please reverse them first.`
      });
      setAgreementToDelete(null);
      return;
    }
    
    // Check if agreement has redemption (repurchase)
    const { count: redemptionCount } = await supabase
      .from('redemptions')
      .select('id', { count: 'exact', head: true })
      .eq('loan_id', agreementToDelete.id);
    
    if (redemptionCount && redemptionCount > 0) {
      toast.error('Cannot delete agreement with existing repurchase record');
      setAgreementToDelete(null);
      return;
    }
    
    // Delete related voucher entries and vouchers
    const { data: vouchers } = await supabase
      .from('vouchers')
      .select('id')
      .eq('loan_id', agreementToDelete.id);
    
    if (vouchers && vouchers.length > 0) {
      const voucherIds = vouchers.map(v => v.id);
      await supabase
        .from('voucher_entries')
        .delete()
        .in('voucher_id', voucherIds);
      
      await supabase
        .from('vouchers')
        .delete()
        .eq('loan_id', agreementToDelete.id);
    }
    
    // Delete approval requests if any
    await supabase
      .from('approval_requests')
      .delete()
      .eq('entity_id', agreementToDelete.id)
      .eq('entity_type', 'loan');
    
    // Delete loan disbursements
    await supabase
      .from('loan_disbursements')
      .delete()
      .eq('loan_id', agreementToDelete.id);
    
    // Delete gold items
    await supabase
      .from('gold_items')
      .delete()
      .eq('loan_id', agreementToDelete.id);
    
    // Finally delete the agreement
    const { error } = await supabase
      .from('loans')
      .delete()
      .eq('id', agreementToDelete.id);
    
    if (error) throw error;
    
    toast.success(`Agreement ${agreementToDelete.loan_number} deleted successfully`);
    setAgreementToDelete(null);
    fetchAgreements();
  } catch (error: any) {
    console.error('Delete error:', error);
    if (error.code === '23503') {
      toast.error('Cannot delete agreement. It has related records that must be removed first.');
    } else {
      toast.error('Failed to delete agreement');
    }
  }
};
```

**4. Update Delete Button Click Handler (lines 2060-2072)**

Replace:
```typescript
onClick={() => {
  if (!attemptDelete()) return;
  toast.info('Delete functionality coming soon');
}}
```

With:
```typescript
onClick={() => {
  if (!attemptDelete()) return;
  setAgreementToDelete(agreement);
}}
```

**5. Add Delete Confirmation Dialog (before closing `</div>` around line 2252)**
```typescript
{/* Delete Confirmation Dialog */}
<AlertDialog open={!!agreementToDelete} onOpenChange={(open) => !open && setAgreementToDelete(null)}>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Delete Sale Agreement</AlertDialogTitle>
      <AlertDialogDescription>
        Are you sure you want to delete agreement <strong>{agreementToDelete?.loan_number}</strong>?
        <br /><br />
        This will also delete:
        <ul className="list-disc list-inside mt-2 text-sm">
          <li>All gold items linked to this agreement</li>
          <li>Disbursement records</li>
          <li>Accounting vouchers</li>
        </ul>
        <br />
        This action cannot be undone.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Cancel</AlertDialogCancel>
      <AlertDialogAction 
        onClick={handleDeleteAgreement} 
        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
      >
        Delete Agreement
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
```

---

### Safety Checks

The delete handler includes important safety checks:

| Check | Action if Found |
|-------|-----------------|
| **Margin Payments** | Block deletion - user must reverse payments first |
| **Repurchase Record** | Block deletion - can't delete exercised agreements |
| **Vouchers** | Auto-delete voucher entries and vouchers |
| **Approval Requests** | Auto-delete pending approvals |
| **Gold Items** | Auto-delete linked gold items |
| **Disbursements** | Auto-delete payment records |

---

### Delete Flow

```text
User clicks Delete → Permission check → Show Confirmation Dialog
                                              ↓
                                    User clicks "Delete Agreement"
                                              ↓
                            ┌─── Has payments? ────→ Block + Show Error
                            │
                            ├─── Has repurchase? ──→ Block + Show Error
                            │
                            └─── Safe to delete ───→ Delete in order:
                                                      1. Voucher entries
                                                      2. Vouchers
                                                      3. Approval requests
                                                      4. Loan disbursements
                                                      5. Gold items
                                                      6. Loan record
                                                      ↓
                                                    Success Toast + Refresh
```

---

### Files to Modify

| File | Change |
|------|--------|
| `src/pages/SaleAgreements.tsx` | Add AlertDialog import, state, handler, and dialog component |

---

### Expected Behavior

1. User clicks trash icon → Confirmation dialog appears
2. Dialog shows agreement number and what will be deleted
3. User clicks "Delete Agreement" → Safety checks run
4. If safe: All related data deleted, success toast, table refreshes
5. If unsafe: Error toast explaining why deletion is blocked
