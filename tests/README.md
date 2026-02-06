# OTP Promise Calculator - UI Test Suite Guide

## Overview

This directory contains end-to-end (E2E) UI tests for the Promise Calculator component built with **Playwright**, following best practices from the AutomationSamana25 course framework.

### Test Framework
- **Framework**: [Playwright](https://playwright.dev/) (JavaScript/TypeScript)
- **Test Runner**: Playwright Test
- **Language**: TypeScript
- **Browser Support**: Chromium, Firefox, WebKit

## Project Structure

```
tests/
├── fixtures/
│   └── otp-mock-data.ts          # Mock API responses for deterministic testing
├── pages/
│   ├── BasePage.ts               # Base page object with common utilities
│   └── PromiseCalculatorPage.ts  # Promise Calculator page object model
├── otp-promise-calculator.spec.ts  # All tests (smoke, manual, sales order, sorting, weekend)
├── otp-sales-orders.spec.ts      # Legacy test (kept for reference)
└── README.md                      # This file
```

## Key Features

### 1. Page Object Model (POM)
Following AutomationSamana25 course patterns:
- Each page encapsulated in a class (e.g., `PromiseCalculatorPage`)
- Selectors stored as class attributes
- Interactions exposed as public methods
- Methods return `this` for fluent chaining
- Page verification happens in constructor
- **No assertions in page objects** - assertions only in test methods

### 2. Mock API Responses
All external API calls are mocked for deterministic, fast tests:
- `GET /health` - API health check
- `GET /otp/health` - OTP service health
- `GET /otp/sales-orders` - List of sales orders
- `GET /otp/sales-orders/{id}` - Specific sales order details
- `POST /otp/promise` - Promise calculation
- Mocked data in `tests/fixtures/otp-mock-data.ts`

### 3. Auto-Waiting & Synchronization
- Use `expect()` assertions with auto-wait (Playwright recommended practice)
- No hard sleeps except minimal waits for UI animations
- Page objects verify page load in constructor
- Network idle handling for API responses

### 4. Test Coverage

#### Smoke Tests (5 tests)
✅ App loads and displays Promise Calculator page  
✅ Sidebar is visible on desktop  
✅ API health badge shows connected status  
✅ Promise Calculator heading is visible  

#### Manual Order Flow (3 tests)
✅ Add single item and evaluate promise  
✅ Add multiple items in manual order  
✅ Verify results section renders promise date and confidence  

#### From Sales Order ID Flow (3 tests)
✅ Switch to Sales Order mode and load sales order list  
✅ Select a sales order and verify auto-fill  
✅ Clear sales order selection  
✅ Verify items auto-fill from selected sales order  

#### Sorting & Validation (3 tests)
✅ Sales Order IDs are sorted in ascending order  
✅ Invalid item code shows validation error or is rejected  
✅ Valid item codes can be added  

#### Weekend Highlighting (2 tests)
✅ Calendar highlights Friday and Saturday as weekends  
✅ No Weekends setting affects promise calculation  

**Total: 16+ test cases** covering core flows, edge cases, and business rules.

## Quick Start

### Prerequisites
```bash
# Node.js 18+ and npm/yarn installed
node --version
npm --version
```

### Installation

```bash
# Install dependencies (if not already done)
npm install

# cd c:/Users/NofJawamis/Desktop/ERPNextNofUI/erpnextnofui && npm run dev

# Install Playwright browsers (required once)
npx playwright install
```

### Running Tests

#### Run all tests
```bash
npm run test:ui
```

#### Run tests in headed mode (see browser during test)
```bash
npm run test:ui:headed
```

#### Run tests in debug mode (interactive debugger)
```bash
npm run test:ui:debug
```

#### Run specific test file
```bash
npx playwright test tests/otp-promise-calculator.spec.ts
```

#### Run specific test by name pattern
```bash
npx playwright test -g "Manual Order"
```

#### Run tests on specific browser
```bash
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit
```

#### Run tests in headed mode for specific browser
```bash
npx playwright test --project=chromium --headed
```

#### Generate and view HTML report
```bash
npx playwright show-report
```

## Test Configuration

### `playwright.config.ts` Settings

| Setting | Value | Purpose |
|---------|-------|---------|
| `testDir` | `./tests` | Where tests are located |
| `timeout` | 30s | Max time per test |
| `expect.timeout` | 5s | Max wait for assertions |
| `baseURL` | `http://localhost:3000` | App URL for tests |
| `trace` | `on-first-retry` | Record trace on failures |
| `screenshot` | `only-on-failure` | Capture screenshots on failures |
| `video` | `retain-on-failure` | Record video on failures |
| `webServer` | Starts `npm run dev` | Auto-starts dev server |

### Environment Variables

Tests read from `.env.local`:
```env
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8001
NEXT_PUBLIC_MOCK_MODE=false
```

For tests with mocked APIs, these are overridden by route handlers.

## Debugging Tests

### 1. Headed Mode (Best for Quick Debugging)
```bash
npm run test:ui:headed
```
Shows the browser window as tests run. Can see what's happening in real-time.

### 2. Debug Mode (Interactive)
```bash
npm run test:ui:debug
```
Opens Playwright Inspector. You can:
- Step through each action
- Inspect DOM elements
- See network requests
- Modify selectors live

### 3. View Test Report
```bash
npx playwright show-report
```
Opens HTML report with:
- Test results
- Screenshots/videos on failures
- Trace recordings (click to debug in Trace Viewer)
- Timing information

### 4. View Trace for Specific Test Failure
Traces are saved in `test-results/` for failed tests:
```bash
npx playwright show-trace test-results/trace.zip
```

### 5. Single Test Debugging
```bash
npx playwright test otp-promise-calculator.spec.ts -g "Add single item" --headed --debug
```

## Test Data & Mocking

### Mock Sales Orders
Located in `tests/fixtures/otp-mock-data.ts`:
- **SAL-ORD-2026-00001**: Acme Corporation (3 items)
- **SAL-ORD-2026-00002**: Beta LLC (2 items)
- **SAL-ORD-2026-00010**: Gamma Industries (5 items)

### Mock Item Codes
Valid items for testing:
- `WIDGET-ALPHA`, `WIDGET-BETA`, `COMPONENT-X`, `COMPONENT-Y`, `GEAR-TYPE-A`

Invalid item (for validation tests):
- `INVALID-ITEM-XYZ`

### Mock Promise Responses
Three scenarios:
- **FEASIBLE** (95% confidence): Normal successful case
- **AT_RISK** (45% confidence): Low confidence scenario
- **NOT_FEASIBLE** (0% confidence): Cannot fulfill order

## Best Practices Used

### 1. **No Hard Sleeps**
❌ Avoid:
```javascript
await page.waitForTimeout(1000); // Bad for reliability
```

✅ Do:
```javascript
await expect(resultsSection).toBeVisible();
```

### 2. **Selectors Priority**
1. Role-based: `page.getByRole('button', { name: 'Submit' })`
2. Test IDs: `page.getByTestId('evaluate-button')`
3. CSS: `page.locator('[class="result"]')`
4. Never: XPath (less maintainable)

### 3. **Test Isolation**
- Each test is independent
- Mock data set up fresh before each test
- No cross-test dependencies
- Can run tests in parallel

### 4. **Meaningful Test Names**
✅ `test('Add single item and evaluate promise')`  
❌ `test('test1')`

### 5. **Page Object Model**
```typescript
// Create page object
const promisePage = new PromiseCalculatorPage(page);

// Use fluent interface
await promisePage
  .navigateToPromiseCalculator()
  .switchToManualMode()
  .fillCustomer('Test Customer');
```

## CI/CD Integration

Tests are configured to run in CI/CD environments:

```yaml
# GitHub Actions workflow example
- name: Run Playwright tests
  run: npm run test:ui
  env:
    CI: true

- name: Upload test results
  uses: actions/upload-artifact@v4
  with:
    name: playwright-report
    path: playwright-report/
```

### CI Configuration
In `playwright.config.ts`:
- `retries: 2` - Retry failed tests twice
- `workers: 1` - Sequential execution (more stable)
- `forbidOnly: true` - Fail if `.only` tests found
- Auto-disabled `reuseExistingServer` in CI

## Troubleshooting

### Issue: Tests fail with "Cannot reach baseURL"
**Solution**: Ensure dev server is running
```bash
# In one terminal
npm run dev     # cd c:/Users/NofJawamis/Desktop/ERPNextNofUI/erpnextnofui && npm run dev

# In another terminal
npm run test:ui
```

### Issue: Tests timeout waiting for element
**Solution**: Check selectors in `PromiseCalculatorPage.ts`
```bash
npm run test:ui:debug
# Inspect and update selectors if UI changed
```

### Issue: Flaky tests (sometimes pass, sometimes fail)
**Solutions**:
1. Remove hard timeouts: use `expect()` with auto-wait
2. Ensure mocks are set up before navigation
3. Check for race conditions in beforeEach hooks

### Issue: "browserType.launch() failed"
**Solution**: Install browsers
```bash
npx playwright install --with-deps
```

## Adding New Tests

### Template for New Test File
```typescript
import { test, expect } from '@playwright/test';
import { PromiseCalculatorPage } from './pages/PromiseCalculatorPage';

test.beforeEach(async ({ page }) => {
  // Mock API endpoints
  await page.route('**/otp/**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ /* mock data */ }),
    })
  );
});

test.describe('Feature Name', () => {
  test('should do something', async ({ page }) => {
    const promisePage = new PromiseCalculatorPage(page);
    
    // Arrange
    await promisePage.navigateToPromiseCalculator();
    
    // Act
    await promisePage.switchToManualMode();
    
    // Assert
    await expect(/* element */).toBeVisible();
  });
});
```

### Key Test Structure
1. **Setup** (beforeEach): Mock APIs
2. **Arrange**: Navigate to page, initialize page object
3. **Act**: Perform user actions
4. **Assert**: Verify results using `expect()`

## Resources

- [Playwright Documentation](https://playwright.dev)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Auto-waiting Guide](https://playwright.dev/docs/actionability)
- [Debugging Guide](https://playwright.dev/docs/debug)
- [Page Object Model Guide](https://playwright.dev/docs/pom)

## Contributing

When adding or modifying tests:

1. Follow existing naming conventions
2. Use page objects for new pages/features
3. Add mock data to `otp-mock-data.ts`
4. No hard sleeps - use auto-wait with `expect()`
5. Add descriptive test names
6. Test both happy path and edge cases
7. Update this README if adding new patterns

## License

Same as parent project (ERPNext NofUI)

---

**Last Updated**: February 2026  
**Framework**: Playwright 1.58+  
**Node Version**: 18+
