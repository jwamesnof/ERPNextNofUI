# ACTUAL UI SELECTORS - Verified from Browser Inspection

Based on real HTML inspection of the running application at http://localhost:3000

## Element Selectors

### Customer Input
- Selector: `input#customer`
- HTML: `<input id="customer" type="text" placeholder="e.g., Acme Corporation">`
- ✅ Confirmed

### Add Item Button
- Selector: `button:has-text("Add Item")` OR `get_by_role("button", name="Add Item")`
- Classes: `flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-100...`
- ✅ Confirmed

### Evaluate Promise Button
- Selector: `button:has-text("Evaluate Promise")` OR `get_by_role("button", name="Evaluate Promise")`
- Type: `submit`
- Status: Currently `disabled` (because validation not complete)
- ✅ Confirmed

### Mode Toggle Buttons
- Manual Mode: `button[data-testid="input-mode-manual"]`
- Sales Order Mode: `button[data-testid="input-mode-sales-order"]`
- ✅ Confirmed (these are the ONLY data-testid buttons!)

### Sales Order Manual Input
- Selector: `input[data-testid="sales-order-manual-input"]`
- Placeholder: "e.g., SO-2024-001"
- ✅ Confirmed

### Item Code Input
- Selector: `input[placeholder="e.g., SKU001"]`
- Type: text with autocomplete
- Inside: Item row grid (col-span-2)
- ✅ Confirmed

### Quantity Input
- Selector: `input[type="number"][name="items.0.qty"]` (for first item)
- Generic: `input[type="number"]` (multiple instances)
- ✅ Confirmed

### Warehouse Select
- Selector: `select[name="items.0.warehouse"]` (for first item)
- Options: "Stores - SD", "Goods In Transit - SD", "Finished Goods - SD", etc.
- ✅ Confirmed

### Item Count Badge
- Text: "1 item" or "X items"
- Selector: `span:has-text(" item")`
- Classes: `text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded`
- ✅ Confirmed

### API Status Badge
- Text: "API connected" (green) or "API offline" (red)
- Selector: `get_by_text("API connected")` or similar
- ✅ Confirmed

### Results Panel (when visible)
- Should show "Promise Date", "Confidence", etc.
- Selector: Look for text content
- Status: Not yet visible (form needs to be complete and submitted)

### Remove Item Button
- Icon: Trash icon
- Selector: `button:has-text("")` with trash icon in item row
- Classes: `w-full px-3 py-2 bg-red-100 hover:bg-red-200 text-red-700`
- ✅ Confirmed

## Form Structure

```
Form
├── Input Mode Toggle (2 buttons with data-testid)
├── Sales Order Manual Input
├── Customer Input #customer
├── Items Section
│   ├── Item Count Badge (text badge)
│   ├── Item Grid (repeating for each item)
│   │   ├── Item Code Input [placeholder="e.g., SKU001"]
│   │   ├── Qty Input [type="number"]
│   │   ├── Warehouse Select
│   │   └── Remove Button
│   ├── Add Item Button
│   └── Clear All Button
├── Delivery Settings Button
└── Evaluate Promise Button [type="submit"]
```

## Total Elements Found

- Total `<input>` elements: **4**
- Total `<button>` elements: **13**
- Elements with `data-testid`: **3** (only the mode buttons and sales-order-manual-input)

## Key Insights

1. **data-testid is SPARSE** - Only 3 elements have it, mostly in input modes
2. **Use role-based selectors** - `get_by_role("button", name="...")` works well
3. **Use ID selectors where available** - `#customer` is clean and stable
4. **Use attribute selectors for specificity** - `[placeholder="..."]`, `[data-testid="..."]`
5. **Use text content carefully** - Works but can break with localization/content changes
6. **Use CSS classes as fallback** - But they're fragile due to Tailwind changes

## Recommendations for Tests

✅ GOOD:
```python
customer = page.locator('#customer')
add_item = page.get_by_role("button", name="Add Item")
evaluate = page.get_by_role("button", name="Evaluate Promise")
item_qty = page.locator('input[type="number"]').first
```

⚠️  RISKY:
```python
# Text content can change
badge = page.get_by_text("1 item")  # Fragile!

# Placeholder can change
item_code = page.locator('input[placeholder="e.g., SKU001"]')  # Fragile!
```

❌ AVOID:
```python
# Tailwind classes change frequently
button = page.locator('button.flex-1.flex.items-center...')  # DON'T DO THIS
```
