'use client';

import React, { useState, useEffect } from 'react';
import { useFieldArray, UseFormReturn } from 'react-hook-form';
import { AlertCircle, Plus, Trash2, ChevronDown, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { otpApiClient } from '@/lib/api/otp-client';

interface InputPanelProps {
  form: UseFormReturn<any>;
  onSubmit: (data: any) => Promise<void>;
  isLoading: boolean;
}

// Sample SKU list for autocomplete
const SAMPLE_SKUS = ['SKU-001', 'SKU-002', 'SKU-003', 'SKU-004', 'SKU-005', 'PROD-A', 'PROD-B'];

const WAREHOUSES = ['Stores - SD', 'Warehouse A', 'Warehouse B', 'Warehouse C', 'Distribution Center'];

const DELIVERY_MODES = [
  {
    id: 'LATEST_ACCEPTABLE',
    label: 'Latest Acceptable (Default)',
    description: 'Promise the latest date acceptable',
  },
  {
    id: 'NO_EARLY_DELIVERY',
    label: 'No Early Delivery',
    description: 'Avoid delivering before desired date',
  },
  {
    id: 'STRICT_FAIL',
    label: 'Strict Fail',
    description: 'Fail if desired date cannot be met',
  },
];

export function InputPanel({ form, onSubmit, isLoading }: InputPanelProps) {
  const errors = form.formState.errors as any;
  const [backendOnline, setBackendOnline] = useState(true);
  const [salesOrdersAvailable, setSalesOrdersAvailable] = useState(true);
  const [salesOrdersChecked, setSalesOrdersChecked] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showDeliverySettings, setShowDeliverySettings] = useState(false);

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'items',
  });

  // Check backend health on mount
  useEffect(() => {
    const checkHealth = async () => {
      try {
        await otpApiClient.checkHealth();
        setBackendOnline(true);
      } catch {
        setBackendOnline(false);
      }
    };

    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const checkSalesOrdersEndpoint = async () => {
      if (salesOrdersChecked) return;
      setSalesOrdersChecked(true);
      try {
        await otpApiClient.fetchSalesOrders();
        setSalesOrdersAvailable(true);
      } catch (error: any) {
        const statusCode = error?.statusCode || 0;
        if (statusCode === 404 || statusCode === 501) {
          setSalesOrdersAvailable(false);
        }
      }
    };

    checkSalesOrdersEndpoint();
  }, [salesOrdersChecked]);

  const canEvaluate =
    form.formState.isValid &&
    backendOnline &&
    form.watch('customer') &&
    fields.length > 0;

  const handleAddItem = () => {
    append({ item_code: '', qty: 1, warehouse: 'Stores - SD' });
  };

  const handleClearAll = () => {
    while (fields.length > 0) {
      remove(0);
    }
    append({ item_code: '', qty: 1, warehouse: 'Stores - SD' });
  };

  return (
    <div className="space-y-4">
      {/* Backend Status Banner */}
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

      {/* Order Input Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900 mb-6">Order Input</h2>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Mode Selector */}
          <div>
            <label className="text-sm font-medium text-slate-700 mb-3 block">Input Mode</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                className="px-4 py-2 rounded-lg border-2 border-blue-600 bg-blue-50 text-blue-700 font-medium text-sm transition"
              >
                Manual Order
              </button>
              <button
                type="button"
                disabled
                title="Endpoint not yet available"
                className="px-4 py-2 rounded-lg border border-slate-300 bg-slate-50 text-slate-400 font-medium text-sm cursor-not-allowed"
              >
                From Sales Order ID
              </button>
            </div>
          </div>

          {/* Sales Order ID (Optional) */}
          <div>
            <label htmlFor="salesOrderId" className="block text-sm font-medium text-slate-700 mb-2">
              Sales Order ID (Optional)
            </label>
            <div className="flex gap-2">
              <input
                id="salesOrderId"
                type="text"
                placeholder="e.g., SO-2024-001"
                {...form.register('salesOrderId')}
                className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              />
              <button
                type="button"
                onClick={() => setSalesOrdersChecked(false)}
                className="px-3 py-2 text-xs bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700"
              >
                Refresh list
              </button>
            </div>
            {!salesOrdersAvailable && (
              <p className="text-xs text-blue-600 mt-2">
                Sales Order list endpoint unavailable — enter Sales Order ID manually.
              </p>
            )}
          </div>

          {/* Customer Name */}
          <div>
            <label htmlFor="customer" className="block text-sm font-medium text-slate-700 mb-2">
              Customer Name <span className="text-red-600">*</span>
            </label>
            <input
              id="customer"
              type="text"
              placeholder="e.g., Acme Corporation"
              {...form.register('customer')}
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
                {fields.length} item{fields.length !== 1 ? 's' : ''}
              </span>
            </div>

            <div className="space-y-3 max-h-80 overflow-y-auto">
              {fields.map((field, index) => (
                <motion.div
                  key={field.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className={`grid ${showAdvanced ? 'grid-cols-6' : 'grid-cols-5'} gap-2 items-end`}
                >
                  {/* Item Code */}
                  <div className="col-span-2">
                    <label className="text-xs text-slate-600 block mb-1">Item Code</label>
                    <input
                      type="text"
                      placeholder="e.g., SKU-001"
                      list={`sku-list-${index}`}
                      {...form.register(`items.${index}.item_code`)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                    <datalist id={`sku-list-${index}`}>
                      {SAMPLE_SKUS.map((sku) => (
                        <option key={sku} value={sku} />
                      ))}
                    </datalist>
                    {errors.items?.[index]?.item_code?.message && (
                      <p className="text-xs text-red-600 mt-0.5">{String(errors.items[index].item_code.message)}</p>
                    )}
                  </div>

                  {/* Quantity */}
                  <div>
                    <label className="text-xs text-slate-600 block mb-1">Qty</label>
                    <input
                      type="number"
                      min="1"
                      {...form.register(`items.${index}.qty`, { valueAsNumber: true })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                  </div>

                  {/* Warehouse */}
                  <div>
                    <label className="text-xs text-slate-600 block mb-1">Warehouse</label>
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
                      <label className="text-xs text-slate-600 block mb-1">Lead Time</label>
                      <input
                        type="number"
                        min="0"
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
                className={`w-4 h-4 transition ${showDeliverySettings ? 'transform -rotate-180' : ''}`}
              />
            </button>

            <AnimatePresence>
              {showDeliverySettings && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
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
                      {...form.register('desiredDeliveryDate')}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
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
                            {...form.register('deliveryMode')}
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

                  {/* Cutoff Time */}
                  <div>
                    <label htmlFor="cutoffTime" className="block text-sm font-medium text-slate-700 mb-2">
                      Order Cutoff Time
                    </label>
                    <input
                      id="cutoffTime"
                      type="time"
                      {...form.register('cutoffTime')}
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
                      {...form.register('cutoffTimezone')}
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
                      {...form.register('bufferDays', { valueAsNumber: true })}
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
              canEvaluate && !isLoading
                ? 'bg-blue-600 hover:bg-blue-700'
                : 'bg-slate-300 cursor-not-allowed'
            }`}
          >
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
            {isLoading ? 'Evaluating...' : 'Evaluate Promise'}
          </button>

          {!backendOnline && (
            <p className="text-xs text-center text-red-600 font-medium">Backend must be online to evaluate</p>
          )}
        </form>
      </div>
    </div>
  );
}
