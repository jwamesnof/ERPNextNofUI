/**
 * useStockData - Fetch stock metrics for item + warehouse combination
 * 
 * Purpose: Dynamically fetch stock data when item_code or warehouse changes
 * Endpoint: GET /api/items/stock?item_code={code}&warehouse={warehouse}
 * 
 * Behavior:
 * - Fetches stock data only if both item_code and warehouse are provided
 * - Returns stock_actual, stock_reserved, stock_available
 * - Gracefully handles missing endpoint (returns undefined)
 */

import { useState, useEffect } from 'react'

export interface StockData {
  stock_actual?: number
  stock_reserved?: number
  stock_available?: number
}

export interface UseStockDataResult {
  stockData: StockData | null
  isLoading: boolean
  error: string | null
  refetch: () => void
}

export function useStockData(itemCode: string, warehouse: string): UseStockDataResult {
  const [stockData, setStockData] = useState<StockData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [refetchTrigger, setRefetchTrigger] = useState(0)

  useEffect(() => {
    // Skip if either item_code or warehouse is missing
    if (!itemCode?.trim() || !warehouse?.trim()) {
      setStockData(null)
      setError(null)
      setIsLoading(false)
      return
    }

    const fetchStockData = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8001'
        
        const response = await fetch(
          `${apiBaseUrl}/api/items/stock?item_code=${encodeURIComponent(itemCode)}&warehouse=${encodeURIComponent(warehouse)}`,
          {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
          }
        )

        if (response.ok) {
          const data = await response.json()
          setStockData({
            stock_actual: data.stock_actual,
            stock_reserved: data.stock_reserved,
            stock_available: data.stock_available,
          })
        } else if (response.status === 404) {
          // Item or warehouse not found - set to null but no error
          setStockData(null)
        } else {
          // Other error - set error message
          setError('Failed to fetch stock data')
          setStockData(null)
        }
      } catch (err) {
        // Endpoint doesn't exist or network error - silently fail
        setStockData(null)
        setError(null)
      } finally {
        setIsLoading(false)
      }
    }

    fetchStockData()
  }, [itemCode, warehouse, refetchTrigger])

  const refetch = () => setRefetchTrigger((prev) => prev + 1)

  return { stockData, isLoading, error, refetch }
}
