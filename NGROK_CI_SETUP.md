# Running Tests via ngrok in GitHub Actions CI

## Problem Fixed
Tests were hanging indefinitely at the collection phase because:
- The GitHub workflow was trying to connect to a hardcoded ngrok URL
- If the ngrok tunnel wasn't running, tests would hang waiting for connection
- No connectivity check was performed before attempting to run tests
- Browser and Playwright had insufficient timeouts

## What Changed

### 1. **Workflow Updates** (`.github/workflows/test.yml`)
- ✅ Added `Verify ngrok URL connectivity` step before running tests
- ✅ Made `BASE_URL` configurable via `secrets.NGROK_URL` GitHub secret
- ✅ Falls back to hardcoded URL if secret not set
- ✅ Tests fail fast if ngrok URL is unreachable
- ✅ Added `--timeout=120` to pytest to prevent indefinite hangs

### 2. **Test Timeouts** (`pytest.ini`)
- ✅ Increased per-test timeout from 30s to 120s (accounts for ngrok network latency)
- ✅ Added `--timeout-method=thread` for reliable timeout handling
- ✅ Prevents tests from hanging indefinitely

### 3. **Better Diagnostics** (`tests/pages/base_page.py`)
- ✅ URL reachability check before navigation
- ✅ Detailed logging for each navigation step
- ✅ Increased navigation timeout from 60s to 90s
- ✅ Better ngrok warning page detection

### 4. **Browser Factory** (`tests/browser_factory.py`)
- ✅ Added explicit 60s timeout for browser launch
- ✅ Detailed logging for debugging
- ✅ Ignore HTTPS errors for ngrok certificates
- ✅ Better error messages on failure

### 5. **Page Object Model** (`tests/pages/promise_calculator_page.py`)
- ✅ URL verification respects `BASE_URL` environment variable
- ✅ Works with both localhost and ngrok URLs

## How to Set Up for CI

### Option 1: Use GitHub Secrets (Recommended)

1. **Create a static ngrok domain:**
   ```bash
   # On your local machine with ngrok installed
   ngrok config add-authtoken YOUR_AUTHTOKEN
   
   # Create a static domain in ngrok dashboard:
   # https://dashboard.ngrok.com/cloud-edge/domains
   # Example: my-erp-app.ngrok-free.app
   ```

2. **Add GitHub Secret:**
   - Go to your GitHub repo: **Settings → Secrets and variables → Actions**
   - Click **New repository secret**
   - Name: `NGROK_URL`
   - Value: `https://my-erp-app.ngrok-free.app` (your static ngrok domain)

3. **Start ngrok on your local machine:**
   ```bash
   ngrok http 3000 --url=my-erp-app.ngrok-free.app
   ```

4. **Push code and watch CI run:**
   - CI will automatically detect the secret and use it
   - Tests will fail fast if ngrok isn't running

### Option 2: Update Workflow Directly (For Testing)

Edit `.github/workflows/test.yml` line 55:
```yaml
BASE_URL: https://your-ngrok-url.ngrok-free.app
```

## Pre-Flight Checklist Before Running CI

- [ ] ngrok account created and authenticated
- [ ] Static ngrok domain created (e.g., `my-app.ngrok-free.app`)
- [ ] GitHub secret `NGROK_URL` set to your ngrok domain
- [ ] Local dev server running: `npm run dev` (on port 3000)
- [ ] ngrok tunnel active: `ngrok http 3000 --url=my-app.ngrok-free.app`
- [ ] Can reach ngrok URL in browser: visit your domain
- [ ] ngrok warning page dismissable (tests handle it automatically)

## Monitoring Test Execution

### View Live Logs:
- Go to GitHub repo → **Actions** tab
- Click the running workflow
- Check "Run Playwright tests with Allure" step for detailed logs

### key log indicators:
```
✓ URL {ngrok-url} is reachable              # Good: connectivity check passed
[NAVIGATE] Attempting to navigate to: ...  # Started test navigation
[SUCCESS] Navigated to ...                  # Test connected successfully
```

### Error Examples & Solutions:

**❌ `Failed to reach {url} after 5 attempts`**
- ngrok tunnel isn't running locally
- ngrok domain is incorrect or expired
- Network firewall blocking access

**❌ `timeout of 120s exceeded`**
- App is too slow even with higher timeout
- ngrok tunnel has high latency
- Need to optimize test performance

**❌ `Cannot reach baseURL`**
- Playwright has trouble connecting to ngrok
- Try adding `--ignore-https-errors` in config

## Local Testing with ngrok

Test locally before pushing to CI:

```bash
# Terminal 1: Start the app
cd c:/Users/NofJawamis/Desktop/ERPNextNofUI/erpnextnofui
npm run dev

# Terminal 2: Start ngrok tunnel
ngrok http 3000 --url=my-static-domain.ngrok-free.app

# Terminal 3: Run tests with ngrok URL
cd c:/Users/NofJawamis/Desktop/ERPNextNofUI/erpnextnofui
export BASE_URL=https://my-static-domain.ngrok-free.app
pytest tests/ -v --tb=short
```

## Troubleshooting

### Tests hang at "collecting..."
→ ngrok URL unreachable or wrong. Check:
- Is ngrok tunnel running locally?
- Is the static domain correct?
- Can you visit it in a browser?

### Tests timeout on first navigation
→ ngrok latency too high:
- Increase `timeout: 120` in pytest.ini if needed
- Check your internet connection
- Try from a different location

### Ngrok warning page not dismissed
→ Tests now handle this automatically, but if issues:
- Check browser logs for error messages
- Try increasing timeout in `_handle_ngrok_warning()`

## Files Modified

| File | Change |
|------|--------|
| [.github/workflows/test.yml](.github/workflows/test.yml) | Added connectivity check, made BASE_URL configurable |
| [pytest.ini](pytest.ini) | Increased timeouts to 120s |
| [tests/pages/base_page.py](tests/pages/base_page.py) | Added URL check, better logging |
| [tests/browser_factory.py](tests/browser_factory.py) | Added logging, timeouts, HTTPS error ignore |
| [tests/pages/promise_calculator_page.py](tests/pages/promise_calculator_page.py) | URL verification respects BASE_URL |

## Next Steps

1. Create your ngrok static domain (free account)
2. Add `NGROK_URL` secret to GitHub
3. Run `ngrok http 3000 --url=your-domain.ngrok-free.app` locally
4. Push code and watch the workflow run
5. Check "Run Playwright tests with Allure" step logs for details

---

**Last Updated**: February 7, 2026
**Framework**: Playwright (Python), pytest, ngrok
