"use client"

import React from "react"
import { CheckCircle2, AlertCircle, XCircle, AlertTriangle } from "lucide-react"

type StatusType = "confirmed" | "at-risk" | "blocked"

interface StatusChipProps {
  status: StatusType
  size?: "sm" | "md" | "lg"
}

export function StatusChip({ status, size = "md" }: StatusChipProps) {
  const sizeClasses = {
    sm: "px-2 py-0.5 text-[10px]",
    md: "px-3 py-1 text-xs",
    lg: "px-4 py-1.5 text-sm",
  }

  const iconSizes = {
    sm: "w-3 h-3",
    md: "w-3.5 h-3.5",
    lg: "w-4 h-4",
  }

  const config = {
    confirmed: {
      label: "Feasible",
      icon: CheckCircle2,
      className: "bg-emerald-50 text-emerald-700 border-emerald-200",
    },
    "at-risk": {
      label: "At Risk",
      icon: AlertTriangle,
      className: "bg-amber-50 text-amber-700 border-amber-200",
    },
    blocked: {
      label: "Not Feasible",
      icon: XCircle,
      className: "bg-red-50 text-red-700 border-red-200",
    },
  }

  const { label, icon: Icon, className } = config[status]

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-semibold border ${className} ${sizeClasses[size]}`}
    >
      <Icon className={iconSizes[size]} />
      {label}
    </span>
  )
}
