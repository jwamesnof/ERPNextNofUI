"""
Base Page Object for OTP Tests

Follows Page Object Model pattern from AutomationSamana25 course:
- Each page encapsulates selectors and interactions
- Methods return self for chaining
- Verification happens in constructor
- No assertions in page objects (only in tests)
"""

import os
from playwright.sync_api import Page


class BasePage:
    """Base page object with common utilities for all page objects."""

    def __init__(self, page: Page):
        """Initialize page object with Playwright page instance."""
        self.page = page

    def navigate_to(self, path: str = "/") -> "BasePage":
        """Navigate to a specific path."""
        base_url = os.environ.get("BASE_URL", "http://localhost:3000")
        self.page.goto(f"{base_url}{path}", timeout=60000)
        
        # Handle ngrok warning page (if present)
        self._handle_ngrok_warning()
        
        self.page.wait_for_load_state("domcontentloaded", timeout=30000)
        return self
    
    def _handle_ngrok_warning(self) -> None:
        """Handle ngrok warning page by clicking 'Visit Site' button if present."""
        max_retries = 3
        for attempt in range(max_retries):
            try:
                # Wait briefly for ngrok warning page to appear (if it exists)
                visit_button = self.page.get_by_role("button", name="Visit Site")
                if visit_button.is_visible(timeout=3000):
                    visit_button.click()
                    # Wait for actual page to load after clicking
                    self.page.wait_for_load_state("domcontentloaded", timeout=10000)
                    break
            except Exception as e:
                # No ngrok warning page, or button already handled
                if attempt == max_retries - 1:
                    pass  # Last attempt, just continue
                else:
                    pass  # Silently continue on other attempts

    def wait_for_network_idle(self, timeout: int = 5000) -> "BasePage":
        """Wait for network to be idle (for API calls)."""
        self.page.wait_for_load_state("networkidle", timeout=timeout)
        return self

    def fill_input(self, selector: str, value: str) -> "BasePage":
        """Fill input field with value."""
        self.page.locator(selector).fill(value)
        return self

    def get_input_value(self, selector: str) -> str:
        """Get value from input field."""
        return self.page.locator(selector).input_value()

    def click(self, selector: str) -> "BasePage":
        """Click on element."""
        self.page.locator(selector).click()
        return self

    def get_text(self, selector: str) -> str:
        """Get text from element."""
        return self.page.locator(selector).inner_text()

    def is_visible(self, selector: str) -> bool:
        """Check if element is visible."""
        return self.page.locator(selector).is_visible()

    def get_by_test_id(self, test_id: str):
        """Get element by test ID."""
        return self.page.get_by_test_id(test_id)

    def wait_for_visible(self, selector: str, timeout: int = 5000) -> "BasePage":
        """Wait for element to be visible."""
        self.page.locator(selector).wait_for(state="visible", timeout=timeout)
        return self

    def wait_for_hidden(self, selector: str, timeout: int = 5000) -> "BasePage":
        """Wait for element to be hidden."""
        self.page.locator(selector).wait_for(state="hidden", timeout=timeout)
        return self

    def wait_for_element_count(self, selector: str, count: int, timeout: int = 5000) -> "BasePage":
        """Wait for element count to match."""
        self.page.locator(selector).count() == count
        return self

    def get_by_role(self, role: str, name: str = None):
        """Get element by role."""
        if name:
            return self.page.get_by_role(role, name=name)
        return self.page.get_by_role(role)

    def select_option(self, selector: str, option_label: str) -> "BasePage":
        """Select option from dropdown."""
        self.page.locator(selector).select_option(label=option_label)
        return self
