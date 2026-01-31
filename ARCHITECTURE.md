# Architecture: ERPNextNof Order Promise Engine

## System Overview

The Order Promise Engine (OTP) is a distributed system with clear separation of concerns:

```
┌──────────────────────────────────────────────────────────────┐
│                     USER INTERFACE LAYER                      │
│              ERPNextNofUI (Next.js + React)                   │
│  - Form inputs for Sales Orders & delivery preferences       │
│  - Real-time results visualization                           │
│  - Mock mode for demo without backend                        │
└────────────────────────┬─────────────────────────────────────┘
                         │ HTTP/REST on port 8001
                         ↓
┌──────────────────────────────────────────────────────────────┐
│                     API GATEWAY LAYER                         │
│                                                               │
│              ERPNextNof (FastAPI + Python)                    │
│  - POST /otp/promise    → Evaluate delivery promise          │
│  - POST /otp/apply      → Apply promise to Sales Order       │
│  - POST /otp/procurement-suggest → Create Material Request   │
│  - GET /health          → Service health check               │
└────────────────────────┬─────────────────────────────────────┘
                         │ REST API
                         ↓
┌──────────────────────────────────────────────────────────────┐
│                   BUSINESS LOGIC LAYER                        │
│                                                               │
│              OTP Services (Python)                            │
│  - promise_service.py   → Promise calculation logic           │
│  - apply_service.py     → Sales Order updates                │
│  - stock_service.py     → Inventory queries                  │
│  - mock_supply_service.py → Mock data (for demo mode)        │
└────────────────────────┬─────────────────────────────────────┘
                         │ ERP API
                         ↓
┌──────────────────────────────────────────────────────────────┐
│                   DATA & INTEGRATION LAYER                    │
│                                                               │
│  ERPNext (Document Database)                                 │
│  - Sales Orders, Items, Stock Levels, Purchase Orders       │
│  - (Or CSV mock data for testing)                           │
└──────────────────────────────────────────────────────────────┘
```

---

## Communication Protocol

### Frontend → Backend

**All requests go through HTTP REST API**

```
Client (Browser)
    │
    ├─ Request: POST /otp/promise
    │   Body: { customer, items, desired_date, rules }
    │   Headers: Content-Type: application/json
    │
    ├─ Response: 200 OK
    │   Body: { status, promise_date, confidence, plan, reasons }
    │
    └─ Error Handling:
        - 400 Bad Request → Invalid input
        - 403 Forbidden → Permission denied
        - 500 Server Error → Backend error
```

### Backend → ERPNext

**Backend is single source of truth for ERP integration**

- Backend owns all ERPNext API credentials
- Frontend never sees ERPNext URLs or credentials
- Backend can fail-over to mock data if ERPNext is unavailable

---

## Component Responsibilities

### Frontend (ERPNextNofUI)

**Responsibilities:**
- Collect user input (Sales Order, delivery date preferences)
- Validate form data locally
- Call backend APIs with proper error handling
- Display results with visual feedback
- Allow user to apply promise to Sales Order

**Does NOT:**
- Query ERPNext directly
- Store sensitive data (API keys, etc.)
- Implement OTP business logic
- Access database directly

### Backend (ERPNextNof)

**Responsibilities:**
- Validate and authenticate requests
- Query ERPNext for current inventory/supply
- Run OTP calculation algorithm
- Update Sales Orders when promise is applied
- Handle errors gracefully
- Provide mock mode for demos

**Does NOT:**
- Trust frontend calculations
- Store user sessions on frontend
- Expose ERP data structure directly

---

## Data Flow Patterns

### Pattern 1: Evaluate Promise

```
Frontend                          Backend                    ERPNext
   │                               │                           │
   ├─ POST /otp/promise ──────────→│                           │
   │  {                            │                           │
   │    customer: "Big Corp"       │                           │
   │    items: [{code, qty, wh}]   │                           │
   │    desired_date: "2026-02-10" │                           │
   │  }                            │                           │
   │                               ├─ Query stock ────────────→│
   │                               │                           │
   │                               │←─ Inventory levels ──────┤
   │                               │                           │
   │                               ├─ Query POs ──────────────→│
   │                               │                           │
   │                               │←─ Expected deliveries ──┤
   │                               │                           │
   │                               ├─ Calculate Promise ────┐  │
   │                               │ (logic: fulfillment,   │  │
   │                               │  adjust for weekends,  │  │
   │                               │  apply lead times, etc)│  │
   │                               │                       ┘  │
   │←────── 200 OK ──────────────┤
   │ {                            │
   │   status: "OK"               │
   │   promise_date: "2026-02-10" │
   │   confidence: "HIGH"         │
   │   plan: [...]                │
   │   reasons: [...]             │
   │ }                            │
   │                              │
```

### Pattern 2: Apply Promise

```
Frontend                          Backend                    ERPNext
   │                               │                           │
   ├─ POST /otp/apply ───────────→│                           │
   │  {                            │                           │
   │    sales_order_id: "SO-001"   │                           │
   │    promise_date: "2026-02-10" │                           │
   │  }                            │                           │
   │                               ├─ Validate SO ────────────→│
   │                               │                           │
   │                               │←─ SO details ───────────┤
   │                               │                           │
   │                               ├─ Add comment/update ─────→│
   │                               │  custom field             │
   │                               │                           │
   │                               │←─ OK ───────────────────┤
   │←────── 200 OK ──────────────┤
   │ {                            │
   │   status: "success"          │
   │   actions_taken: [...]       │
   │ }                            │
   │                              │
```

### Pattern 3: Mock Mode (No Backend)

```
Frontend                    Mock Data Store
   │                              │
   ├─ POST /otp/promise ─────────→│
   │                              │
   │←────── 200 OK ──────────────┤
   │ {                            │
   │   Predefined fixture data    │
   │   (matches real response)    │
   │ }                            │
   │                              │
   └─ No backend/ERPNext calls   │
     (Useful for demos)
```

---

## Data Models

### Promise Evaluation Request

```typescript
{
  customer: string,                    // "Big Corp"
  items: Array<{
    item_code: string,                 // "SKU001"
    qty: number,                       // 20
    warehouse: string                  // "Stores - SD"
  }>,
  desired_date?: string,               // "2026-02-10" (optional)
  rules?: {
    no_weekends: boolean,              // Skip weekends?
    cutoff_time: string,               // "14:00" (daily cutoff)
    timezone: string,                  // "UTC"
    lead_time_buffer_days: number,     // 1
    processing_lead_time_days: number, // 1
    desired_date_mode: "LATEST_ACCEPTABLE" | "NO_EARLY_DELIVERY" | "STRICT_FAIL"
  }
}
```

### Promise Evaluation Response

```typescript
{
  status: "OK" | "CANNOT_FULFILL" | "CANNOT_PROMISE_RELIABLY",
  promise_date: string,                   // "2026-02-10"
  promise_date_raw?: string,              // Before adjustments
  confidence: "HIGH" | "MEDIUM" | "LOW",
  on_time: boolean,
  can_fulfill: boolean,
  
  plan: Array<{
    item_code: string,
    qty_required: number,
    fulfillment: Array<{
      source: "stock" | "purchase_order",
      qty: number,
      available_date: string,
      ship_ready_date: string,
      warehouse: string,
      po_id?: string
    }>,
    shortage: number
  }>,
  
  reasons: string[],        // ["Sufficient stock", "Can fulfill by..."]
  blockers: string[],       // ["Stock insufficient", "No POs"]
  options: any[],           // Alternative options
  
  error?: string,
  error_detail?: string
}
```

---

## Decision Points in OTP Logic

The backend evaluates promises using this decision tree:

```
Can we fulfill by desired_date?
├─ YES, with high confidence
│   └─ status = "OK", confidence = "HIGH"
│
├─ YES, with medium confidence
│   └─ status = "OK", confidence = "MEDIUM"
│
├─ YES, but needs adjustment (weekend, lead time)
│   ├─ desired_date_mode = "LATEST_ACCEPTABLE"?
│   │   └─ Adjust to first available → status = "OK"
│   │
│   ├─ desired_date_mode = "NO_EARLY_DELIVERY"?
│   │   └─ Cannot promise before customer wants → status = "CANNOT_PROMISE_RELIABLY"
│   │
│   └─ desired_date_mode = "STRICT_FAIL"?
│       └─ Cannot meet exactly → status = "CANNOT_PROMISE_RELIABLY"
│
├─ NO, partial fulfillment possible
│   └─ status = "CANNOT_FULFILL", show options for split shipment
│
└─ NO, cannot fulfill at all
    └─ status = "CANNOT_FULFILL", suggest procurement alternatives
```

---

## Error Handling Strategy

### Frontend

1. **Network Errors** → Show "Backend unreachable, using mock data" banner
2. **API Errors (4xx/5xx)** → Extract error message from response, display to user
3. **Validation Errors** → Highlight form field, show inline message
4. **Permission Errors (403)** → Show "You don't have permission for this item"

### Backend

1. **Validation Errors** → Return 400 with clear message
2. **Permission Errors** → Return 403 with indication
3. **Business Logic Errors** → Return 200 with error fields in response
4. **Unexpected Errors** → Return 500, log stack trace

### Never Silent Failures

- Always display errors to user
- Always log errors for debugging
- Always suggest next steps (retry, contact support, etc.)

---

## Mock Mode Strategy

### When to Use Mock Mode

✅ **Use Mock Mode When:**
- Developing UI without backend running
- Demoing to clients (reliable, no latency)
- Testing with specific scenarios (partial stock, cannot fulfill, etc.)
- ERPNext is down but demo must go on

❌ **Don't Use Mock Mode When:**
- In production
- Integrating with real ERPNext data
- Testing end-to-end with actual orders

### Mock Data Matching

Mock responses **must exactly match** backend response schema:

```typescript
// ✅ CORRECT: Matches backend schema exactly
{
  status: "OK",
  promise_date: "2026-02-10",
  confidence: "HIGH",
  plan: [{...}],
  reasons: [...],
  ...
}

// ❌ WRONG: Different structure confuses UI
{
  success: true,
  result: {...}  // Different shape!
}
```

---

## Testing Strategy

### Unit Tests (Frontend)

```typescript
// Test API client handles errors gracefully
it('should return error response on 403', async () => {
  // Mock fetch to return 403
  const result = await apiClient.evaluatePromise(request)
  expect(result.status).toBe('CANNOT_PROMISE_RELIABLY')
})
```

### Integration Tests (Frontend + Mock Backend)

```typescript
// Test full flow with mock data
it('should calculate and apply promise in mock mode', async () => {
  // Enable mock mode
  // Call evaluatePromise
  // Verify response structure
  // Call applyPromise
  // Verify success
})
```

### E2E Tests (With Real Backend)

```typescript
// Test full flow with real ERPNextNof
it('should evaluate promise against real backend', async () => {
  const response = await apiClient.evaluatePromise({
    customer: 'Test Customer',
    items: [{...}]
  })
  expect(response.status).toMatch(/OK|CANNOT_/)
})
```

---

## Performance Considerations

### Frontend

- **React Query Caching**: Sales orders cached for 5 min
- **Lazy Loading**: Components load data on demand
- **Memoization**: Prevent unnecessary re-renders

### Backend

- **Request Validation**: Fast-fail on invalid input
- **Batch Queries**: Fetch multiple stock levels in one call
- **Caching**: Cache supply data for repeated queries
- **Async Operations**: Non-blocking for long operations

### Network

- **Pagination**: For large result sets (not yet implemented)
- **Compression**: GZIP responses
- **CDN**: Cache static assets (frontend build)

---

## Security Model

### Frontend

```
┌─ No sensitive data stored
├─ No API keys in code
├─ No direct database access
└─ All requests go through backend
```

### Backend

```
┌─ API key management
├─ Request validation
├─ Rate limiting (not yet implemented)
├─ Audit logging (not yet implemented)
└─ ERPNext authentication
```

### Data in Transit

- ✅ HTTPS in production
- ✅ CORS headers configured
- ✅ Credentials never exposed
- ✅ Sanitize all user input

---

## Deployment Architecture

### Development

```
Developer Laptop
├─ Frontend: localhost:3000
├─ Backend: localhost:8001
└─ ERPNext: localhost:8080
```

### Production

```
Production Infrastructure
├─ Frontend (CDN + Static)
│   └─ Cloudfront / Nginx
├─ Backend (Auto-scaling)
│   └─ Docker + Kubernetes / ECS
└─ ERPNext (Separate deployment)
    └─ Managed service / On-premises
```

---

## Future Improvements

1. **Request Logging**: Audit trail of all promises calculated
2. **Rate Limiting**: Prevent abuse of promise evaluation
3. **Pagination**: Handle large lists of sales orders
4. **WebSocket**: Real-time updates for long-running calculations
5. **Batch API**: Evaluate multiple SO at once
6. **Caching**: Cache promise calculations by customer + items
7. **A/B Testing**: Test different business rules

---

## References

- [Frontend Integration Guide](./INTEGRATION_GUIDE.md)
- [Backend Documentation](../ERPNextNof/README.md)
- [API Contract Types](./src/lib/api/types.ts)

