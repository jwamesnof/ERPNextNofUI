"use client"

import { useQuery } from "@tanstack/react-query"
import { otpClient } from "@/lib/api/otpClient"
import type { SalesOrderListItem } from "@/lib/api/types"

export interface SalesOrderListParams {
  limit?: number
  offset?: number
  customer?: string
  status?: string
  from_date?: string
  to_date?: string
  search?: string
}

/**
 * Sort sales orders by numeric suffix in name (e.g., SAL-ORD-2026-00016)
 * Extracts the last numeric part and sorts ascending
 */
function sortSalesOrders(orders: SalesOrderListItem[]): SalesOrderListItem[] {
  return [...orders].sort((a, b) => {
    const extractNumber = (name: string): number => {
      const match = name.match(/(\d+)$/);
      return match ? parseInt(match[1], 10) : 0
    }
    return extractNumber(a.name) - extractNumber(b.name)
  })
}

export function useSalesOrders(params?: SalesOrderListParams, enabled = true) {
  return useQuery<SalesOrderListItem[]>({
    queryKey: ["sales-orders", params ?? {}],
    queryFn: async () => {
      const data = await otpClient.listSalesOrders(params)
      return sortSalesOrders(data)
    },
    enabled,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  })
}
