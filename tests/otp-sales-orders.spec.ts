import { test, expect } from '@playwright/test';

test('loads sales orders and selects an entry', async ({ page }) => {
  await page.route('**/health', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      headers: { 'access-control-allow-origin': '*' },
      body: JSON.stringify({
        status: 'healthy',
        version: '0.1.0',
        erpnext_connected: true,
      }),
    })
  );

  await page.route('**/otp/sales-orders**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      headers: { 'access-control-allow-origin': '*' },
      body: JSON.stringify({
        sales_orders: [
          { name: 'SO-0001', customer: 'Acme Corp', so_date: '2026-02-01', item_count: 3 },
          { name: 'SO-0002', customer: 'Beta LLC', so_date: '2026-02-01', item_count: 2 },
        ],
        total: 2,
        limit: 20,
      }),
    })
  );

  await page.goto('/');

  await page.getByTestId('input-mode-sales-order').click();
  await page.getByTestId('sales-order-combobox-input').click();
  await page.getByTestId('sales-order-combobox-input').fill('SO-0001');
  await page.getByRole('option', { name: /SO-0001/ }).click();

  await expect(page.getByTestId('sales-order-combobox-input')).toHaveValue('SO-0001');
});
