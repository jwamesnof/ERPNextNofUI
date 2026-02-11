# Python UI Tests - Quick Start Guide

## What Was Done

✅ **Converted 26 UI tests from TypeScript to Python**
- Following **AutomationSamana25 course** patterns exactly
- Using **Python + Playwright + unittest** framework
- Maintaining **100% feature parity** with original tests

## Files Created

### Test Files (26 tests total)
- **tests/journeys.py** - 11 user journey tests (end-to-end workflows)
- **tests/components.py** - 15 component tests (edge cases & validation)

### Page Objects
- **tests/pages/base_page.py** - Base utilities for all pages
- **tests/pages/promise_calculator_page.py** - Promise Calculator specific

### Mock Data
- **tests/mocks/otp.py** - Centralized mock API responses

### Configuration & Documentation
- **pytest.ini** - Test configuration
- **tests/README_PYTHON.md** - Full documentation
- **PYTHON_CONVERSION_SUMMARY.md** - Conversion details

## Quick Start (3 Steps)

### Step 1: Install Python Dependencies
```bash
cd c:\Users\NofJawamis\Desktop\ERPNextNofUI\erpnextnofui

# Install Playwright
pip install playwright pytest pytest-playwright

# Install browser binaries
playwright install
```

### Step 2: Start the Application
```bash
# In one terminal, start the Next.js app
npm run dev
# Wait for it to start at http://localhost:3000
```

### Step 3: Run the Tests
```bash
# In another terminal, run all tests
pytest tests/ -v

# Or specific test file
pytest tests/journeys.py -v       # Just journeys (11 tests)
pytest tests/components.py -v     # Just components (15 tests)
```

## Test Execution Examples

### Run All Tests (Headless/Background)
```bash
pytest tests/ -v
```

### Run with Browser Visible (Debug)
```bash
set PLAYWRIGHT_HEADLESS=false
pytest tests/ -v
```

### Run Single Test
```bash
pytest tests/journeys.py::PromiseCalculatorJourneyTest::test_smoke_01_app_loads_and_displays_page -v
```

### Run with Detailed Output
```bash
pytest tests/ -v -s
```

## Test Organization

### Journey Tests (tests/journeys.py) - 11 tests
**Real user workflows from start to finish:**
- ✅ Smoke Tests: Page loads, elements visible, API health
- ✅ Manual Order: Single item, multiple items, different warehouses
- ✅ Sales Order: Load, switch between orders, auto-fill, clear

### Component Tests (tests/components.py) - 15 tests
**Component-specific tests with edge cases:**
- ✅ Combobox: Open, sort, filter, clear
- ✅ Item Input: Valid codes, multiple codes, invalid codes
- ✅ Calendar: Weekends, toggle, date selection
- ✅ Results: Promise date, confidence, status

## Course Alignment - AutomationSamana25

| Requirement | Implementation |
|---|---|
| **Framework** | Python + unittest (same as course) |
| **POM Pattern** | ✅ BasePage + PromiseCalculatorPage |
| **Test Organization** | ✅ Journeys (workflows) + Components (edge cases) |
| **Auto-Wait** | ✅ No random sleeps, uses Playwright waiting |
| **Mock API** | ✅ Centralized in tests/mocks/otp.py |
| **Naming** | ✅ Clear, descriptive names (snake_case) |
| **Setup/Teardown** | ✅ setUpClass, tearDownClass, setUp, tearDown |

## File Structure

```
erpnextnofui/
├── tests/                              # Test directory
│   ├── journeys.py                     # 11 journey tests
│   ├── components.py                   # 15 component tests
│   ├── pytest.ini                      # Pytest configuration
│   ├── README_PYTHON.md                # Full Python test docs
│   ├── pages/
│   │   ├── base_page.py               # Base page object
│   │   ├── promise_calculator_page.py # Promise Calculator page
│   │   └── __init__.py
│   ├── mocks/
│   │   ├── otp.py                     # Mock data (7 responses)
│   │   └── __init__.py
│   └── __init__.py
├── pytest.ini                          # Root pytest config
├── PYTHON_CONVERSION_SUMMARY.md        # Conversion details
└── src/                                # Application source
    └── app/
        └── ...
```

## Page Object Model Example

```python
class PromiseCalculatorPage(BasePage):
    # Selectors as class attributes
    MANUAL_MODE_BUTTON = '[data-testid="input-mode-manual"]'
    CUSTOMER_INPUT = '[data-testid="customer-input"]'
    
    # Methods encapsulate UI interactions
    def switch_to_manual_mode(self) -> "PromiseCalculatorPage":
        self.click(self.MANUAL_MODE_BUTTON)
        return self  # Return self for method chaining
    
    def fill_customer(self, customer_name: str) -> "PromiseCalculatorPage":
        self.fill_input(self.CUSTOMER_INPUT, customer_name)
        return self
    
    # No assertions in page objects!
```

## Test Example

```python
class PromiseCalculatorJourneyTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        """Set up once for all tests"""
        cls.playwright = sync_playwright().start()
        cls.browser = cls.playwright.chromium.launch(headless=True)
    
    def setUp(self):
        """Set up before each test"""
        self.page = self.browser.new_page()
        self.promise_page = PromiseCalculatorPage(self.page)
    
    def test_journey_01_complete_manual_order_flow(self):
        """Test: Complete manual order workflow"""
        # Arrange
        self.promise_page.navigate_to_promise_calculator()
        
        # Act
        self.promise_page.switch_to_manual_mode()
        self.promise_page.fill_customer("ABC Manufacturing")
        self.promise_page.add_item("WIDGET-ALPHA", qty=5)
        self.promise_page.evaluate_promise()
        
        # Assert - assertions are in tests, NOT page objects!
        results = self.page.locator('[data-testid="results-section"]')
        expect(results).to_be_visible(timeout=10000)
```

## Mock Data Strategy

All API responses are centralized in `tests/mocks/otp.py`:

```python
MOCK_HEALTH_RESPONSE = {
    "status": "healthy",
    "version": "1.0.0",
    "erpnext_connected": True,
}

MOCK_SALES_ORDERS_LIST = {
    "sales_orders": [...],
    "total": 3,
}

# Used in every test:
def _mock_api_endpoints(self):
    def handle_health(route):
        route.fulfill(
            status=200,
            body=json.dumps(MOCK_HEALTH_RESPONSE)
        )
    self.page.route("**/health", handle_health)
```

## Troubleshooting

### Tests timeout
- Make sure application is running: `npm run dev`
- Increase timeout: `pytest --timeout=60`

### Element not found errors
- Check data-testid attributes in HTML match selectors in page object
- Run with browser visible: `PLAYWRIGHT_HEADLESS=false pytest tests/ -v`

### Import errors
- Ensure you're in correct directory: `cd erpnextnofui`
- Verify __init__.py files exist in tests/, pages/, mocks/ directories

### API mock errors
- Check mock data matches expected endpoint responses
- Verify route patterns in _mock_api_endpoints() method

## Key Differences from TypeScript Tests

| Aspect | TypeScript | Python |
|---|---|---|
| **Syntax** | async/await | Synchronous (blocking) |
| **Naming** | camelCase | snake_case |
| **Framework** | @playwright/test | unittest + pytest |
| **Config** | playwright.config.ts | pytest.ini |
| **Setup** | test.beforeEach | setUp() method |

## Next Steps

1. ✅ Install dependencies: `pip install playwright pytest pytest-playwright`
2. ✅ Start app: `npm run dev`
3. ✅ Run tests: `pytest tests/ -v`
4. ✅ View results in terminal

## Documentation

- **Full Test Docs**: [tests/README_PYTHON.md](tests/README_PYTHON.md)
- **Conversion Details**: [PYTHON_CONVERSION_SUMMARY.md](PYTHON_CONVERSION_SUMMARY.md)
- **Course Alignment**: [COURSE_ALIGNMENT_REPORT.md](COURSE_ALIGNMENT_REPORT.md)

## Test Coverage

- **Journeys** (11): Complete user workflows
- **Components** (15): Component-specific edge cases
- **Total** (26): Comprehensive Promise Calculator coverage

## Running in CI/CD

Tests can be integrated into GitHub Actions:

```yaml
- name: Run UI Tests
  run: |
    pip install playwright pytest pytest-playwright
    playwright install
    pytest tests/ -v
```

---

**Framework**: Playwright (Python)  
**Pattern**: Page Object Model  
**Course**: AutomationSamana25  
**Tests**: 26 total (11 journeys + 15 components)  
**Status**: ✅ Ready to Execute
