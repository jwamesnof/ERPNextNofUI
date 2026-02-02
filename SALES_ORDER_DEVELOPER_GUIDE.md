# Sales Order Integration - Developer Quick Reference

## What Changed & Why

### Before
- UI showed vague "endpoint unavailable" messages
- No way to know if endpoint was truly missing vs. network error vs. wrong base URL
- Silently fell back to mock data when API failed
- No diagnostic info in error messages
- Badge showed base URL but didn't warn about wrong ports

### After
- **OpenAPI Detection**: App checks `openapi.json` on startup to see if `/otp/sales-orders` exists
- **Base URL Validation**: Warns if pointed at ERPNext (port 8000) instead of OTP API (port 8001)
- **Clear Error Messages**: Shows HTTP status + full URL + backend error detail
- **Smart Fallback**: No mock fallback when mock mode is off; shows real errors instead
- **Better UX States**: 4 distinct states with appropriate UI for each

## How It Works

### When App Starts
1. OTPClient constructor runs
2. Checks if `NEXT_PUBLIC_API_BASE_URL` is port 8000 or 8080 (ERPNext ports)
3. If yes → `baseUrlWarning` is set
4. InputPanel calls `detectSalesOrdersEndpoint()`
5. This fetches `/openapi.json` and checks for `/otp/sales-orders`
6. Result cached for 5 minutes

### When User Switches to "From Sales Order ID" Mode
- If endpoint exists → combobox + auto-fetch
- If endpoint missing (404 in OpenAPI) → warning banner + manual input fallback
- If API error → error banner with URL + retry button + manual input
- If list empty → info banner + manual input

## API Reference

### New OTPClient Methods

```typescript
// Returns any warning about wrong base URL
getBaseUrlWarning(): string | null

// Detects if /otp/sales-orders exists in OpenAPI spec
async detectSalesOrdersEndpoint(): Promise<EndpointDetectionResult>
  // Returns: { exists: boolean, error?: string }
```

### Error Message Format

All fetch errors now include full URL:
```
HTTP 404 - http://127.0.0.1:8001/otp/sales-orders?limit=20
Endpoint not found
```

Instead of:
```
Sales Order list endpoint unavailable
```

## Testing Checklist

- [ ] Try with `NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000` → should show orange/amber badge + warning
- [ ] Try with OpenAPI not available → should show "endpoint not available" but allow manual input
- [ ] Try with 500 error on `/otp/sales-orders` → should show error with full URL + retry button
- [ ] Try with empty list → should show info + manual input
- [ ] Try with `NEXT_PUBLIC_MOCK_MODE=false` and backend down → should show network error, NOT mock data
- [ ] Verify refresh button refetches list
- [ ] Verify retry button on error works
- [ ] Verify manual fallback input always available

## Common Scenarios

### Scenario: "Why is the dropdown not loading?"

Check in this order:
1. Badge shows API endpoint (top-right)
2. If badge is amber/orange → base URL points to ERPNext, not OTP API
3. If badge is green but dropdown shows error → check the error message for HTTP status + URL
4. If error is 404 → backend hasn't implemented `/otp/sales-orders` yet
5. If error is network → backend not running or firewall issue
6. If error is timeout → backend slow or hanging
7. If showing "endpoint not available" warning → OpenAPI response didn't include `/otp/sales-orders` path

### Scenario: "Why am I seeing mock data?"

- Check `NEXT_PUBLIC_MOCK_MODE` env var
- If `false` → you shouldn't see mock data, you should see real errors
- If `true` → mock mode is enabled, that's expected
- If `true` but you want real data → set `NEXT_PUBLIC_MOCK_MODE=false` and ensure backend is running

## File Structure

```
src/lib/api/
├── otpClient.ts          ← Main API client with new detection logic
├── otp-client.ts         ← Re-exports otpClient (backward compat)
├── types.ts              ← Typed models
└── mockData.ts           ← Mock responses

src/components/otp/
├── input-panel.tsx       ← Updated with endpoint detection + error states
└── dashboard-layout.tsx  ← Updated API badge with warning

src/components/ui/
├── alert-banner.tsx      ← Reusable alert for error/info/warning messages
├── combobox.tsx          ← Searchable dropdown for Sales Orders
└── loading-skeleton.tsx  ← Loading placeholder
```

## Migration Guide for Developers

If you built custom components that call `fetchSalesOrders()`:

**Before:**
```typescript
try {
  const orders = await otpClient.fetchSalesOrders()
  // Use orders
} catch (error) {
  // Showed vague message, might have silently used mock
}
```

**After:**
```typescript
try {
  const orders = await otpClient.fetchSalesOrders()
  // Use orders
} catch (error) {
  const apiError = error as OTPApiError
  // error.detail now includes: "HTTP 404 - http://127.0.0.1:8001/otp/sales-orders?limit=20"
  // No mock fallback if NEXT_PUBLIC_MOCK_MODE=false
  console.error(apiError.detail)
}
```

Error object structure:
```typescript
export class OTPApiError extends Error {
  statusCode?: number         // HTTP status code
  code?: string              // "HTTP_404", "TIMEOUT", "NETWORK_ERROR"
  detail?: string            // Full URL + response body
}
```
