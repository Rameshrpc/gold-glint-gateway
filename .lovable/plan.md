

## Plan: Add Appraised Value Column and Edit Button to Gold Items Table

### Overview

This plan adds:
1. **Appraised Value column** - displayed next to the Purity column
2. **Edit button** - alongside the existing Delete button to allow editing gold items

---

### Current Table Structure

| S.No | Item | Item Nos | Gross Wt | Net Wt | Purity | Market Value | Remarks | Actions |
|------|------|----------|----------|--------|--------|--------------|---------|---------|
| 1 | OTHER - Other | 1 | 323.400g | 323.300g | 22k | - | - | Delete |

### New Table Structure

| S.No | Item | Item Nos | Gross Wt | Net Wt | Purity | Appraised Value | Market Value | Remarks | Actions |
|------|------|----------|----------|--------|--------|-----------------|--------------|---------|---------|
| 1 | OTHER - Other | 1 | 323.400g | 323.300g | 22k | ₹25,60,000 | - | - | Edit / Delete |

---

### Changes Required

#### 1. Add Edit Functionality State

Add a new state variable to track which item is being edited:

```typescript
const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
```

#### 2. Create Edit Gold Item Function

```typescript
const editGoldItem = (index: number) => {
  const item = goldItems[index];
  // Populate currentItem form with the item being edited
  setCurrentItem({
    item_type: item.item_type,
    item_id: item.item_id,
    selectedItemGroupId: item.item_group_id,
    description: item.description,
    gross_weight_grams: item.gross_weight_grams,
    stone_weight_grams: item.stone_weight_grams,
    purity: item.purity,
    item_count: item.item_count,
    remarks: item.remarks,
  });
  setEditingItemIndex(index);
};
```

#### 3. Update Add Item Function

Modify `addGoldItem` to handle both add and edit operations:
- If `editingItemIndex !== null`, replace the item at that index
- Reset `editingItemIndex` to null after update

#### 4. Update Table Headers

Add new "Appraised Value" header between "Purity" and "Market Value":

**Location**: Lines 1645-1656

```typescript
<TableHead>Purity</TableHead>
<TableHead className="text-right">Appraised Value</TableHead>  // NEW
<TableHead className="text-right">Market Value</TableHead>
```

#### 5. Update Table Body Cells

Add Appraised Value cell and Edit button:

**Location**: Lines 1659-1678

```typescript
<TableCell>{item.purity}</TableCell>
<TableCell className="text-right">
  {formatIndianCurrency(item.appraised_value)}
</TableCell>
<TableCell className="text-right">
  {item.market_value ? formatIndianCurrency(item.market_value) : '-'}
</TableCell>
<TableCell className="text-muted-foreground text-sm max-w-[150px] truncate">
  {item.remarks || '-'}
</TableCell>
<TableCell>
  <div className="flex items-center gap-1">
    <Button variant="ghost" size="sm" onClick={() => editGoldItem(index)}>
      <Pencil className="h-4 w-4 text-muted-foreground" />
    </Button>
    <Button variant="ghost" size="sm" onClick={() => removeGoldItem(index)}>
      <Trash2 className="h-4 w-4 text-destructive" />
    </Button>
  </div>
</TableCell>
```

#### 6. Update Table Footer

Add empty cell for the new Appraised Value column to maintain alignment:

**Location**: Lines 1680-1691

```typescript
<TableCell></TableCell>  // Purity
<TableCell className="text-right font-semibold">
  {formatIndianCurrency(goldItems.reduce((sum, item) => sum + item.appraised_value, 0))}
</TableCell>
<TableCell className="text-right font-semibold">
  {formatIndianCurrency(goldItems.reduce((sum, item) => sum + (item.market_value || 0), 0))}
</TableCell>
```

#### 7. Update Add Item Button Text

When editing, change button text to "Update Item":

```typescript
<Button type="button" onClick={addGoldItem} variant="outline" size="sm" className="w-full">
  {editingItemIndex !== null ? (
    <>
      <Pencil className="h-4 w-4 mr-1" /> Update Item
    </>
  ) : (
    <>
      <Plus className="h-4 w-4 mr-1" /> Add Item
    </>
  )}
</Button>
```

---

### Files to Modify

| File | Changes |
|------|---------|
| `src/pages/Loans.tsx` | Add edit state, edit function, update table headers/body/footer, modify add button |

---

### Technical Details

**Lines affected in Loans.tsx:**
- ~Line 240: Add `editingItemIndex` state
- ~Lines 471-542: Modify `addGoldItem` to handle edit mode
- ~Lines 1645-1656: Update table headers
- ~Lines 1659-1678: Update table body cells
- ~Lines 1680-1691: Update table footer
- ~Lines 1632-1636: Update Add Item button

**Icon already imported**: `Pencil` is already imported on line 17

---

### Result

After implementation:
- Gold items table shows **Appraised Value** column next to Purity
- Each row has both **Edit** and **Delete** buttons
- Clicking Edit populates the form with item data for modification
- Add button changes to "Update Item" when in edit mode
- Footer shows total Appraised Value alongside Market Value

