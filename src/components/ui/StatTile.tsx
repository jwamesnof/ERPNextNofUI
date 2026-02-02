"use client"

import React from "react"
import { LucideIcon } from "lucide-react"

interface StatTileProps {
  label: string
  value: string | number
  icon?: LucideIcon
  trend?: "up" | "down" | "neutral"
  trendValue?: string
  variant?: "default" | "success" | "warning" | "danger"
}

export function StatTile({ label, value, icon: Icon, trend, trendValue, variant = "default" }: StatTileProps) {
  const variantClasses = {
    default: "bg-white border-slate-200",
    success: "bg-emerald-50 border-emerald-200",
    warning: "bg-amber-50 border-amber-200",
    danger: "bg-red-50 border-red-200",
  }

  const iconColors = {
    default: "text-slate-400",
    success: "text-emerald-600",
    warning: "text-amber-600",
    danger: "text-red-600",
  }

  return (
    <div className={`rounded-lg border p-4 ${variantClasses[variant]}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs font-medium text-slate-600 uppercase tracking-wide mb-1">{label}</p>
          <p className="text-2xl font-bold text-slate-900">{value}</p>
          {trendValue && (
            <p className="text-xs text-slate-500 mt-1">
              {trend === "up" && "↑ "}
              {trend === "down" && "↓ "}
              {trendValue}
            </p>
          )}
        </div>
        {Icon && (
          <div className={`p-2 rounded-lg bg-white/50 ${iconColors[variant]}`}>
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
    </div>
  )
}
