"use client"

import React from "react"
import { Package, Clock, Calendar, Truck, Tag } from "lucide-react"
import { PromiseResponse } from "@/lib/api/otpClient"

interface DriversConstraintsCardProps {
  result: PromiseResponse
}

type DriverCategory = "inventory" | "lead-time" | "business-rules" | "supply"

interface Driver {
  category: DriverCategory
  text: string
}

export function DriversConstraintsCard({ result }: DriversConstraintsCardProps) {
  const categorizeDrivers = (): Driver[] => {
    const reasons = result.reasons || []
    const blockers = result.blockers || []
    const allItems = [...reasons, ...blockers]

    return allItems.map((text) => {
      const lower = text.toLowerCase()
      
      if (lower.includes("stock") || lower.includes("inventory") || lower.includes("warehouse")) {
        return { category: "inventory", text }
      }
      if (lower.includes("lead time") || lower.includes("lead-time") || lower.includes("processing")) {
        return { category: "lead-time", text }
      }
      if (
        lower.includes("weekend") ||
        lower.includes("cutoff") ||
        lower.includes("rule") ||
        lower.includes("adjusted") ||
        lower.includes("buffer")
      ) {
        return { category: "business-rules", text }
      }
      if (lower.includes("po") || lower.includes("incoming") || lower.includes("supply") || lower.includes("purchase")) {
        return { category: "supply", text }
      }
      
      return { category: "business-rules", text }
    })
  }

  const drivers = categorizeDrivers()
  
  const groupedDrivers = drivers.reduce(
    (acc, driver) => {
      if (!acc[driver.category]) acc[driver.category] = []
      acc[driver.category].push(driver.text)
      return acc
    },
    {} as Record<DriverCategory, string[]>
  )

  const categoryConfig = {
    inventory: {
      label: "Inventory Allocation",
      icon: Package,
      color: "text-blue-600",
      bg: "bg-blue-50",
      tag: "stock",
    },
    "lead-time": {
      label: "Lead Times",
      icon: Clock,
      color: "text-purple-600",
      bg: "bg-purple-50",
      tag: "time",
    },
    "business-rules": {
      label: "Business Rules",
      icon: Calendar,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      tag: "rule",
    },
    supply: {
      label: "Supply Constraints",
      icon: Truck,
      color: "text-amber-600",
      bg: "bg-amber-50",
      tag: "supply",
    },
  }

  const hasDrivers = Object.keys(groupedDrivers).length > 0

  if (!hasDrivers) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-900 mb-4">Drivers & Constraints</h3>
        <p className="text-sm text-slate-500 text-center py-4">No specific drivers or constraints reported.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
      <h3 className="text-sm font-semibold text-slate-900 mb-4">Drivers & Constraints</h3>
      
      <div className="space-y-4">
        {(Object.keys(groupedDrivers) as DriverCategory[]).map((category) => {
          const config = categoryConfig[category]
          const items = groupedDrivers[category]
          const Icon = config.icon

          return (
            <div key={category} className="space-y-2">
              <div className="flex items-center gap-2">
                <div className={`p-1.5 rounded-lg ${config.bg}`}>
                  <Icon className={`w-4 h-4 ${config.color}`} />
                </div>
                <span className="text-sm font-semibold text-slate-900">{config.label}</span>
                <span className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide bg-slate-100 text-slate-600 rounded-full">
                  {config.tag}
                </span>
              </div>
              <ul className="space-y-1.5 ml-9">
                {items.map((item, idx) => (
                  <li key={idx} className="text-sm text-slate-600 flex items-start gap-2">
                    <span className="text-slate-400 mt-1">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )
        })}
      </div>
    </div>
  )
}
