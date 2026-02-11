# Item Code Field - Quick Reference Card

## ⚡ Quick Start

### For Developers Testing
1. **No backend endpoints?** → See simple text input, no dropdown
2. **Backend endpoints ready?** → See Combobox with items, validation on blur
3. **Invalid item?** → See red error message below field
4. **Submit with invalid items?** → Items filtered out automatically

### For Backend Team
Implement these 2 endpoints to enable dropdown:

```
GET /api/items/search?query=SKU  → [{ item_code, item_name, description }]
GET /api/items/validate?item_code=SKU001  → { valid: boolean }
```

See `BACKEND_ITEM_ENDPOINTS_PROMPT.md` for full spec.

---

## 📁 Files to Know

| File | Purpose |
|------|---------|
| `src/hooks/useItemSearch.ts` | Item search logic (endpoint detection, validation) |
| `src/components/ui/item-code-input.tsx` | Item code input component (dropdown/text) |
| `src/components/otp/OrderForm.tsx` | Updated to use ItemCodeInput |
| `src/components/otp/promise-calculator.tsx` | Filters invalid items before submit |
| `ITEM_CODE_FIELD_GUIDE.md` | Complete behavior documentation |
| `BACKEND_ITEM_ENDPOINTS_PROMPT.md` | Backend integration spec |
| `ITEM_CODE_TECHNICAL_ARCHITECTURE.md` | Architecture diagrams & flows |

---

## 🔄 Behavior Summary

### Mode 1: With Backend Endpoints
```
Dropdown visible → Search while typing → Validation on blur → 
Error shown inline → Valid items submitted
```

### Mode 2: Without Backend Endpoints
```
Text input only → No validation on blur → Submit → 
If error: "unknown item" → User corrects → Retry
```

---

## 🎯 Key Features

✅ **Smart Fallback**: Gracefully handles missing endpoints
✅ **Real-time Search**: Dropdown filters as user types
✅ **Immediate Validation**: On blur if endpoint available
✅ **Inline Errors**: Clear error messages with icon
✅ **Item Filtering**: Invalid items never sent to backend
✅ **No Hardcoding**: Only real ERPNext items shown
✅ **Responsive**: Works on all screen sizes

---

## 🐛 Common Issues & Fixes

### No Dropdown Appearing
- [ ] Backend `/api/items/search` endpoint deployed?
- [ ] `NEXT_PUBLIC_API_BASE_URL` pointing to correct backend?
- [ ] Check browser console for network errors

### Validation Not Triggering
- [ ] Is `/api/items/validate` endpoint implemented?
- [ ] Did backend return proper response format?
- [ ] Try network tab in DevTools

### Items Being Excluded
- [ ] Are all items valid in ERPNext?
- [ ] Check if item_code is empty string
- [ ] Verify backend returns "unknown item" error

---

## 🧪 Manual Testing

```
Test 1: Type partial item code
  ✓ Dropdown appears (if endpoint exists)
  ✓ Shows matching items

Test 2: Leave field blank and blur
  ✓ Error: "Item code is required"

Test 3: Type invalid item code and blur
  ✓ Error: "Item not found" (if endpoint available)

Test 4: Type valid item code and blur
  ✓ No error message
  ✓ Field ready for submit

Test 5: Submit form with invalid items
  ✓ Error shows in alert
  ✓ Can fix and resubmit
```

---

## 📊 State Flow

```
User types → useItemSearch detects endpoint → 
ItemCodeInput shows Combobox (if items) or TextInput (fallback) → 
Validation occurs on blur (if endpoint) → 
State tracked in itemValidationErrors → 
Error displayed inline → 
Submit filters invalid items
```

---

## 🔌 API Expectations

### Request Payload
```typescript
{
  customer: "Acme Corp",
  items: [
    {
      item_code: "SKU001",  // Empty items filtered out
      qty: 5,
      warehouse: "Stores - SD"
    }
  ]
}
```

### Error Handling
```typescript
// Backend returns unknown item?
→ Frontend extracts code
→ Shows: "Item 'SKU999' not found in inventory"
→ User corrects
→ Resubmits
```

---

## 🚀 Deployment Checklist

- [ ] All files compile (`npm run build`)
- [ ] No TypeScript errors
- [ ] Component renders without crashes
- [ ] Can type in item code field
- [ ] Errors display correctly (if present)
- [ ] Form submits with valid items
- [ ] Backend endpoints implemented (when ready)
- [ ] Dropdown appears after endpoints deployed
- [ ] Validation works on blur (after endpoints deployed)

---

## 💡 Pro Tips

1. **Fast Testing**: Use browser DevTools to mock API responses
2. **Debugging**: Check `itemValidationErrors` state in React DevTools
3. **Performance**: Items list fetched once on mount, not on every keystroke
4. **Accessibility**: Component supports keyboard navigation + screen readers
5. **Styling**: Uses Tailwind CSS, matches existing design system

---

## 📞 Support Resources

| Question | Resource |
|----------|----------|
| "How does it work?" | `ITEM_CODE_FIELD_GUIDE.md` |
| "What to implement?" | `BACKEND_ITEM_ENDPOINTS_PROMPT.md` |
| "Show me the architecture" | `ITEM_CODE_TECHNICAL_ARCHITECTURE.md` |
| "Where's the code?" | `src/hooks/useItemSearch.ts` or `src/components/ui/item-code-input.tsx` |

---

## 🎓 Learning Path

1. Start: This quick reference card
2. Next: `ITEM_CODE_FIELD_GUIDE.md` (behavioral overview)
3. Then: `ITEM_CODE_TECHNICAL_ARCHITECTURE.md` (deep dive)
4. Code: `src/components/ui/item-code-input.tsx` (implementation)
5. Backend: `BACKEND_ITEM_ENDPOINTS_PROMPT.md` (integration spec)

---

**Status**: ✅ Ready for Integration | 🔄 Awaiting Backend Endpoints

Last Updated: 2026-02-03
