"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import {
  PromiseStatusBadge,
  ConfidenceBadge,
  BlockersDisplay,
  FulfillmentTimeline,
  PromiseOptions,
  HealthStatusIndicator,
  ErrorDisplay,
  ErrorBoundary,
  ProcurementModal,
} from "@/components/promise"
import { MOCK_PROMISE_RESPONSE_CANNOT_FULFILL } from "@/lib/api/mockData"
import type { APIError } from "@/lib/api/types"

/**
 * Component Showcase Page
 * Demonstrates all sophisticated UI components from the OTP integration
 *
 * This page is useful for:
 * - Testing component rendering without API calls
 * - Visual regression testing
 * - Documentation of component capabilities
 * - Development/iteration on component design
 */
export default function ComponentShowcase() {
  const [selectedProcurementItems, setSelectedProcurementItems] = useState(false)
  const [demoError, setDemoError] = useState<APIError | null>(null)

  // Demo data from mock response
  const mockResponse = MOCK_PROMISE_RESPONSE_CANNOT_FULFILL
  const mockBlockers = [
    {
      type: "error" as const,
      title: "Insufficient Stock",
      description: "Current inventory is not enough to meet demand",
      details: [
        "Item SKU001: 10 units available, 50 units required",
        "Item SKU002: 25 units available, 45 units required",
      ],
    },
    {
      type: "warning" as const,
      title: "Delayed PO Arrival",
      description: "Expected purchase orders arrive after desired date",
      details: ["PO for SKU001 arrives 5 days late"],
    },
    {
      type: "info" as const,
      title: "Supply Chain Note",
      description: "Supplier is experiencing delays",
    },
  ]

  const mockError: APIError = {
    code: "VALIDATION_ERROR",
    message: "Validation error: Please check your input",
    detail:
      '[{"loc":["body","items",0,"item_code"],"msg":"ensure this value has at least 1 characters","type":"value_error.any_str.min_length","ctx":{"limit_value":1}},{"loc":["body","desired_date"],"msg":"value is not a valid datetime","type":"type_error.datetime"}]',
    statusCode: 422,
    validationErrors: [
      { field: "items[0].item_code", message: "Item code is required" },
      { field: "desired_date", message: "Invalid date format" },
    ],
  }

  const mockProcurementItems = mockResponse.plan?.flatMap((p) =>
    p.fulfillment.map((f) => ({
      item_code: p.item_code,
      qty_needed: f.qty,
      warehouse: f.warehouse || "Stores - Main",
    }))
  ) || []

  return (
    <ErrorBoundary
      onError={(error: Error) => {
        console.error("ErrorBoundary caught:", error)
      }}
    >
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
        <div className="max-w-6xl mx-auto space-y-12">
          {/* Header */}
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-4xl font-bold text-slate-900 mb-2">Component Showcase</h1>
            <p className="text-lg text-slate-600">
              Demonstration of sophisticated OTP engine UI components
            </p>
          </motion.div>

          {/* Status Components */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white p-8 rounded-lg shadow-sm border border-slate-200 space-y-6"
          >
            <h2 className="text-2xl font-bold text-slate-900">Status Display Components</h2>

            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-600 mb-3">Promise Status Badges</h3>
                <div className="flex flex-wrap gap-4">
                  <PromiseStatusBadge status="OK" />
                  <PromiseStatusBadge status="CANNOT_FULFILL" />
                  <PromiseStatusBadge status="CANNOT_PROMISE_RELIABLY" />
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-slate-600 mb-3">Confidence Levels</h3>
                <div className="flex flex-wrap gap-4">
                  <ConfidenceBadge confidence="HIGH" size="sm" />
                  <ConfidenceBadge confidence="HIGH" size="md" />
                  <ConfidenceBadge confidence="HIGH" size="lg" />
                  <ConfidenceBadge confidence="MEDIUM" showLabel />
                  <ConfidenceBadge confidence="LOW" showLabel />
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-slate-600 mb-3">Health Status</h3>
                <div className="flex flex-wrap gap-4">
                  <HealthStatusIndicator compact={false} />
                  <HealthStatusIndicator compact={true} />
                </div>
              </div>
            </div>
          </motion.section>

          {/* Information Display Components */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          >
            {/* Blockers */}
            <div className="bg-white p-8 rounded-lg shadow-sm border border-slate-200">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">Blockers Display</h2>
              <BlockersDisplay blockers={mockBlockers} title="Issues Preventing Fulfillment" />
            </div>

            {/* Fulfillment Timeline */}
            <div className="bg-white p-8 rounded-lg shadow-sm border border-slate-200">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">Fulfillment Timeline</h2>
              <FulfillmentTimeline
                fulfillments={
                  mockResponse.plan?.flatMap((p) =>
                    p.fulfillment.map((f) => ({
                      ...f,
                      available_date: f.available_date || new Date().toISOString().split("T")[0],
                      ship_ready_date: f.ship_ready_date || new Date().toISOString().split("T")[0],
                    }))
                  ) || [
                    {
                      source: "stock",
                      qty: 10,
                      available_date: new Date().toISOString().split("T")[0],
                      ship_ready_date: new Date().toISOString().split("T")[0],
                      warehouse: "Main Warehouse",
                    },
                    {
                      source: "purchase_order",
                      qty: 30,
                      date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)
                        .toISOString()
                        .split("T")[0],
                      warehouse: "Main Warehouse",
                      details: "Expected delivery in 5 days",
                    },
                  ]
                }
              />
            </div>
          </motion.section>

          {/* Promise Options */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white p-8 rounded-lg shadow-sm border border-slate-200 space-y-6"
          >
            <h2 className="text-2xl font-bold text-slate-900">Promise Options</h2>
            <PromiseOptions
              options={
                mockResponse.options || [
                  {
                    date: new Date().toISOString().split("T")[0],
                    confidence: "HIGH",
                    days_advantage: 0,
                    notes: "Matches your desired date",
                  },
                  {
                    date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)
                      .toISOString()
                      .split("T")[0],
                    confidence: "MEDIUM",
                    days_advantage: 2,
                    notes: "Two days earlier with medium confidence",
                  },
                  {
                    date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
                      .toISOString()
                      .split("T")[0],
                    confidence: "LOW",
                    days_advantage: -7,
                    notes: "One week later but ensures fulfillment",
                  },
                ]
              }
            />
          </motion.section>

          {/* Error Display */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="space-y-4"
          >
            <h2 className="text-2xl font-bold text-slate-900">Error Handling</h2>

            <div className="bg-white p-8 rounded-lg shadow-sm border border-slate-200 space-y-4">
              <h3 className="font-semibold text-slate-900">Validation Error Example</h3>
              <ErrorDisplay error={demoError || mockError} onDismiss={() => setDemoError(null)} />

              {!demoError && (
                <button
                  onClick={() => setDemoError(mockError)}
                  className="text-sm px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-900 rounded"
                >
                  Show Error
                </button>
              )}
            </div>
          </motion.section>

          {/* Procurement Modal */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white p-8 rounded-lg shadow-sm border border-slate-200 space-y-4"
          >
            <h2 className="text-2xl font-bold text-slate-900">Procurement Workflow</h2>
            <p className="text-slate-600">
              Click the button below to see the procurement modal for creating Material Requests
            </p>

            <button
              onClick={() => setSelectedProcurementItems(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Open Procurement Modal
            </button>

            <ProcurementModal
              isOpen={selectedProcurementItems}
              onClose={() => setSelectedProcurementItems(false)}
              items={mockProcurementItems}
              onSuccess={(result: any) => {
                console.log("Procurement created:", result)
              }}
            />
          </motion.section>

          {/* Component Information */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-blue-50 border border-blue-200 p-8 rounded-lg space-y-4"
          >
            <h2 className="text-2xl font-bold text-blue-900">Component Reference</h2>
            <div className="space-y-3 text-sm text-blue-900">
              <p>
                <strong>PromiseStatusBadge</strong> - Displays promise status (OK, CANNOT_FULFILL,
                CANNOT_PROMISE_RELIABLY)
              </p>
              <p>
                <strong>ConfidenceBadge</strong> - Shows confidence level (HIGH, MEDIUM, LOW) with
                size options
              </p>
              <p>
                <strong>BlockersDisplay</strong> - Lists issues preventing fulfillment with
                severity levels
              </p>
              <p>
                <strong>FulfillmentTimeline</strong> - Visualizes fulfillment sources and schedule
              </p>
              <p>
                <strong>PromiseOptions</strong> - Shows alternative delivery date options
              </p>
              <p>
                <strong>HealthStatusIndicator</strong> - Real-time backend health with ERPNext
                status
              </p>
              <p>
                <strong>ErrorDisplay</strong> - Comprehensive error handling with validation details
              </p>
              <p>
                <strong>ErrorBoundary</strong> - Catches React component errors gracefully
              </p>
              <p>
                <strong>ProcurementModal</strong> - Complete workflow for creating Material Requests
              </p>
            </div>
          </motion.section>
        </div>
      </div>
    </ErrorBoundary>
  )
}
