#!/bin/bash

# API Client
cat > src/lib/api/client.ts << 'EOF'
import { z } from "zod"
import type { DeliveryMode, PromiseEvaluateRequest, PromiseEvaluateResponse } from "@/types/promise"

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000"
const MOCK_MODE = process.env.NEXT_PUBLIC_MOCK_MODE === "true"

const MOCK_SALES_ORDERS = [
  { name: "SO-00001", customer: "Acme Corp" },
  { name: "SO-00002", customer: "Tech Solutions Ltd" },
  { name: "SO-00003", customer: "Global Trade Inc" },
  { name: "SO-00004", customer: "Industrial Partners" },
]

const MOCK_PROMISE_RESPONSE: PromiseEvaluateResponse = {
  sales_order_id: "SO-00001",
  promise_date: "2026-02-10",
  promise_date_raw: "2026-02-09",
  confidence: "HIGH",
  status: "OK",
  on_time: true,
  desired_date: "2026-02-10",
  reasons: [
    {
      id: "1",
      type: "supply",
      title: "Used 8 units from Stores - SD",
      description: "Current inventory satisfies 8 of 10 units required",
      quantity: 8,
    },
    {
      id: "2",
      type: "supply",
      title: "Waiting for PO-001",
      description: "Incoming shipment arriving 2026-02-05 (2 units)",
      timestamp: "2026-02-05",
      quantity: 2,
    },
    {
      id: "3",
      type: "adjustment",
      title: "Weekend adjustment applied",
      description: "Delivery shifted from Saturday to Sunday to comply with workweek (Sun-Thu)",
    },
  ],
  options: {
    split_shipment: false,
    expedited: false,
  },
}

const PromiseEvaluateRequestSchema = z.object({
  sales_order_id: z.string().min(1),
  desired_date: z.string().optional(),
  delivery_mode: z.enum(["LATEST_ACCEPTABLE", "NO_EARLY_DELIVERY", "STRICT_FAIL"]),
  warehouse_id: z.string().optional(),
})

export class APIClient {
  private baseUrl: string
  private mockMode: boolean

  constructor() {
    this.baseUrl = API_BASE_URL
    this.mockMode = MOCK_MODE
  }

  async fetchSalesOrders(): Promise<{ name: string; customer: string }[]> {
    if (this.mockMode) {
      return new Promise((resolve) =>
        setTimeout(() => resolve(MOCK_SALES_ORDERS), 500)
      )
    }

    try {
      const response = await fetch(\`\${this.baseUrl}/api/resource/Sales Order\`, {
        headers: { Accept: "application/json" },
      })
      const data = await response.json()
      return data.data || []
    } catch (error) {
      console.error("Failed to fetch sales orders:", error)
      return []
    }
  }

  async evaluatePromise(
    request: PromiseEvaluateRequest
  ): Promise<PromiseEvaluateResponse> {
    PromiseEvaluateRequestSchema.parse(request)

    if (this.mockMode) {
      return new Promise((resolve) =>
        setTimeout(() => resolve(MOCK_PROMISE_RESPONSE), 1000)
      )
    }

    try {
      const response = await fetch(\`\${this.baseUrl}/api/method/promise.evaluate\`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(request),
      })

      if (response.status === 403) {
        return {
          ...MOCK_PROMISE_RESPONSE,
          status: "CANNOT_PROMISE_RELIABLY",
          error: "Permission denied",
          error_detail: "You do not have permission to evaluate promises for this item",
        }
      }

      if (!response.ok) {
        throw new Error(\`API error: \${response.statusText}\`)
      }

      const data = await response.json()
      return data.message || data
    } catch (error) {
      console.error("Failed to evaluate promise:", error)
      throw error
    }
  }

  async applyPromise(
    salesOrderId: string,
    promiseDate: string
  ): Promise<{ success: boolean; message?: string; url?: string }> {
    if (this.mockMode) {
      return new Promise((resolve) =>
        setTimeout(
          () =>
            resolve({
              success: true,
              message: "Promise applied successfully",
              url: \`/app/sales-order/\${salesOrderId}\`,
            }),
          800
        )
      )
    }

    try {
      const response = await fetch(\`\${this.baseUrl}/api/method/promise.apply\`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          sales_order_id: salesOrderId,
          promise_date: promiseDate,
        }),
      })

      if (!response.ok) {
        throw new Error(\`API error: \${response.statusText}\`)
      }

      const data = await response.json()
      return data.message || { success: true }
    } catch (error) {
      console.error("Failed to apply promise:", error)
      throw error
    }
  }

  async fetchAuditHistory(limit: number = 50): Promise<any[]> {
    if (this.mockMode) {
      return new Promise((resolve) =>
        setTimeout(
          () =>
            resolve([
              {
                id: "1",
                sales_order_id: "SO-00001",
                timestamp: new Date().toISOString(),
                promise_date: "2026-02-10",
                confidence: "HIGH",
                status: "OK",
              },
            ]),
          300
        )
      )
    }

    try {
      const response = await fetch(
        \`\${this.baseUrl}/api/method/promise.audit?limit=\${limit}\`,
        {
          headers: { Accept: "application/json" },
        }
      )

      if (!response.ok) {
        throw new Error(\`API error: \${response.statusText}\`)
      }

      const data = await response.json()
      return data.message || []
    } catch (error) {
      console.error("Failed to fetch audit history:", error)
      return []
    }
  }
}

export const apiClient = new APIClient()
EOF

echo "Created API client"

# Hooks
cat > src/hooks/usePromise.ts << 'EOF'
import { useMutation, useQuery } from "@tanstack/react-query"
import { apiClient } from "@/lib/api/client"
import type { PromiseEvaluateRequest, PromiseEvaluateResponse } from "@/types/promise"

export function useSalesOrders() {
  return useQuery({
    queryKey: ["sales-orders"],
    queryFn: () => apiClient.fetchSalesOrders(),
  })
}

export function useEvaluatePromise() {
  return useMutation({
    mutationFn: (request: PromiseEvaluateRequest) =>
      apiClient.evaluatePromise(request),
  })
}

export function useApplyPromise() {
  return useMutation({
    mutationFn: ({ salesOrderId, promiseDate }: { salesOrderId: string; promiseDate: string }) =>
      apiClient.applyPromise(salesOrderId, promiseDate),
  })
}

export function useAuditHistory(limit: number = 50) {
  return useQuery({
    queryKey: ["audit-history", limit],
    queryFn: () => apiClient.fetchAuditHistory(limit),
  })
}
EOF

echo "Created hooks"
