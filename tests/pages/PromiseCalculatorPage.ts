/**
 * OTP Promise Calculator Page Object
 * 
 * Encapsulates all interactions with the Promise Calculator page:
 * - Manual Order mode
 * - From Sales Order ID mode
 * - Results verification
 * 
 * Follows POM pattern: selectors as attributes, methods return this for chaining
 */

import { Page, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class PromiseCalculatorPage extends BasePage {
  // Sidebar & Navigation
  private readonly sidebarToggle = 'button[aria-label="Toggle sidebar"]';
  private readonly promiseCalculatorNav = 'a:has-text("Promise Calculator")';
  private readonly sidebar = 'aside';

  // Input Mode Tabs
  private readonly manualModeButton = '[data-testid="input-mode-manual"]';
  private readonly salesOrderModeButton = '[data-testid="input-mode-sales-order"]';

  // Manual Order Mode - Form Fields
  private readonly customerInput = '[data-testid="customer-input"]';
  private readonly itemCodeInput = '[data-testid="item-code-input"]';
  private readonly itemQtyInput = '[data-testid="item-qty-input"]';
  private readonly warehouseSelect = '[data-testid="warehouse-select"]';
  private readonly desiredDateInput = '[data-testid="desired-date-input"]';
  private readonly addItemButton = '[data-testid="add-item-button"]';
  private readonly removeItemButton = '[data-testid="remove-item-button"]';
  private readonly evaluatePromiseButton = '[data-testid="evaluate-promise-button"]';

  // Sales Order Mode
  private readonly salesOrderComboboxInput = '[data-testid="sales-order-combobox-input"]';
  private readonly salesOrderOption = 'div[role="option"]';
  private readonly clearSelectionButton = '[data-testid="clear-selection-button"]';

  // Results Section
  private readonly resultsSection = '[data-testid="results-section"]';
  private readonly promiseDateResult = '[data-testid="promise-date-result"]';
  private readonly confidenceLevelResult = '[data-testid="confidence-level-result"]';
  private readonly driversListSection = '[data-testid="drivers-list"]';
  private readonly statusBadge = '[data-testid="status-badge"]';

  // API & Status
  private readonly apiHealthBadge = '[data-testid="api-health-badge"]';
  private readonly loadingSpinner = '[data-testid="loading-spinner"]';

  // Calendar & Validation
  private readonly calendarButton = '[data-testid="calendar-button"]';
  private readonly validationError = '[data-testid="validation-error"]';

  constructor(page: Page) {
    super(page);
  }

  /**
   * Verify Promise Calculator page is loaded
   */
  async verifyPageLoaded() {
    // Verify heading or key element is visible
    const heading = await this.page.getByRole('heading', { name: /Promise Calculator|OTP/i }).first();
    await expect(heading).toBeVisible();
  }

  /**
   * Verify sidebar is visible
   */
  async verifySidebarVisible() {
    await expect(this.page.locator(this.sidebar)).toBeVisible();
  }

  /**
   * Get API health badge status
   */
  async getApiHealthStatus(): Promise<string> {
    const badge = this.getByTestId('api-health-badge');
    return await badge.getAttribute('data-status') || '';
  }

  /**
   * Switch to Manual Order mode
   */
  async switchToManualMode() {
    await this.click(this.manualModeButton);
    return this;
  }

  /**
   * Verify Manual Order mode is active
   */
  async verifyManualModeActive() {
    const manualButton = this.page.locator(this.manualModeButton).first();
    await expect(manualButton).toBeVisible();
    return this;
  }

  /**
   * Switch to From Sales Order ID mode
   */
  async switchToSalesOrderMode() {
    await this.click(this.salesOrderModeButton);
    return this;
  }

  /**
   * Fill customer name (Manual mode)
   */
  async fillCustomer(customerName: string) {
    await this.fillInput(this.customerInput, customerName);
    return this;
  }

  /**
   * Add item to order
   * @param itemCode - Item code (e.g., "WIDGET-ALPHA")
   * @param qty - Quantity
   * @param warehouse - Warehouse name
   */
  async addItem(itemCode: string, qty: number = 1, warehouse: string = 'Stores - SD') {
    // Fill item code
    await this.fillInput(this.itemCodeInput, itemCode);
    // Wait for item to be found/validated
    await this.page.waitForTimeout(500); // Small wait for autocomplete
    
    // Fill quantity
    const qtyField = this.page.locator(this.itemQtyInput).first();
    await qtyField.clear();
    await qtyField.fill(qty.toString());

    // Select warehouse if available
    if (warehouse) {
      const warehouseField = this.page.locator(this.warehouseSelect).first();
      if (await warehouseField.isVisible()) {
        await warehouseField.selectOption({ label: warehouse });
      }
    }

    // Click Add Item button
    await this.click(this.addItemButton);
    return this;
  }

  /**
   * Set desired delivery date
   */
  async setDesiredDate(dateString: string) {
    await this.fillInput(this.desiredDateInput, dateString);
    return this;
  }

  /**
   * Click Evaluate Promise button
   */
  async clickEvaluatePromise() {
    await this.click(this.evaluatePromiseButton);
    // Wait for results to appear or loading to complete
    await this.page.waitForTimeout(500);
    return this;
  }

  /**
   * Wait for results to be visible
   */
  async waitForResults(timeout = 10000) {
    await this.waitForVisible(this.resultsSection, timeout);
    return this;
  }

  /**
   * Get promise date from results
   */
  async getPromiseDate(): Promise<string> {
    const element = this.getByTestId('promise-date-result');
    return await element.innerText();
  }

  /**
   * Get confidence level from results
   */
  async getConfidenceLevel(): Promise<string> {
    const element = this.getByTestId('confidence-level-result');
    return await element.innerText();
  }

  /**
   * Get status badge text
   */
  async getStatusBadge(): Promise<string> {
    const element = this.getByTestId('status-badge');
    return await element.innerText();
  }

  /**
   * Check if drivers list is visible
   */
  async areDriversVisible(): Promise<boolean> {
    return await this.isVisible(this.driversListSection);
  }

  /**
   * Switch to Sales Order mode and select a sales order
   * @param salesOrderId - Sales Order ID (e.g., "SAL-ORD-2026-00001")
   */
  async selectSalesOrder(salesOrderId: string) {
    await this.switchToSalesOrderMode();
    
    // Click combobox input
    await this.click(this.salesOrderComboboxInput);
    
    // Fill the search value
    await this.fillInput(this.salesOrderComboboxInput, salesOrderId);
    
    // Wait for dropdown options to appear
    await this.page.waitForTimeout(300);
    
    // Click the matching option
    const option = this.page.getByRole('option', { name: new RegExp(salesOrderId) }).first();
    await option.click();
    
    return this;
  }

  /**
   * Get currently selected sales order value
   */
  async getSelectedSalesOrder(): Promise<string> {
    return await this.getInputValue(this.salesOrderComboboxInput);
  }

  /**
   * Clear sales order selection
   */
  async clearSalesOrderSelection() {
    const clearBtn = this.page.locator(this.clearSelectionButton).first();
    if (await clearBtn.isVisible()) {
      await clearBtn.click();
    }
    return this;
  }

  /**
   * Get validation error message if visible
   */
  async getValidationError(): Promise<string | null> {
    const errorElement = this.page.locator(this.validationError).first();
    if (await errorElement.isVisible()) {
      return await errorElement.innerText();
    }
    return null;
  }

  /**
   * Check if loading spinner is visible
   */
  async isLoadingVisible(): Promise<boolean> {
    const spinner = this.page.locator(this.loadingSpinner).first();
    return await spinner.isVisible({ timeout: 1000 }).catch(() => false);
  }

  /**
   * Wait for loading to complete
   */
  async waitForLoadingComplete(timeout = 10000) {
    const spinner = this.page.locator(this.loadingSpinner).first();
    try {
      await spinner.waitFor({ state: 'hidden', timeout });
    } catch {
      // Spinner may not exist, that's OK
    }
    return this;
  }

  /**
   * Navigate to Promise Calculator page
   */
  async navigateToPromiseCalculator() {
    await this.navigateTo('/');
    await this.verifyPageLoaded();
    return this;
  }

  /**
   * Check if calendar is available and click it
   */
  async openCalendar() {
    const calendarBtn = this.page.locator(this.calendarButton).first();
    if (await calendarBtn.isVisible()) {
      await calendarBtn.click();
      return this;
    }
    return this;
  }

  /**
   * Get all calendar day buttons (for weekend verification)
   */
  async getCalendarDays() {
    return await this.page.locator('button[role="gridcell"]').all();
  }

  /**
   * Verify item appears in items list
   */
  async verifyItemInList(itemCode: string) {
    const itemElement = this.page.locator(`[data-testid="item-${itemCode}"]`).first();
    await expect(itemElement).toBeVisible();
    return this;
  }
}
