'use client'

import React from 'react'
import { useStockData } from '@/hooks/useStockData'
import { Loader2 } from 'lucide-react'

interface StockMetricsDisplayProps {
  itemCode: string
  warehouse: string
  initialStock?: {
    stock_actual?: number
    stock_reserved?: number
    stock_available?: number
  }
}

export function StockMetricsDisplay({ itemCode, warehouse, initialStock }: StockMetricsDisplayProps) {
  const { stockData, isLoading } = useStockData(itemCode, warehouse)

  // Don't show anything if no item code
  if (!itemCode?.trim()) {
    return <span className="text-slate-400">Enter item code to see stock</span>
  }

  // Loading state
  if (isLoading) {
    return (
      <span className="flex items-center gap-1 text-slate-500">
        <Loader2 className="w-3 h-3 animate-spin" />
        Loading stock...
      </span>
    )
  }

  // Use fetched stock data if available, otherwise fall back to initial stock
  const displayStock = stockData || initialStock

  // Check if we have any actual stock values
  const hasAnyStockData = displayStock && (
    displayStock.stock_actual !== undefined ||
    displayStock.stock_reserved !== undefined ||
    displayStock.stock_available !== undefined
  )

  // No stock data available (endpoint missing AND no initial stock)
  if (!hasAnyStockData) {
    return <span className="text-slate-400">Stock metrics not available</span>
  }

  // Display stock metrics
  const actual = displayStock.stock_actual ?? '—'
  const reserved = displayStock.stock_reserved ?? '—'
  const available = displayStock.stock_available ?? '—'

  return (
    <span className="text-slate-600">
      Stock: Actual <span className="font-medium">{actual}</span> • 
      Reserved <span className="font-medium">{reserved}</span> • 
      Available <span className="font-medium text-green-700">{available}</span>
    </span>
  )
}
