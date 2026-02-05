# UI Test Suite - Python Version

This directory contains automated UI tests for the Promise Calculator application using Python, Playwright, and unittest framework.

The tests follow best practices from the **AutomationSamana25** course, including:
- **Page Object Model (POM)** pattern for maintainable test code
- **Test Organization**: Journeys (user workflows) vs Components (edge cases)
- **Auto-Wait**: No random sleeps - uses Playwright's built-in waiting
- **Mock API**: Deterministic, centralized mock data
- **Type-Safe**: Python with type hints

## File Structure

```
tests/
├── journeys.py                 # User journey tests (end-to-end workflows)
├── components.py               # Component tests (edge cases & validation)
├── pages/
│   ├── base_page.py           # Base page object with common utilities
│   ├── promise_calculator_page.py  # Promise Calculator page object
│   └── __init__.py
├── mocks/
│   ├── otp.py                 # Centralized mock API responses
│   └── __init__.py
└── pytest.ini                 # Pytest configuration
```

## Prerequisites

1. **Python 3.8+** installed
2. **Playwright** installed:
   ```bash
   pip install playwright pytest-playwright
   playwright install
   ```

## Running Tests

### Run all tests (verbose output):
```bash
pytest tests/ -v
```

### Run only journey tests (user workflows):
```bash
pytest tests/journeys.py -v
```

### Run only component tests (edge cases):
```bash
pytest tests/components.py -v
```

### Run with headless browser (default):
```bash
pytest tests/ -v
```

### Run with browser visible (headed mode):
```bash
PLAYWRIGHT_HEADLESS=false pytest tests/ -v
```

### Run with debug mode:
```bash
pytest tests/ -v --pdb
```

## Test Organization

### Journey Tests (tests/journeys.py) - 11 tests
End-to-end user workflows testing complete feature paths:

**Smoke Tests** (4):
- App loads and displays page
- Sidebar visible on desktop
- API health badge shows connected
- Promise Calculator heading visible

**Manual Order Journey** (3):
- Complete manual order with multiple items
- Single item manual order
- Manual order with different warehouses

**Sales Order Journey** (4):
- Load and evaluate sales order
- Switch between sales orders
- Clear sales order selection
- Auto-fill items from sales order

### Component Tests (tests/components.py) - 15 tests
Component-specific tests with edge cases and validation:

**Sales Order Combobox** (4):
- Open dropdown and view options
- Verify numeric sorting
- Filter by typing search term
- Clear selection

**Item Code Input** (4):
- Accept valid item codes
- Accept multiple valid codes
- Reject invalid item codes
- Verify all valid codes accepted

**Calendar & Weekends** (4):
- Weekend highlighting
- No-weekends toggle functionality
- Impact on calculation
- Date selection

**Results Panel** (3):
- Promise date display
- Confidence level display
- Fulfillment status display

## Test Execution Flow

### Setup Phase (setUp method)
1. Create new browser page
2. Initialize PromiseCalculatorPage object
3. Mock all API endpoints

### Test Execution
1. Navigate to application
2. Perform user actions (fill form, click buttons, etc.)
3. Assert expectations (element visibility, text content, etc.)

### Teardown Phase (tearDown method)
1. Close browser page

## Page Object Model

### BasePage (base_page.py)
Base utilities for all page objects:
- `navigate_to(path)` - Navigate to URL
- `click(selector)` - Click element
- `fill_input(selector, value)` - Fill form input
- `get_text(selector)` - Get element text
- `is_visible(selector)` - Check visibility
- `wait_for_visible(selector)` - Wait for visibility

### PromiseCalculatorPage (promise_calculator_page.py)
Promise Calculator specific interactions:
- Mode switching: `switch_to_manual_mode()`, `switch_to_sales_order_mode()`
- Manual mode: `fill_customer()`, `add_item()`, `set_desired_date()`
- Sales order mode: `select_sales_order()`, `clear_sales_order_selection()`
- Results: `wait_for_results()`, `get_promise_date()`, `get_confidence_level()`

All methods return `self` for method chaining.

## Mock Data

Mock data is centralized in `tests/mocks/otp.py`:

- `MOCK_HEALTH_RESPONSE` - API health status
- `MOCK_SALES_ORDERS_LIST` - List of sales orders
- `MOCK_SALES_ORDER_DETAILS_*` - Individual sales order details
- `MOCK_STOCK_DATA` - Stock information
- `MOCK_PROMISE_RESPONSE_*` - Promise evaluation responses
- `VALID_ITEM_CODES` - List of valid item codes for testing
- `INVALID_ITEM_CODE` - Invalid item code for error testing

## Auto-Wait & Reliability

Tests use Playwright's auto-wait mechanism:
- No `sleep()` or `wait_for_timeout()` unless absolutely necessary
- Uses `wait_for_visible()` for element waits
- Uses `expect()` for assertions with built-in retry

## Debugging Failed Tests

### Generate Screenshots on Failure
Screenshots are automatically captured and saved to `test-results/` directory.

### Increase Logging
```bash
pytest tests/ -v -s  # Show print statements
```

### Run Single Test
```bash
pytest tests/journeys.py::PromiseCalculatorJourneyTest::test_smoke_01_app_loads_and_displays_page -v
```

### Browser Visible Mode
```bash
PLAYWRIGHT_HEADLESS=false pytest tests/journeys.py -v
```

## Best Practices

1. **Tests are Independent** - Each test mocks its own API calls and doesn't depend on other tests
2. **Clear Naming** - Test names describe what they test (e.g., `test_journey_01_complete_manual_order_flow`)
3. **No Assertions in Page Objects** - Assertions are in test files only
4. **Page Object Returns Self** - Methods return `self` for fluent chaining
5. **Centralized Mocks** - All mock data in one file for easy maintenance

## Course Alignment

This test suite implements the AutomationSamana25 course patterns:

✅ Page Object Model - Selectors encapsulated in page objects  
✅ Auto-Wait - No random sleeps, uses Playwright waiting  
✅ Test Organization - Journeys (workflows) + Components (edge cases)  
✅ Mock API - Deterministic responses, centered in one file  
✅ Clear Naming - Descriptive test and file names  
✅ Python/Playwright - Same stack as course examples  

## Additional Resources

- [Playwright Python Documentation](https://playwright.dev/python/)
- [Pytest Documentation](https://docs.pytest.org/)
- [AutomationSamana25 Course Repository](https://github.com/AutomationSamana/AutomationSamana25-main)

---

**Last Updated**: February 2026  
**Framework**: Playwright + Python + unittest  
**Total Tests**: 26 (11 journeys + 15 components)
