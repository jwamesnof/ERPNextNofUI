"use client"

import React, { useState } from "react"
import { UseFormReturn, FieldArrayWithId } from "react-hook-form"
import { Plus, Trash2, ChevronDown, Loader2 } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

interface OrderFormProps {
  form: UseFormReturn<any>
  fields: FieldArrayWithId<any, "items", "id">[]
  append: (value: any) => void
  remove: (index: number) => void
  replace: (value: any[]) => void
  isLoading: boolean
  canEvaluate: boolean
  backendOnline: boolean
}

// ERPNext warehouse names (Israel logistics)
const WAREHOUSES = [
  "Stores - SD",
  "Goods In Transit - SD",
  "Finished Goods - SD",
  "Work In Progress - SD",
  "All Warehouses - SD",
]

const DELIVERY_MODES = [
  {
    id: "LATEST_ACCEPTABLE",
    label: "Latest Acceptable (Default)",
    description: "Promise the latest date acceptable",
  },
  {
    id: "NO_EARLY_DELIVERY",
    label: "No Early Delivery",
    description: "Avoid delivering before desired date",
  },
  {
    id: "STRICT_FAIL",
    label: "Strict Fail",
    description: "Fail if desired date cannot be met",
  },
]

/**
 * WEEKEND_DAYS - Single source of truth for weekend definition
 * 
 * Israel weekend: Friday (5) + Saturday (6)
 * Week days: 0=Sunday, 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday
 * 
 * This constant is used:
 * - For "Exclude weekends" business rule (noWeekends checkbox)
 * - For calendar date validation
 * - For backend promise calculation via no_weekends parameter
 * 
 * Do NOT hardcode weekend assumptions elsewhere. Import this constant instead.
 */
export const WEEKEND_DAYS = [5, 6]

export function OrderForm({
  form,
  fields,
  append,
  remove,
  replace,
  isLoading,
  canEvaluate,
  backendOnline,
}: OrderFormProps) {
  const errors = form.formState.errors as any
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [showDeliverySettings, setShowDeliverySettings] = useState(false)
  const defaultWarehouse = form.watch("defaultWarehouse") || "Stores - SD"

  const handleAddItem = () => {
    append({ item_code: "", qty: 1, warehouse: defaultWarehouse })
  }

  const handleClearAll = () => {
    replace([{ item_code: "", qty: 1, warehouse: defaultWarehouse }])
  }

  return (
    <>
      {/* Customer Name */}
      <div>
        <label htmlFor="customer" className="block text-sm font-medium text-slate-700 mb-2">
          Customer Name <span className="text-red-600">*</span>
        </label>
        <input
          id="customer"
          type="text"
          placeholder="e.g., Acme Corporation"
          {...form.register("customer")}
          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
        />
        {errors.customer?.message && (
          <p className="text-xs text-red-600 mt-1">{String(errors.customer.message)}</p>
        )}
      </div>

      {/* Items Editor */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <label className="text-sm font-medium text-slate-700">
            Items <span className="text-red-600">*</span>
          </label>
          <span className="text-xs text-slate-500 bg-slate-100 px-2 py-1 rounded">
            {fields.length} item{fields.length !== 1 ? "s" : ""}
          </span>
        </div>

        <div className="space-y-3 max-h-80 overflow-y-auto">
          {fields.map((field, index) => (
            <div key={field.id}>
              {/* Labels Row */}
              <div className={`grid ${showAdvanced ? "grid-cols-6" : "grid-cols-5"} gap-2 mb-1`}>
                <div className="col-span-2">
                  <label className="text-xs font-medium text-slate-600">Item Code</label>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600">Qty</label>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600">Warehouse</label>
                </div>
                {showAdvanced && <div className="text-xs font-medium text-slate-600">Lead Time</div>}
              </div>
              
              {/* Fields Row */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className={`grid ${showAdvanced ? "grid-cols-6" : "grid-cols-5"} gap-2`}
              >
                {/* Item Code */}
                <div className="col-span-2 relative">
                  <div className="relative">
                  <input
                    type="text"
                    placeholder="e.g., SKU001"
                    autoCorrect="off"
                    autoCapitalize="none"
                    spellCheck={false}
                    {...form.register(`items.${index}.item_code`)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                  </div>
                  {errors.items?.[index]?.item_code?.message && (
                    <p className="text-xs text-red-600 mt-1">
                      {String(errors.items[index].item_code.message)}
                    </p>
                  )}
                </div>

                {/* Quantity */}
                <div>
                  <input
                    type="number"
                    min="1"
                    {...form.register(`items.${index}.qty`, { valueAsNumber: true })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                  {errors.items?.[index]?.qty?.message && (
                    <p className="text-xs text-red-600 mt-1">
                      {String(errors.items[index].qty.message)}
                    </p>
                  )}
                </div>

                {/* Warehouse */}
                <div>
                  <select
                    {...form.register(`items.${index}.warehouse`)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  >
                    {WAREHOUSES.map((wh) => (
                      <option key={wh} value={wh}>
                        {wh}
                      </option>
                    ))}
                  </select>
                </div>

                {showAdvanced && (
                  <div>
                    <input
                      type="number"
                      min="0"
                      placeholder="days"
                      {...form.register(`items.${index}.lead_time_override_days`, { valueAsNumber: true })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                  </div>
                )}

                {/* Remove Button */}
                <div>
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    className="w-full px-3 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition text-sm font-medium"
                  >
                    <Trash2 className="w-4 h-4 mx-auto" />
                  </button>
                </div>
              </motion.div>
            </div>
          ))}
        </div>

        {errors.items?.message && (
          <p className="text-xs text-red-600 mt-2">{String(errors.items.message)}</p>
        )}

        {/* Item Actions */}
        <div className="flex gap-2 mt-4">
          <button
            type="button"
            onClick={handleAddItem}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition font-medium text-sm"
          >
            <Plus className="w-4 h-4" />
            Add Item
          </button>
          <button
            type="button"
            onClick={handleClearAll}
            className="flex-1 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition font-medium text-sm"
          >
            Clear All
          </button>
        </div>

        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="mt-3 text-xs text-slate-600 hover:text-slate-800"
        >
          {showAdvanced ? "Hide advanced item fields" : "Show advanced item fields"}
        </button>
      </div>

      {/* Delivery Settings Accordion */}
      <div className="border-t border-slate-200 pt-4">
        <button
          type="button"
          onClick={() => setShowDeliverySettings(!showDeliverySettings)}
          className="flex items-center justify-between w-full text-sm font-medium text-slate-900 hover:text-blue-600 transition"
        >
          <span>Delivery Settings</span>
          <ChevronDown
            className={`w-4 h-4 transition ${showDeliverySettings ? "transform -rotate-180" : ""}`}
          />
        </button>

        <AnimatePresence>
          {showDeliverySettings && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 space-y-4"
            >
              {/* Desired Delivery Date */}
              <div>
                <label htmlFor="desiredDeliveryDate" className="block text-sm font-medium text-slate-700 mb-2">
                  Desired Delivery Date (Optional)
                </label>
                <input
                  id="desiredDeliveryDate"
                  type="date"
                  {...form.register("desiredDeliveryDate")}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm weekend-calendar"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Weekend: Friday &amp; Saturday (Israel workweek)
                </p>
              </div>

              {/* Default Warehouse */}
              <div>
                <label htmlFor="defaultWarehouse" className="block text-sm font-medium text-slate-700 mb-2">
                  Default Warehouse
                </label>
                <select
                  id="defaultWarehouse"
                  {...form.register("defaultWarehouse")}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                >
                  {WAREHOUSES.map((wh) => (
                    <option key={wh} value={wh}>
                      {wh}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-slate-500 mt-1">Used as fallback for item warehouses</p>
              </div>

              {/* Delivery Mode */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-3">Delivery Mode</label>
                <div className="space-y-2">
                  {DELIVERY_MODES.map((mode) => (
                    <label key={mode.id} className="flex items-start gap-3 cursor-pointer group">
                      <input
                        type="radio"
                        value={mode.id}
                        {...form.register("deliveryMode")}
                        className="mt-1 w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500"
                      />
                      <div>
                        <p className="text-sm font-medium text-slate-900 group-hover:text-blue-600 transition">
                          {mode.label}
                        </p>
                        <p className="text-xs text-slate-500">{mode.description}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* No Weekends */}
              <div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    {...form.register("noWeekends")}
                    className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500"
                  />
                  <span className="text-sm text-slate-700">Exclude weekends from promise dates</span>
                </label>
                <p className="text-xs text-slate-500 mt-1 ml-7">
                  Weekends: Friday &amp; Saturday (based on Israel workweek)
                </p>
              </div>

              {/* Cutoff Time */}
              <div>
                <label htmlFor="cutoffTime" className="block text-sm font-medium text-slate-700 mb-2">
                  Order Cutoff Time
                </label>
                <input
                  id="cutoffTime"
                  type="time"
                  {...form.register("cutoffTime")}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
                <p className="text-xs text-slate-500 mt-1">Orders after this time processed next day</p>
              </div>

              {/* Timezone */}
              <div>
                <label htmlFor="cutoffTimezone" className="block text-sm font-medium text-slate-700 mb-2">
                  Timezone
                </label>
                <select
                  id="cutoffTimezone"
                  {...form.register("cutoffTimezone")}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                >
                  <option value="UTC">UTC</option>
                  <option value="Asia/Riyadh">Asia/Riyadh</option>
                  <option value="Europe/London">Europe/London</option>
                  <option value="America/New_York">America/New_York</option>
                </select>
                <p className="text-xs text-slate-500 mt-1">Used to interpret cutoff time</p>
              </div>

              {/* Buffer Days */}
              <div>
                <label htmlFor="bufferDays" className="block text-sm font-medium text-slate-700 mb-2">
                  Buffer Days
                </label>
                <input
                  id="bufferDays"
                  type="number"
                  min="0"
                  max="30"
                  {...form.register("bufferDays", { valueAsNumber: true })}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
                <p className="text-xs text-slate-500 mt-1">Safety buffer added to promise dates</p>
              </div>

              <div className="text-xs text-slate-500">
                Workweek: Sunday–Thursday • Weekend: Friday–Saturday
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Evaluate Button */}
      <button
        type="submit"
        disabled={!canEvaluate || isLoading}
        className={`w-full py-3 rounded-lg font-semibold text-white transition flex items-center justify-center gap-2 ${
          canEvaluate && !isLoading ? "bg-blue-600 hover:bg-blue-700" : "bg-slate-300 cursor-not-allowed"
        }`}
      >
        {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
        {isLoading ? "Evaluating..." : "Evaluate Promise"}
      </button>

      {!backendOnline && (
        <p className="text-xs text-center text-red-600 font-medium">Backend must be online to evaluate</p>
      )}
    </>
  )
}
