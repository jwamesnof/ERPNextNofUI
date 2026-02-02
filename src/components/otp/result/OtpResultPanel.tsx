"use client"

import React from "react"
import { Calendar, Package, TrendingUp, AlertTriangle } from "lucide-react"
import { PromiseResponse } from "@/lib/api/otpClient"
import { PromiseSummaryCard } from "./PromiseSummaryCard"
import { DriversConstraintsCard } from "./DriversConstraintsCard"
import { RecommendedActionsCard } from "./RecommendedActionsCard"
import { ItemAllocationTable } from "./ItemAllocationTable"
import { CustomerMessageCard } from "./CustomerMessageCard"
import { StatTile } from "@/components/ui/StatTile"
import { format, parseISO } from "date-fns"

interface OtpResultPanelProps {
  result: PromiseResponse | null
  isLoading: boolean
}

export function OtpResultPanel({ result, isLoading }: OtpResultPanelProps) {
  const safeFormatDate = (date: string | null, fmt: string, fallback = "—") => {
    if (!date) return fallback
    try {
      return format(parseISO(date), fmt)
    } catch {
      return fallback
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-slate-200 rounded w-1/4" />
            <div className="h-12 bg-slate-200 rounded w-3/4" />
            <div className="h-2 bg-slate-200 rounded w-full" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <div className="animate-pulse space-y-3">
              <div className="h-4 bg-slate-200 rounded w-1/2" />
              <div className="h-8 bg-slate-200 rounded w-3/4" />
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <div className="animate-pulse space-y-3">
              <div className="h-4 bg-slate-200 rounded w-1/2" />
              <div className="h-8 bg-slate-200 rounded w-3/4" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Empty state
  if (!result) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 shadow-sm">
        <div className="flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
            <Calendar className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">No Results Yet</h3>
          <p className="text-sm text-slate-600 max-w-md mb-6">
            Fill in the order details on the left and click "Evaluate Promise" to calculate a delivery commitment.
          </p>
          <div className="flex gap-4 text-xs text-slate-500">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              <span>Customer info</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              <span>Item details</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              <span>Delivery settings</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Compute metrics for stat tiles
  const plan = result.plan || []
  const fulfillment = plan.flatMap((p) => p.fulfillment || [])
  const stockSources = fulfillment.filter((f) => f.source === "stock")
  const poSources = fulfillment.filter((f) => f.source === "purchase_order")
  const mixedSources = stockSources.length > 0 && poSources.length > 0

  const fulfillmentSource = mixedSources
    ? "Mixed"
    : stockSources.length > 0
      ? "Stock"
      : poSources.length > 0
        ? "Incoming PO"
        : "—"

  const riskFlags = [
    ...(result.blockers || []),
    ...(result.confidence === "LOW" ? ["Low confidence"] : []),
    ...(result.on_time === false ? ["Late delivery"] : []),
  ]

  // Result state
  return (
    <div className="space-y-6">
      {/* Top Metrics Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatTile
          label="Promise Date"
          value={safeFormatDate(result.promise_date, "MMM dd")}
          icon={Calendar}
          variant="default"
        />
        <StatTile
          label="Confidence"
          value={result.confidence}
          icon={TrendingUp}
          variant={
            result.confidence === "HIGH"
              ? "success"
              : result.confidence === "MEDIUM"
                ? "warning"
                : "danger"
          }
        />
        <StatTile label="Source" value={fulfillmentSource} icon={Package} variant="default" />
        {riskFlags.length > 0 && (
          <StatTile
            label="Risk Flags"
            value={riskFlags.length}
            icon={AlertTriangle}
            variant="warning"
          />
        )}
      </div>

      {/* Primary Summary */}
      <PromiseSummaryCard result={result} />

      {/* Two-column layout for secondary cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DriversConstraintsCard result={result} />
        <RecommendedActionsCard result={result} />
      </div>

      {/* Item Allocation Table (collapsible) */}
      <ItemAllocationTable result={result} />

      {/* Customer Message */}
      <CustomerMessageCard result={result} />
    </div>
  )
}
