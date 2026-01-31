'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { InputPanel } from './input-panel';
import { ResultsPanel } from './results-panel';
import { motion } from 'framer-motion';
import { otpApiClient, PromiseRequest, PromiseResponse } from '@/lib/api/otp-client';

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
      })
    )
    .min(1, 'At least one item is required'),
  desiredDeliveryDate: z.string().default(''),
  deliveryMode: z.enum(['LATEST_ACCEPTABLE', 'NO_EARLY_DELIVERY', 'STRICT_FAIL']).default('LATEST_ACCEPTABLE'),
  cutoffTime: z.string().default('14:00'),
  cutoffTimezone: z.string().default('UTC'),
  bufferDays: z.number().default(1),
});

type PromiseFormValues = any;
type LineItem = {
  item_code: string;
  qty: number;
  warehouse?: string;
  lead_time_override_days?: number;
};

export function PromiseCalculator() {
  const [result, setResult] = useState<PromiseResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<any>({
    resolver: zodResolver(promiseFormSchema),
    defaultValues: {
      salesOrderId: '',
      customer: '',
      items: [{ item_code: '', qty: 1, warehouse: 'Stores - SD' }],
      desiredDeliveryDate: '',
      deliveryMode: 'LATEST_ACCEPTABLE',
      cutoffTime: '14:00',
      cutoffTimezone: 'UTC',
      bufferDays: 1,
    },
  });

  const onSubmit = async (data: PromiseFormValues) => {
    setError(null);
    setIsLoading(true);
    setResult(null);

    try {
      // Build API request
      const items = (data.items as LineItem[]) || [];
      const request: PromiseRequest = {
        customer: data.customer,
        items: items.map((item) => ({
          item_code: item.item_code,
          qty: item.qty,
          warehouse: item.warehouse,
        })),
        desired_date: data.desiredDeliveryDate || undefined,
        rules: {
          no_weekends: true,
          cutoff_time: data.cutoffTime,
          timezone: data.cutoffTimezone,
          lead_time_buffer_days: data.bufferDays,
          processing_lead_time_days: 1,
          desired_date_mode: data.deliveryMode,
        },
        sales_order_id: data.salesOrderId || undefined,
      };

      // sales_order_id already set if provided

      // Call API
      const response = await otpApiClient.evaluatePromise(request);

      // Store in audit history
      const auditRecord = {
        id: `audit_${Date.now()}`,
        timestamp: new Date().toISOString(),
        customer: data.customer,
        itemCount: data.items.length,
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

      setResult(response);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to evaluate promise';
      setError(message);
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
        <InputPanel form={form} onSubmit={onSubmit} isLoading={isLoading} />

        {/* Right Column: Results */}
        <ResultsPanel result={result} isLoading={isLoading} />
      </div>
    </div>
  );
}
