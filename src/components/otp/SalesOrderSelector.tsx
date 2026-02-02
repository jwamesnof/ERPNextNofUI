"use client"

import React, { useEffect, useMemo, useState } from "react"
import { Loader2, RotateCw, XCircle } from "lucide-react"
import { Combobox } from "@/components/ui/combobox"
import { AlertBanner } from "@/components/ui/alert-banner"
import { LoadingSkeleton } from "@/components/ui/loading-skeleton"
import { useSalesOrders } from "@/hooks/useSalesOrders"
import type { SalesOrderListItem } from "@/lib/api/types"
import type { OTPApiError } from "@/lib/api/otpClient"

interface SalesOrderSelectorProps {
  value?: string | null
  onChange: (value: string | null) => void
  manualIdValue?: string
  onManualIdChange?: (value: string) => void
  disabled?: boolean
}

function getOrderLabel(order: SalesOrderListItem) {
  return order.name
}

function getOrderDescription(order: SalesOrderListItem) {
  return order.customer_name || order.customer || undefined
}

function getOrderMeta(order: SalesOrderListItem) {
  if (order.delivery_date) return `Delivery: ${order.delivery_date}`
  if (order.transaction_date) return `Created: ${order.transaction_date}`
  if (order.item_count) return `${order.item_count} items`
  return undefined
}

export function SalesOrderSelector({
  value,
  onChange,
  manualIdValue,
  onManualIdChange,
  disabled,
}: SalesOrderSelectorProps) {
  const [query, setQuery] = useState("")
  const [search, setSearch] = useState("")

  useEffect(() => {
    const handle = setTimeout(() => setSearch(query.trim()), 350)
    return () => clearTimeout(handle)
  }, [query])

  const {
    data = [],
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
    dataUpdatedAt,
  } = useSalesOrders({ limit: 25, search }, !disabled)

  const options = useMemo(
    () =>
      data.map((order) => ({
        value: order.name,
        label: getOrderLabel(order),
        description: getOrderDescription(order),
        meta: getOrderMeta(order),
      })),
    [data]
  )

  const lastUpdated = dataUpdatedAt ? new Date(dataUpdatedAt).toLocaleTimeString() : null
  const normalizedError = error as OTPApiError | undefined

  const handleClear = () => {
    onChange(null)
    setQuery("")
    setSearch("")
    if (onManualIdChange) {
      onManualIdChange("")
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-slate-700">Sales Order</label>
        <div className="flex items-center gap-2">
          {value && (
            <button
              type="button"
              onClick={handleClear}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700"
            >
              <XCircle className="h-3.5 w-3.5" />
              Clear
            </button>
          )}
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs bg-slate-100 hover:bg-slate-200 disabled:opacity-50 rounded-lg text-slate-700"
          >
            {isFetching ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCw className="h-3.5 w-3.5" />}
            Refresh
          </button>
        </div>
      </div>

      {isLoading && <LoadingSkeleton lines={4} />}

      {!isLoading && isFetching && (
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Updating Sales Orders...
        </div>
      )}

      {!isLoading && !isError && (
        <Combobox
          label=""
          placeholder="Search Sales Orders..."
          options={options}
          value={value || undefined}
          onChange={(val) => onChange(val)}
          onQueryChange={setQuery}
          emptyLabel="No Sales Orders match your search"
          testId="sales-order-combobox"
        />
      )}

      {isError && (
        <AlertBanner
          variant="error"
          title="Failed to load Sales Orders"
          description={normalizedError?.detail || normalizedError?.message || "Unable to load sales orders."}
          action={
            <button
              type="button"
              onClick={() => refetch()}
              className="px-3 py-1.5 text-xs bg-white/70 hover:bg-white border border-red-200 rounded-lg text-red-700"
            >
              Retry
            </button>
          }
        />
      )}

      {!isLoading && !isError && data.length === 0 && (
        <AlertBanner
          variant="info"
          title="No Sales Orders found"
          description="No Sales Orders are available for selection. You can enter an ID manually below."
        />
      )}

      {(isError || data.length === 0) && onManualIdChange && (
        <div>
          <label htmlFor="salesOrderIdFallback" className="block text-xs font-medium text-slate-600 mb-2">
            Sales Order ID (Manual)
          </label>
          <input
            id="salesOrderIdFallback"
            type="text"
            placeholder="e.g., SO-2024-001"
            value={manualIdValue || ""}
            onChange={(event) => onManualIdChange(event.target.value)}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          />
        </div>
      )}

      {lastUpdated && (
        <p className="text-[11px] text-slate-400">Last updated: {lastUpdated}</p>
      )}
    </div>
  )
}
