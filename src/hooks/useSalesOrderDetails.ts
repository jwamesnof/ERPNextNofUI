"use client"

import { useQuery } from "@tanstack/react-query"
import { otpClient } from "@/lib/api/otpClient"
import type { SalesOrderDetailsResponse } from "@/lib/api/types"

export function useSalesOrderDetails(salesOrderId?: string | null) {
  return useQuery<SalesOrderDetailsResponse>({
    queryKey: ["sales-order-details", salesOrderId],
    queryFn: () => otpClient.getSalesOrderDetails(salesOrderId as string),
    enabled: !!salesOrderId,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  })
}
