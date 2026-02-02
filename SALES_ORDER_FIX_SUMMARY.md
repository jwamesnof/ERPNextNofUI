# Sales Order Integration Fix - Technical Summary

## Problem Fixed
The Sales Order list integration was showing confusing error messages and didn't properly detect endpoint availability. The UI showed "endpoint unavailable" without diagnostic info, and the base URL wasn't validated for correctness.

## Solution Implemented

### 1. **OpenAPI-Based Endpoint Detection** 
   - Added `inspectOpenApi()` helpers that fetch `${BASE_URL}/openapi.json` on app startup
   - Checks if `/otp/sales-orders` exists in the OpenAPI spec paths
   - Caches result for 5 minutes to avoid excessive HTTP calls
   - **Code Location**: [src/lib/api/otpClient.ts](src/lib/api/otpClient.ts) - `getOpenApiSpec()`, `detectEndpoint()` functions

### 2. **Base URL Validation & Warning**
   - Detects if base URL points to ERPNext (port 8000 or 8080) instead of OTP API (port 8001)
   - Shows clear warning: "You are connected to ERPNext, not the OTP API. Set NEXT_PUBLIC_API_BASE_URL..."
   - Badge in top-right turns amber with tooltip showing warning
   - **Code Location**: [src/lib/api/otpClient.ts](src/lib/api/otpClient.ts) - `isWrongBaseUrl()`, `getBaseUrlWarning()`

### 3. **Improved Error Diagnostics**
   - Error messages now include:
     - Full URL that was called (no guessing)
     - HTTP status code
     - Backend error detail if available
   - Format: `HTTP 404 - http://127.0.0.1:8001/otp/sales-orders?limit=20`
   - **Code Location**: [src/lib/api/otpClient.ts](src/lib/api/otpClient.ts) - `fetchSalesOrders()` method

### 4. **Better UX States**
   - **Endpoint Detecting**: Shows "Detecting Sales Order endpoint..." banner during OpenAPI check
   - **Endpoint Not Found**: Shows warning "The /otp/sales-orders endpoint is not implemented in the backend"
   - **API Error**: Shows error banner with full URL and retry button
   - **Empty List**: Shows info banner explaining no Sales Orders found
   - All states allow manual Sales Order ID fallback input
   - **Code Location**: [src/components/otp/input-panel.tsx](src/components/otp/input-panel.tsx) - Sales Order mode UI

### 5. **No Mock Fallback When Real API Fails**
   - Removed automatic fallback to mock data when `NEXT_PUBLIC_MOCK_MODE=false`
   - If API call fails, shows actual error (not mock data)
   - Gives user "Retry" button to troubleshoot
   - **Code Location**: [src/lib/api/otpClient.ts](src/lib/api/otpClient.ts) - All fetch methods respect mock mode

### 6. **Dashboard API Badge Enhancement**
   - Shows base URL clearly
   - Turns amber with warning if connected to wrong endpoint
   - Tooltip shows full warning message
   - **Code Location**: [src/components/otp/dashboard-layout.tsx](src/components/otp/dashboard-layout.tsx) - API status badge

## Key Changes

| File | Change |
|------|--------|
| [src/lib/api/otpClient.ts](src/lib/api/otpClient.ts) | Added OpenAPI types, endpoint detection, base URL validation, improved error messages |
| [src/components/otp/input-panel.tsx](src/components/otp/input-panel.tsx) | Added endpoint detection logic, base URL warning display, better error UI states |
| [src/components/otp/dashboard-layout.tsx](src/components/otp/dashboard-layout.tsx) | Enhanced API badge to show base URL warning |

## Behavior Flow

```
On App Load:
1. OTPClient constructor checks if base URL is ERPNext → shows warning if true
2. InputPanel triggers detectSalesOrdersEndpoint() → fetches openapi.json
3. If endpoint exists → enables Sales Order picker + loads list
4. If endpoint missing (404) → shows warning, keeps manual fallback enabled
5. If API error → shows error with full URL + retry button

User selects Sales Order mode:
- If list available → shows combobox with loaded orders
- If list empty → shows info + manual input
- If API failed → shows error with retry + manual input
- If endpoint missing → shows warning + manual input
```

## Testing Recommendations

1. **Test with wrong base URL (port 8000)**:
   - Set `NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000`
   - Should show amber badge and warning message

2. **Test with endpoint not available**:
   - Respond with 404 to `/openapi.json` or without `/otp/sales-orders` in spec
   - Should show warning banner and allow manual input

3. **Test with API error**:
   - Mock 500 error on `/otp/sales-orders`
   - Should show error with full URL and retry button

4. **Test with empty list**:
   - Mock 200 with `sales_orders: []`
   - Should show info banner and allow manual input

5. **Test mock mode disabled**:
   - Set `NEXT_PUBLIC_MOCK_MODE=false`
   - Kill backend
   - Should show actual network error, not mock data

## No Breaking Changes
- All existing APIs backward compatible
- New OpenAPI detection is non-blocking (fails gracefully)
- Existing mock mode still works when enabled
- All error states allow manual input fallback
