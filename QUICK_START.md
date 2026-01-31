# Quick Start: Order Promise Engine Integration

Get the full OTP system running in 5 minutes.

## Prerequisites

- **Node.js** 18+ (frontend)
- **Python** 3.9+ (backend)
- **ERPNext** (optional, can use mock mode)

---

## Option 1: Demo Mode (Fastest - 1 minute)

### Run frontend with mock data (no backend needed)

```bash
cd erpnextnofui

# Install dependencies (if not done)
npm install

# Ensure mock mode is enabled
cat .env.local
# Should show: NEXT_PUBLIC_MOCK_MODE=true

# Start dev server
npm run dev
```

**Visit**: [http://localhost:3000](http://localhost:3000)

**What to try:**
1. Select any Sales Order from dropdown
2. Click "Evaluate Promise"
3. See demo results appear
4. Click "Apply to Sales Order"
5. See success confirmation

**Demo Features:**
- ✅ No backend required
- ✅ Random realistic results
- ✅ Shows success/partial/cannot-fulfill scenarios
- ✅ Perfect for UI/UX demos

---

## Option 2: Local Backend Integration (3-5 minutes)

### Terminal 1: Start Backend

```bash
cd ../ERPNextNof

# Create virtual environment (first time only)
python -m venv venv
source venv/bin/activate  # Linux/Mac
# or: venv\Scripts\activate  # Windows

# Install dependencies
pip install -r requirements.txt

# Run backend
python -m uvicorn src.main:app --reload --port 8001
```

**Expected output:**
```
INFO:     Uvicorn running on http://0.0.0.0:8001
```

### Terminal 2: Start Frontend (Switch to Real Mode)

```bash
cd erpnextnofui

# Switch to real backend mode
cat > .env.local << EOF
NEXT_PUBLIC_API_BASE_URL=http://localhost:8001
NEXT_PUBLIC_MOCK_MODE=false
EOF

# Start frontend
npm run dev
```

### Test the Integration

1. **Check Backend Health**: `curl http://localhost:8001/health`
2. **Visit Frontend**: [http://localhost:3000](http://localhost:3000)
3. **Evaluate Promise**:
   - Select Sales Order
   - Click "Evaluate Promise"
   - Backend calculates using mock CSV data
4. **Apply Promise**:
   - Click "Apply to Sales Order"
   - See success response

---

## Option 3: With Real ERPNext (5-10 minutes)

### Prerequisites
- ERPNext running (e.g., localhost:8080)
- Backend configured with ERPNext credentials

### Terminal 1: Start Backend (with ERPNext)

```bash
cd ../ERPNextNof

# Configure ERPNext connection in .env
cat > .env << EOF
ERPNEXT_BASE_URL=http://localhost:8080
ERPNEXT_API_KEY=your_api_key
ERPNEXT_API_SECRET=your_api_secret
USE_MOCK_SUPPLY=false
EOF

# Run backend
python -m uvicorn src.main:app --reload --port 8001
```

### Terminal 2: Start Frontend

```bash
cd erpnextnofui

# Use real backend
cat > .env.local << EOF
NEXT_PUBLIC_API_BASE_URL=http://localhost:8001
NEXT_PUBLIC_MOCK_MODE=false
EOF

npm run dev
```

### Verify

1. Backend should connect to ERPNext successfully
2. Sales Orders dropdown populated from ERPNext
3. Promises calculated using real stock data
4. Applied promises create comments in ERPNext

---

## API Testing with curl

### Health Check

```bash
curl http://localhost:8001/health
```

### Evaluate Promise

```bash
curl -X POST http://localhost:8001/otp/promise \
  -H "Content-Type: application/json" \
  -d '{
    "customer": "Big Corp",
    "items": [
      {"item_code": "SKU001", "qty": 20, "warehouse": "Stores - SD"}
    ],
    "desired_date": "2026-02-10",
    "rules": {
      "desired_date_mode": "LATEST_ACCEPTABLE"
    }
  }'
```

### Apply Promise

```bash
curl -X POST http://localhost:8001/otp/apply \
  -H "Content-Type: application/json" \
  -d '{
    "sales_order_id": "SO-2026-00001",
    "promise_date": "2026-02-10",
    "confidence": "HIGH"
  }'
```

---

## Troubleshooting

### Frontend shows "Backend unreachable"

```bash
# Check backend is running
curl http://localhost:8001/health

# If not running, start it in terminal 1
cd ../ERPNextNof
python -m uvicorn src.main:app --reload --port 8001
```

### Port 3000 already in use

```bash
# Use different port
npm run dev -- -p 3001
```

### Port 8001 already in use

```bash
# Use different port
python -m uvicorn src.main:app --reload --port 8002

# Update frontend .env.local
NEXT_PUBLIC_API_BASE_URL=http://localhost:8002
```

### CORS errors in browser console

- Backend CORS is enabled for all origins
- Check Network tab in DevTools
- Verify `NEXT_PUBLIC_API_BASE_URL` is correct
- Restart frontend after changing env vars

### ERPNext connection failing

- Verify ERPNext is running
- Check ERPNext credentials in `.env`
- Ensure API key has necessary permissions
- Check backend logs for detailed error

---

## What's Happening

### Architecture Flow

```
┌─ You click "Evaluate Promise" in UI
│
├─ Frontend sends HTTP POST to backend
│  URL: /otp/promise
│  Body: { customer, items, desired_date, ... }
│
├─ Backend receives request
│  ├─ Validates input
│  ├─ Queries ERPNext (or uses mock CSV)
│  ├─ Runs OTP calculation algorithm
│  └─ Returns promise date + confidence + reasons
│
├─ Frontend receives response
│  ├─ Displays promise date (big number)
│  ├─ Shows confidence badge
│  ├─ Lists reasons why this date
│  └─ Shows supply timeline
│
└─ You click "Apply to Sales Order"
   ├─ Frontend sends HTTP POST to backend
   │  URL: /otp/apply
   ├─ Backend adds comment to Sales Order
   ├─ Backend updates custom fields in ERPNext
   └─ Shows success banner
```

---

## Next Steps

1. **Play with Mock Mode**: Understand the UI/UX
2. **Start Backend**: Test with real calculation engine
3. **Connect ERPNext**: See real stock data
4. **Customize**: Modify business rules in backend
5. **Deploy**: Push to production environment

---

## Documentation

For detailed information, see:

- **Frontend Setup**: [INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md)
- **Architecture**: [ARCHITECTURE.md](./ARCHITECTURE.md)
- **Backend Setup**: [../ERPNextNof/FRONTEND_INTEGRATION.md](../ERPNextNof/FRONTEND_INTEGRATION.md)
- **API Reference**: [../ERPNextNof/API_CONTRACT.md](../ERPNextNof/API_CONTRACT.md)

---

## Key Files

```
ERPNextNofUI/
├── .env.local                    ← Your environment config (gitignored)
├── .env.example                  ← Template for .env.local
├── INTEGRATION_GUIDE.md          ← Complete frontend docs
├── ARCHITECTURE.md               ← System design
└── src/lib/api/
    ├── client.ts                 ← API communication layer
    ├── types.ts                  ← TypeScript interfaces
    └── mockData.ts               ← Demo data fixtures

ERPNextNof/
├── src/main.py                   ← FastAPI app entry point
├── src/routes/otp.py             ← API endpoints
├── FRONTEND_INTEGRATION.md       ← Frontend developer guide
└── API_CONTRACT.md               ← API documentation
```

---

## Common Tasks

### Run frontend only (mock mode)
```bash
npm run dev
```

### Run backend only
```bash
python -m uvicorn src.main:app --reload --port 8001
```

### Run full system (backend + frontend)
```bash
# Terminal 1
cd ../ERPNextNof && python -m uvicorn src.main:app --reload --port 8001

# Terminal 2
npm run dev
```

### Build frontend for production
```bash
npm run build
npm start
```

### Run backend with ERPNext
```bash
# Set .env with ERPNext credentials
USE_MOCK_SUPPLY=false
# Then run backend
```

---

## Support

**Something not working?**

1. Check browser console (F12 → Console tab)
2. Check backend logs (terminal running backend)
3. Verify env variables: `cat .env.local`
4. Try mock mode: `NEXT_PUBLIC_MOCK_MODE=true`
5. Restart both frontend and backend

**More help:**
- See [INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md) for detailed troubleshooting
- Check [../ERPNextNof/FRONTEND_INTEGRATION.md](../ERPNextNof/FRONTEND_INTEGRATION.md) for backend issues
