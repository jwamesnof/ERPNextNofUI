"use client"

import React, { useState } from "react"
import { format, parseISO } from "date-fns"
import { Copy, Check, Calendar } from "lucide-react"
import { StatusChip } from "@/components/ui/StatusChip"
import { PromiseResponse } from "@/lib/api/otpClient"

interface PromiseSummaryCardProps {
  result: PromiseResponse
}

export function PromiseSummaryCard({ result }: PromiseSummaryCardProps) {
  const [copied, setCopied] = useState(false)

  const safeFormatDate = (date: string | null, fmt: string, fallback = "—") => {
    if (!date) return fallback
    try {
      return format(parseISO(date), fmt)
    } catch {
      return fallback
    }
  }

  const promiseDate = safeFormatDate(result.promise_date, "MMMM dd, yyyy")
  const promiseDateShort = safeFormatDate(result.promise_date, "MMM dd, yyyy")

  const getStatus = (): "confirmed" | "at-risk" | "blocked" => {
    // Not Feasible: CANNOT_FULFILL or missing promise_date (cannot produce promise)
    if (result.status === "CANNOT_FULFILL" || !result.promise_date) {
      return "blocked"
    }
    
    // Check for shortages in plan
    const hasShortage = (result.plan || []).some((item) => (item.shortage || 0) > 0)
    
    // At Risk: LOW confidence, CANNOT_PROMISE_RELIABLY, or shortages exist
    if (
      result.confidence === "LOW" ||
      result.status === "CANNOT_PROMISE_RELIABLY" ||
      hasShortage
    ) {
      return "at-risk"
    }
    
    // Feasible: status OK + promise exists + no shortages + confidence not LOW
    return "confirmed"
  }

  const getConfidenceColor = () => {
    switch (result.confidence) {
      case "HIGH":
        return "text-emerald-600"
      case "MEDIUM":
        return "text-amber-600"
      case "LOW":
        return "text-red-600"
      default:
        return "text-slate-600"
    }
  }

  const getConfidenceWidth = () => {
    switch (result.confidence) {
      case "HIGH":
        return "w-full"
      case "MEDIUM":
        return "w-2/3"
      case "LOW":
        return "w-1/3"
      default:
        return "w-0"
    }
  }

  const handleCopyDate = () => {
    navigator.clipboard.writeText(promiseDateShort)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div className="flex-1">
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Promise Date</p>
          <div className="flex items-center gap-3">
            <h2 className="text-3xl font-bold text-slate-900">{promiseDate}</h2>
            <button
              onClick={handleCopyDate}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors group"
              title="Copy date"
            >
              {copied ? (
                <Check className="w-4 h-4 text-emerald-600" />
              ) : (
                <Copy className="w-4 h-4 text-slate-400 group-hover:text-slate-600" />
              )}
            </button>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <StatusChip status={getStatus()} size="lg" />
        </div>
      </div>

      {/* Confidence Meter */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-slate-600 uppercase tracking-wide">Confidence</span>
          <span className={`text-sm font-semibold ${getConfidenceColor()}`}>{result.confidence}</span>
        </div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${
              result.confidence === "HIGH"
                ? "bg-emerald-500"
                : result.confidence === "MEDIUM"
                  ? "bg-amber-500"
                  : "bg-red-500"
            } ${getConfidenceWidth()}`}
          />
        </div>
      </div>

      {/* Desired Date Comparison */}
      {result.desired_date && (
        <div className="pt-4 border-t border-slate-200">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-600">Desired Date:</span>
            <span className="font-medium text-slate-900">
              {safeFormatDate(result.desired_date, "MMM dd, yyyy")}
            </span>
          </div>
          {result.on_time !== undefined && (
            <div className="flex items-center gap-2 mt-2">
              {result.on_time ? (
                <>
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-xs text-emerald-700 font-medium">On Time</span>
                </>
              ) : (
                <>
                  <div className="w-2 h-2 rounded-full bg-red-500" />
                  <span className="text-xs text-red-700 font-medium">Late</span>
                </>
              )}
            </div>
          )}
          {result.desired_date_mode && (
            <div className="mt-2 text-xs text-slate-500">
              Mode: <span className="font-medium text-slate-700">{result.desired_date_mode.replace(/_/g, ' ')}</span>
            </div>
          )}
        </div>
      )}

      {/* Last Calculated */}
      <div className="mt-4 pt-4 border-t border-slate-200">
        <p className="text-xs text-slate-500 flex items-center gap-1.5">
          <Calendar className="w-3.5 h-3.5" />
          Last calculated: {format(new Date(), "MMM dd, yyyy 'at' HH:mm")}
        </p>
      </div>
    </div>
  )
}
