"use client"

import { clsx } from "clsx"
import type { Confidence } from "@/types/promise"

interface BadgeProps {
  confidence: Confidence
}

export function Badge({ confidence }: BadgeProps) {
  const colorMap: Record<Confidence, string> = {
    HIGH: "bg-success-100 text-success-800 border-success-300",
    MEDIUM: "bg-warning-100 text-warning-800 border-warning-300",
    LOW: "bg-danger-100 text-danger-800 border-danger-300",
  }

  return (
    <span
      className={clsx(
        "badge border",
        colorMap[confidence]
      )}
    >
      {confidence} Confidence
    </span>
  )
}
