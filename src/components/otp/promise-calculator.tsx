'use client';

/**
 * Promise Calculator - OTP Frontend State Model & Endpoints
 * 
 * STATE ARCHITECTURE:
 * - Maintains TWO separate form drafts: manualDraft (Manual Order) + fromSoDraft (From Sales Order)
 * - Switching input modes does NOT overwrite the other draft
 * - Each mode has isolated: customer, items[], delivery settings
 * 
 * BACKEND ENDPOINTS:
 * - GET /otp/sales-orders?limit&offset&search → list of Sales Orders
 * - GET /otp/sales-orders/{id} → full details with items[], defaults{}
 * - POST /otp/promise → evaluate promise, returns promise_date, confidence, status, plan[]
 * 
 * WEEKEND: Friday + Saturday (Israel workweek: Sun-Thu)
 * WAREHOUSES: Stores-SD, Goods In Transit-SD, Finished Goods-SD, Work In Progress-SD, All Warehouses-SD
 * STATUS LOGIC: Feasible (OK + promise exists), At Risk (LOW confidence), Not Feasible (CANNOT_FULFILL or no date)
 */

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { InputPanel } from './input-panel';
import { OtpResultPanel } from './result/OtpResultPanel';
import { motion } from 'framer-motion';
import { otpClient, PromiseRequest, PromiseResponse } from '@/lib/api/otpClient';

// Validation schema
const promiseFormSchema = z.object({
  salesOrderId: z.string().default(''),
  customer: z.string().min(1, 'Customer name is required'),
  items: z
    .array(
      z.object({
        item_code: z.string().min(1, 'Item code is required'),
        qty: z.number().min(1, 'Quantity must be at least 1'),
        warehouse: z.string().default(''),
        lead_time_override_days: z.number().optional(),
        stock_actual: z.number().optional(),
        stock_reserved: z.number().optional(),
        stock_available: z.number().optional(),
      })
    )
    .min(1, 'At least one item is required'),
  desiredDeliveryDate: z.string().default(''),
  orderCreatedAt: z.string().default(''),
  deliveryMode: z.enum(['LATEST_ACCEPTABLE', 'NO_EARLY_DELIVERY', 'STRICT_FAIL']).default('LATEST_ACCEPTABLE'),
  noWeekends: z.boolean().default(true),
  cutoffTime: z.string().default('14:00'),
  cutoffTimezone: z.string().default('UTC'),
  bufferDays: z.number().default(1),
  defaultWarehouse: z.string().default('Stores - SD'),
});

type PromiseFormValues = any;
type LineItem = {
  item_code: string;
  qty: number;
  warehouse?: string;
  lead_time_override_days?: number;
  stock_actual?: number;
  stock_reserved?: number;
  stock_available?: number;
};

function pad2(value: number) {
  return value.toString().padStart(2, '0');
}

function getLocalDateTimeValue(date: Date) {
  const yyyy = date.getFullYear();
  const mm = pad2(date.getMonth() + 1);
  const dd = pad2(date.getDate());
  const hh = pad2(date.getHours());
  const min = pad2(date.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
}

function isAfterCutoff(orderCreatedAt?: string, cutoffTime?: string) {
  if (!orderCreatedAt || !cutoffTime) return false;
  const timePart = orderCreatedAt.split('T')[1];
  if (!timePart) return false;
  return timePart >= cutoffTime;
}

export function PromiseCalculator() {
  const [result, setResult] = useState<PromiseResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const clearResults = () => {
    setResult(null);
    setError(null);
  };

  const form = useForm<any>({
    resolver: zodResolver(promiseFormSchema),
    mode: 'onChange',
    reValidateMode: 'onChange',
    defaultValues: {
      salesOrderId: '',
      customer: '',
      items: [{ item_code: '', qty: 1, warehouse: 'Stores - SD' }],
      desiredDeliveryDate: '',
      orderCreatedAt: getLocalDateTimeValue(new Date()),
      deliveryMode: 'LATEST_ACCEPTABLE',
      noWeekends: true,
      cutoffTime: '14:00',
      cutoffTimezone: 'UTC',
      bufferDays: 1,
      defaultWarehouse: 'Stores - SD',
    },
  });

  const onSubmit = async (data: PromiseFormValues) => {
    setError(null);
    setIsLoading(true);
    setResult(null);

    try {
      // Filter out items with empty item_code or invalid items (those that failed validation)
      const validItems = (data.items as LineItem[]).filter(
        (item) => item.item_code && item.item_code.trim().length > 0
      ) || [];

      if (validItems.length === 0) {
        setError('At least one valid item is required');
        setIsLoading(false);
        return;
      }

      // Build API request with only valid items
      const request: PromiseRequest = {
        customer: data.customer,
        items: validItems.map((item) => ({
          item_code: item.item_code,
          qty: item.qty,
          warehouse: item.warehouse,
        })),
        desired_date: data.desiredDeliveryDate || undefined,
        rules: {
          no_weekends: data.noWeekends,
          cutoff_time: data.cutoffTime,
          timezone: data.cutoffTimezone,
          lead_time_buffer_days: data.bufferDays,
          processing_lead_time_days: 1,
          desired_date_mode: data.deliveryMode,
          order_created_at: data.orderCreatedAt || undefined,
        },
        sales_order_id: data.salesOrderId || undefined,
      };

      // sales_order_id already set if provided

      // Call API
      const response = await otpClient.evaluatePromise(request);

      const afterCutoffNote = isAfterCutoff(data.orderCreatedAt, data.cutoffTime)
        ? 'After cutoff → processed next business day'
        : null

      const enrichedResponse: PromiseResponse = afterCutoffNote
        ? {
            ...response,
            blockers: [...(response.blockers || []), afterCutoffNote],
          }
        : response

      // Store in audit history
      const auditRecord = {
        id: `audit_${Date.now()}`,
        timestamp: new Date().toISOString(),
        customer: data.customer,
        itemCount: validItems.length,
        confidence: response.confidence,
        promiseDate: response.promise_date,
        onTime: response.on_time || null,
        request,
        response,
      };

      const existing = localStorage.getItem('otp_audit_history');
      const history = existing ? JSON.parse(existing) : [];
      history.push(auditRecord);
      localStorage.setItem('otp_audit_history', JSON.stringify(history));

      setResult(enrichedResponse);
    } catch (err) {
      let errorMessage = err instanceof Error ? err.message : 'Failed to evaluate promise';

      // Handle OTP API errors with validation details
      if (err instanceof Error && err.message.includes('unknown item')) {
        const itemMatch = err.message.match(/unknown item[:\s](.+)/i);
        if (itemMatch) {
          errorMessage = `Item "${itemMatch[1]}" not found in inventory. Please check the item code.`;
        }
      }

      // Handle validation errors from backend
      if (err instanceof Error && err.message.includes('validation')) {
        errorMessage = 'Validation error: Please check all items are valid.';
      }

      setError(errorMessage);
      console.error('Promise evaluation error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Promise Calculator</h1>
        <p className="text-sm text-slate-600 mt-1">
          Evaluate delivery promises for customer orders
        </p>
      </div>

      {/* Error Banner */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 border border-red-200 rounded-lg p-4"
        >
          <p className="text-sm font-medium text-red-800">{error}</p>
        </motion.div>
      )}

      {/* Main Layout: 2-Column */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Inputs */}
        <InputPanel form={form} onSubmit={onSubmit} isLoading={isLoading} onClearResults={clearResults} />

        {/* Right Column: Results */}
        <OtpResultPanel result={result} isLoading={isLoading} />
      </div>
    </div>
  );
}
