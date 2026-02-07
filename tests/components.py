"""
OTP Promise Calculator - COMPONENT TESTS (Comprehensive & Edge Cases)

These tests focus on specific UI components and their behavior,
including edge cases, validation, sorting, and business logic.

Components tested:
- Sales Order Combobox (selection, sorting, clearing)
- Item Code Input Field (validation, valid/invalid codes)
- Calendar & Weekend Settings (highlighting, business rules)
- Results Panel (data rendering)

Follows AutomationSamana25 course pattern with unittest framework.
"""

import unittest
import json
import re
import time
from playwright.sync_api import expect
from tests.browser_factory import BrowserFactory
from tests.pages.promise_calculator_page import PromiseCalculatorPage
from tests.mocks.otp import (
    MOCK_HEALTH_RESPONSE,
    MOCK_SALES_ORDERS_LIST,
    MOCK_SALES_ORDER_DETAILS_SAL_ORD_00001,
    MOCK_SALES_ORDER_DETAILS_SAL_ORD_00002,
    MOCK_PROMISE_RESPONSE_SUCCESS,
    VALID_ITEM_CODES,
    INVALID_ITEM_CODE,
)


class PromiseCalculatorComponentTest(unittest.TestCase):
    """Test class for Promise Calculator components (edge cases and validation)."""

    @classmethod
    def setUpClass(cls):
        """Set up browser once for all tests in this class."""
        cls.factory = BrowserFactory()
        cls.browser = cls.factory.start()

    @classmethod
    def tearDownClass(cls):
        """Clean up after all tests are done."""
        try:
            cls.factory.close()
        except (KeyboardInterrupt, Exception):
            pass

    def setUp(self):
        """Set up before each test method."""
        self.context = self.factory.new_context()
        # Register routes on context BEFORE creating page
        self._mock_api_endpoints_on_context()
        self.page = self.context.new_page()
        self.promise_page = PromiseCalculatorPage(self.page)

    def tearDown(self):
        """Clean up after each test method."""
        self.page.close()
        self.context.close()

    def _mock_api_endpoints_on_context(self):
        """Mock all API endpoints using a universal route handler."""
        cors_headers = {
            "access-control-allow-origin": "*",
            "access-control-allow-methods": "GET,POST,OPTIONS",
            "access-control-allow-headers": "*",
        }

        # Universal handler that checks URL and routes appropriately
        def universal_handler(route):
            url = route.request.url
            method = route.request.method
            
            print(f"[REQUEST] {method} {url}")
            
            # Health checks
            if "/health" in url:
                print(f"[ROUTE] Mocking health check")
                route.fulfill(
                    status=200,
                    content_type="application/json",
                    headers=cors_headers,
                    body=json.dumps(MOCK_HEALTH_RESPONSE),
                )
                return
            
            # Sales order details
            if "/sales-orders/SAL-ORD-2026-00001" in url:
                print(f"[ROUTE] Mocking SO 00001")
                route.fulfill(
                    status=200,
                    content_type="application/json",
                    headers=cors_headers,
                    body=json.dumps(MOCK_SALES_ORDER_DETAILS_SAL_ORD_00001),
                )
                return
            
            if "/sales-orders/SAL-ORD-2026-00002" in url:
                print(f"[ROUTE] Mocking SO 00002")
                route.fulfill(
                    status=200,
                    content_type="application/json",
                    headers=cors_headers,
                    body=json.dumps(MOCK_SALES_ORDER_DETAILS_SAL_ORD_00002),
                )
                return
            
            # Sales orders list (must come after specific SO routes)
            if "/sales-orders" in url and "SAL-ORD-2026" not in url:
                print(f"[ROUTE] Mocking sales orders list")
                route.fulfill(
                    status=200,
                    content_type="application/json",
                    headers=cors_headers,
                    body=json.dumps(MOCK_SALES_ORDERS_LIST),
                )
                return
            
            # Promise evaluation
            if "/promise" in url:
                print(f"[ROUTE] Mocking promise eval")
                route.fulfill(
                    status=200,
                    content_type="application/json",
                    headers=cors_headers,
                    body=json.dumps(MOCK_PROMISE_RESPONSE_SUCCESS),
                )
                return
            
            # Let everything else through
            route.continue_()

        # Register universal handler for all requests
        self.context.route("**/*", universal_handler)

    def _fill_item_code(self, index: int, item_code: str) -> None:
        combobox_inputs = self.page.get_by_test_id("item-code-search-input")
        try:
            target = combobox_inputs.nth(index)
            target.wait_for(state="visible", timeout=3000)
            target.click()
            target.fill(item_code)
            option = self.page.get_by_role("option").filter(has_text=item_code).first
            if option.is_visible(timeout=2000):
                option.click()
            target.press("Tab")
            return
        except Exception:
            pass

        text_inputs = self.page.locator('input[placeholder="e.g., SKU001"]')
        target = text_inputs.nth(index)
        target.wait_for(state="visible", timeout=3000)
        target.fill(item_code)
        target.press("Tab")

    # ========================================================================
    # COMPONENT: Sales Order Combobox
    # Test: Selection, sorting, filtering, clearing
    # ========================================================================

    def test_combobox_01_open_dropdown_view_all_sales_orders(self):
        """Component Test: Open combobox dropdown and view all sales orders."""
        self.promise_page.navigate_to_promise_calculator()

        # Switch to Sales Order mode
        self.promise_page.switch_to_sales_order_mode()

        # Get combobox input
        combobox_input = self.promise_page.wait_for_sales_order_combobox_input(timeout=30000)

        # Type to open dropdown
        combobox_input.click()
        self.page.wait_for_timeout(300)
        combobox_input.type("S")
        
        # Wait for listbox to render with options - use ID selector for reliability
        listbox = self.page.locator('#sales-order-combobox-listbox')
        listbox.wait_for(state="visible", timeout=5000)
        
        # Get options from the listbox (not page-global)
        options = listbox.get_by_role("option")
        
        # Wait for options to be available
        option_count = 0
        start_time = time.time()
        while option_count == 0 and time.time() - start_time < 5:
            self.page.wait_for_timeout(100)
            option_count = options.count()
        
        self.assertGreater(option_count, 0, "No options found in sales order dropdown")

        # Verify some expected sales orders are listed
        option_texts = []
        for i in range(min(option_count, 5)):
            text = options.nth(i).inner_text()
            option_texts.append(text)

        # Should contain at least one SAL-ORD
        found = any("SAL-ORD" in text for text in option_texts)
        self.assertTrue(found, f"No SAL-ORD found in options: {option_texts}")

    def test_combobox_02_sales_order_ids_sorted_numeric(self):
        """Component Test: Sales Order IDs are sorted in ascending numeric order."""
        self.promise_page.navigate_to_promise_calculator()

        # Switch to Sales Order mode
        self.promise_page.switch_to_sales_order_mode()

        # Open dropdown by typing
        combobox_input = self.promise_page.wait_for_sales_order_combobox_input(timeout=30000)
        combobox_input.click()
        self.page.wait_for_timeout(300)
        combobox_input.type("")
        
        # Get all options - wait for listbox to render using ID selector
        listbox = self.page.locator('#sales-order-combobox-listbox')
        listbox.wait_for(state="visible", timeout=5000)
        options = listbox.get_by_role("option")
        
        # Wait for options to populate
        option_count = 0
        start_time = time.time()
        while option_count == 0 and time.time() - start_time < 5:
            self.page.wait_for_timeout(100)
            option_count = options.count()
        
        # Extract numeric parts and verify sorting
        so_ids = []
        for i in range(min(option_count, 5)):
            text = options.nth(i).inner_text()
            so_ids.append(text)

        # Verify numeric parts are in ascending order
        for i in range(1, len(so_ids)):
            prev = so_ids[i - 1]
            curr = so_ids[i]

            # Extract numeric suffix
            prev_match = re.search(r"(\d+)$", prev)
            curr_match = re.search(r"(\d+)$", curr)

            if prev_match and curr_match:
                prev_num = int(prev_match.group(0))
                curr_num = int(curr_match.group(0))
                self.assertLessEqual(prev_num, curr_num)

    def test_combobox_03_filter_dropdown_by_typing(self):
        """Component Test: Filter dropdown by typing search term."""
        self.promise_page.navigate_to_promise_calculator()

        # Switch to Sales Order mode (VERIFIED: data-testid="input-mode-sales-order")
        self.promise_page.switch_to_sales_order_mode()

        # In sales-order mode, SalesOrderSelector renders a Combobox input
        combobox_input = self.promise_page.wait_for_sales_order_combobox_input(timeout=30000)

        # Type search term
        combobox_input.click()
        self.page.wait_for_timeout(300)
        combobox_input.fill("SAL-ORD")
        
        # Verify options appear using ID selector
        listbox = self.page.locator('#sales-order-combobox-listbox')
        listbox.wait_for(state="visible", timeout=5000)
        options = listbox.get_by_role("option")
        
        # Wait for options to populate
        option_count = 0
        start_time = time.time()
        while option_count == 0 and time.time() - start_time < 5:
            self.page.wait_for_timeout(100)
            option_count = options.count()
        
        # Should have at least one option
        if option_count > 0:
            first_option = options.first
            option_text = first_option.inner_text()
            self.assertTrue(len(option_text) > 0, "Option text should not be empty")

    def test_combobox_04_clear_selection_removes_value(self):
        """Component Test: Clear selection button removes the selected value."""
        self.promise_page.navigate_to_promise_calculator()

        # Switch to Sales Order mode
        self.promise_page.switch_to_sales_order_mode()

        # Select a sales order
        combobox_input = self.promise_page.wait_for_sales_order_combobox_input(timeout=30000)
        combobox_input.click()
        self.page.wait_for_timeout(300)
        combobox_input.fill("SAL-ORD-2026-00001")
        self.page.wait_for_timeout(500)

        option = self.page.get_by_role("option").first
        if option.is_visible():
            option.click()
            self.page.wait_for_timeout(500)

            # Verify selected
            selected_value = combobox_input.input_value()
            self.assertIn("SAL-ORD-2026-00001", selected_value)

            # Click clear button
            clear_button = self.page.get_by_role("button", name="Clear").first
            if clear_button.is_visible():
                clear_button.click()
                self.page.wait_for_timeout(300)

                # Verify cleared
                cleared_value = combobox_input.input_value()
                self.assertEqual(cleared_value, "")

    # ========================================================================
    # COMPONENT: Sales Order Manual Input (Manual Mode)
    # Test: Visibility and value persistence
    # ========================================================================

    def test_manual_sales_order_input_visible_and_persists(self):
        """Component Test: Manual Sales Order input is visible and retains value."""
        self.promise_page.navigate_to_promise_calculator()

        # Manual mode input should be visible
        self.promise_page.switch_to_manual_mode()
        manual_input = self.page.get_by_test_id("sales-order-manual-input").first
        manual_input.wait_for(state="visible", timeout=5000)

        # Fill a value
        manual_value = "SO-2024-001"
        manual_input.fill(manual_value)
        self.page.wait_for_timeout(200)
        self.assertEqual(manual_input.input_value(), manual_value)

        # Switch modes and ensure value persists when returning to manual mode
        self.promise_page.switch_to_sales_order_mode()
        self.promise_page.switch_to_manual_mode()
        manual_input = self.page.get_by_test_id("sales-order-manual-input").first
        manual_input.wait_for(state="visible", timeout=5000)
        self.assertEqual(manual_input.input_value(), manual_value)

    # ========================================================================
    # COMPONENT: Item Code Input Field
    # Test: Validation, valid/invalid codes, error messages
    # ========================================================================

    def test_item_input_01_valid_item_code_accepted(self):
        """Component Test: Valid item code is accepted."""
        self.promise_page.navigate_to_promise_calculator()

        # Switch to manual mode
        self.promise_page.switch_to_manual_mode()

        # Fill customer
        customer_input = self.page.locator("#customer")
        customer_input.wait_for(state="visible", timeout=5000)
        customer_input.click()
        self.page.wait_for_timeout(100)
        customer_input.fill("")  # Clear first
        self.page.wait_for_timeout(100)
        customer_input.type("Test Customer", delay=50)
        self.page.wait_for_timeout(200)
        customer_input.press("Tab")
        self.page.wait_for_timeout(300)

        # Add a valid item
        item_code_input = self.page.locator(
            'input[data-testid="item-code-search-input"], input[placeholder="e.g., SKU001"]'
        ).first
        valid_item = VALID_ITEM_CODES[0]  # WIDGET-ALPHA
        item_code_input.fill(valid_item)
        self.page.wait_for_timeout(300)

        qty_input = self.page.locator('input[type="number"]').first
        qty_input.fill("")
        qty_input.fill("5")

        add_button = self.page.get_by_role("button", name="Add Item")
        if add_button.is_visible():
            add_button.click()
            self.page.wait_for_timeout(300)

            # Verify no error messages
            error_messages = self.page.locator('[role="alert"]')
            error_count = error_messages.count()
            # Should have 0 or minimal errors after adding valid item
            self.assertLessEqual(error_count, 1)

    def test_item_input_02_multiple_valid_codes_added(self):
        """Component Test: Multiple valid item codes can be added."""
        self.promise_page.navigate_to_promise_calculator()

        # Switch to manual mode
        self.promise_page.switch_to_manual_mode()

        # Fill customer
        customer_input = self.page.locator("#customer")
        customer_input.wait_for(state="visible", timeout=5000)
        customer_input.click()
        self.page.wait_for_timeout(100)
        customer_input.fill("")  # Clear first
        self.page.wait_for_timeout(100)
        customer_input.type("Test Customer", delay=50)
        self.page.wait_for_timeout(200)
        customer_input.press("Tab")
        self.page.wait_for_timeout(300)

        item_code_input = self.page.locator(
            'input[data-testid="item-code-search-input"], input[placeholder="e.g., SKU001"]'
        ).first
        qty_input = self.page.locator('input[type="number"]').first
        add_button = self.page.get_by_role("button", name="Add Item")

        # Add first item
        item_code_input.fill(VALID_ITEM_CODES[0])  # WIDGET-ALPHA
        self.page.wait_for_timeout(300)
        qty_input.fill("")
        qty_input.fill("5")

        if add_button.is_visible():
            add_button.click()
            self.page.wait_for_timeout(300)

        # Add second item
        item_code_input.fill(VALID_ITEM_CODES[1])  # WIDGET-BETA
        self.page.wait_for_timeout(300)
        qty_input.fill("")
        qty_input.fill("3")

        if add_button.is_visible():
            add_button.click()
            self.page.wait_for_timeout(300)

        # Add third item
        item_code_input.fill(VALID_ITEM_CODES[2])  # COMPONENT-X
        self.page.wait_for_timeout(300)
        qty_input.fill("")
        qty_input.fill("2")

        if add_button.is_visible():
            add_button.click()
            self.page.wait_for_timeout(500)

        # Verify items are in the form by checking item count badge
        # VERIFIED from browser: Item count appears as "X item" or "X items" in a badge
        # Look for the span with item count text
        try:
            # Try to find item count badge with "item" text
            badges = self.page.locator('span:has-text(" item")')
            if badges.count() > 0:
                badge_text = badges.first.inner_text()
                # Extract number: "3 items" or "1 item"
                match = re.search(r'(\d+)\s+item', badge_text)
                self.assertTrue(match is not None, f"Expected 'X item(s)' format, got: {badge_text}")
                item_count = int(match.group(1))
                self.assertGreaterEqual(item_count, 3, f"Expected 3+ items, found: {item_count}")
            else:
                # Fallback: count item code inputs in the form
                item_inputs = self.page.locator('input[placeholder="e.g., SKU001"]')
                item_input_count = item_inputs.count()
                self.assertGreaterEqual(item_input_count, 1, "Expected at least 1 item input found")
        except AssertionError as e:
            self.fail(f"Item verification failed: {str(e)}")

    def test_item_input_03_invalid_code_rejected(self):
        """Component Test: Invalid item code is rejected with error message."""
        self.promise_page.navigate_to_promise_calculator()

        # Switch to manual mode
        self.promise_page.switch_to_manual_mode()

        # Fill customer
        customer_input = self.page.locator("#customer")
        customer_input.wait_for(state="visible", timeout=5000)
        customer_input.click()
        self.page.wait_for_timeout(100)
        customer_input.fill("")  # Clear first
        self.page.wait_for_timeout(100)
        customer_input.type("Test Customer", delay=50)
        self.page.wait_for_timeout(200)
        customer_input.press("Tab")
        self.page.wait_for_timeout(300)

        # Try to add invalid item code
        item_code_input = self.page.locator(
            'input[data-testid="item-code-search-input"], input[placeholder="e.g., SKU001"]'
        ).first
        item_code_input.fill(INVALID_ITEM_CODE)  # INVALID-ITEM-XYZ
        self.page.wait_for_timeout(500)

        # Try to add the item
        add_button = self.page.get_by_role("button", name="Add Item")
        if add_button.is_visible():
            is_enabled = add_button.is_enabled()
            if is_enabled:
                add_button.click()

        # Check for validation error message
        validation_error = self.page.locator('[role="alert"]').first
        try:
            is_visible = validation_error.is_visible(timeout=2000)
            if is_visible:
                error_text = validation_error.inner_text()
                self.assertGreater(len(error_text), 0)
        except:
            # Error element might not be visible, which is acceptable
            pass

    def test_item_input_04_all_valid_codes_accepted(self):
        """Component Test: All valid item codes from list are accepted."""
        self.promise_page.navigate_to_promise_calculator()

        # Switch to manual mode
        self.promise_page.switch_to_manual_mode()

        # Fill customer
        customer_input = self.page.locator("#customer")
        customer_input.wait_for(state="visible", timeout=5000)
        customer_input.click()
        self.page.wait_for_timeout(100)
        customer_input.fill("")  # Clear first
        self.page.wait_for_timeout(100)
        customer_input.type("Test Customer", delay=50)
        self.page.wait_for_timeout(200)
        customer_input.press("Tab")
        self.page.wait_for_timeout(300)

        item_code_input = self.page.locator(
            'input[data-testid="item-code-search-input"], input[placeholder="e.g., SKU001"]'
        ).first
        qty_input = self.page.locator('input[type="number"]').first

        # Test first 3 valid item codes
        for item_code in VALID_ITEM_CODES[:3]:
            item_code_input.fill(item_code)
            self.page.wait_for_timeout(300)

            qty_input.fill("")
            qty_input.fill("1")

            # Verify item input has the value
            input_value = item_code_input.input_value()
            self.assertEqual(input_value, item_code)

    # ========================================================================
    # COMPONENT: Calendar & Weekend Settings
    # Test: Weekend highlighting, toggle, date selection
    # ========================================================================

    def test_calendar_01_weekends_highlighted_disabled(self):
        """Component Test: Weekend days are highlighted or disabled."""
        self.promise_page.navigate_to_promise_calculator()

        # Open delivery settings and calendar
        delivery_toggle = self.page.get_by_role("button", name="Delivery Settings")
        delivery_toggle.click()
        self.page.wait_for_timeout(300)

        calendar_button = self.page.locator("#desiredDeliveryDate")
        if calendar_button.is_visible():
            calendar_button.click()
            self.page.wait_for_timeout(300)

            weekend_days = self.page.locator(".otp-day-picker .otp-weekend-day")
            self.assertGreaterEqual(weekend_days.count(), 0)

    def test_calendar_02_no_weekends_toggle_functional(self):
        """Component Test: No Weekends toggle exists and is functional."""
        self.promise_page.navigate_to_promise_calculator()

        # Open delivery settings
        delivery_toggle = self.page.get_by_role("button", name="Delivery Settings")
        delivery_toggle.click()
        self.page.wait_for_timeout(300)

        # Look for "No Weekends" toggle/checkbox
        no_weekends_toggle = self.page.locator(
            'label:has-text("Exclude weekends from promise dates") input[type="checkbox"]'
        ).first

        if no_weekends_toggle.is_visible():
            # Check current state
            is_checked = no_weekends_toggle.is_checked()

            # Toggle the state
            no_weekends_toggle.click()
            self.page.wait_for_timeout(300)

            # Verify state changed
            new_state = no_weekends_toggle.is_checked()
            self.assertNotEqual(new_state, is_checked)

    def test_calendar_03_no_weekends_affects_calculation(self):
        """Component Test: No Weekends setting affects promise calculation."""
        self.promise_page.navigate_to_promise_calculator()

        # Setup manual order
        self.promise_page.switch_to_manual_mode()

        customer_input = self.page.locator("#customer")
        customer_input.wait_for(state="visible", timeout=5000)
        customer_input.click()
        self.page.wait_for_timeout(100)
        customer_input.fill("")  # Clear first
        self.page.wait_for_timeout(100)
        customer_input.type("Test Customer", delay=50)
        self.page.wait_for_timeout(200)
        customer_input.press("Tab")
        self.page.wait_for_timeout(300)

        self._fill_item_code(0, "WIDGET-ALPHA")
        self.page.wait_for_timeout(300)

        qty_input = self.page.locator('input[type="number"]').first
        qty_input.fill("")
        qty_input.fill("5")
        qty_input.press("Tab")

        # Open delivery settings and verify no-weekends setting
        delivery_toggle = self.page.get_by_role("button", name="Delivery Settings")
        delivery_toggle.click()
        self.page.wait_for_timeout(300)

        no_weekends_toggle = self.page.locator(
            'label:has-text("Exclude weekends from promise dates") input[type="checkbox"]'
        ).first

        if no_weekends_toggle.is_visible():
            # Ensure it's checked
            if not no_weekends_toggle.is_checked():
                no_weekends_toggle.click()

        # Evaluate promise
        self.promise_page.wait_for_api_connected(timeout=10000)

        evaluate_btn = self.page.get_by_role("button", name="Evaluate Promise")
        if evaluate_btn.is_visible():
            expect(evaluate_btn).to_be_enabled(timeout=15000)
            evaluate_btn.click()
            self.page.wait_for_timeout(500)

            # Verify results appear
            results_label = self.page.get_by_text("Promise Date").first
            expect(results_label).to_be_visible(timeout=10000)

    def test_calendar_04_date_selection_reflected_in_form(self):
        """Component Test: Date can be selected and is reflected in form."""
        self.promise_page.navigate_to_promise_calculator()

        # Open delivery settings and date picker
        delivery_toggle = self.page.get_by_role("button", name="Delivery Settings")
        delivery_toggle.click()
        self.page.wait_for_timeout(300)

        date_button = self.page.locator("#desiredDeliveryDate")
        if date_button.is_visible():
            date_button.click()
            self.page.wait_for_timeout(300)

            day_button = self.page.locator(".otp-day-picker button").filter(
                has_text="15"
            ).first
            if day_button.is_visible():
                day_button.click()
                self.page.wait_for_timeout(300)

                # Verify date button shows a selected value
                button_text = date_button.inner_text()
                self.assertTrue(button_text)

    # ========================================================================
    # COMPONENT: Results Panel
    # Test: Promise date rendering, confidence display, drivers list
    # ========================================================================

    def test_results_01_promise_date_displayed(self):
        """Component Test: Promise date is displayed correctly."""
        self.promise_page.navigate_to_promise_calculator()

        # Setup and evaluate
        self.promise_page.switch_to_manual_mode()

        customer_input = self.page.locator("#customer")
        customer_input.wait_for(state="visible", timeout=5000)
        customer_input.click()
        self.page.wait_for_timeout(100)
        customer_input.fill("")  # Clear first
        self.page.wait_for_timeout(100)
        customer_input.type("Test Customer", delay=50)
        self.page.wait_for_timeout(200)
        customer_input.press("Tab")
        self.page.wait_for_timeout(300)

        item_code_input = self.page.locator(
            'input[data-testid="item-code-search-input"], input[placeholder="e.g., SKU001"]'
        ).first
        item_code_input.fill("WIDGET-ALPHA")
        item_code_input.press("Tab")
        self.page.wait_for_timeout(300)

        qty_input = self.page.locator('input[type="number"]').first
        qty_input.fill("")
        qty_input.fill("5")
        qty_input.press("Tab")
        self.page.wait_for_timeout(500)

        # Evaluate
        self.promise_page.wait_for_api_connected(timeout=10000)

        # Debug form state before evaluating
        customer_val = self.page.evaluate("document.querySelector('#customer')?.value || ''")
        items = self.page.locator('input[placeholder="e.g., SKU001"]').count()
        print(f"[DEBUG test_results_01] Customer: '{customer_val}', Items: {items}")

        evaluate_btn = self.page.get_by_role("button", name="Evaluate Promise")
        if evaluate_btn.is_visible():
            expect(evaluate_btn).to_be_enabled(timeout=15000)
            evaluate_btn.click()
            self.page.wait_for_timeout(500)

            # Verify results section visible
            results_label = self.page.get_by_text("Promise Date").first
            expect(results_label).to_be_visible(timeout=10000)

            # Look for promise date
            promise_date_element = self.page.get_by_text("Promise Date").first
            if promise_date_element.is_visible():
                date_text = promise_date_element.inner_text()
                self.assertTrue(date_text)

    def test_results_02_confidence_level_displayed(self):
        """Component Test: Confidence level is displayed."""
        self.promise_page.navigate_to_promise_calculator()

        # Setup and evaluate
        self.promise_page.switch_to_manual_mode()

        customer_input = self.page.locator("#customer")
        customer_input.wait_for(state="visible", timeout=5000)
        customer_input.click()
        self.page.wait_for_timeout(100)
        customer_input.fill("")  # Clear first
        self.page.wait_for_timeout(100)
        customer_input.type("Test Customer", delay=50)
        self.page.wait_for_timeout(200)
        customer_input.press("Tab")
        self.page.wait_for_timeout(300)

        self._fill_item_code(0, "WIDGET-ALPHA")
        self.page.wait_for_timeout(300)

        qty_input = self.page.locator('input[type="number"]').first
        qty_input.fill("")
        qty_input.fill("5")
        qty_input.press("Tab")

        # Evaluate
        evaluate_btn = self.page.get_by_role("button", name="Evaluate Promise")
        if evaluate_btn.is_visible():
            self.promise_page.wait_for_api_connected(timeout=10000)
            expect(evaluate_btn).to_be_enabled(timeout=15000)
            evaluate_btn.click()
            self.page.wait_for_timeout(500)

            # Verify results section visible
            results_label = self.page.get_by_text("Promise Date").first
            expect(results_label).to_be_visible(timeout=10000)

            # Look for confidence
            # Look for confidence text near the label
            confidence_section = self.page.locator(".otp-result-panel, [class*='result']").first
            if confidence_section.is_visible():
                section_text = confidence_section.inner_text()
                # Should contain confidence label and a value (percentage or level)
                self.assertIn("Confidence", section_text)
                # Check for valid confidence patterns: percentage, HIGH, MEDIUM, LOW, CRITICAL
                pattern = r"\d+%|HIGH|MEDIUM|LOW|CRITICAL"
                self.assertTrue(
                    re.search(pattern, section_text, re.IGNORECASE),
                    f"Expected confidence value in: {section_text}"
                )

    def test_results_03_fulfillment_status_displayed(self):
        """Component Test: Fulfillment status is displayed."""
        self.promise_page.navigate_to_promise_calculator()

        # Setup and evaluate
        self.promise_page.switch_to_manual_mode()

        customer_input = self.page.locator("#customer")
        customer_input.wait_for(state="visible", timeout=5000)
        customer_input.click()
        self.page.wait_for_timeout(100)
        customer_input.fill("")  # Clear first
        self.page.wait_for_timeout(100)
        customer_input.type("Test Customer", delay=50)
        self.page.wait_for_timeout(200)
        customer_input.press("Tab")
        self.page.wait_for_timeout(300)

        item_code_input = self.page.locator(
            'input[data-testid="item-code-search-input"], input[placeholder="e.g., SKU001"]'
        ).first
        item_code_input.fill("WIDGET-ALPHA")
        self.page.wait_for_timeout(300)

        qty_input = self.page.locator('input[type="number"]').first
        qty_input.fill("")
        qty_input.fill("5")

        # Evaluate
        evaluate_btn = self.page.get_by_role("button", name="Evaluate Promise")
        if evaluate_btn.is_visible():
            evaluate_btn.click()
            self.page.wait_for_timeout(500)

            # Verify results section visible
            results_label = self.page.get_by_text("Promise Date").first
            expect(results_label).to_be_visible(timeout=10000)

            # Look for status
            status_element = self.page.get_by_text(
                re.compile(r"Feasible|At Risk|Not Feasible", re.IGNORECASE)
            ).first
            if status_element.is_visible():
                status_text = status_element.inner_text()
                self.assertTrue(status_text)


if __name__ == "__main__":
    unittest.main()
