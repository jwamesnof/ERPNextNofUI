/**
 * Mock Data - Comprehensive Demo Responses
 * Matches backend response schema exactly
 * Used when NEXT_PUBLIC_MOCK_MODE=true (frontend demo mode)
 * 
 * Scenarios:
 * - SUCCESS: All items in stock, early delivery possible
 * - PARTIAL_STOCK: Mix of stock + incoming POs
 * - CANNOT_FULFILL: Insufficient supply
 * - STRICT_FAIL: Reliability check fails
 */

import type { PromiseEvaluateResponse, HealthCheckResponse } from "./types"

export const MOCK_SALES_ORDERS = [
  { name: "SO-2026-00001", customer: "Big Corp", date: "2026-01-15", items: 3 },
  { name: "SO-2026-00002", customer: "Tech Solutions Ltd", date: "2026-01-16", items: 5 },
  { name: "SO-2026-00003", customer: "Global Trade Inc", date: "2026-01-17", items: 2 },
  { name: "SO-2026-00004", customer: "Industrial Partners", date: "2026-01-18", items: 4 },
  { name: "SO-2026-00005", customer: "Retail Network Co", date: "2026-01-19", items: 6 },
]

export const MOCK_ITEMS = [
  { item_code: "SKU001", name: "Widget A", qty: 50 },
  { item_code: "SKU002", name: "Widget B", qty: 30 },
  { item_code: "SKU003", name: "Gadget X", qty: 0 },
  { item_code: "SKU004", name: "Component C", qty: 100 },
  { item_code: "SKU005", name: "Part D", qty: 15 },
]

export const MOCK_ITEM_CODES = MOCK_ITEMS.map((item) => item.item_code)

export const MOCK_PROMISE_RESPONSE_SUCCESS: PromiseEvaluateResponse = {
  status: "OK",
  promise_date: "2026-02-10",
  promise_date_raw: "2026-02-09",
  desired_date: "2026-02-10",
  desired_date_mode: "LATEST_ACCEPTABLE",
  on_time: true,
  adjusted_due_to_no_early_delivery: false,
  can_fulfill: true,
  confidence: "HIGH",
  plan: [
    {
      item_code: "SKU001",
      qty_required: 20,
      fulfillment: [
        {
          source: "stock",
          qty: 20,
          available_date: "2026-02-05",
          ship_ready_date: "2026-02-05",
          warehouse: "Stores - SD",
        },
      ],
      shortage: 0,
    },
    {
      item_code: "SKU002",
      qty_required: 10,
      fulfillment: [
        {
          source: "stock",
          qty: 10,
          available_date: "2026-02-05",
          ship_ready_date: "2026-02-05",
          warehouse: "Stores - SD",
        },
      ],
      shortage: 0,
    },
  ],
  reasons: [
    "All items available in warehouse",
    "Can fulfill by 2026-02-05",
    "Weekend adjustment applied: Sunday delivery allowed",
  ],
  blockers: [],
  options: [
    { type: "expedite_po", description: "Can deliver 1 day earlier" },
    { type: "split_shipment", description: "Split across 2 shipments" },
  ],
}

export const MOCK_PROMISE_RESPONSE_PARTIAL_STOCK: PromiseEvaluateResponse = {
  status: "OK",
  promise_date: "2026-02-12",
  promise_date_raw: "2026-02-10",
  desired_date: "2026-02-15",
  desired_date_mode: "LATEST_ACCEPTABLE",
  on_time: true,
  adjusted_due_to_no_early_delivery: false,
  can_fulfill: true,
  confidence: "MEDIUM",
  plan: [
    {
      item_code: "SKU001",
      qty_required: 50,
      fulfillment: [
        {
          source: "stock",
          qty: 30,
          available_date: "2026-02-05",
          ship_ready_date: "2026-02-05",
          warehouse: "Stores - SD",
        },
        {
          source: "purchase_order",
          qty: 20,
          available_date: "2026-02-10",
          ship_ready_date: "2026-02-12",
          warehouse: "Stores - SD",
          po_id: "PO-2026-001",
          expected_date: "2026-02-10",
        },
      ],
      shortage: 0,
    },
  ],
  reasons: [
    "30 units available in stock (Stores - SD)",
    "20 units incoming from PO-2026-001 expected 2026-02-10",
    "Full fulfillment possible by 2026-02-12",
  ],
  blockers: [],
  options: [],
}

export const MOCK_PROMISE_RESPONSE_CANNOT_FULFILL: PromiseEvaluateResponse = {
  status: "CANNOT_FULFILL",
  promise_date: "2026-03-15",
  desired_date: "2026-02-10",
  desired_date_mode: "LATEST_ACCEPTABLE",
  on_time: false,
  adjusted_due_to_no_early_delivery: false,
  can_fulfill: false,
  confidence: "LOW",
  plan: [],
  reasons: [
    "Insufficient stock: 10 units available, 50 required",
    "No incoming purchase orders for this item",
    "Would require 3+ weeks for new procurement",
  ],
  blockers: [
    "SKU005 not available in requested warehouse",
    "Supply chain disruption expected through 2026-02-28",
  ],
  options: [
    { type: "backorder", description: "Deliver available 10 units now" },
    { type: "split_shipment", description: "Split delivery: 10 now, 40 on 2026-03-15" },
    { type: "alternate_warehouse", description: "SKU006 is a compatible alternative" },
  ],
}

export const MOCK_PROMISE_RESPONSE_STRICT_FAIL: PromiseEvaluateResponse = {
  status: "CANNOT_PROMISE_RELIABLY",
  promise_date: null,
  desired_date: "2026-02-10",
  desired_date_mode: "STRICT_FAIL",
  on_time: false,
  adjusted_due_to_no_early_delivery: false,
  can_fulfill: false,
  confidence: "LOW",
  plan: [],
  reasons: [],
  blockers: [
    "STRICT_FAIL mode: Cannot promise reliably for desired date",
    "Risk of non-fulfillment exceeds threshold",
  ],
  options: [
    { type: "expedite_po", description: "Use LATEST_ACCEPTABLE for flexible date" },
    { type: "backorder", description: "Pay premium for expedited supply" },
  ],
  error: "Cannot fulfill with required reliability",
  error_detail: "In STRICT_FAIL mode, we cannot promise this date",
}

export const MOCK_HEALTH_CHECK: HealthCheckResponse = {
  status: "healthy",
  version: "0.1.0",
  erpnext_connected: false, // False in mock mode
  message: "Mock mode active - backend data not connected",
}

/**
 * Helper to get a random mock response for demo purposes
 */
export function getRandomMockResponse(): PromiseEvaluateResponse {
  const responses = [
    MOCK_PROMISE_RESPONSE_SUCCESS,
    MOCK_PROMISE_RESPONSE_PARTIAL_STOCK,
    MOCK_PROMISE_RESPONSE_CANNOT_FULFILL,
  ]
  return responses[Math.floor(Math.random() * responses.length)]
}
