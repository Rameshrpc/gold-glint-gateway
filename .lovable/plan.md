
## Plan: Protect Existing Sale Agreements from Scheme Changes

### Problem Statement
Currently, when a Sale Agreement Scheme is edited or deleted in `SaleSchemes.tsx`:
- **Edit**: Directly updates the scheme record, which could affect calculations for existing agreements
- **Delete**: Forcefully deletes the scheme AND its versions, breaking any existing agreements that reference them

### Solution Overview
Implement the same version history system already used in `Schemes.tsx` (for loans):

1. **On Edit**: Check if any agreements exist with this scheme. If yes, create a NEW version instead of modifying in place.
2. **On Delete**: Check if any agreements exist. If yes, block deletion. If no, allow deletion.

---

### Technical Changes

#### File: `src/pages/SaleSchemes.tsx`

**1. Update `handleDelete` function (lines 134-157)**

Add a check for existing agreements before deletion:

```typescript
const handleDelete = async () => {
  if (!schemeToDelete) return;
  
  try {
    // Check if any sale agreements use this scheme
    const { count: agreementCount } = await supabase
      .from('loans')
      .select('id', { count: 'exact', head: true })
      .eq('scheme_id', schemeToDelete.id)
      .eq('transaction_type', 'sale_agreement');
    
    if (agreementCount && agreementCount > 0) {
      toast.error('Cannot delete scheme. It is being used by existing sale agreements.', {
        description: `${agreementCount} agreement(s) are linked to this scheme.`
      });
      setSchemeToDelete(null);
      return;
    }
    
    // Safe to delete - first delete versions
    await supabase
      .from('scheme_versions')
      .delete()
      .eq('scheme_id', schemeToDelete.id);
    
    // Then delete the scheme
    const { error } = await supabase
      .from('schemes')
      .delete()
      .eq('id', schemeToDelete.id);
    
    if (error) throw error;
    toast.success('Scheme deleted successfully');
    setSchemeToDelete(null);
    fetchSchemes();
  } catch (error: any) {
    if (error.code === '23503') {
      toast.error('Cannot delete scheme. It is being used by existing agreements.');
    } else {
      toast.error('Failed to delete scheme');
    }
  }
};
```

**2. Update `handleSubmit` function (lines 208-319)**

Add version management when editing a scheme that has existing agreements:

```typescript
const handleSubmit = async () => {
  if (!client) return;
  
  // ... validation ...

  if (editingScheme) {
    // Check if any sale agreements exist with this scheme
    const { count: agreementCount } = await supabase
      .from('loans')
      .select('id', { count: 'exact', head: true })
      .eq('scheme_id', editingScheme.id)
      .eq('transaction_type', 'sale_agreement');

    if (agreementCount && agreementCount > 0) {
      // Agreements exist - create NEW VERSION instead of modifying in place
      
      // Get current max version number
      const { data: existingVersions } = await supabase
        .from('scheme_versions')
        .select('version_number')
        .eq('scheme_id', editingScheme.id)
        .order('version_number', { ascending: false })
        .limit(1);

      const nextVersionNumber = (existingVersions?.[0]?.version_number || 0) + 1;
      const today = new Date().toISOString().split('T')[0];

      // Close old version
      const { data: currentScheme } = await supabase
        .from('schemes')
        .select('current_version_id')
        .eq('id', editingScheme.id)
        .single();

      if (currentScheme?.current_version_id) {
        await supabase
          .from('scheme_versions')
          .update({ effective_to: today })
          .eq('id', currentScheme.current_version_id);
      }

      // Create new version with new rates
      const { data: newVersion, error: versionError } = await supabase
        .from('scheme_versions')
        .insert({
          scheme_id: editingScheme.id,
          client_id: client.id,
          version_number: nextVersionNumber,
          effective_from: today,
          change_reason: 'Scheme updated - new version for new agreements',
          margin_per_month: marginPerMonth,
          tenure_step: 15,
          interest_rate: equivalentAnnualRate,
          shown_rate: equivalentAnnualRate,
          effective_rate: equivalentAnnualRate,
          // ... other version fields ...
        })
        .select()
        .single();

      if (versionError) throw versionError;

      // Update scheme header with new current_version_id
      await supabase
        .from('schemes')
        .update({
          ...schemeData,
          current_version_id: newVersion.id,
        })
        .eq('id', editingScheme.id);

      toast.success(`Scheme updated. Version ${nextVersionNumber} created for new agreements.`, {
        description: 'Existing agreements will continue using their original terms.'
      });
    } else {
      // No agreements exist - safe to update in place
      const { error } = await supabase
        .from('schemes')
        .update(schemeData)
        .eq('id', editingScheme.id);
      
      if (error) throw error;

      // Also update the current version record
      const { data: currentScheme } = await supabase
        .from('schemes')
        .select('current_version_id')
        .eq('id', editingScheme.id)
        .single();

      if (currentScheme?.current_version_id) {
        await supabase
          .from('scheme_versions')
          .update({
            margin_per_month: marginPerMonth,
            // ... other version fields ...
          })
          .eq('id', currentScheme.current_version_id);
      }

      toast.success('Scheme updated successfully');
    }
  } else {
    // Create new scheme (existing logic)
  }
};
```

---

### Data Flow After Implementation

```text
┌─────────────────────────────────────────────────────────────┐
│ SALE AGREEMENT SCHEME: SALE-01                              │
├─────────────────────────────────────────────────────────────┤
│ Version 1 (Original)          Version 2 (New)               │
│ ─────────────────────         ─────────────────────         │
│ Margin: ₹1,500/L/mo           Margin: ₹2,000/L/mo           │
│ Effective: 2025-01-01         Effective: 2026-02-02         │
│ Closed: 2026-02-01            Active                        │
│                                                              │
│ ↓ Used by:                    ↓ Used by:                    │
│ SA202501010001                SA202602020144 (new)          │
│ SA202501152345                                              │
│ SA202501309876                                              │
│ (These keep original terms)   (Gets new terms)              │
└─────────────────────────────────────────────────────────────┘
```

---

### Behavior Summary

| Action | Has Existing Agreements? | Result |
|--------|--------------------------|--------|
| **Edit** | No | Updates scheme and version in place |
| **Edit** | Yes | Creates new version; old agreements keep original version |
| **Delete** | No | Deletes scheme and versions |
| **Delete** | Yes | Blocked with error message |
| **Toggle Status** | Any | Only affects visibility for new agreements (safe) |

---

### Files to Modify

| File | Change |
|------|--------|
| `src/pages/SaleSchemes.tsx` | Add agreement check in `handleDelete`, version management in `handleSubmit` |

---

### Why This Works

1. **Agreements store `scheme_version_id`**: When a sale agreement is created, it captures the `current_version_id` from the scheme at that moment (already implemented in `SaleAgreements.tsx` line 705).

2. **Calculations use version data**: When calculating interest/margin for existing agreements, the system should reference the stored `scheme_version_id` to get the original rates (already in place for Interest.tsx, Redemption.tsx).

3. **New version for new agreements**: After an edit, only new agreements will use the new version, while existing agreements continue using their locked-in version.

---

### Expected Outcome

- Existing sale agreements maintain their original calculation parameters
- Admins can freely update scheme rates for future agreements
- Schemes with existing agreements cannot be deleted
- Clear feedback messages explain what's happening
