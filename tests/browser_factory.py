"""
Browser factory for Playwright tests.

Creates browser instances based on environment variables:
- BROWSER: chrome | chromium | firefox | webkit (default: chrome)
- SCREEN_WIDTH: viewport width (default: 1920)
- SCREEN_HEIGHT: viewport height (default: 1080)
- HEADLESS: true | false (default: false)
- SLOW_MO: integer milliseconds (default: 0)
"""

import os
from playwright.sync_api import sync_playwright


class BrowserFactory:
    """Create Playwright browser instances from environment variables."""

    def __init__(self) -> None:
        self.browser_type = os.getenv("BROWSER", "chrome").lower()
        self.width = int(os.getenv("SCREEN_WIDTH", "1920"))
        self.height = int(os.getenv("SCREEN_HEIGHT", "1080"))
        self.headless = os.getenv("HEADLESS", "false").lower() == "true"
        self.slow_mo = int(os.getenv("SLOW_MO", "0"))
        self.playwright = None
        self.browser = None

    def start(self):
        """Start Playwright and launch a browser."""
        self.playwright = sync_playwright().start()
        self.browser = self._launch_browser()
        return self.browser

    def _launch_browser(self):
        if self.browser_type in {"chrome", "chromium"}:
            return self.playwright.chromium.launch(
                headless=self.headless, slow_mo=self.slow_mo
            )
        if self.browser_type == "firefox":
            return self.playwright.firefox.launch(
                headless=self.headless, slow_mo=self.slow_mo
            )
        if self.browser_type == "webkit":
            return self.playwright.webkit.launch(
                headless=self.headless, slow_mo=self.slow_mo
            )
        raise ValueError(f"Unsupported browser: {self.browser_type}")

    def new_context(self):
        """Create a new browser context with configured viewport."""
        if not self.browser:
            self.start()
        return self.browser.new_context(
            viewport={"width": self.width, "height": self.height}
        )

    def close(self) -> None:
        """Close browser and stop Playwright."""
        if self.browser:
            self.browser.close()
        if self.playwright:
            self.playwright.stop()
