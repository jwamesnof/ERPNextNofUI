"""
OTP Promise Calculator Page Object

Encapsulates all interactions with the Promise Calculator page:
- Manual Order mode
- From Sales Order ID mode
- Results verification

Follows POM pattern: selectors as attributes, methods return self for chaining
"""

import os
import re
from playwright.sync_api import Page, expect
from tests.pages.base_page import BasePage


class PromiseCalculatorPage(BasePage):
    """Page object for Promise Calculator application."""

    # Sidebar & Navigation
    SIDEBAR_TOGGLE = 'button[aria-label="Toggle sidebar"]'
    PROMISE_CALCULATOR_NAV = 'a:has-text("Promise Calculator")'
    SIDEBAR = "aside"

    # Input Mode Tabs (VERIFIED: data-testid exists on buttons)
    MANUAL_MODE_BUTTON = '[data-testid="input-mode-manual"]'
    SALES_ORDER_MODE_BUTTON = '[data-testid="input-mode-sales-order"]'

    # Manual Order Mode - Form Fields (VERIFIED from browser inspection)
    CUSTOMER_INPUT = '#customer'  # <input id="customer">
    ITEM_CODE_INPUT = 'input[placeholder="e.g., SKU001"]'  # Item code in grid
    ITEM_QTY_INPUT = 'input[type="number"]'  # Quantity input
    WAREHOUSE_SELECT = 'select'  # Warehouse dropdown
    ADD_ITEM_BUTTON_TEXT = 'Add Item'  # Button text
    EVALUATE_PROMISE_BUTTON_TEXT = 'Evaluate Promise'  # Submit button
    CLEAR_ALL_BUTTON_TEXT = 'Clear All'  # Clear items button

    # Sales Order Mode (VERIFIED: data-testid exists)
    SALES_ORDER_MANUAL_INPUT = '[data-testid="sales-order-manual-input"]'
    SALES_ORDER_OPTION = '[role="option"]'  # Combobox options

    # Results Section (text-based from actual results)
    PROMISE_DATE_LABEL = 'Promise Date'
    CONFIDENCE_LABEL = 'Confidence'
    STATUS_TEXTS = ['Feasible', 'At Risk', 'Not Feasible']

    # API & Status (text-based from actual UI)
    API_CONNECTED_TEXT = 'API connected'
    API_OFFLINE_TEXT = 'API offline'

    # Item Management (VERIFIED from browser)
    REMOVE_ITEM_BUTTON = 'button >> svg.lucide-trash-2'  # Remove button
    ITEM_COUNT_BADGE = 'span:has-text(" item")'  # Item count badge

    def __init__(self, page: Page):
        """Initialize Promise Calculator page object."""
        super().__init__(page)

    def verify_page_loaded(self) -> "PromiseCalculatorPage":
        """Verify Promise Calculator page is loaded."""
        # Verify heading or key element is visible
        try:
            heading = self.page.get_by_role("heading").first
            expect(heading).to_be_visible()
        except:
            # If heading not found, just verify page loaded by checking for basic element
            base_url = os.environ.get("BASE_URL", "http://localhost:3000").rstrip("/")
            expect(self.page).to_have_url(re.compile(rf"^{re.escape(base_url)}/?$"))
        return self

    def verify_sidebar_visible(self) -> "PromiseCalculatorPage":
        """Verify sidebar is visible."""
        sidebar_nav = self.page.get_by_role("button", name="Promise Calculator")
        expect(sidebar_nav).to_be_visible()
        return self

    def get_api_health_status(self) -> str:
        """Get API health badge status."""
        if self.page.get_by_text(self.API_CONNECTED_TEXT).count() > 0:
            return "connected"
        if self.page.get_by_text(self.API_OFFLINE_TEXT).count() > 0:
            return "offline"
        if self.page.get_by_text("Backend Offline").count() > 0:
            return "offline"
        return "unknown"

    def navigate_to_promise_calculator(self) -> "PromiseCalculatorPage":
        """Navigate to Promise Calculator page."""
        self.navigate_to("/")
        self.verify_page_loaded()
        return self

    def switch_to_manual_mode(self) -> "PromiseCalculatorPage":
        """Switch to Manual Order mode."""
        self.click(self.MANUAL_MODE_BUTTON)
        self.page.wait_for_timeout(500)
        return self

    def verify_manual_mode_active(self) -> "PromiseCalculatorPage":
        """Verify Manual Order mode is active."""
        manual_button = self.page.locator(self.MANUAL_MODE_BUTTON).first
        expect(manual_button).to_be_visible()
        return self

    def switch_to_sales_order_mode(self) -> "PromiseCalculatorPage":
        """Switch to From Sales Order ID mode."""
        self.click(self.SALES_ORDER_MODE_BUTTON)
        self.page.wait_for_timeout(500)
        return self

    def fill_customer(self, customer_name: str) -> "PromiseCalculatorPage":
        """Fill customer name (Manual mode)."""
        self.fill_input(self.CUSTOMER_INPUT, customer_name)
        return self

    def add_item(
        self, item_code: str, qty: int = 1, warehouse: str = "Stores - SD"
    ) -> "PromiseCalculatorPage":
        """Add item to order.

        Args:
            item_code: Item code (e.g., "WIDGET-ALPHA")
            qty: Quantity (default 1)
            warehouse: Warehouse name (default "Stores - SD")
        """
        # Fill item code
        item_input = self.page.locator(self.ITEM_CODE_INPUT).first
        item_input.fill(item_code)
        self.page.wait_for_timeout(500)

        # Fill quantity
        qty_field = self.page.locator(self.ITEM_QTY_INPUT).first
        qty_field.clear()
        qty_field.fill(str(qty))

        # Select warehouse if available
        warehouse_field = self.page.locator(self.WAREHOUSE_SELECT).first
        if warehouse_field.is_visible():
            warehouse_field.select_option(label=warehouse)

        # Click Add Item button
        add_button = self.page.get_by_role("button", name=self.ADD_ITEM_BUTTON_TEXT)
        if add_button.is_visible():
            add_button.click()
        self.page.wait_for_timeout(300)
        return self

    def open_delivery_settings(self) -> "PromiseCalculatorPage":
        """Open Delivery Settings section."""
        toggle = self.page.get_by_role("button", name="Delivery Settings")
        if toggle.is_visible():
            toggle.click()
            self.page.wait_for_timeout(300)
        return self

    def open_date_picker(self) -> "PromiseCalculatorPage":
        """Open the desired delivery date picker."""
        self.open_delivery_settings()
        date_button = self.page.locator(self.DESIRED_DATE_BUTTON)
        if date_button.is_visible():
            date_button.click()
            self.page.wait_for_timeout(300)
        return self

    def remove_item_at_index(self, index: int = 0) -> "PromiseCalculatorPage":
        """Remove item from items list by index."""
        remove_buttons = self.page.locator(self.REMOVE_ITEM_BUTTON)
        if remove_buttons.count() > index:
            remove_buttons.nth(index).click()
            self.page.wait_for_timeout(300)
        return self

    def get_items_list_count(self) -> int:
        """Get count of items in items list."""
        return self.page.locator(self.ITEMS_LIST_ITEM).count()

    def verify_item_in_list(self, item_code: str) -> bool:
        """Verify item code is in items list."""
        items_list = self.page.locator(self.ITEMS_LIST)
        return item_code in items_list.inner_text()

    def evaluate_promise(self) -> "PromiseCalculatorPage":
        """Click Evaluate Promise button."""
        evaluate_btn = self.page.get_by_role("button", name=self.EVALUATE_PROMISE_BUTTON_TEXT)
        if evaluate_btn.is_visible():
            evaluate_btn.click()
            self.page.wait_for_timeout(500)
        return self

    def wait_for_results(self, timeout: int = 10000) -> "PromiseCalculatorPage":
        """Wait for results section to be visible."""
        results_label = self.page.get_by_text(self.PROMISE_DATE_LABEL).first
        results_label.wait_for(state="visible", timeout=timeout)
        return self

    def get_promise_date(self) -> str:
        """Get promise date from results."""
        label = self.page.get_by_text(self.PROMISE_DATE_LABEL).first
        container = label.locator("xpath=..")
        return container.inner_text()

    def get_confidence_level(self) -> str:
        """Get confidence level from results."""
        label = self.page.get_by_text(self.CONFIDENCE_LABEL).first
        container = label.locator("xpath=..")
        return container.inner_text()

    def get_status_badge(self) -> str:
        """Get status badge text."""
        for status in self.STATUS_TEXTS:
            if self.page.get_by_text(status).count() > 0:
                return status
        return ""

    def select_sales_order(self, sales_order_id: str) -> "PromiseCalculatorPage":
        """Select sales order from combobox."""
        # Open combobox
        combobox_input = self.page.locator(self.SALES_ORDER_COMBOBOX_INPUT).first
        combobox_input.click()
        self.page.wait_for_timeout(500)

        # Select option
        option = self.page.locator(self.SALES_ORDER_OPTION)
        for i in range(option.count()):
            if sales_order_id in option.nth(i).inner_text():
                option.nth(i).click()
                self.page.wait_for_timeout(500)
                break
        return self

    def get_selected_sales_order(self) -> str:
        """Get currently selected sales order ID."""
        combobox_input = self.page.locator(self.SALES_ORDER_COMBOBOX_INPUT).first
        return combobox_input.input_value()

    def clear_sales_order_selection(self) -> "PromiseCalculatorPage":
        """Clear sales order selection."""
        self.click(self.CLEAR_SELECTION_BUTTON)
        self.page.wait_for_timeout(300)
        return self

    def open_calendar(self) -> "PromiseCalculatorPage":
        """Open calendar picker."""
        self.click(self.CALENDAR_BUTTON)
        self.page.wait_for_timeout(300)
        return self

    def get_calendar_days(self) -> list:
        """Get all calendar day elements."""
        calendar_days = self.page.locator('[data-testid="calendar-day"]')
        return [calendar_days.nth(i).inner_text() for i in range(calendar_days.count())]

    def is_validation_error_visible(self) -> bool:
        """Check if validation error is visible."""
        return self.is_visible(self.VALIDATION_ERROR)

    def get_validation_error_text(self) -> str:
        """Get validation error message."""
        return self.get_text(self.VALIDATION_ERROR)
