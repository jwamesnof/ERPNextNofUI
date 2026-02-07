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
import sys
from playwright.sync_api import sync_playwright


class BrowserFactory:
    """Create Playwright browser instances from environment variables."""

    def __init__(self) -> None:
        self.browser_type = os.getenv("BROWSER", "chrome").lower()
        self.headless = os.getenv("HEADLESS", "false").lower() == "true"

        self.device_profile = os.getenv("DEVICE_PROFILE", "").lower()
        self.width = int(os.getenv("SCREEN_WIDTH", "1920"))
        self.height = int(os.getenv("SCREEN_HEIGHT", "1080"))
        self.is_mobile = False
        self.has_touch = False
        self.device_scale_factor = None

        if self.device_profile == "mobile":
            self.width, self.height = 375, 667
            self.is_mobile = True
            self.has_touch = True
            self.device_scale_factor = 2
        elif self.device_profile == "tablet":
            self.width, self.height = 768, 1024
            self.has_touch = True
        elif self.device_profile == "desktop":
            self.width, self.height = 1920, 1080

        slow_mo_env = os.getenv("SLOW_MO")
        if slow_mo_env is None and not self.headless:
            self.slow_mo = 100
        else:
            self.slow_mo = int(slow_mo_env or "0")

        self.playwright = None
        self.browser = None

        print(
            "[FACTORY] Browser: {browser}, Resolution: {w}x{h}, Headless: {headless}, "
            "Device: {device}, SlowMo: {slow}"
            .format(
                browser=self.browser_type,
                w=self.width,
                h=self.height,
                headless=self.headless,
                device=self.device_profile or "custom",
                slow=self.slow_mo,
            )
        )

    def start(self):
        """Start Playwright and launch a browser."""
        try:
            print("[FACTORY] Starting Playwright...")
            self.playwright = sync_playwright().start()
            print("[FACTORY] Playwright started successfully")
            
            print(f"[FACTORY] Launching {self.browser_type} browser...")
            self.browser = self._launch_browser()
            print("[FACTORY] Browser launched successfully")
            
            return self.browser
        except Exception as e:
            print(f"[ERROR] Failed to start browser: {e}")
            raise

    def _launch_browser(self):
        if self.browser_type in {"chrome", "chromium"}:
            return self.playwright.chromium.launch(
                headless=self.headless,
                slow_mo=self.slow_mo,
                timeout=60000,
                args=[
                    "--disable-features=WebBluetooth,WebUSB,WebSerial",
                    "--disable-notifications",
                    "--disable-popup-blocking",
                ],
            )
        if self.browser_type == "firefox":
            return self.playwright.firefox.launch(
                headless=self.headless, slow_mo=self.slow_mo, timeout=60000
            )
        if self.browser_type == "webkit":
            return self.playwright.webkit.launch(
                headless=self.headless, slow_mo=self.slow_mo, timeout=60000
            )
        raise ValueError(f"Unsupported browser: {self.browser_type}")

    def new_context(self):
        """Create a new browser context with configured viewport."""
        try:
            if not self.browser:
                self.start()
            
            print(f"[FACTORY] Creating context with viewport {self.width}x{self.height}")
            context_kwargs = {
                "viewport": {"width": self.width, "height": self.height},
                "ignore_https_errors": True,
                "extra_http_headers": {"ngrok-skip-browser-warning": "true"},
            }
            if self.device_scale_factor is not None:
                context_kwargs["device_scale_factor"] = self.device_scale_factor
            if self.is_mobile:
                context_kwargs["is_mobile"] = True
            if self.has_touch:
                context_kwargs["has_touch"] = True

            context = self.browser.new_context(**context_kwargs)
            print("[FACTORY] Context created successfully")
            return context
        except Exception as e:
            print(f"[ERROR] Failed to create context: {e}")
            raise

    def close(self) -> None:
        """Close browser and stop Playwright."""
        try:
            if self.browser:
                print("[FACTORY] Closing browser...")
                self.browser.close()
                print("[FACTORY] Browser closed")
            
            if self.playwright:
                print("[FACTORY] Stopping Playwright...")
                self.playwright.stop()
                print("[FACTORY] Playwright stopped")
        except Exception as e:
            print(f"[ERROR] Error during cleanup: {e}")
