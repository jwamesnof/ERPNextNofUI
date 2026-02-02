"use client"

import { useQuery } from "@tanstack/react-query"
import { otpClient } from "@/lib/api/otpClient"

/**
 * Fetch available items from backend for autocomplete
 */
export function useItems() {
  return useQuery<string[]>({
    queryKey: ["items"],
    queryFn: () => otpClient.listItems(),
    staleTime: 10 * 60 * 1000, // Cache for 10 minutes
    refetchOnWindowFocus: false,
  })
}
