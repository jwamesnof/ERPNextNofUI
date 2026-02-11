/**
 * API Contract Types - Synced with ERPNextNof backend specification
 * Reference: FRONTEND_INTEGRATION_PROMPT.md (backend specification document)
 * 
 * Backend: http://localhost:8001 (or configured via NEXT_PUBLIC_API_BASE_URL)
 * Frontend communicates exclusively via /otp/* endpoints
 * 
 * Key Rules:
 * - Frontend NEVER talks to ERPNext directly
 * - Backend handles all ERPNext authentication and permissions
 * - All dates in ISO 8601 format (YYYY-MM-DD)
 * - Status-based error handling (HTTP 200 with business logic status field)
 * - Workweek: Sunday-Thursday (Friday-Saturday are weekends)
 */

// ============================================================================
// ENUMS & TYPE DEFINITIONS: Core Business Types
// ============================================================================

export type DeliveryMode = "LATEST_ACCEPTABLE" | "NO_EARLY_DELIVERY" | "STRICT_FAIL"
export type PromiseStatus = "OK" | "CANNOT_FULFILL" | "CANNOT_PROMISE_RELIABLY"
export type Confidence = "HIGH" | "MEDIUM" | "LOW"
export type FulfillmentSource = "stock" | "purchase_order" | "production"
export type ApplyAction = "add_comment" | "set_custom_field" | "both"
export type Priority = "HIGH" | "MEDIUM" | "LOW"
export type ProcurementType = "material_request" | "draft_po" | "task"
export type HealthStatus = "healthy" | "degraded" | "unhealthy"
export type OptionType =
  | "alternate_warehouse"
  | "expedite_po"
  | "split_shipment"
  | "backorder"

// ============================================================================
// REQUEST TYPES: POST /otp/promise
// ============================================================================

/**
 * POST /otp/promise - Evaluate Promise Request
 * Calculate delivery promise for given items and business rules
 * Min 1 item required, customer is optional but recommended
 */
export interface PromiseEvaluateRequest {
  customer?: string              // Customer name or ID (optional but recommended)
  items: PromiseItem[]           // Min 1 item required
  desired_date?: string          // ISO date (YYYY-MM-DD), optional
  rules?: PromiseRules           // Optional, backend uses defaults if omitted
  sales_order_id?: string        // Optional, for UI context tracking
}

export interface PromiseItem {
  item_code: string              // ERPNext item code (e.g., "SKU005")
  qty: number                    // Quantity > 0 (required)
  warehouse?: string             // Optional, defaults to "Stores - SD"
}

export interface PromiseRules {
  no_weekends?: boolean          // Default: true (Sun-Thu workweek)
  cutoff_time?: string           // Default: "14:00" (HH:MM format)
  timezone?: string              // Default: "UTC"
  lead_time_buffer_days?: number             // Default: 1
  processing_lead_time_days?: number         // Default: 1
  desired_date_mode?: DeliveryMode           // Default: "LATEST_ACCEPTABLE"
  order_created_at?: string      // ISO datetime (YYYY-MM-DDTHH:mm), optional
}

// ============================================================================
// RESPONSE TYPES: POST /otp/promise
// ============================================================================

/**
 * POST /otp/promise - Promise Evaluation Response
 * Contains calculated promise date, confidence level, and fulfillment plan
 * 
 * Status field indicates result:
 * - OK: Promise calculated, can_fulfill indicates if all items allocatable
 * - CANNOT_FULFILL: Insufficient stock/supply (promise_date = null)
 * - CANNOT_PROMISE_RELIABLY: Missing critical data but calculated with disclaimers
 */
export interface PromiseEvaluateResponse {
  status: PromiseStatus                      // OK | CANNOT_FULFILL | CANNOT_PROMISE_RELIABLY
  promise_date: string | null                // ISO date or null if CANNOT_FULFILL
  promise_date_raw?: string | null           // Before desired_date adjustments
  desired_date?: string | null               // Echoed from request
  desired_date_mode?: DeliveryMode | null    // Mode used for calculation
  on_time: boolean | null                    // True if promise <= desired (null if CANNOT_FULFILL)
  adjusted_due_to_no_early_delivery: boolean // If promise was delayed for NO_EARLY_DELIVERY mode
  can_fulfill: boolean                       // True if all items allocatable
  confidence: Confidence                     // HIGH | MEDIUM | LOW
  plan: PromisePlan[]                        // Per-item fulfillment details
  reasons: string[]                          // Calculation explanations (user-friendly)
  blockers: string[]                         // Issues preventing optimal promise (use for warnings)
  options: PromiseOption[]                   // Suggestions to improve promise
  error?: string                             // HTTP error reason if applicable
  error_detail?: string                      // Detailed error information
}

export interface PromisePlan {
  item_code: string
  qty_required: number
  fulfillment: Fulfillment[]                 // Array of fulfillment sources for this item
  shortage: number                           // Unfulfilled quantity (can_fulfill = false if > 0)
}

export interface Fulfillment {
  source: FulfillmentSource                  // stock | purchase_order | production
  qty: number                                // Quantity from this source
  available_date: string                     // ISO date when available
  ship_ready_date: string                    // available_date + processing_lead_time
  warehouse: string | null                   // Warehouse name or null
  po_id?: string | null                      // Purchase Order ID (if source=purchase_order)
  expected_date?: string | null              // Expected delivery date (if source=purchase_order)
}

export interface PromiseOption {
  type?: OptionType                          // Type: alternate_warehouse | expedite_po | split_shipment | backorder
  description?: string                       // Human-readable description
  impact?: string                            // Impact description (e.g., "Could reduce promise date by 2 days")
  po_id?: string | null                      // Related PO if applicable
}

// ============================================================================
// REQUEST/RESPONSE TYPES: POST /otp/apply
// ============================================================================

/**
 * POST /otp/apply - Apply Promise Request
 * Write calculated promise back to ERPNext Sales Order as comment/custom field
 */
export interface PromiseApplyRequest {
  sales_order_id: string                     // ERPNext SO ID (e.g., "SAL-ORD-2026-00015")
  promise_date: string                       // ISO date (from response.promise_date)
  confidence: Confidence                     // HIGH | MEDIUM | LOW
  action?: ApplyAction                       // Default: "both" (add_comment | set_custom_field | both)
  comment_text?: string                      // Optional custom comment
}

/**
 * POST /otp/apply - Apply Promise Response
 * Confirmation of promise being written to ERPNext
 */
export interface PromiseApplyResponse {
  status: "success" | "error"                // Operation result
  sales_order_id: string                     // SO ID
  actions_taken: string[]                    // List of actions performed (e.g., ["Added comment to Sales Order", "Updated custom_promise_date field"])
  erpnext_response?: Record<string, any>     // Raw ERPNext response
  error?: string | null                      // Error message if status=error
}

// ============================================================================
// REQUEST/RESPONSE TYPES: POST /otp/procurement-suggest
// ============================================================================

/**
 * POST /otp/procurement-suggest - Procurement Suggestion Request
 * Generate Material Request in ERPNext for items with shortages
 */
export interface ProcurementSuggestionRequest {
  items: ProcurementItem[]                   // Min 1 item
  suggestion_type?: ProcurementType          // Default: "material_request"
  priority?: Priority                        // Default: "MEDIUM"
}

export interface ProcurementItem {
  item_code: string                          // Item code
  qty_needed: number                         // Quantity > 0
  required_by: string                        // ISO date (YYYY-MM-DD)
  reason: string                             // Human-readable reason
}

/**
 * POST /otp/procurement-suggest - Procurement Suggestion Response
 * Confirmation of Material Request creation
 */
export interface ProcurementSuggestionResponse {
  status: "success" | "error"                // Operation result
  suggestion_id: string                      // Created doc ID in ERPNext (e.g., "MAT-REQ-2026-00042")
  type: string                               // Doc type created (e.g., "Material Request")
  items_count: number                        // Number of items in doc
  erpnext_url: string                        // Direct link to view in ERPNext
  error?: string | null                      // Error message if status=error
}

// ============================================================================
// RESPONSE TYPES: GET /health & GET /otp/sales-orders
// ============================================================================

/**
 * GET /health - Health Check Response
 * Service status and ERPNext connectivity
 */
export interface HealthCheckResponse {
  status: HealthStatus                       // healthy | degraded | unhealthy
  version: string                            // Backend version (e.g., "0.1.0")
  erpnext_connected: boolean                 // True if ERPNext is reachable
  message?: string | null                    // Additional status message
}

/**
 * GET /otp/sales-orders - Sales Orders List Response
 * (Note: Not yet implemented in backend as REST endpoint)
 * Frontend should use mock data or request backend to add this
 */
export interface SalesOrder {
  name: string                               // SO ID (e.g., "SAL-ORD-2026-00015")
  customer: string                           // Customer name
  delivery_date?: string                     // Expected/desired delivery date
  item_count?: number                        // Number of line items
  total_qty?: number                         // Total quantity across all items
  status?: string                            // Draft | Submitted | Cancelled
  so_date?: string                           // SO creation date
}

// ============================================================================
// SALES ORDER LIST & DETAILS (GET /otp/sales-orders)
// ============================================================================

export interface SalesOrderListItem {
  name: string                               // SO ID (e.g., "SAL-ORD-2026-00015")
  customer?: string                          // Customer name (legacy)
  customer_name?: string                     // Customer name (preferred)
  status?: string                            // Draft | Submitted | Cancelled
  transaction_date?: string                  // SO transaction date (YYYY-MM-DD)
  delivery_date?: string                     // Expected/desired delivery date
  item_count?: number                        // Number of line items
  total_qty?: number                         // Total quantity across all items
}

export interface SalesOrderDetailItem {
  item_code?: string
  qty?: number
  warehouse?: string
  stock_actual?: number
  stock_reserved?: number
  stock_available?: number
}

export interface SalesOrderDefaults {
  warehouse?: string
  no_weekends?: boolean
  cutoff_time?: string
  delivery_mode?: DeliveryMode
}

export interface SalesOrderDetailsResponse {
  name?: string
  sales_order_id?: string
  customer?: string
  customer_name?: string
  transaction_date?: string
  delivery_date?: string
  items?: SalesOrderDetailItem[]
  defaults?: SalesOrderDefaults
}

export interface SalesOrderListResponse {
  sales_orders: SalesOrderListItem[]
  total: number
  limit: number
  offset?: number
}

// ============================================================================
// ERROR TYPES
// ============================================================================

/**
 * Standard error format (returned by frontend error handler)
 * Maps HTTP errors and backend errors to consistent format
 */
export interface APIError {
  message: string                            // User-friendly error message
  code?: string                              // Error code (e.g., "VALIDATION_ERROR", "SERVICE_UNAVAILABLE")
  detail?: string                            // Detailed error information
  statusCode?: number                        // HTTP status code
  validationErrors?: ValidationError[]       // Field-level validation errors (from 422)
}

export interface ValidationError {
  field: string                              // Field name (e.g., "items[0].qty")
  message: string                            // Error message (e.g., "ensure this value is greater than 0")
  value?: any                                // Field value that failed
}

// ============================================================================
// UI STATE TYPES (Frontend-specific)
// ============================================================================

/**
 * UI state derived from backend response
 */
export type UIPromiseState = "idle" | "loading" | "success" | "warning" | "error"

export interface UIPromiseContext {
  state: UIPromiseState
  response?: PromiseEvaluateResponse
  error?: APIError
  timestamp?: number
}

/**
 * Processed promise data for UI rendering
 * Normalizes backend response into UI-friendly format
 */
export interface ProcessedPromiseData {
  isSuccess: boolean                         // status === "OK"
  isFulfillable: boolean                     // can_fulfill === true
  canPromise: boolean                         // status !== "CANNOT_PROMISE_RELIABLY"
  isOnTime: boolean | null                   // on_time === true (null if CANNOT_FULFILL)
  hasShortages: boolean                      // any plan item has shortage > 0
  shortageQty: number                        // Total shortage across all items
  confidenceColor: "green" | "yellow" | "red"
  statusMessage: string                      // Human-readable status for UI
  primaryAction: "APPLY" | "CREATE_PR" | "RETRY" | "ADJUST"
  canApply: boolean                          // Can user apply this promise?
  canCreatePR: boolean                       // Can user create Material Request?
}

/**
 * Form state for promise calculation
 * Used to manage form validation and state
 */
export interface PromiseFormState {
  customer: string
  items: PromiseItem[]
  desiredDate?: string
  desiredDateMode: DeliveryMode
  warehouse?: string
  includeRules: boolean
  rules?: PromiseRules
  isValid: boolean
  errors: Record<string, string>
}

// ============================================================================
// BACKWARD COMPATIBILITY & RE-EXPORTS
// ============================================================================

// For components that still use old names
export type SalesOrderItem = PromiseItem
export type HealthCheck = HealthCheckResponse
