"use client"

import React, { useEffect, useMemo, useState } from "react"
import { useFieldArray, UseFormReturn } from "react-hook-form"
import { AlertCircle, Loader2 } from "lucide-react"
import { motion } from "framer-motion"
import { otpClient, OTPApiError } from "@/lib/api/otpClient"
import { AlertBanner } from "@/components/ui/alert-banner"
import { SalesOrderSelector } from "./SalesOrderSelector"
import { OrderForm } from "./OrderForm"
import { useBackendHealth } from "@/hooks/useBackendHealth"
import { useSalesOrderDetails } from "@/hooks/useSalesOrderDetails"
import type { SalesOrderDetailsResponse, SalesOrderDetailItem } from "@/lib/api/types"

interface InputPanelProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: UseFormReturn<any>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSubmit: (data: any) => Promise<void>
  isLoading: boolean
  onClearResults?: () => void
}

const DEFAULT_WAREHOUSE = "Stores - SD"

function normalizeSalesOrderId(details: SalesOrderDetailsResponse, fallbackId?: string | null) {
  return details.sales_order_id || details.name || fallbackId || ""
}

function normalizeCustomer(details: SalesOrderDetailsResponse) {
  return details.customer_name || details.customer || ""
}

function normalizeDesiredDate(details: SalesOrderDetailsResponse) {
  return details.delivery_date || details.transaction_date || ""
}

function normalizeOrderCreatedAt(details: SalesOrderDetailsResponse) {
  if (!details.transaction_date) return ""
  return `${details.transaction_date}T00:00`
}

function normalizeItems(
  detailsItems: SalesOrderDetailItem[] | undefined,
  defaultWarehouse: string
) {
  if (!detailsItems || detailsItems.length === 0) {
    return [{ item_code: "", qty: 1, warehouse: defaultWarehouse }]
  }

  return detailsItems.map((item) => ({
    item_code: item.item_code || "",
    qty: item.qty ?? 1,
    warehouse: item.warehouse || defaultWarehouse,
    stock_actual: item.stock_actual,
    stock_reserved: item.stock_reserved,
    stock_available: item.stock_available,
  }))
}

// Type for storing draft state
type DraftState = {
  salesOrderId: string
  customer: string
  items: Array<{
    item_code: string
    qty: number
    warehouse: string
    stock_actual?: number
    stock_reserved?: number
    stock_available?: number
  }>
  desiredDeliveryDate: string
  orderCreatedAt: string
  deliveryMode: "LATEST_ACCEPTABLE" | "NO_EARLY_DELIVERY" | "STRICT_FAIL"
  noWeekends: boolean
  cutoffTime: string
  cutoffTimezone: string
  defaultWarehouse: string
}

export function InputPanel({ form, onSubmit, isLoading, onClearResults }: InputPanelProps) {
  const { isError: healthError } = useBackendHealth()
  const backendOnline = !healthError
  const baseUrlWarning = otpClient.getBaseUrlWarning()

  const [inputMode, setInputMode] = useState<"manual" | "salesOrder">("manual")
  const [selectedSalesOrder, setSelectedSalesOrder] = useState<string | null>(null)
  const [detailsAppliedFor, setDetailsAppliedFor] = useState<string | null>(null)
  
  // TWO separate draft states - one for each mode
  const defaultManualDraft: DraftState = {
    salesOrderId: "",
    customer: "",
    items: [{ item_code: "", qty: 1, warehouse: DEFAULT_WAREHOUSE }],
    desiredDeliveryDate: "",
    orderCreatedAt: "",
    deliveryMode: "LATEST_ACCEPTABLE",
    noWeekends: true,
    cutoffTime: "14:00",
    cutoffTimezone: "UTC",
    defaultWarehouse: DEFAULT_WAREHOUSE,
  }
  
  const [manualDraft, setManualDraft] = useState<DraftState>(defaultManualDraft)
  
  const [fromSoDraft, setFromSoDraft] = useState<DraftState>({
    salesOrderId: "",
    customer: "",
    items: [{ item_code: "", qty: 1, warehouse: DEFAULT_WAREHOUSE }],
    desiredDeliveryDate: "",
    orderCreatedAt: "",
    deliveryMode: "LATEST_ACCEPTABLE",
    noWeekends: true,
    cutoffTime: "14:00",
    cutoffTimezone: "UTC",
    defaultWarehouse: DEFAULT_WAREHOUSE,
  })

  const {
    data: salesOrderDetails,
    isLoading: detailsLoading,
    isError: detailsError,
    error: detailsErrorRaw,
    refetch: refetchDetails,
  } = useSalesOrderDetails(selectedSalesOrder)

  const detailsErrorNormalized = detailsErrorRaw as OTPApiError | undefined

  const { fields, append, remove, replace } = useFieldArray({
    control: form.control,
    name: "items",
  })

  // Load draft state into form
  const loadDraft = (draft: DraftState) => {
    form.setValue("salesOrderId", draft.salesOrderId, { shouldValidate: true })
    form.setValue("customer", draft.customer, { shouldValidate: true })
    form.setValue("desiredDeliveryDate", draft.desiredDeliveryDate, { shouldValidate: true })
    form.setValue("orderCreatedAt", draft.orderCreatedAt, { shouldValidate: true })
    form.setValue("deliveryMode", draft.deliveryMode, { shouldValidate: true })
    form.setValue("noWeekends", draft.noWeekends, { shouldValidate: true })
    form.setValue("cutoffTime", draft.cutoffTime, { shouldValidate: true })
    form.setValue("cutoffTimezone", draft.cutoffTimezone, { shouldValidate: true })
    form.setValue("defaultWarehouse", draft.defaultWarehouse, { shouldValidate: true })
    replace(draft.items)
  }

  // Save current form state to appropriate draft before switching
  const saveCurrentDraft = () => {
    const currentValues = {
      salesOrderId: form.getValues("salesOrderId") || "",
      customer: form.getValues("customer") || "",
      items: form.getValues("items") || [{ item_code: "", qty: 1, warehouse: DEFAULT_WAREHOUSE }],
      desiredDeliveryDate: form.getValues("desiredDeliveryDate") || "",
      orderCreatedAt: form.getValues("orderCreatedAt") || "",
      deliveryMode: form.getValues("deliveryMode") || "LATEST_ACCEPTABLE",
      noWeekends: form.getValues("noWeekends") ?? true,
      cutoffTime: form.getValues("cutoffTime") || "14:00",
      cutoffTimezone: form.getValues("cutoffTimezone") || "UTC",
      defaultWarehouse: form.getValues("defaultWarehouse") || DEFAULT_WAREHOUSE,
    }
    
    if (inputMode === "manual") {
      setManualDraft(currentValues)
    } else {
      setFromSoDraft(currentValues)
    }
  }

  useEffect(() => {
    if (selectedSalesOrder) {
      form.setValue("salesOrderId", selectedSalesOrder, { shouldValidate: true })
    }
  }, [selectedSalesOrder, form])

  useEffect(() => {
    if (!selectedSalesOrder) {
      setDetailsAppliedFor(null)
      return
    }
    if (detailsLoading || !salesOrderDetails) return
    if (detailsAppliedFor === selectedSalesOrder) return

    const defaults = salesOrderDetails.defaults || {}
    const defaultWarehouse = defaults.warehouse || DEFAULT_WAREHOUSE

    if (!salesOrderDetails.items) {
      console.warn("Sales Order details missing items array.", salesOrderDetails)
    }
    if (!salesOrderDetails.customer_name && !salesOrderDetails.customer) {
      console.warn("Sales Order details missing customer name.", salesOrderDetails)
    }

    // Apply Sales Order details to form AND update fromSoDraft
    const updatedDraft: DraftState = {
      salesOrderId: normalizeSalesOrderId(salesOrderDetails, selectedSalesOrder),
      customer: normalizeCustomer(salesOrderDetails),
      desiredDeliveryDate: normalizeDesiredDate(salesOrderDetails),
      orderCreatedAt: normalizeOrderCreatedAt(salesOrderDetails),
      deliveryMode: defaults.delivery_mode || "LATEST_ACCEPTABLE",
      noWeekends: defaults.no_weekends ?? true,
      cutoffTime: defaults.cutoff_time || "14:00",
      cutoffTimezone: form.getValues("cutoffTimezone") || "UTC",
      defaultWarehouse: defaultWarehouse,
      items: normalizeItems(salesOrderDetails.items, defaultWarehouse),
    }
    
    // Update the fromSoDraft
    setFromSoDraft(updatedDraft)
    
    // Apply to form
    loadDraft(updatedDraft)

    setDetailsAppliedFor(selectedSalesOrder)
  }, [
    selectedSalesOrder,
    salesOrderDetails,
    detailsLoading,
    detailsAppliedFor,
  ])

  const handleModeChange = (mode: "manual" | "salesOrder") => {
    // Save current draft before switching
    saveCurrentDraft()
    
    // Switch mode
    setInputMode(mode)
    
    // Load the appropriate draft
    if (mode === "manual") {
      setSelectedSalesOrder(null)
      setDetailsAppliedFor(null)
      loadDraft(manualDraft)
    } else {
      loadDraft(fromSoDraft)
    }
  }

  const handleSalesOrderChange = (value: string | null) => {
    setSelectedSalesOrder(value)
    setDetailsAppliedFor(null)
    
    if (!value) {
      // Clear was clicked - reset the SO mode form AND fromSoDraft
      const resetDraft: DraftState = {
        salesOrderId: "",
        customer: "",
        desiredDeliveryDate: "",
        items: [{ item_code: "", qty: 1, warehouse: DEFAULT_WAREHOUSE }],
        deliveryMode: "LATEST_ACCEPTABLE",
        noWeekends: true,
        cutoffTime: "14:00",
        cutoffTimezone: "UTC",
        orderCreatedAt: "",
        defaultWarehouse: DEFAULT_WAREHOUSE,
      }
      setFromSoDraft(resetDraft)
      loadDraft(resetDraft)
      
      // Clear promise results if they were based on this Sales Order
      if (onClearResults) {
        onClearResults()
      }
    }
  }

  const manualSalesOrderId = form.watch("salesOrderId")
  const items = form.watch("items") || []
  const customerName = form.watch("customer")

  const hasValidItems = Array.isArray(items)
    ? items.some((item: any) => item?.item_code?.trim() && Number(item?.qty) > 0)
    : false

  const canEvaluate = Boolean(customerName?.trim()) && hasValidItems && backendOnline

  const detailsStatus = useMemo(() => {
    if (!selectedSalesOrder) return null
    if (detailsLoading) return "loading"
    if (detailsError) return "error"
    if (salesOrderDetails) return "ready"
    return null
  }, [selectedSalesOrder, detailsLoading, detailsError, salesOrderDetails])

  return (
    <div className="space-y-4">
      {!backendOnline && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3"
        >
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-800">Backend Unreachable</p>
            <p className="text-xs text-red-700 mt-1">
              Cannot connect to the OTP backend. Check your connection and try again.
            </p>
          </div>
        </motion.div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-slate-900">Order Input</h2>
          <div
            className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-medium ${
              backendOnline
                ? "bg-green-50 border-green-200 text-green-700"
                : "bg-red-50 border-red-200 text-red-700"
            }`}
          >
            <span className={`h-2 w-2 rounded-full ${backendOnline ? "bg-green-600" : "bg-red-600"}`} />
            {backendOnline ? "API connected" : "API offline"}
          </div>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {baseUrlWarning && (
            <AlertBanner
              variant="warning"
              title="Wrong API endpoint"
              description={baseUrlWarning}
            />
          )}

          <div>
            <label className="text-sm font-medium text-slate-700 mb-3 block">Input Mode</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleModeChange("manual")}
                data-testid="input-mode-manual"
                className={`px-4 py-2 rounded-lg border text-sm font-medium transition ${
                  inputMode === "manual"
                    ? "border-blue-600 bg-blue-50 text-blue-700"
                    : "border-slate-300 bg-white text-slate-600 hover:border-blue-300"
                }`}
              >
                Manual Order
              </button>
              <button
                type="button"
                onClick={() => handleModeChange("salesOrder")}
                data-testid="input-mode-sales-order"
                className={`px-4 py-2 rounded-lg border text-sm font-medium transition ${
                  inputMode === "salesOrder"
                    ? "border-blue-600 bg-blue-50 text-blue-700"
                    : "border-slate-300 bg-white text-slate-600 hover:border-blue-300"
                }`}
              >
                From Sales Order ID
              </button>
            </div>
            <p className="text-xs text-slate-500 mt-2">Choose manual input or select an existing Sales Order.</p>
          </div>

          {inputMode === "manual" && (
            <div>
              <label htmlFor="salesOrderId" className="block text-sm font-medium text-slate-700 mb-2">
                Sales Order ID (Optional)
              </label>
              <input
                id="salesOrderId"
                type="text"
                placeholder="e.g., SO-2024-001"
                value={manualSalesOrderId || ""}
                onChange={(event) => form.setValue("salesOrderId", event.target.value, { shouldValidate: true })}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                data-testid="sales-order-manual-input"
              />
            </div>
          )}

          {inputMode === "salesOrder" && (
            <div className="space-y-3">
              <SalesOrderSelector
                value={selectedSalesOrder}
                onChange={handleSalesOrderChange}
                manualIdValue={manualSalesOrderId}
                onManualIdChange={(value) => form.setValue("salesOrderId", value, { shouldValidate: true })}
              />

              {detailsStatus === "loading" && (
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Fetching Sales Order details...
                </div>
              )}

              {detailsStatus === "error" && (
                <AlertBanner
                  variant="error"
                  title="Failed to load Sales Order details"
                  description={detailsErrorNormalized?.detail || detailsErrorNormalized?.message}
                  action={
                    <button
                      type="button"
                      onClick={() => refetchDetails()}
                      className="px-3 py-1.5 text-xs bg-white/70 hover:bg-white border border-red-200 rounded-lg text-red-700"
                    >
                      Retry
                    </button>
                  }
                />
              )}

              {detailsStatus === "ready" && (
                <p className="text-[11px] text-slate-400">Sales Order details applied.</p>
              )}
            </div>
          )}

          <OrderForm
            form={form}
            fields={fields}
            append={append}
            remove={remove}
            replace={replace}
            isLoading={isLoading}
            canEvaluate={canEvaluate}
            backendOnline={backendOnline}
          />
        </form>
      </div>
    </div>
  )
}
