import type {
  PromiseEvaluateRequest,
  PromiseEvaluateResponse,
  PromiseApplyRequest,
  PromiseApplyResponse,
  ProcurementSuggestionRequest,
  ProcurementSuggestionResponse,
  HealthCheckResponse,
  SalesOrderListItem,
  SalesOrderListResponse,
  SalesOrderDetailsResponse,
} from "./types"
import {
  MOCK_HEALTH_CHECK,
  MOCK_PROMISE_RESPONSE_SUCCESS,
  getRandomMockResponse,
  MOCK_SALES_ORDERS,
  MOCK_ITEM_CODES,
} from "./mockData"

const RAW_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8001"
const API_BASE_URL = RAW_BASE_URL.replace(/\/+$/, "")
const MOCK_MODE = process.env.NEXT_PUBLIC_MOCK_MODE === "true"

const DEFAULT_TIMEOUT_MS = 10000
const HEALTH_TIMEOUT_MS = 5000

export interface NormalizedApiError {
  status: number
  message: string
  detail?: string
}

export type PromiseRequest = PromiseEvaluateRequest
export type PromiseResponse = PromiseEvaluateResponse
export type HealthResponse = HealthCheckResponse

export class OTPApiError extends Error {
  status?: number
  code?: string
  detail?: string

  constructor(message: string, options?: { status?: number; code?: string; detail?: string }) {
    super(message)
    this.name = "OTPApiError"
    this.status = options?.status
    this.code = options?.code
    this.detail = options?.detail
  }
}

function normalizeBaseUrl(url: string) {
  return url.replace(/\/+$/, "")
}

async function fetchWithTimeout(input: RequestInfo, init: RequestInit, timeoutMs: number) {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  try {
    return await fetch(input, { ...init, signal: controller.signal })
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new OTPApiError("Request timed out. Please try again.", {
        code: "TIMEOUT",
        status: 0,
      })
    }
    throw error
  } finally {
    clearTimeout(timeoutId)
  }
}

async function buildHttpError(response: Response): Promise<OTPApiError> {
  const raw = await response.text()
  let detail: string | undefined = raw
  let message = `Request failed: ${response.status}`

  try {
    const parsed = JSON.parse(raw)
    if (typeof parsed?.detail === "string") {
      detail = parsed.detail
      message = parsed.detail
    } else if (typeof parsed?.message === "string") {
      detail = parsed.message
      message = parsed.message
    }
  } catch {
    // Ignore JSON parse errors
  }

  return new OTPApiError(message, {
    status: response.status,
    code: `HTTP_${response.status}`,
    detail,
  })
}

function mapMockSalesOrders(): SalesOrderListItem[] {
  return MOCK_SALES_ORDERS.map((order) => ({
    name: order.name,
    customer_name: order.customer,
    transaction_date: order.date,
    item_count: order.items,
  }))
}

function isWrongBaseUrl(baseUrl: string): boolean {
  try {
    const url = new URL(baseUrl)
    return url.port === "8000" || url.port === "8080"
  } catch {
    return false
  }
}

class OTPClient {
  private baseUrl: string
  private mockMode: boolean
  private baseUrlWarning: string | null = null

  constructor() {
    this.baseUrl = normalizeBaseUrl(API_BASE_URL)
    this.mockMode = MOCK_MODE

    if (isWrongBaseUrl(this.baseUrl)) {
      const url = new URL(this.baseUrl)
      this.baseUrlWarning =
        `You are connected to ERPNext (port ${url.port}), not the OTP API. ` +
        `Set NEXT_PUBLIC_API_BASE_URL to the OTP server address (default: http://127.0.0.1:8001).`
    }
  }

  getBaseUrl() {
    return this.baseUrl
  }

  isMockMode() {
    return this.mockMode
  }

  getBaseUrlWarning() {
    return this.baseUrlWarning
  }

  private buildUrl(path: string) {
    if (path.startsWith("http")) return path
    const normalized = path.startsWith("/") ? path : `/${path}`
    return `${this.baseUrl}${normalized}`
  }

  private async requestJson<T>(path: string, init: RequestInit, timeoutMs = DEFAULT_TIMEOUT_MS) {
    try {
      const response = await fetchWithTimeout(this.buildUrl(path), init, timeoutMs)
      if (!response.ok) {
        throw await buildHttpError(response)
      }
      return (await response.json()) as T
    } catch (error) {
      if (error instanceof OTPApiError) {
        throw error
      }
      if (error instanceof TypeError) {
        throw new OTPApiError("Network error: Unable to reach backend server.", {
          code: "NETWORK_ERROR",
          status: 0,
        })
      }
      throw error
    }
  }

  async health(): Promise<HealthResponse> {
    if (this.mockMode) {
      return MOCK_HEALTH_CHECK
    }

    return this.requestJson<HealthCheckResponse>(
      "/health",
      { method: "GET", headers: { Accept: "application/json" } },
      HEALTH_TIMEOUT_MS
    )
  }

  async checkHealth(): Promise<HealthResponse> {
    return this.health()
  }

  async evaluatePromise(request: PromiseEvaluateRequest): Promise<PromiseEvaluateResponse> {
    if (this.mockMode) {
      return getRandomMockResponse() || MOCK_PROMISE_RESPONSE_SUCCESS
    }

    return this.requestJson<PromiseEvaluateResponse>("/otp/promise", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(request),
    })
  }

  async applyPromise(request: PromiseApplyRequest): Promise<PromiseApplyResponse> {
    if (this.mockMode) {
      return {
        status: "success",
        sales_order_id: request.sales_order_id,
        actions_taken: ["Added comment to Sales Order", "Updated custom field 'Promise Date'"],
      }
    }

    return this.requestJson<PromiseApplyResponse>("/otp/apply", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(request),
    })
  }

  async createProcurementSuggestion(
    request: ProcurementSuggestionRequest
  ): Promise<ProcurementSuggestionResponse> {
    if (this.mockMode) {
      return {
        status: "success",
        suggestion_id: `MAT-REQ-${Math.floor(Math.random() * 10000)}`,
        type: "Material Request",
        items_count: request.items.length,
        erpnext_url: "",
      }
    }

    return this.requestJson<ProcurementSuggestionResponse>("/otp/procurement-suggest", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(request),
    })
  }

  async listSalesOrders(params?: {
    limit?: number
    offset?: number
    customer?: string
    status?: string
    from_date?: string
    to_date?: string
    search?: string
  }): Promise<SalesOrderListItem[]> {
    if (this.mockMode) {
      return mapMockSalesOrders()
    }

    const url = new URL(this.buildUrl("/otp/sales-orders"))
    if (params?.limit !== undefined) url.searchParams.set("limit", String(params.limit))
    if (params?.offset !== undefined) url.searchParams.set("offset", String(params.offset))
    if (params?.customer) url.searchParams.set("customer", params.customer)
    if (params?.status) url.searchParams.set("status", params.status)
    if (params?.from_date) url.searchParams.set("from_date", params.from_date)
    if (params?.to_date) url.searchParams.set("to_date", params.to_date)
    if (params?.search) url.searchParams.set("search", params.search)

    const fullUrl = url.toString()
    let response: Response
    try {
      response = await fetchWithTimeout(
        fullUrl,
        { method: "GET", headers: { Accept: "application/json" } },
        DEFAULT_TIMEOUT_MS
      )
    } catch (error) {
      if (error instanceof OTPApiError) {
        error.detail = `${fullUrl}\n${error.message}`
        throw error
      }
      if (error instanceof TypeError) {
        throw new OTPApiError(`Network error: Unable to reach ${fullUrl}`, {
          code: "NETWORK_ERROR",
          status: 0,
          detail: fullUrl,
        })
      }
      throw error
    }

    if (!response.ok) {
      const httpError = await buildHttpError(response)
      httpError.detail = `HTTP ${response.status} - ${fullUrl}\n${httpError.detail || ""}`
      throw httpError
    }

    const data = (await response.json()) as
      | SalesOrderListResponse
      | SalesOrderListItem[]
      | { data?: SalesOrderListItem[] }

    if (Array.isArray(data)) {
      return data
    }

    if (Array.isArray((data as SalesOrderListResponse).sales_orders)) {
      return (data as SalesOrderListResponse).sales_orders
    }

    if (Array.isArray((data as { data?: SalesOrderListItem[] }).data)) {
      return (data as { data?: SalesOrderListItem[] }).data || []
    }

    return []
  }

  async getSalesOrderDetails(id: string): Promise<SalesOrderDetailsResponse> {
    if (this.mockMode) {
      return {
        name: id,
        sales_order_id: id,
        customer_name: "Mock Customer",
        delivery_date: undefined,
        items: [],
        defaults: { warehouse: "Stores - SD", no_weekends: true, cutoff_time: "14:00" },
      }
    }

    const safeId = encodeURIComponent(id)
    return this.requestJson<SalesOrderDetailsResponse>(`/otp/sales-orders/${safeId}`, {
      method: "GET",
      headers: { Accept: "application/json" },
    })
  }

  async listItems(): Promise<string[]> {
    if (this.mockMode) {
      return MOCK_ITEM_CODES
    }

    return this.requestJson<string[]>("/otp/items", {
      method: "GET",
      headers: { Accept: "application/json" },
    })
  }
}

export const otpClient = new OTPClient()
export const otpApiClient = otpClient
export type { APIError } from "./types"
