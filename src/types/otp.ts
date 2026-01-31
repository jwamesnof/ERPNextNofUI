export interface OTPRequest {
  sales_order_id?: string
  customer: string
  items: Array<{
    item_code: string
    qty: number
    warehouse?: string
    lead_time_override_days?: number
  }>
  desired_delivery_date?: string
  delivery_mode?: "LATEST_ACCEPTABLE" | "NO_EARLY_DELIVERY" | "STRICT_FAIL"
  cutoff_time?: string
  buffer_days?: number
}

export interface OTPResponse {
  status: "success" | "partial" | "failure"
  promise_date: string
  confidence: "HIGH" | "MEDIUM" | "LOW"
  on_time?: boolean
  adjusted_delivery_date?: string
  explanation?: {
    stock_considered?: string[]
    stock_ignored?: string[]
    incoming_supply?: string[]
    calendar_adjustments?: string[]
    assumptions?: string[]
  }
  items?: Array<{
    item_code: string
    promised_qty: number
    shortfall?: number
    promise_date?: string
  }>
  recommended_actions?: Array<{
    action: string
    reason: string
  }>
  raw_details?: any
}

export interface HealthResponse {
  status: "healthy" | "degraded" | "unhealthy"
  version?: string
  timestamp?: string
}

export interface SavedScenario {
  id: string
  name: string
  timestamp: Date
  request: OTPRequest
  response: OTPResponse
}

export interface AuditRecord extends SavedScenario {
  // Same structure for history
}
