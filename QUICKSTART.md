# Quick Start: ERPNextNof Order Promise Engine

## 🚀 Get Running in 5 Minutes

### Option A: Demo Mode (No Backend Required)

Perfect for exploring the UI without any infrastructure:

```bash
# 1. Install dependencies
npm install

# 2. Start development server
npm run dev

# 3. Open browser
open http://localhost:3000
```

✅ Mock mode is **enabled by default** (.env.local: `NEXT_PUBLIC_MOCK_MODE=true`)

You'll see realistic demo data for Sales Orders and promise calculations.

---

### Option B: With Backend (Recommended for Integration Testing)

Requires ERPNextNof running locally:

#### Terminal 1: Start Backend

```bash
# Navigate to backend
cd ../ERPNextNof

# Install Python dependencies
pip install -r requirements.txt

# Start backend (runs on port 8001)
python -m uvicorn src.main:app --reload --port 8001
```

#### Terminal 2: Start Frontend

```bash
# Navigate to frontend
cd ../ERPNextNofUI/erpnextnofui

# Install dependencies
npm install

# Update .env.local to disable mock mode
cat > .env.local << 'EOF'
NEXT_PUBLIC_API_BASE_URL=http://localhost:8001
NEXT_PUBLIC_MOCK_MODE=false
EOF

# Start dev server
npm run dev
```

#### Terminal 3: Start ERPNext (Optional)

```bash
# If you have ERPNext running locally:
# Visit http://localhost:8080 in another browser tab

# Backend will query ERPNext for real order/inventory data
```

#### Open browser
```
http://localhost:3000
```

---

## 📋 What You Can Do

### 1. **Evaluate Promise**
- Select a Sales Order
- Optionally set a desired delivery date
- Click "Evaluate Promise"
- See calculated delivery date with confidence level
- View fulfillment plan and supply timeline

### 2. **Apply to Sales Order**
- After evaluation, click "Apply to Sales Order"
- In real mode: Creates comment in ERPNext Sales Order
- In mock mode: Shows success confirmation

### 3. **Understand the Results**
- **Promise Date**: When we can deliver
- **Confidence**: HIGH/MEDIUM/LOW based on supply certainty
- **Plan**: Which items come from stock vs purchase orders
- **Timeline**: Visual supply chain timeline
- **Reasons**: Why that specific date was chosen

---

## ⚙️ Environment Variables

Located in `.env.local`:

```dotenv
# Backend URL (default: localhost:8001)
NEXT_PUBLIC_API_BASE_URL=http://localhost:8001

# Use mock demo data (default: true for demos, false for integration)
NEXT_PUBLIC_MOCK_MODE=true
```

### Changing Between Modes

**Mock Mode (Demo):**
```bash
echo 'NEXT_PUBLIC_MOCK_MODE=true' >> .env.local
npm run dev  # Restart for changes to take effect
```

**Real Mode (Backend):**
```bash
echo 'NEXT_PUBLIC_MOCK_MODE=false' >> .env.local
# Ensure backend is running first!
npm run dev
```

---

## 🛠 Development

### Start Dev Server

```bash
npm run dev
```

Runs on `http://localhost:3000` with hot reload.

### Build for Production

```bash
npm run build
npm start
```

### Run Linter

```bash
npm run lint
```

---

## 🐛 Troubleshooting

### "Cannot reach backend"

1. Verify backend is running:
   ```bash
   curl http://localhost:8001/health
   ```

2. Check `.env.local` has correct URL:
   ```bash
   cat .env.local
   ```

3. If using mock mode, this error won't appear (mocks are built-in)

### Mock Mode Not Working

1. Restart dev server after changing .env.local
2. Clear browser cache (Cmd+Shift+Delete or Ctrl+Shift+Delete)
3. Check console: Should show `[OTP Client] Mock mode ENABLED`

### Buttons Not Responding

1. Check browser console for errors (F12)
2. Verify React Query is working: Open DevTools → Application → Cookies/Storage
3. Try hard refresh (Cmd+Shift+R or Ctrl+Shift+R)

---

## 📚 Documentation

- **[INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md)** - Complete integration setup
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - System architecture and data flow
- **Backend Docs**: See `../ERPNextNof/FRONTEND_INTEGRATION.md`

---

## 🎯 Common Tasks

### Test with Different Scenarios

Mock mode includes multiple response scenarios:
- ✅ Full fulfillment from stock
- ⚠️ Partial stock + incoming purchase orders
- ❌ Cannot fulfill (insufficient stock)
- 🚫 Strict fail (reliability requirement not met)

Each time you evaluate in mock mode, you get a random scenario.

### Examine API Calls

1. Open DevTools (F12)
2. Go to Console tab
3. Look for `[OTP Client]` messages showing request/response
4. Check Network tab to see HTTP calls

### Access Swagger UI (Backend Only)

When backend is running:
```
http://localhost:8001/docs
```

Interactive API documentation with try-it-out feature.

---

## 🚀 Next Steps

1. ✅ Run `npm run dev` to start
2. ✅ Explore the UI with mock mode
3. ✅ Read [INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md) for detailed setup
4. ✅ Start backend on port 8001 for real integration
5. ✅ Set `NEXT_PUBLIC_MOCK_MODE=false` to use real data

---

## 📞 Support

**Issue** | **Solution**
---------|----------
Backend connection error | Ensure backend runs on 8001, check NEXT_PUBLIC_API_BASE_URL in .env.local
Mock mode not showing data | Restart dev server after .env.local change, clear cache
TypeError in components | Verify imports use @/lib/api/types, run npm run lint
Slow responses | Check backend logs, may need to optimize ERPNext queries

---

## Architecture at a Glance

```
You (Browser)
     ↓
Frontend (React/TypeScript)
     ↓ HTTP REST
Backend (FastAPI/Python)
     ↓ ERP API
ERPNext (or Mock CSV)
```

**Key Rule**: Frontend only talks to Backend. Backend talks to ERPNext.

---

Enjoy! 🎉
