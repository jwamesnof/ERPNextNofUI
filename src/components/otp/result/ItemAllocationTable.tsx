"use client"

import React, { useState } from "react"
import { ChevronDown, ChevronUp } from "lucide-react"
import { format, parseISO } from "date-fns"
import { PromiseResponse } from "@/lib/api/otpClient"

interface ItemAllocationTableProps {
  result: PromiseResponse
}

export function ItemAllocationTable({ result }: ItemAllocationTableProps) {
  const [expanded, setExpanded] = useState(false)

  const plan = result.plan || []

  if (plan.length === 0) {
    return null
  }

  const safeFormatDate = (date: string | null | undefined) => {
    if (!date) return "—"
    try {
      return format(parseISO(date), "MMM dd, yyyy")
    } catch {
      return "—"
    }
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-semibold text-slate-900">Item Allocation Details</h3>
          <span className="px-2 py-0.5 text-xs font-semibold bg-slate-100 text-slate-600 rounded-full">
            {plan.length} {plan.length === 1 ? "item" : "items"}
          </span>
        </div>
        {expanded ? (
          <ChevronUp className="w-4 h-4 text-slate-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-slate-400" />
        )}
      </button>

      {expanded && (
        <div className="border-t border-slate-200">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide">
                    Item Code
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide">
                    Qty Required
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide">
                    Source
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide">
                    Warehouse
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide">
                    Earliest Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase tracking-wide">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {plan.map((item, idx) => {
                  const fulfillment = item.fulfillment || []
                  const primarySource = fulfillment[0]
                  const totalFulfilled = fulfillment.reduce((sum, f) => sum + (f.qty || 0), 0)
                  const shortage = item.shortage || 0

                  return (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="px-6 py-4 text-sm font-medium text-slate-900">
                        {item.item_code}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {item.qty_required || 0}
                      </td>
                      <td className="px-6 py-4">
                        {primarySource ? (
                          <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-blue-50 text-blue-700">
                            {primarySource.source === "stock"
                              ? "Stock"
                              : primarySource.source === "purchase_order"
                                ? "PO"
                                : "Production"}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {primarySource?.warehouse || "—"}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">
                        {safeFormatDate(primarySource?.available_date || primarySource?.ship_ready_date)}
                      </td>
                      <td className="px-6 py-4">
                        {shortage > 0 ? (
                          <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-amber-50 text-amber-700">
                            Short: {shortage}
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-emerald-50 text-emerald-700">
                            Fulfilled
                          </span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
