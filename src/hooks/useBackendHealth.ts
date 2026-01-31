import { useQuery } from "@tanstack/react-query"
import { otpClient } from "@/lib/api/otpClient"

/**
 * Check backend health status
 * Polls every 30 seconds to monitor connection
 * Used to disable UI when backend is offline
 */
export function useBackendHealth() {
  return useQuery({
    queryKey: ["backend-health"],
    queryFn: () => otpClient.checkHealth(),
    staleTime: 30000, // 30 seconds
    refetchInterval: 30000, // Re-check every 30 seconds
    retry: false, // Don't retry on failure
  })
}
