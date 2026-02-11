/**
 * Base Page Object for OTP Tests
 * 
 * Follows Page Object Model pattern from AutomationSamana25 course:
 * - Each page encapsulates selectors and interactions
 * - Methods return page objects for chaining
 * - Verification happens in constructor
 * - No assertions in page objects (only in tests)
 */

import { Page, expect } from '@playwright/test';

export class BasePage {
  protected page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Navigate to a specific path
   */
  async navigateTo(path: string = '/') {
    await this.page.goto(path);
  }

  /**
   * Wait for network to be idle (for API calls)
   */
  async waitForNetworkIdle() {
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Fill input field with value
   */
  async fillInput(selector: string, value: string) {
    await this.page.locator(selector).fill(value);
  }

  /**
   * Get value from input field
   */
  async getInputValue(selector: string): Promise<string> {
    return await this.page.locator(selector).inputValue();
  }

  /**
   * Click on element
   */
  async click(selector: string) {
    await this.page.locator(selector).click();
  }

  /**
   * Get text from element
   */
  async getText(selector: string): Promise<string> {
    return await this.page.locator(selector).innerText();
  }

  /**
   * Check if element is visible
   */
  async isVisible(selector: string): Promise<boolean> {
    return await this.page.locator(selector).isVisible();
  }

  /**
   * Get element by test ID
   */
  getByTestId(testId: string) {
    return this.page.getByTestId(testId);
  }

  /**
   * Wait for element to be visible
   */
  async waitForVisible(selector: string, timeout = 5000) {
    await this.page.locator(selector).waitFor({ state: 'visible', timeout });
  }

  /**
   * Wait for element to be hidden
   */
  async waitForHidden(selector: string, timeout = 5000) {
    await this.page.locator(selector).waitFor({ state: 'hidden', timeout });
  }
}
