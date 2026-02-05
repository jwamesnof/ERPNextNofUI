/**
 * Re-export types from API layer for UI components
 * This maintains backward compatibility while using the unified types
 */

export type {
  DeliveryMode,
  PromiseStatus,
  Confidence,
  PromiseEvaluateRequest,
  PromiseEvaluateResponse,
  PromiseApplyRequest,
  PromiseApplyResponse,
  PromisePlan,
  Fulfillment,
  PromiseOption,
  PromiseRules,
  PromiseItem,
  HealthCheck,
  APIError,
} from "@/lib/api/types"

export interface SalesOrder {
  name: string
  customer: string
  date?: string
  items?: number
}

export interface AuditEntry {
  id: string
  sales_order_id: string
  timestamp: string
  promise_date: string
  confidence: string
  status: string
  desired_date?: string
}
