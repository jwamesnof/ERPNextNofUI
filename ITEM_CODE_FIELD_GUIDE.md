# Item Code Field Implementation Guide

## Overview

The Item Code field now implements intelligent item search and validation with a graceful fallback mechanism based on backend availability.

## Behavior

### With Backend Item Search Endpoint Available
- **Display**: Searchable dropdown/combobox showing real ERPNext items
- **Validation**: Validates item on blur via `/api/items/validate` endpoint
- **Error Display**: Shows inline error if item not found
- **Submission**: Excludes items with validation errors from request payload

### Without Backend Item Search Endpoint
- **Display**: Simple text input field
- **Validation**: Manual entry only; validates when POST /otp/promise returns error
- **Error Display**: Shows inline error after submission attempt if item unknown
- **Submission**: Excludes empty items from request payload; backend returns "unknown item" error for invalid codes

## Architecture

### Key Components

#### 1. `useItemSearch` Hook (`src/hooks/useItemSearch.ts`)
- Checks for backend item search endpoint availability on mount
- Provides `searchItems(query)` to filter available items
- Provides `validateItem(itemCode)` to validate single items
- Returns `hasEndpoint` flag to determine UI mode

#### 2. `ItemCodeInput` Component (`src/components/ui/item-code-input.tsx`)
- Renders Combobox if items available + endpoint exists
- Renders simple text input if no endpoint or no items
- Handles blur validation if endpoint available
- Shows inline error with AlertCircle icon
- Tracks validation state via callback

#### 3. `OrderForm` Component Updates
- Imports and uses `ItemCodeInput` component
- Tracks validation errors per item index
- Passes validation callbacks to exclude invalid items

#### 4. `PromiseCalculator` Updates (`src/components/otp/promise-calculator.tsx`)
- Filters out empty/invalid items before submission
- Enhanced error handling for "unknown item" responses
- Displays clear error messages from backend

## API Contracts

### Item Search Endpoint (Optional)
```
GET /api/items/search?query={query}
Response: Array<{ item_code: string; item_name?: string; description?: string }>
```

### Item Validation Endpoint (Optional)
```
GET /api/items/validate?item_code={code}
Response: { valid: boolean; error?: string }
```

## User Flows

### Flow 1: Backend Endpoint Available
1. User types in Item Code field
2. Dropdown shows filtered items
3. User selects or types complete code
4. On blur: Validation request sent to backend
5. If invalid: Error shown inline, item cannot be submitted
6. If valid: Item ready for submission
7. On submit: Only valid items sent to POST /otp/promise

### Flow 2: Backend Endpoint NOT Available
1. User types item code manually
2. No validation on blur
3. On submit: Items with empty code_id filtered out
4. POST /otp/promise called with available items
5. If backend returns "unknown item" error: Shown to user
6. User can correct and resubmit

## Error Messages

### Validation Errors (Inline)
- `Item code is required` - Empty field on blur
- `Item not found` - Invalid code per backend
- `Validation failed` - Backend validation error

### Submission Errors (Alert)
- `Item "{code}" not found in inventory. Please check the item code.` - Unknown item from backend
- `Validation error: Please check all items are valid.` - Multiple validation failures
- `At least one valid item is required` - No valid items after filtering

## Implementation Details

### Validation Behavior
- **On blur (if endpoint exists)**: Async validation against backend
- **On submit**: Filters empty/invalid items before payload construction
- **Backend response**: Captures "unknown item" errors and displays clearly

### State Management
- Item validation errors tracked in `OrderForm` state
- Hook-based approach for reusable item search logic
- No external validation library; uses React Hook Form + custom async validation

### UI/UX
- Combobox shows check mark for selected item
- Search highlights matching items (label + description)
- Error icon (AlertCircle) with red text for inline errors
- Graceful degradation to text input if no endpoint

## Testing

### Manual Tests
1. **With endpoint**: Type partial code → see filtered dropdown
2. **Without endpoint**: Type code → no validation on blur
3. **Invalid item**: Type non-existent code → blur/submit → error shown
4. **Valid item**: Type real code → submit succeeds
5. **Empty item**: Leave blank → excluded from submission

### Error Scenarios
- Backend validation endpoint returns 404
- Multiple items with mix of valid/invalid
- Empty items list on submit
- Network error during validation

## Future Enhancements

1. **Caching**: Cache available items list to avoid repeated API calls
2. **Debouncing**: Debounce search queries to reduce backend load
3. **Async Validation in Form**: Integrate validation errors directly into React Hook Form's error state
4. **Item Metadata**: Display additional item details (price, category, etc.) in dropdown
5. **Recent Items**: Show recently used items for quick access

## Configuration

### Environment Variables
```
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8001  # Backend URL
```

### Backend Endpoint URLs (Assumed)
- Item search: `{API_BASE_URL}/api/items/search?query=...`
- Item validation: `{API_BASE_URL}/api/items/validate?item_code=...`
- Item promise: `{API_BASE_URL}/otp/promise` (existing)

## Troubleshooting

### No Dropdown Appearing
- Check if backend endpoint `/api/items/search` is available
- Check `hasEndpoint` flag in browser dev tools
- Verify `NEXT_PUBLIC_API_BASE_URL` is set correctly

### Validation Not Working
- Ensure `/api/items/validate` endpoint is implemented
- Check browser network tab for validation requests
- Verify item codes match backend ERPNext format

### Items Being Excluded
- Check if validation error is set for that item
- Verify item_code is not empty string
- Check console for validation error details

## Related Files
- `src/components/otp/OrderForm.tsx` - Main form component
- `src/components/ui/item-code-input.tsx` - Item code input component
- `src/hooks/useItemSearch.ts` - Item search hook
- `src/components/otp/promise-calculator.tsx` - Promise calculation and submission
- `src/components/ui/combobox.tsx` - Reusable combobox component
