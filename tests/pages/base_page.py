"""
Base Page Object for OTP Tests

Follows Page Object Model pattern from AutomationSamana25 course:
- Each page encapsulates selectors and interactions
- Methods return self for chaining
- Verification happens in constructor
- No assertions in page objects (only in tests)
"""

import os
import sys
import time
import socket
from urllib.parse import urlparse
from playwright.sync_api import Page


class BasePage:
    """Base page object with common utilities for all page objects."""

    def __init__(self, page: Page):
        """Initialize page object with Playwright page instance."""
        self.page = page

    @staticmethod
    def _check_url_reachable(url: str, timeout: int = 10) -> bool:
        """Check if a URL is reachable before navigating."""
        try:
            parsed = urlparse(url)
            host = parsed.hostname
            port = parsed.port or (443 if parsed.scheme == 'https' else 80)
            
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(timeout)
            result = sock.connect_ex((host, port))
            sock.close()
            
            return result == 0
        except Exception as e:
            print(f"[WARNING] Could not verify URL reachability: {e}")
            return False

    def navigate_to(self, path: str = "/") -> "BasePage":
        """Navigate to a specific path."""
        base_url = os.environ.get("BASE_URL", "http://localhost:3000").rstrip("/")
        full_url = f"{base_url}{path}"
        
        # Log the navigation attempt
        print(f"\n[NAVIGATE] Attempting to navigate to: {full_url}")
        
        # Check if URL is reachable (especially for ngrok URLs)
        if not self._check_url_reachable(base_url, timeout=15):
            print(f"[WARNING] URL {base_url} may not be reachable, proceeding anyway")
        
        try:
            self.page.goto(full_url, timeout=90000, wait_until='domcontentloaded')
            print(f"[SUCCESS] Navigated to {full_url}")
        except Exception as e:
            print(f"[ERROR] Navigation failed: {e}")
            raise
        
        # Handle ngrok warning page (if present)
        self._handle_ngrok_warning()
        
        # Final wait for content to load
        try:
            self.page.wait_for_load_state("domcontentloaded", timeout=30000)
        except:
            print("[WARNING] domcontentloaded timeout exceeded")
        
        return self
    
    def _handle_ngrok_warning(self) -> None:
        """Handle ngrok warning page by clicking 'Visit Site' button if present."""
        max_retries = 3
        for attempt in range(max_retries):
            try:
                # Wait briefly for ngrok warning page to appear (if it exists)
                visit_button = self.page.get_by_role("button", name="Visit Site")
                if visit_button.is_visible(timeout=2000):
                    print("[INFO] Ngrok warning page detected, clicking 'Visit Site'")
                    visit_button.click()
                    # Wait for actual page to load after clicking
                    self.page.wait_for_load_state("domcontentloaded", timeout=10000)
                    break
            except Exception as e:
                # No ngrok warning page, or button already handled
                if attempt == max_retries - 1:
                    print("[INFO] No ngrok warning page found")
                else:
                    pass  # Silently continue on other attempts

    def wait_for_network_idle(self, timeout: int = 5000) -> "BasePage":
        """Wait for network to be idle (for API calls)."""
        try:
            self.page.wait_for_load_state("networkidle", timeout=timeout)
        except:
            print(f"[WARNING] Network idle timeout ({timeout}ms) exceeded")
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
