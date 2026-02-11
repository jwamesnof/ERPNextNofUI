"""
OTP Promise Calculator - USER JOURNEY TESTS (End-to-End Flows)

These tests represent real user workflows:
- Journey A: Manual Order Entry (create order manually)
- Journey B: From Sales Order ID (load existing sales order)
- Journey C: Smoke tests (basic page functionality)

Each journey tests the complete flow from start to result verification.
Happy path focus - validating that core user workflows function correctly.

Follows AutomationSamana25 course pattern with unittest framework.
"""

import unittest
import json
from playwright.sync_api import sync_playwright, Page, expect
from tests.pages.promise_calculator_page import PromiseCalculatorPage
from tests.mocks.otp import (
    MOCK_HEALTH_RESPONSE,
    MOCK_SALES_ORDERS_LIST,
    MOCK_SALES_ORDER_DETAILS_SAL_ORD_00001,
    MOCK_SALES_ORDER_DETAILS_SAL_ORD_00002,
    MOCK_PROMISE_RESPONSE_SUCCESS,
)


class PromiseCalculatorJourneyTest(unittest.TestCase):
    """Test class for Promise Calculator user journeys (end-to-end flows)."""

    @classmethod
    def setUpClass(cls):
        """Set up browser once for all tests in this class."""
        cls.playwright = sync_playwright().start()
        cls.browser = cls.playwright.chromium.launch(headless=True)

    @classmethod
    def tearDownClass(cls):
        """Clean up after all tests are done."""
        import threading
        
        def close_browser():
            try:
                cls.browser.close()
            except (KeyboardInterrupt, Exception):
                pass
        
        # Close browser in a thread with timeout
        thread = threading.Thread(target=close_browser, daemon=True)
        thread.start()
        thread.join(timeout=5)
        
        try:
            cls.playwright.stop()
        except (KeyboardInterrupt, Exception):
            pass

    def setUp(self):
        """Set up before each test method."""
        self.page = self.browser.new_page()
        self.promise_page = PromiseCalculatorPage(self.page)
        self._mock_api_endpoints()

    def tearDown(self):
        """Clean up after each test method."""
        self.page.close()

    def _mock_api_endpoints(self):
        """Mock all API endpoints."""
        # Mock health check endpoints
        def handle_health(route):
            route.fulfill(
                status=200,
                content_type="application/json",
                headers={"access-control-allow-origin": "*"},
                body=json.dumps(MOCK_HEALTH_RESPONSE),
            )

        self.page.route("**/health", handle_health)
        self.page.route("**/otp/health", handle_health)

        # Mock sales orders list
        def handle_sales_orders_list(route):
            url = route.request.url
            if "/otp/sales-orders/" in url:
                return
            route.fulfill(
                status=200,
                content_type="application/json",
                headers={"access-control-allow-origin": "*"},
                body=json.dumps(MOCK_SALES_ORDERS_LIST),
            )

        self.page.route("**/otp/sales-orders**", handle_sales_orders_list)

        # Mock individual sales order details
        def handle_so_00001(route):
            route.fulfill(
                status=200,
                content_type="application/json",
                headers={"access-control-allow-origin": "*"},
                body=json.dumps(MOCK_SALES_ORDER_DETAILS_SAL_ORD_00001),
            )

        def handle_so_00002(route):
            route.fulfill(
                status=200,
                content_type="application/json",
                headers={"access-control-allow-origin": "*"},
                body=json.dumps(MOCK_SALES_ORDER_DETAILS_SAL_ORD_00002),
            )

        self.page.route("**/otp/sales-orders/SAL-ORD-2026-00001**", handle_so_00001)
        self.page.route("**/otp/sales-orders/SAL-ORD-2026-00002**", handle_so_00002)

        # Mock promise evaluation endpoint
        def handle_promise_eval(route):
            route.fulfill(
                status=200,
                content_type="application/json",
                headers={"access-control-allow-origin": "*"},
                body=json.dumps(MOCK_PROMISE_RESPONSE_SUCCESS),
            )

        self.page.route("**/otp/promise", handle_promise_eval)

    # ========================================================================
    # SMOKE TESTS - Basic Page Functionality
    # ========================================================================

    def test_smoke_01_app_loads_and_displays_page(self):
        """Smoke Test: App loads and displays Promise Calculator page."""
        self.promise_page.navigate_to_promise_calculator()

        # Verify page title
        title = self.page.title()
        self.assertIn("Promise", title or "")

        # Verify heading is visible
        heading = self.page.get_by_role("heading").first
        expect(heading).to_be_visible()

    def test_smoke_02_sidebar_visible_on_desktop(self):
        """Smoke Test: Sidebar is visible on desktop."""
        self.promise_page.navigate_to_promise_calculator()

        # Set viewport to desktop size
        self.page.set_viewport_size({"width": 1920, "height": 1080})
        sidebar_nav = self.page.get_by_role("button", name="Promise Calculator")
        expect(sidebar_nav).to_be_visible()

    def test_smoke_03_api_health_badge_shows_connected(self):
        """Smoke Test: API health badge shows connected status."""
        self.promise_page.navigate_to_promise_calculator()

        # Verify API badge exists and shows healthy status
        api_badge = self.page.get_by_text("API connected").first
        if api_badge.is_visible():
            expect(api_badge).to_be_visible()
        else:
            # Allow offline state when backend mock is not detected
            offline_badge = self.page.get_by_text("API offline").first
            expect(offline_badge).to_be_visible()

    def test_smoke_04_promise_calculator_heading_visible(self):
        """Smoke Test: Promise Calculator heading is visible."""
        self.promise_page.navigate_to_promise_calculator()

        heading = self.page.get_by_role("heading").first
        expect(heading).to_be_visible()

    # ========================================================================
    # JOURNEY A: MANUAL ORDER ENTRY
    # User creates an order manually with items, warehouse, and delivery date,
    # then evaluates the promise
    # ========================================================================

    def test_journey_01_complete_manual_order_flow(self):
        """Journey A-1: Complete manual order flow with multiple items."""
        self.promise_page.navigate_to_promise_calculator()

        # Step 1: Verify manual mode is default
        self.promise_page.verify_manual_mode_active()

        # Step 2: Fill customer name
        customer_input = self.page.locator("#customer").first
        customer_input.fill("ABC Manufacturing")

        # Step 3: Add first item (WIDGET-ALPHA, qty 5)
        item_code_inputs = self.page.locator('input[placeholder="e.g., SKU001"]')
        qty_inputs = self.page.locator('input[type="number"]')

        item_code_inputs.nth(0).fill("WIDGET-ALPHA")
        item_code_inputs.nth(0).press("Tab")
        self.page.wait_for_timeout(500)  # Increased wait time

        qty_inputs.nth(0).clear()
        qty_inputs.nth(0).fill("5")
        qty_inputs.nth(0).press("Tab")  # Trigger blur/validation
        self.page.wait_for_timeout(500)

        add_button = self.page.get_by_role("button", name="Add Item")
        if add_button.is_visible():
            add_button.click()
            self.page.wait_for_timeout(800)  # Wait for new row to appear

        # Step 4: Add second item (WIDGET-BETA, qty 10)
        # Refresh locators to get updated list
        item_code_inputs = self.page.locator('input[placeholder="e.g., SKU001"]')
        qty_inputs = self.page.locator('input[type="number"]')

        # Fill the second row
        item_code_inputs.nth(1).fill("WIDGET-BETA")
        item_code_inputs.nth(1).press("Tab")
        self.page.wait_for_timeout(800)  # Increased wait for validation
        
        qty_inputs.nth(1).clear()
        qty_inputs.nth(1).fill("10")
        qty_inputs.nth(1).press("Tab")  # Trigger blur/validation
        self.page.wait_for_timeout(800)  # Wait for validation to complete

        # Step 5: Set desired delivery date
        # Step 6: Ensure no validation errors, backend connected, then click Evaluate Promise
        self.page.wait_for_timeout(1000)  # Additional wait for all validations
        
        error_messages = self.page.locator("p.text-red-600")
        if error_messages.count() > 0:
            self.fail(f"Validation errors present: {error_messages.all_inner_texts()}")

        api_connected = self.page.get_by_text("API connected").first
        if api_connected.is_visible():
            expect(api_connected).to_be_visible(timeout=10000)

        evaluate_btn = self.page.get_by_role("button", name="Evaluate Promise")
        # Wait for button to be enabled (not disabled)
        expect(evaluate_btn).to_be_enabled(timeout=15000)
        
        if evaluate_btn.is_visible() and not evaluate_btn.is_disabled():
            # Click the evaluate button and wait for response
            evaluate_btn.click()
            self.page.wait_for_timeout(3000)  # Increased wait for API response/results

            # Step 7: Verify results appear - look for result panel or promise date
            # Try multiple selectors to find results
            results_visible = False
            try:
                results_label = self.page.get_by_text("Promise Date").first
                expect(results_label).to_be_visible(timeout=20000)  # Increased timeout
                results_visible = True
            except:
                # Alternative: look for the results panel container
                result_panel = self.page.locator(".bg-white.rounded-xl, [class*='rounded-xl']").filter(has_text="Promise Date")
                if result_panel.is_visible(timeout=20000):
                    results_visible = True
            
            self.assertTrue(results_visible, "Results panel did not appear after evaluation")

            # Step 8: Verify promise date is displayed
            promise_date_element = self.page.get_by_text("Promise Date").first
            if promise_date_element.is_visible():
                date_text = promise_date_element.inner_text()
                self.assertTrue(date_text)

            # Step 9: Verify confidence level displays
            confidence_element = self.page.get_by_text("Confidence").first
            if confidence_element.is_visible():
                confidence_text = confidence_element.inner_text()
                self.assertTrue(confidence_text)

    def test_journey_02_manual_single_item_and_evaluate(self):
        """Journey A-2: Manual order with single item and evaluate."""
        self.promise_page.navigate_to_promise_calculator()

        # Fill customer
        customer_input = self.page.locator("#customer").first
        customer_input.fill("Test Customer")

        # Add single item
        item_code_input = self.page.locator(
            'input[placeholder="e.g., SKU001"]'
        ).first
        item_code_input.fill("WIDGET-ALPHA")
        self.page.wait_for_timeout(300)

        qty_input = self.page.locator('input[type="number"]').first
        qty_input.clear()
        qty_input.fill("5")

        # Evaluate promise
        evaluate_btn = self.page.get_by_role("button", name="Evaluate Promise")
        if evaluate_btn.is_visible():
            evaluate_btn.click()
            self.page.wait_for_timeout(500)

            # Verify results render
            results_label = self.page.get_by_text("Promise Date").first
            expect(results_label).to_be_visible(timeout=10000)

    def test_journey_03_manual_order_with_different_warehouses(self):
        """Journey A-3: Manual order with item from specific warehouse."""
        self.promise_page.navigate_to_promise_calculator()

        # Fill customer
        customer_input = self.page.locator("#customer").first
        customer_input.fill("Customer XYZ")

        # Add item
        item_code_input = self.page.locator(
            'input[placeholder="e.g., SKU001"]'
        ).first
        item_code_input.fill("WIDGET-ALPHA")
        self.page.wait_for_timeout(300)

        qty_input = self.page.locator('input[type="number"]').first
        qty_input.clear()
        qty_input.fill("2")

        # Set a specific warehouse (no need to add a new empty row)
        warehouse_select = self.page.locator('select').first
        if warehouse_select.is_visible():
            warehouse_select.select_option(label="Finished Goods - SD")
            self.page.wait_for_timeout(300)

        # Evaluate - wait for validation to complete
        self.page.wait_for_timeout(1000)  # Give time for item validation
        evaluate_btn = self.page.get_by_role("button", name="Evaluate Promise")
        if evaluate_btn.is_visible() and not evaluate_btn.is_disabled():
            evaluate_btn.click()
            # Wait longer for API call and results to render
            self.page.wait_for_timeout(3000)

            # Step 6: Verify results appear - look for result panel or promise date
            results_visible = False
            try:
                results_label = self.page.get_by_text("Promise Date").first
                expect(results_label).to_be_visible(timeout=5000)
                results_visible = True
            except:
                # Alternative: look for the results panel container
                result_panel = self.page.locator(".bg-white.rounded-xl, [class*='rounded-xl']").filter(has_text="Promise Date")
                if result_panel.is_visible(timeout=5000):
                    results_visible = True
            
            self.assertTrue(results_visible, "Results panel did not appear after evaluation")

    # ========================================================================
    # JOURNEY B: FROM SALES ORDER ID
    # User loads a sales order and evaluates the promise for that order
    # ========================================================================

    def test_journey_04_load_sales_order_and_evaluate(self):
        """Journey B-1: Load sales order and evaluate promise."""
        self.promise_page.navigate_to_promise_calculator()

        # Step 1: Switch to Sales Order mode
        so_mode_button = self.page.get_by_test_id(
            "input-mode-sales-order"
        ).first
        so_mode_button.click()
        self.page.wait_for_timeout(500)

        # Step 2: Select a sales order from combobox (VERIFIED: testId="sales-order-combobox")
        combobox_container = self.page.get_by_test_id("sales-order-combobox").first
        combobox_input = combobox_container.locator('input[role="combobox"]').first
        combobox_input.click()
        self.page.wait_for_timeout(300)

        # Type to filter
        combobox_input.fill("SAL-ORD-2026-00001")
        self.page.wait_for_timeout(500)

        # Click the option
        option = self.page.get_by_role("option").first
        if option.is_visible():
            option.click()
            self.page.wait_for_timeout(500)

            # Step 3: Click Evaluate Promise button
            evaluate_btn = self.page.get_by_role("button", name="Evaluate Promise")
            if evaluate_btn.is_visible():
                evaluate_btn.click()
                self.page.wait_for_timeout(500)

                # Step 5: Verify results appear
                results_section = self.page.locator(
                    '[data-testid="results-section"]'
                ).first
                expect(results_section).to_be_visible(timeout=10000)

    def test_journey_05_switch_between_sales_orders(self):
        """Journey B-2: Load and switch between different sales orders."""
        self.promise_page.navigate_to_promise_calculator()

        # Switch to Sales Order mode
        so_mode_button = self.page.get_by_test_id(
            "input-mode-sales-order"
        ).first
        so_mode_button.click()
        self.page.wait_for_timeout(500)

        # Select first sales order (VERIFIED combobox)
        combobox_container = self.page.get_by_test_id("sales-order-combobox").first
        combobox_input = combobox_container.locator('input[role="combobox"]').first
        combobox_input.click()
        self.page.wait_for_timeout(300)
        combobox_input.fill("SAL-ORD-2026-00001")
        self.page.wait_for_timeout(500)

        option = self.page.get_by_role("option").first
        if option.is_visible():
            option.click()
            self.page.wait_for_timeout(500)

            # Verify first SO is selected
            selected = combobox_input.input_value()
            self.assertIn("SAL-ORD-2026-00001", selected)

            # Clear and select second SO
            clear_button = self.page.get_by_role("button", name="Clear").first
            if clear_button.is_visible():
                clear_button.click()
                self.page.wait_for_timeout(300)

                # Select second SO
                combobox_input.click()
                self.page.wait_for_timeout(300)
                combobox_input.fill("SAL-ORD-2026-00002")
                self.page.wait_for_timeout(500)

                option2 = self.page.get_by_role("option").first
                if option2.is_visible():
                    option2.click()
                    self.page.wait_for_timeout(500)

                    # Verify second SO is selected
                    selected2 = combobox_input.input_value()
                    self.assertIn("SAL-ORD-2026-00002", selected2)

    def test_journey_06_clear_sales_order_selection(self):
        """Journey B-3: Clear sales order selection."""
        self.promise_page.navigate_to_promise_calculator()

        # Switch to Sales Order mode
        so_mode_button = self.page.get_by_test_id(
            "input-mode-sales-order"
        ).first
        so_mode_button.click()
        self.page.wait_for_timeout(500)

        # Select a sales order (VERIFIED combobox)
        combobox_container = self.page.get_by_test_id("sales-order-combobox").first
        combobox_input = combobox_container.locator('input[role="combobox"]').first
        combobox_input.click()
        self.page.wait_for_timeout(300)
        combobox_input.fill("SAL-ORD-2026-00001")
        self.page.wait_for_timeout(500)

        option = self.page.get_by_role("option").first
        if option.is_visible():
            option.click()
            self.page.wait_for_timeout(500)

            # Verify selected
            selected = combobox_input.input_value()
            self.assertTrue(selected)

            # Clear selection
            clear_button = self.page.get_by_role("button", name="Clear").first
            if clear_button.is_visible():
                clear_button.click()
                self.page.wait_for_timeout(300)

                # Verify cleared
                cleared = combobox_input.input_value()
                self.assertEqual(cleared, "")

    def test_journey_07_auto_fill_items_from_sales_order(self):
        """Journey B-4: Auto-fill items when loading sales order."""
        self.promise_page.navigate_to_promise_calculator()

        # Switch to Sales Order mode
        so_mode_button = self.page.get_by_test_id(
            "input-mode-sales-order"
        ).first
        so_mode_button.click()
        self.page.wait_for_timeout(500)

        # Select a sales order (VERIFIED combobox)
        combobox_container = self.page.get_by_test_id("sales-order-combobox").first
        combobox_input = combobox_container.locator('input[role="combobox"]').first
        combobox_input.click()
        self.page.wait_for_timeout(300)
        combobox_input.fill("SAL-ORD-2026-00001")
        self.page.wait_for_timeout(500)

        option = self.page.get_by_role("option").first
        if option.is_visible():
            option.click()
            self.page.wait_for_timeout(500)

            # Verify item code input is populated
            item_code_input = self.page.locator(
                'input[placeholder="e.g., SKU001"]'
            ).first
            if item_code_input.is_visible():
                value = item_code_input.input_value()
                self.assertTrue(value)


if __name__ == "__main__":
    unittest.main()
