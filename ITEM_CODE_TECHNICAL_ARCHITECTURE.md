# Item Code Field - Technical Architecture Diagram

## Component Hierarchy

```
PromiseCalculator
  ├── InputPanel
  │   └── OrderForm
  │       ├── useItemSearch (hook)
  │       └── ItemCodeInput (for each item)
  │           ├── Combobox (if items available)
  │           └── or TextInput (fallback)
  └── OtpResultPanel
```

## Data Flow Diagram

### With Backend Endpoints Available
```
User Input
    ↓
ItemCodeInput
    ↓
useItemSearch.searchItems()
    ↓
Combobox Dropdown
    ↓
User Selects / Confirms
    ↓
onBlur Trigger
    ↓
useItemSearch.validateItem()
    ↓
Backend: GET /api/items/validate?item_code=SKU001
    ↓
Update itemValidationErrors State
    ↓
Display Error or Clear
    ↓
onSubmit
    ↓
Filter Invalid Items
    ↓
POST /otp/promise
```

### Without Backend Endpoints
```
User Input
    ↓
ItemCodeInput
    ↓
Simple TextInput
    ↓
onBlur (No validation)
    ↓
onSubmit
    ↓
Filter Empty Items
    ↓
POST /otp/promise
    ↓
Backend Error (if unknown item)
    ↓
Display Error Message
    ↓
User Corrects & Retries
```

## State Management

### useItemSearch Hook State
```typescript
{
  items: Item[],           // Available items from backend
  isLoading: boolean,      // Search endpoint request state
  hasEndpoint: boolean     // Whether search endpoint exists
}
```

### OrderForm Component State
```typescript
{
  itemValidationErrors: {
    [index: number]: string  // Error message per item index
  }
}
```

### Promise Calculator State
```typescript
{
  result: PromiseResponse | null,
  isLoading: boolean,
  error: string | null
}
```

## API Integration Points

### 1. Item Search (Optional)
```
GET /api/items/search?query=SKU
↓
Returns: Array<{item_code, item_name, description}>
```

### 2. Item Validation (Optional)
```
GET /api/items/validate?item_code=SKU001
↓
Returns: {valid: boolean, error?: string}
```

### 3. Promise Evaluation (Required)
```
POST /otp/promise
{
  customer: string,
  items: [{item_code, qty, warehouse}],
  desired_date?: string,
  rules: {...}
}
↓
Returns: {promise_date, confidence, status, ...}
```

## UI Behavior Matrix

| Condition | Input Type | Validation | Error Display | Submit Behavior |
|-----------|-----------|------------|---------------|-----------------|
| Backend exists, items available | Combobox | On blur | Inline error | Filter invalid |
| Backend exists, no items | TextInput | On blur | Inline error | Filter empty |
| Backend missing | TextInput | None | None (until submit) | Filter empty |
| Submit with invalid item | - | - | Alert popup | Filtered out |
| Submit with no valid items | - | - | Alert popup | Rejected |

## Error Handling Tree

```
User Submits Form
    ├─ No valid items?
    │  └─ Show: "At least one valid item is required"
    │
    ├─ Backend validation error?
    │  └─ Show: Specific error + item code
    │
    ├─ Unknown item error?
    │  └─ Show: "Item '{code}' not found in inventory"
    │
    ├─ Validation error?
    │  └─ Show: "Validation error: Please check all items"
    │
    └─ Success?
       └─ Display promise results
```

## Performance Optimization Points

1. **Search Debouncing**: Built into Combobox (onQueryChange)
2. **Lazy Validation**: Only on blur, not on every keystroke
3. **Item List Caching**: Single fetch on mount
4. **Filtered Submission**: Empty items never sent to backend
5. **Error Memoization**: Stored per item index for quick access

## Fallback Strategy

```
Try: Load items from /api/items/search
  ✓ Success → Use Combobox mode
  ✗ Failed → Use TextInput mode
  
Try: Validate on blur via /api/items/validate
  ✓ Success → Show error/clear
  ✗ Failed → Assume valid (backend will catch)

Try: POST /otp/promise with items
  ✓ Success → Display results
  ✗ Unknown item → Extract code, show error
  ✗ Other error → Show general error message
```

## Type Safety

### ItemCodeInput Props
```typescript
interface ItemCodeInputProps {
  value: string
  onChange: (value: string) => void
  onBlur?: () => void
  disabled?: boolean
  hasEndpoint: boolean
  availableItems: Array<{item_code, item_name?}>
  onValidationChange?: (isValid, error?) => void
  validateItem?: (code) => Promise<{valid, error?}>
  error?: string
}
```

### UseItemSearch Return
```typescript
interface UseItemSearchResult {
  items: Item[]
  isLoading: boolean
  hasEndpoint: boolean
  searchItems: (query: string) => Item[]
  validateItem: (code: string) => Promise<{valid, error?}>
}
```

## Integration Checklist

- [x] Remove random suggestions ✓
- [x] Implement dropdown ✓
- [x] Add validation on blur ✓
- [x] Handle backend errors ✓
- [x] Filter invalid items ✓
- [x] Show inline errors ✓
- [x] Exclude from submission ✓
- [x] Create documentation ✓
- [ ] Backend implements endpoints (pending)
- [ ] End-to-end testing (pending)

## Future Enhancement Ideas

1. **Item Caching**: Store items in localStorage to avoid repeated fetches
2. **Search Debouncing**: Reduce API calls during typing
3. **Item Categories**: Filter by category if available
4. **Recent Items**: Show recently used items
5. **Keyboard Navigation**: Arrow keys for dropdown selection
6. **Batch Validation**: Validate all items before submit
7. **Item Metadata**: Show stock levels, prices, etc. in dropdown
