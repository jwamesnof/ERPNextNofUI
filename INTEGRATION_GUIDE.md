# ERPNextNofUI - Frontend Integration Guide

## Overview

**ERPNextNofUI** is a modern Next.js + TypeScript frontend for the **Order Promise Engine (OTP)** skill. It communicates exclusively with the **ERPNextNof** backend via REST APIs, which in turn integrates with ERPNext.

### Architecture

```
┌─────────────────────────┐
│  ERPNextNofUI (Frontend) │  ← You are here
│  (Next.js + React)      │
└────────────┬────────────┘
             │ HTTP REST (port 8001)
             ↓
┌─────────────────────────┐
│   ERPNextNof (Backend)  │
│   (FastAPI + Python)    │
└────────────┬────────────┘
             │ REST API
             ↓
┌─────────────────────────┐
│   ERPNext (ERP System)  │
│   (Document DB)         │
└─────────────────────────┘
```

**Key Rule**: Frontend NEVER talks directly to ERPNext. All communication goes through the backend.

---

## Setup

### Prerequisites

- Node.js 18+ with npm
- ERPNextNof backend running on port 8001
- (Optional) ERPNext instance for real mode testing

### Installation

```bash
cd erpnextnofui

# Install dependencies
npm install

# Set environment variables (see below)
cp .env.example .env.local  # or create manually

# Start development server
npm run dev
```

The frontend will be available at `http://localhost:3000`

---

## Environment Variables

Create a `.env.local` file in the project root:

```dotenv
# Backend API Configuration
NEXT_PUBLIC_API_BASE_URL=http://localhost:8001

# Mock Mode - Set to 'true' to use local demo data instead of backend
# Useful for demos when backend/ERPNext is unavailable
NEXT_PUBLIC_MOCK_MODE=true
```

### Variable Explanation

| Variable | Required | Default | Notes |
|----------|----------|---------|-------|
| `NEXT_PUBLIC_API_BASE_URL` | Yes | `http://localhost:8001` | Must match backend URL/port. Use `NEXT_PUBLIC_` prefix for client-side access. |
| `NEXT_PUBLIC_MOCK_MODE` | No | `true` | Set to `false` to use real backend. When `true`, uses local JSON fixtures. |

---

## API Endpoints

The frontend calls these backend endpoints (on ERPNextNof):

### 1. POST `/otp/promise` - Evaluate Promise

**Request:**
```typescript
{
  customer: string,           // e.g., "Big Corp"
  items: [
    {
      item_code: string,      // e.g., "SKU001"
      qty: number,            // e.g., 20
      warehouse: string       // e.g., "Stores - SD"
    }
  ],
  desired_date?: string,      // Optional desired delivery (YYYY-MM-DD)
  rules?: {                   // Optional business rules
    no_weekends: boolean,
    cutoff_time: string,      // HH:MM format
    timezone: string,         // e.g., "UTC"
    lead_time_buffer_days: number,
    processing_lead_time_days: number,
    desired_date_mode: "LATEST_ACCEPTABLE" | "NO_EARLY_DELIVERY" | "STRICT_FAIL"
  }
}
```

**Response:**
```typescript
{
  status: "OK" | "CANNOT_FULFILL" | "CANNOT_PROMISE_RELIABLY",
  promise_date: string,       // YYYY-MM-DD format
  promise_date_raw?: string,  // Before adjustments
  confidence: "HIGH" | "MEDIUM" | "LOW",
  on_time: boolean,
  can_fulfill: boolean,
  plan: [                     // Fulfillment plan
    {
      item_code: string,
      qty_required: number,
      fulfillment: [
        {
          source: "stock" | "purchase_order",
          qty: number,
          available_date: string,
          ship_ready_date: string,
          warehouse: string,
          po_id?: string
        }
      ],
      shortage: number
    }
  ],
  reasons: string[],          // Human-readable explanation
  blockers: string[],         // Why it cannot be fulfilled
  options: any[],             // Alternative options
  error?: string,
  error_detail?: string
}
```

### 2. POST `/otp/apply` - Apply Promise to Sales Order

**Request:**
```typescript
{
  sales_order_id: string,     // e.g., "SO-2026-00001"
  promise_date: string,       // YYYY-MM-DD
  confidence: Confidence,
  action?: "comment" | "custom_field" | "both",
  comment_text?: string
}
```

**Response:**
```typescript
{
  status: "success" | "error",
  sales_order_id: string,
  actions_taken: string[],
  erpnext_response?: Record<string, any>,
  error?: string
}
```

### 3. GET `/health` - Health Check

**Response:**
```typescript
{
  status: "healthy" | "degraded" | "unhealthy",
  version: string,
  erpnext_connected: boolean,
  message: string
}
```

---

## Mock Mode

When `NEXT_PUBLIC_MOCK_MODE=true`, the frontend uses **local JSON fixtures** that exactly match backend responses.

### Benefits

- ✅ Demo the UI without backend/ERPNext
- ✅ Consistent reproducible results
- ✅ No network latency
- ✅ Perfect for presentations

### Mock Data Files

- **Mock Sales Orders**: [src/lib/api/mockData.ts](src/lib/api/mockData.ts)
- **Mock Responses**: Include multiple scenarios (success, partial stock, cannot fulfill, strict fail)

### Switching Modes

```dotenv
# Mock Mode (Demo)
NEXT_PUBLIC_MOCK_MODE=true

# Real Mode (Backend)
NEXT_PUBLIC_MOCK_MODE=false
```

Restart the dev server after changing this variable.

---

## Project Structure

```
src/
├── app/                      # Next.js app directory
│   ├── layout.tsx           # Root layout with providers
│   ├── page.tsx             # Home page
│   ├── globals.css          # Global styles
│   └── providers.tsx        # React Query provider
├── components/
│   ├── layout/
│   │   ├── sidebar.tsx
│   │   ├── dashboard.tsx
│   │   └── page-container.tsx
│   ├── promise/
│   │   ├── promise-calculator.tsx   # Main calculation component
│   │   ├── input-panel.tsx          # Form inputs
│   │   ├── results-panel.tsx        # Results display
│   │   ├── reasons-panel.tsx        # Explanation of promise
│   │   ├── supply-timeline.tsx      # Supply fulfillment timeline
│   │   ├── apply-promise-button.tsx # Apply to SO button
│   │   ├── status-banner.tsx        # Error/warning display
│   │   └── customer-message-panel.tsx # Customer-facing message
│   └── ui/
│       ├── badge.tsx
│       └── copy-button.tsx
├── hooks/
│   └── usePromise.ts                # React Query hooks for API
├── lib/
│   └── api/
│       ├── client.ts                # API client
│       ├── types.ts                 # TypeScript interfaces
│       └── mockData.ts              # Mock fixtures
└── types/
    └── promise.ts                   # Re-exported types
```

---

## Development

### Start Dev Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Build for Production

```bash
npm run build
npm start
```

### Linting

```bash
npm run lint
```

---

## API Client Usage

The API client is located at `src/lib/api/client.ts` and provides a clean interface:

```typescript
import { apiClient } from "@/lib/api/client"

// Evaluate a promise
const response = await apiClient.evaluatePromise({
  customer: "Big Corp",
  items: [{ item_code: "SKU001", qty: 20, warehouse: "Stores - SD" }],
  desired_date: "2026-02-10",
  rules: {
    desired_date_mode: "LATEST_ACCEPTABLE"
  }
})

// Apply the promise
await apiClient.applyPromise({
  sales_order_id: "SO-2026-00001",
  promise_date: "2026-02-10",
  confidence: "HIGH"
})

// Check backend health
const health = await apiClient.checkHealth()
```

---

## React Hooks

Use these custom hooks in components:

```typescript
import {
  useSalesOrders,
  useEvaluatePromise,
  useApplyPromise,
  useHealthCheck
} from "@/hooks/usePromise"

// In your component:
const { data: salesOrders, isLoading } = useSalesOrders()
const evaluateMutation = useEvaluatePromise()

const handleEvaluate = async (request) => {
  try {
    const result = await evaluateMutation.mutateAsync(request)
    // Use result
  } catch (error) {
    // Handle error
  }
}
```

---

## Running with Backend

### Option 1: Backend Running Locally

```bash
# Terminal 1: Backend (ERPNextNof)
cd ../ERPNextNof
python -m uvicorn src.main:app --reload --port 8001

# Terminal 2: Frontend (ERPNextNofUI)
cd ../ERPNextNofUI/erpnextnofui
npm run dev
```

Update `.env.local`:
```dotenv
NEXT_PUBLIC_API_BASE_URL=http://localhost:8001
NEXT_PUBLIC_MOCK_MODE=false
```

### Option 2: Backend Running Remotely

```dotenv
NEXT_PUBLIC_API_BASE_URL=https://otp-backend.example.com
NEXT_PUBLIC_MOCK_MODE=false
```

---

## Data Flow Example

### Scenario: User Evaluates a Promise

1. **User Input** → InputPanel collects Sales Order + Desired Date
2. **API Call** → `evaluateMutation.mutateAsync()` sends to `/otp/promise`
3. **Backend Processing** → ERPNextNof queries ERPNext, runs OTP logic
4. **Response** → Backend returns promise date + confidence + fulfillment plan
5. **UI Renders** → ResultsPanel, ReasonsPanel, SupplyTimeline display results
6. **User Action** → Clicks "Apply to Sales Order"
7. **Apply Call** → `applyPromise()` sends to `/otp/apply`
8. **Backend Updates** → ERPNextNof creates comment/updates SO in ERPNext
9. **Confirmation** → UI shows success banner

---

## Troubleshooting

### Backend Not Found (Cannot Reach http://localhost:8001)

1. Check backend is running: `curl http://localhost:8001/health`
2. If not running, start it in the ERPNextNof repo
3. Verify `NEXT_PUBLIC_API_BASE_URL` is correct
4. Check firewall/network isolation

### CORS Errors

- Backend has CORS enabled for all origins (`*`)
- If you see CORS errors, check network tab in DevTools
- Ensure `Content-Type: application/json` is set (client.ts does this)

### Mock Mode Not Working

- Verify `NEXT_PUBLIC_MOCK_MODE=true` in `.env.local`
- Restart dev server after changing env vars
- Check console for `[OTP Client] Mock mode ENABLED` message

### Type Errors in Components

- Run `npm run lint` to catch TypeScript errors
- Verify imports use types from `@/lib/api/types`
- Check that API responses match the TypeScript interfaces

---

## Testing

Run the test suite:

```bash
npm test
```

Tests include:
- Unit tests for API client
- Component tests for Promise Calculator
- Integration tests for full flow

---

## Performance

- **React Query** handles caching and refetching
- Sales Orders are cached for 5 minutes
- Health checks are cached for 30 seconds
- Mock mode has simulated delays to mimic real network latency

---

## Security Notes

- ✅ No credentials stored in frontend
- ✅ All sensitive data handled by backend
- ✅ Frontend never talks directly to ERPNext
- ✅ API calls use HTTPS in production
- ⚠️ Set `NEXT_PUBLIC_MOCK_MODE=false` in production

---

## Next Steps

1. **Start the frontend**: `npm run dev`
2. **Start the backend** (ERPNextNof on port 8001)
3. **Set `NEXT_PUBLIC_MOCK_MODE=false`** in `.env.local`
4. **Visit** [http://localhost:3000](http://localhost:3000)
5. **Select a Sales Order** → Click "Evaluate Promise"
6. **Review the results** → Click "Apply to Sales Order"

---

## Support

For issues or questions:

1. Check the [ERPNextNof Backend README](../ERPNextNof/README.md)
2. Review the [Architecture Documentation](./ARCHITECTURE.md)
3. Check backend logs: `ERPNextNof/`
4. Check browser console: DevTools → Console

---

## Related Projects

- **ERPNextNof** (Backend): `../ERPNextNof/`
- **ERPNext** (ERP System): Documentation at `https://docs.erpnext.com/`

