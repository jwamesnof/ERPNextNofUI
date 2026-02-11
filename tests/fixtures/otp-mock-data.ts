/**
 * Mock API Data for OTP Tests
 * 
 * Provides consistent mock responses for:
 * - Health check endpoint
 * - Sales orders list
 * - Sales order details
 * - Stock data
 * - Promise evaluation
 */

export const MOCK_HEALTH_RESPONSE = {
  status: 'healthy',
  version: '1.0.0',
  erpnext_connected: true,
  timestamp: new Date().toISOString(),
};

export const MOCK_SALES_ORDERS_LIST = {
  sales_orders: [
    {
      name: 'SAL-ORD-2026-00001',
      customer: 'Acme Corporation',
      customer_name: 'Acme Corporation',
      so_date: '2026-02-01',
      delivery_date: '2026-02-15',
      item_count: 3,
      grand_total: 15000.00,
      status: 'Draft',
    },
    {
      name: 'SAL-ORD-2026-00002',
      customer: 'Beta LLC',
      customer_name: 'Beta LLC',
      so_date: '2026-02-02',
      delivery_date: '2026-02-20',
      item_count: 2,
      grand_total: 8500.00,
      status: 'Draft',
    },
    {
      name: 'SAL-ORD-2026-00010',
      customer: 'Gamma Industries',
      customer_name: 'Gamma Industries',
      so_date: '2026-02-03',
      delivery_date: '2026-02-25',
      item_count: 5,
      grand_total: 22000.00,
      status: 'Draft',
    },
  ],
  total: 3,
  limit: 20,
  offset: 0,
};

export const MOCK_SALES_ORDER_DETAILS_SAL_ORD_00001 = {
  name: 'SAL-ORD-2026-00001',
  sales_order_id: 'SAL-ORD-2026-00001',
  customer: 'Acme Corporation',
  customer_name: 'Acme Corporation',
  transaction_date: '2026-02-01',
  delivery_date: '2026-02-15',
  status: 'Draft',
  items: [
    {
      name: 'SAL-ORD-2026-00001-0001',
      item_code: 'WIDGET-ALPHA',
      item_name: 'Widget Alpha',
      description: 'Premium alpha widget',
      qty: 5,
      uom: 'NOS',
      warehouse: 'Stores - SD',
      stock_actual: 20,
      stock_reserved: 5,
      stock_available: 15,
    },
    {
      name: 'SAL-ORD-2026-00001-0002',
      item_code: 'WIDGET-BETA',
      item_name: 'Widget Beta',
      description: 'Standard beta widget',
      qty: 10,
      uom: 'NOS',
      warehouse: 'Stores - SD',
      stock_actual: 50,
      stock_reserved: 20,
      stock_available: 30,
    },
    {
      name: 'SAL-ORD-2026-00001-0003',
      item_code: 'COMPONENT-X',
      item_name: 'Component X',
      description: 'Critical component',
      qty: 3,
      uom: 'NOS',
      warehouse: 'Stores - SD',
      stock_actual: 10,
      stock_reserved: 0,
      stock_available: 10,
    },
  ],
  defaults: {
    warehouse: 'Stores - SD',
    delivery_mode: 'LATEST_ACCEPTABLE',
  },
};

export const MOCK_SALES_ORDER_DETAILS_SAL_ORD_00002 = {
  name: 'SAL-ORD-2026-00002',
  sales_order_id: 'SAL-ORD-2026-00002',
  customer: 'Beta LLC',
  customer_name: 'Beta LLC',
  transaction_date: '2026-02-02',
  delivery_date: '2026-02-20',
  status: 'Draft',
  items: [
    {
      name: 'SAL-ORD-2026-00002-0001',
      item_code: 'COMPONENT-Y',
      item_name: 'Component Y',
      description: 'Secondary component',
      qty: 8,
      uom: 'NOS',
      warehouse: 'Stores - SD',
      stock_actual: 25,
      stock_reserved: 10,
      stock_available: 15,
    },
    {
      name: 'SAL-ORD-2026-00002-0002',
      item_code: 'GEAR-TYPE-A',
      item_name: 'Gear Type A',
      description: 'Standard gear',
      qty: 6,
      uom: 'NOS',
      warehouse: 'Stores - SD',
      stock_actual: 30,
      stock_reserved: 6,
      stock_available: 24,
    },
  ],
  defaults: {
    warehouse: 'Stores - SD',
    delivery_mode: 'LATEST_ACCEPTABLE',
  },
};

export const MOCK_STOCK_DATA = {
  items: [
    {
      item_code: 'WIDGET-ALPHA',
      item_name: 'Widget Alpha',
      warehouses: [
        {
          warehouse: 'Stores - SD',
          stock: 20,
          reserved: 5,
          available: 15,
        },
      ],
    },
    {
      item_code: 'WIDGET-BETA',
      item_name: 'Widget Beta',
      warehouses: [
        {
          warehouse: 'Stores - SD',
          stock: 50,
          reserved: 20,
          available: 30,
        },
      ],
    },
    {
      item_code: 'COMPONENT-X',
      item_name: 'Component X',
      warehouses: [
        {
          warehouse: 'Stores - SD',
          stock: 10,
          reserved: 0,
          available: 10,
        },
      ],
    },
    {
      item_code: 'COMPONENT-Y',
      item_name: 'Component Y',
      warehouses: [
        {
          warehouse: 'Stores - SD',
          stock: 25,
          reserved: 10,
          available: 15,
        },
      ],
    },
    {
      item_code: 'GEAR-TYPE-A',
      item_name: 'Gear Type A',
      warehouses: [
        {
          warehouse: 'Stores - SD',
          stock: 30,
          reserved: 6,
          available: 24,
        },
      ],
    },
  ],
};

export const MOCK_PROMISE_RESPONSE_SUCCESS = {
  request_id: 'req-12345',
  status: 'FEASIBLE',
  promise_date: '2026-02-18',
  confidence_pct: 95,
  confidence_level: 'HIGH',
  order_created_at: '2026-02-01T10:30:00',
  desired_delivery_date: '2026-02-15',
  calculated_promise_date: '2026-02-18',
  factors: {
    is_weekend_excluded: true,
    is_holiday_checked: false,
    buffer_applied_days: 1,
    cutoff_time_applied: true,
  },
  plan: [
    {
      item_code: 'WIDGET-ALPHA',
      qty: 5,
      warehouse: 'Stores - SD',
      available: 15,
      lead_time_days: 1,
      feasible: true,
    },
    {
      item_code: 'WIDGET-BETA',
      qty: 10,
      warehouse: 'Stores - SD',
      available: 30,
      lead_time_days: 2,
      feasible: true,
    },
    {
      item_code: 'COMPONENT-X',
      qty: 3,
      warehouse: 'Stores - SD',
      available: 10,
      lead_time_days: 1,
      feasible: true,
    },
  ],
  message: 'Promise date: 2026-02-18 (HIGH confidence)',
};

export const MOCK_PROMISE_RESPONSE_AT_RISK = {
  request_id: 'req-12346',
  status: 'AT_RISK',
  promise_date: '2026-02-20',
  confidence_pct: 45,
  confidence_level: 'LOW',
  order_created_at: '2026-02-01T10:30:00',
  desired_delivery_date: '2026-02-15',
  calculated_promise_date: '2026-02-20',
  factors: {
    is_weekend_excluded: true,
    is_holiday_checked: false,
    buffer_applied_days: 1,
    cutoff_time_applied: true,
  },
  plan: [
    {
      item_code: 'COMPONENT-Y',
      qty: 8,
      warehouse: 'Stores - SD',
      available: 15,
      lead_time_days: 3,
      feasible: false,
    },
  ],
  message: 'Promise date: 2026-02-20 (LOW confidence - delivery risk)',
};

export const MOCK_PROMISE_RESPONSE_NOT_FEASIBLE = {
  request_id: 'req-12347',
  status: 'NOT_FEASIBLE',
  promise_date: null,
  confidence_pct: 0,
  confidence_level: 'CRITICAL',
  order_created_at: '2026-02-01T10:30:00',
  desired_delivery_date: '2026-02-10',
  calculated_promise_date: null,
  factors: {
    is_weekend_excluded: true,
    is_holiday_checked: false,
    buffer_applied_days: 1,
    cutoff_time_applied: true,
  },
  plan: [],
  message: 'Cannot fulfill: desired date is in past or insufficient stock',
};

export const VALID_ITEM_CODES = ['WIDGET-ALPHA', 'WIDGET-BETA', 'COMPONENT-X', 'COMPONENT-Y', 'GEAR-TYPE-A'];
export const INVALID_ITEM_CODE = 'INVALID-ITEM-XYZ';
export const DEFAULT_WAREHOUSE = 'Stores - SD';
