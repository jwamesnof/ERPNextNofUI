/**
 * API Client - Production-Grade Backend Integration
 * 
 * Purpose: Single point of contact for all backend communication
 * Backend: ERPNextNof (FastAPI) - http://localhost:8001
 * 
 * Features:
 * - All 4 endpoints: /otp/promise, /otp/apply, /otp/procurement-suggest, /health
 * - Comprehensive error handling per spec
 * - Status-based error semantics (HTTP 200 with business logic status field)
 * - Mock mode for development without backend
 * - Request/response logging for debugging
 * 
 * Reference: FRONTEND_INTEGRATION_PROMPT.md (backend specification)
 */

import type {
  PromiseEvaluateRequest,
  PromiseEvaluateResponse,
  PromiseApplyRequest,
  PromiseApplyResponse,
  ProcurementSuggestionRequest,
  ProcurementSuggestionResponse,
  HealthCheckResponse,
  SalesOrder,
  SalesOrderListItem,
  SalesOrderListResponse,
  APIError,
  ValidationError,
} from "./types"
import {
  MOCK_SALES_ORDERS,
  MOCK_PROMISE_RESPONSE_SUCCESS,
  MOCK_PROMISE_RESPONSE_PARTIAL_STOCK,
  MOCK_PROMISE_RESPONSE_CANNOT_FULFILL,
  MOCK_HEALTH_CHECK,
  getRandomMockResponse,
} from "./mockData"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8001"
const MOCK_MODE = process.env.NEXT_PUBLIC_MOCK_MODE === "true"
let healthLogged = false

// ============================================================================
// ERROR HANDLING
// ============================================================================

/**
 * Parse validation errors from 422 responses
 */
function parseValidationError(detail: any): ValidationError[] {
  if (!Array.isArray(detail)) {
    return []
  }
  return detail.map((err: any) => ({
    field: (err.loc || []).join("."),
    message: err.msg || "Validation error",
    value: err.input,
  }))
}

/**
 * Handle API errors with consistent error structure
 * Distinguishes between network errors, HTTP errors, and business logic errors
 */
function handleAPIError(error: unknown, statusCode?: number): APIError {
  // Network error (fetch failed)
  if (error instanceof TypeError) {
    return {
      message: "Network error: Unable to reach backend server",
      code: "NETWORK_ERROR",
      detail: error.message,
      statusCode: 0,
    }
  }

  // Generic Error
  if (error instanceof Error) {
    return {
      message: error.message || "An unexpected error occurred",
      code: "UNKNOWN_ERROR",
      statusCode: statusCode || 500,
    }
  }

  // Fallback
  return {
    message: "An unexpected error occurred",
    code: "UNKNOWN_ERROR",
    statusCode: statusCode || 500,
  }
}

/**
 * Handle HTTP error responses
 */
async function handleHTTPError(response: Response): Promise<APIError> {
  let detail = await response.text()

  // Try to parse JSON error response
  let parsedDetail: any
  try {
    parsedDetail = JSON.parse(detail)
  } catch {
    parsedDetail = null
  }

  // Extract detailed error info
  if (response.status === 422 && parsedDetail?.detail) {
    // Validation error
    return {
      message: "Validation error: Please check your input",
      code: "VALIDATION_ERROR",
      detail: detail,
      statusCode: 422,
      validationErrors: parseValidationError(parsedDetail.detail),
    }
  }

  if (parsedDetail?.detail && typeof parsedDetail.detail === "string") {
    return {
      message: parsedDetail.detail,
      code: `HTTP_${response.status}`,
      detail: detail,
      statusCode: response.status,
    }
  }

  return {
    message: `Backend error: ${response.statusText}`,
    code: `HTTP_${response.status}`,
    detail: detail,
    statusCode: response.status,
  }
}

// ============================================================================
// API CLIENT CLASS
// ============================================================================

export class APIClient {
  private baseUrl: string
  private mockMode: boolean

  constructor() {
    this.baseUrl = API_BASE_URL
    this.mockMode = MOCK_MODE
    this.logInitialization()
  }

  private logInitialization() {
    if (this.mockMode) {
      console.log(
        "%c[OTP Client] Mock mode ENABLED",
        "color: #FFA500; font-weight: bold; font-size: 12px"
      )
    } else {
      console.log(
        `%c[OTP Client] Connected to ${this.baseUrl}`,
        "color: #00AA00; font-weight: bold; font-size: 12px"
      )
    }
  }

  // ========================================================================
  // GET /otp/sales-orders - Sales Orders List
  // ========================================================================

  /**
   * Fetch list of Sales Orders (not yet implemented in backend)
   * Currently uses mock data, will fallback to real endpoint when available
   */
  async fetchSalesOrders(limit: number = 20): Promise<SalesOrderListItem[]> {
    if (this.mockMode) {
      console.log("[OTP Client] Mock: fetchSalesOrders")
      return new Promise((resolve) => setTimeout(() => resolve(MOCK_SALES_ORDERS), 300))
    }

    try {
      console.log(`[OTP Client] GET /otp/sales-orders?limit=${limit}`)

      const url = new URL(`${this.baseUrl}/otp/sales-orders`)
      url.searchParams.append("limit", limit.toString())

      const response = await fetch(url.toString(), {
        method: "GET",
        headers: { Accept: "application/json" },
      })

      if (!response.ok) {
        // Throw error instead of silently falling back to mock data
        const error = await handleHTTPError(response)
        throw error
      }

      const data: SalesOrderListResponse = await response.json()
      console.log("[OTP Client] Fetched sales orders:", data.sales_orders.length)
      return data.sales_orders
    } catch (error) {
      // Endpoint not available (expected) - throw error for React Query to handle
      throw error
    }
  }

  // ========================================================================
  // POST /otp/promise - Evaluate Promise
  // ========================================================================

  /**
   * POST /otp/promise - Calculate delivery promise for given items
   * Core OTP calculation endpoint
   *
   * Returns promise_date with confidence level and fulfillment plan
   * Status field indicates result (OK, CANNOT_FULFILL, CANNOT_PROMISE_RELIABLY)
   */
  async evaluatePromise(request: PromiseEvaluateRequest): Promise<PromiseEvaluateResponse> {
    if (this.mockMode) {
      console.log("[OTP Client] Mock: evaluatePromise", request)
      // Return mode-specific mock response
      const deliveryMode = request.rules?.desired_date_mode
      const response = getRandomMockResponse(deliveryMode)
      return new Promise((resolve) => setTimeout(() => resolve(response), 800))
    }

    try {
      console.log("[OTP Client] POST /otp/promise", request)

      const response = await fetch(`${this.baseUrl}/otp/promise`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(request),
      })

      if (!response.ok) {
        const error = await handleHTTPError(response)
        console.error(`[OTP Client] Promise calculation failed:`, error)

        // Return error response matching PromiseEvaluateResponse structure
        return {
          status: response.status === 403 ? "CANNOT_PROMISE_RELIABLY" : "CANNOT_FULFILL",
          promise_date: null,
          promise_date_raw: null,
          on_time: null,
          adjusted_due_to_no_early_delivery: false,
          can_fulfill: false,
          confidence: "LOW",
          plan: [],
          reasons: [],
          blockers: [error.message],
          options: [],
          error: error.code,
          error_detail: error.detail,
        }
      }

      const data: PromiseEvaluateResponse = await response.json()
      console.log("[OTP Client] Promise evaluated successfully:", {
        status: data.status,
        confidence: data.confidence,
        promise_date: data.promise_date,
      })
      return data
    } catch (error) {
      const apiError = handleAPIError(error)
      console.error("[OTP Client] Promise calculation network error:", apiError)

      return {
        status: "CANNOT_PROMISE_RELIABLY",
        promise_date: null,
        promise_date_raw: null,
        on_time: null,
        adjusted_due_to_no_early_delivery: false,
        can_fulfill: false,
        confidence: "LOW",
        plan: [],
        reasons: [],
        blockers: [apiError.message],
        options: [],
        error: apiError.code,
        error_detail: apiError.detail,
      }
    }
  }

  // ========================================================================
  // POST /otp/apply - Apply Promise to Sales Order
  // ========================================================================

  /**
   * POST /otp/apply - Apply calculated promise to Sales Order
   * Writes promise date as comment and/or custom field in ERPNext
   */
  async applyPromise(request: PromiseApplyRequest): Promise<PromiseApplyResponse> {
    if (this.mockMode) {
      console.log("[OTP Client] Mock: applyPromise", request)
      return new Promise((resolve) =>
        setTimeout(
          () =>
            resolve({
              status: "success",
              sales_order_id: request.sales_order_id,
              actions_taken: [
                "Added comment to Sales Order",
                "Updated custom field 'Promise Date'",
              ],
            }),
          600
        )
      )
    }

    try {
      console.log("[OTP Client] POST /otp/apply", request)

      const response = await fetch(`${this.baseUrl}/otp/apply`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(request),
      })

      if (!response.ok) {
        const error = await handleHTTPError(response)
        console.error(`[OTP Client] Apply promise failed:`, error)

        return {
          status: "error",
          sales_order_id: request.sales_order_id,
          actions_taken: [],
          error: error.message,
        }
      }

      const data: PromiseApplyResponse = await response.json()
      console.log("[OTP Client] Promise applied successfully:", data)
      return data
    } catch (error) {
      const apiError = handleAPIError(error)
      console.error("[OTP Client] Apply promise network error:", apiError)

      return {
        status: "error",
        sales_order_id: request.sales_order_id,
        actions_taken: [],
        error: apiError.message,
      }
    }
  }

  // ========================================================================
  // POST /otp/procurement-suggest - Create Material Request
  // ========================================================================

  /**
   * POST /otp/procurement-suggest - Generate Material Request for shortages
   * Creates Material Request doc in ERPNext for items with shortages
   */
  async createProcurementSuggestion(
    request: ProcurementSuggestionRequest
  ): Promise<ProcurementSuggestionResponse> {
    if (this.mockMode) {
      console.log("[OTP Client] Mock: createProcurementSuggestion", request)
      const mrId = `MAT-REQ-2026-${String(Math.floor(Math.random() * 10000)).padStart(5, "0")}`
      return new Promise((resolve) =>
        setTimeout(
          () =>
            resolve({
              status: "success",
              suggestion_id: mrId,
              type: "Material Request",
              items_count: request.items.length,
              erpnext_url: `http://localhost:8080/app/material-request/${mrId}`,
            }),
          600
        )
      )
    }

    try {
      console.log("[OTP Client] POST /otp/procurement-suggest", request)

      const response = await fetch(`${this.baseUrl}/otp/procurement-suggest`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(request),
      })

      if (!response.ok) {
        const error = await handleHTTPError(response)
        console.error(`[OTP Client] Procurement suggestion failed:`, error)

        return {
          status: "error",
          suggestion_id: "",
          type: "Material Request",
          items_count: request.items.length,
          erpnext_url: "",
          error: error.message,
        }
      }

      const data: ProcurementSuggestionResponse = await response.json()
      console.log("[OTP Client] Procurement suggestion created:", data)
      return data
    } catch (error) {
      const apiError = handleAPIError(error)
      console.error("[OTP Client] Procurement suggestion network error:", apiError)

      return {
        status: "error",
        suggestion_id: "",
        type: "Material Request",
        items_count: request.items.length,
        erpnext_url: "",
        error: apiError.message,
      }
    }
  }

  // ========================================================================
  // GET /health - Health Check
  // ========================================================================

  /**
   * GET /health - Check backend health and ERPNext connectivity
   * Used for monitoring service status
   */
  async checkHealth(): Promise<HealthCheckResponse> {
    if (this.mockMode) {
      return MOCK_HEALTH_CHECK
    }

    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        method: "GET",
        headers: { Accept: "application/json" },
      })

      if (!response.ok) {
        console.warn(`[OTP Client] Health check failed: ${response.status}`)
        return {
          status: "unhealthy",
          version: "unknown",
          erpnext_connected: false,
          message: `Backend returned HTTP ${response.status}`,
        }
      }

      const data: HealthCheckResponse = await response.json()
      if (data.status === "healthy" && !healthLogged) {
        console.info(`[OTP Client] Connected and healthy: ${this.baseUrl}`)
        healthLogged = true
      }
      return data
    } catch (error) {
      return {
        status: "unhealthy",
        version: "unknown",
        erpnext_connected: false,
        message: "Backend unreachable",
      }
    }
  }

  /**
   * Get API client configuration info for display
   */
  getConfig(): { baseUrl: string; mockMode: boolean } {
    return {
      baseUrl: this.baseUrl,
      mockMode: this.mockMode,
    }
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const apiClient = new APIClient()
