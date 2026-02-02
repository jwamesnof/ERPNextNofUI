"use client"

import React from "react"
import {
  CheckCircle,
  TruckIcon,
  Package,
  Repeat,
  AlertTriangle,
  ArrowRight,
} from "lucide-react"
import { PromiseResponse } from "@/lib/api/otpClient"

interface RecommendedActionsCardProps {
  result: PromiseResponse
}

export function RecommendedActionsCard({ result }: RecommendedActionsCardProps) {
  // Check conditions for showing actions:
  // 1. Backend provided options/recommended_actions
  const hasBackendActions = (result.options || []).length > 0

  // 2. Confidence is not HIGH
  const hasLowConfidence = result.confidence !== "HIGH"

  // 3. Any driver indicates shortage or supply constraint
  const hasShortageConstraint =
    (result.plan || []).some((p) => (p.shortage || 0) > 0) ||
    (result.reasons || []).some((r) =>
      /shortage|insufficient|low stock|supply/i.test(r)
    ) ||
    (result.blockers || []).some((b) =>
      /shortage|insufficient|low stock|supply/i.test(b)
    )

  const shouldShowActions = hasBackendActions || hasLowConfidence || hasShortageConstraint

  // If no actions needed, show subtle message
  if (!shouldShowActions) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-900 mb-3">Recommended Actions</h3>
        <div className="flex items-center gap-2 p-3 bg-emerald-50 rounded-lg border border-emerald-200">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          <p className="text-xs text-emerald-700">No actions needed — promise is healthy.</p>
        </div>
      </div>
    )
  }

  // Map backend options to action items with icons
  const getIconForOption = (type?: string) => {
    if (!type) return ArrowRight
    if (type.includes("warehouse")) return Package
    if (type.includes("expedite") || type.includes("po")) return Repeat
    if (type.includes("split") || type.includes("shipment")) return TruckIcon
    return ArrowRight
  }

  const backendActions = (result.options || [])
    .filter((opt) => opt.description)
    .map((opt) => ({
      label: opt.description || opt.type || "Action",
      icon: getIconForOption(opt.type),
      impact: opt.impact,
    }))

  // Fallback suggestions if no backend actions but conditions met
  const fallbackActions = [
    { label: "Review shortage items and check alternate warehouses", icon: Package, impact: undefined },
    { label: "Expedite supplier purchase orders", icon: Repeat, impact: undefined },
    { label: "Consider split shipment options", icon: TruckIcon, impact: undefined },
  ]

  const actions = backendActions.length > 0 ? backendActions : fallbackActions

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <AlertTriangle className="w-4 h-4 text-amber-600" />
        <h3 className="text-sm font-semibold text-slate-900">Recommended Actions</h3>
      </div>

      <ul className="space-y-2.5">
        {actions.map((action, idx) => {
          const Icon = action.icon
          return (
            <li
              key={idx}
              className="flex items-start gap-3 px-4 py-3 rounded-lg bg-slate-50 border border-slate-200 text-sm text-slate-700"
            >
              <Icon className="w-4 h-4 mt-0.5 text-slate-500 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-medium">{action.label}</p>
                {action.impact && (
                  <p className="text-xs text-slate-500 mt-1">{action.impact}</p>
                )}
              </div>
            </li>
          )
        })}
      </ul>

      <p className="text-xs text-slate-500 mt-4 px-3 py-2 bg-blue-50 rounded-lg border border-blue-100">
        💡 These suggestions can help improve promise reliability or meet the desired delivery date.
      </p>
    </div>
  )
}
