'use client';

import React, { useMemo, useState } from 'react';
import { format, parseISO } from 'date-fns';
import {
  AlertCircle,
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  Copy,
  Info,
  MessageSquare,
  ShieldAlert,
  ShieldCheck,
  ShieldX,
  Truck,
  XCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { PromiseResponse } from '@/lib/api/otpClient';
import { getWeekendLabel, getWorkweekLabel } from "@/lib/weekend"

interface ResultsPanelProps {
  result: PromiseResponse | null;
  isLoading: boolean;
}

export function ResultsPanel({ result, isLoading }: ResultsPanelProps) {
  const [showExplanation, setShowExplanation] = useState(false);
  const [showCustomerMessage, setShowCustomerMessage] = useState(false);
  const [messageTone, setMessageTone] = useState<'formal' | 'friendly'>('formal');
  const [messageCopied, setMessageCopied] = useState(false);

  const safeFormatDate = (date: string | null, fmt: string, fallback = '—') => {
    if (!date) return fallback;
    return format(parseISO(date), fmt);
  };

  const derived = useMemo(() => {
    if (!result) return null;

    const statusLabel =
      result.status === 'OK'
        ? 'Confirmed'
        : result.status === 'CANNOT_PROMISE_RELIABLY'
          ? 'At Risk'
          : 'Cannot Fulfill';

    const statusTone =
      result.status === 'OK'
        ? 'green'
        : result.status === 'CANNOT_PROMISE_RELIABLY'
          ? 'yellow'
          : 'red';

    const confidenceTone =
      result.confidence === 'HIGH'
        ? 'green'
        : result.confidence === 'MEDIUM'
          ? 'yellow'
          : 'red';

    const showRecommendations =
      result.status !== 'OK' || result.confidence === 'LOW' || result.confidence === 'MEDIUM';

    const desiredDateProvided = Boolean(result.desired_date);
    const onTimeLabel = result.adjusted_due_to_no_early_delivery
      ? 'Adjusted'
      : result.on_time
        ? 'On Time'
        : 'Late';

    const deliveryMode = result.desired_date_mode || 'LATEST_ACCEPTABLE';
    const deliveryModeCopy =
      deliveryMode === 'NO_EARLY_DELIVERY'
        ? 'The promise date was adjusted to avoid early delivery.'
        : deliveryMode === 'STRICT_FAIL'
          ? 'The promise fails if delivery exceeds the desired date.'
          : 'The system delivers as early as possible, but no later than the desired date.';

    const plan = result.plan || [];
    const stockLines = plan.flatMap((p) => p.fulfillment.filter((f) => f.source === 'stock'));
    const incomingLines = plan.flatMap((p) =>
      p.fulfillment.filter((f) => f.source === 'purchase_order' || f.source === 'production')
    );

    const totalRequired = plan.reduce((sum, p) => sum + (p.qty_required || 0), 0);
    const totalStock = stockLines.reduce((sum, f) => sum + (f.qty || 0), 0);
    const warehouses = Array.from(
      new Set(stockLines.map((f) => f.warehouse).filter(Boolean))
    ).join(', ');

    return {
      statusLabel,
      statusTone,
      confidenceTone,
      showRecommendations,
      desiredDateProvided,
      onTimeLabel,
      deliveryMode,
      deliveryModeCopy,
      totalRequired,
      totalStock,
      warehouses: warehouses || '—',
      incomingLines,
    };
  }, [result]);

  const generateCustomerMessage = () => {
    if (!result) return '';
    const promiseDate = safeFormatDate(result.promise_date, 'MMMM dd, yyyy', 'N/A');
    const confidenceText =
      result.confidence === 'HIGH'
        ? 'We are highly confident'
        : result.confidence === 'MEDIUM'
          ? 'We are fairly confident'
          : 'We have some concerns';

    if (messageTone === 'formal') {
      return `Dear Valued Customer,\n\nWe can deliver your order by ${promiseDate}.\n\n${confidenceText} in meeting this commitment based on current inventory levels and expected supply availability.\n\nPlease reach out if you have any questions.\n\nBest regards,\nOrder Management Team`;
    }

    return `Hi there!\n\nWe can deliver your order by ${promiseDate}.\n\n${confidenceText} we can meet this commitment based on inventory and supply availability.\n\nLet us know if you need anything else!`;
  };

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(generateCustomerMessage());
    setMessageCopied(true);
    setTimeout(() => setMessageCopied(false), 2000);
  };

  const getToneClasses = (tone: string) => {
    switch (tone) {
      case 'green':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'yellow':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'red':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-300';
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <div className="space-y-6 animate-pulse">
          <div>
            <div className="h-4 bg-slate-200 rounded w-1/3 mb-2" />
            <div className="h-12 bg-slate-200 rounded w-2/3" />
          </div>
          <div>
            <div className="h-4 bg-slate-200 rounded w-1/4 mb-2" />
            <div className="h-10 bg-slate-200 rounded w-1/3" />
          </div>
          <div>
            <div className="h-4 bg-slate-200 rounded w-1/4 mb-2" />
            <div className="h-8 bg-slate-200 rounded w-1/2" />
          </div>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
            <Calendar className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">No Promise Calculated</h3>
          <p className="text-sm text-slate-600 max-w-sm">
            Fill in order details and click &quot;Evaluate Promise&quot; to calculate a delivery commitment.
          </p>
        </div>
      </div>
    );
  }

  if (result.status !== 'OK') {
    const fallbackMessage =
      result.blockers?.[0] || result.reasons?.[0] || result.error_detail || result.error || 'Promise requires review.';

    return (
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="space-y-2">
              <p className="text-sm font-medium text-amber-800">Promise needs review</p>
              <p className="text-xs text-amber-700">
                {result.promise_date
                  ? `Promise date: ${safeFormatDate(result.promise_date, 'MMM dd, yyyy')}`
                  : 'Cannot promise: Insufficient supply for one or more items.'}
              </p>

              {result.reasons?.length ? (
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-amber-700/80">Calculation Details</p>
                  <ul className="text-xs text-amber-700 list-disc pl-4 space-y-1">
                    {result.reasons.map((reason, index) => (
                      <li key={`reason-${index}`}>{reason}</li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {result.blockers?.length ? (
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-amber-700/80">Supply Issues</p>
                  <ul className="text-xs text-amber-700 list-disc pl-4 space-y-1">
                    {result.blockers.map((blocker, index) => (
                      <li key={`blocker-${index}`}>{blocker}</li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {result.desired_date_mode === 'STRICT_FAIL' && (
                <p className="text-xs text-amber-700">
                  This order cannot be fulfilled by the desired date under the selected policy.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const promiseDateFull = safeFormatDate(result.promise_date, 'MMMM dd, yyyy', 'Unavailable');
  const availabilityRows = (result.plan || []).map((plan) => {
    const fulfilled = (plan.fulfillment || []).reduce((sum, entry) => sum + (entry.qty || 0), 0);
    const shortage = plan.shortage ?? Math.max(0, (plan.qty_required || 0) - fulfilled);
    return {
      item_code: plan.item_code,
      required: plan.qty_required || 0,
      fulfilled,
      shortage,
    };
  });

  return (
    <div className="space-y-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase font-semibold text-slate-500 mb-2">Promise Date</p>
            <h2 className="text-3xl font-bold text-blue-700">{promiseDateFull}</h2>
            {derived?.desiredDateProvided && (
              <p className="text-xs text-slate-500 mt-2">
                Desired Date: {safeFormatDate(result.desired_date || null, 'MMMM dd, yyyy', '—')}
              </p>
            )}
          </div>
          <div className="flex flex-col items-end gap-2">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${
                derived?.statusTone === 'green'
                  ? 'bg-green-50 text-green-700 border-green-200'
                  : derived?.statusTone === 'yellow'
                    ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                    : 'bg-red-50 text-red-700 border-red-200'
              }`}
            >
              {derived?.statusTone === 'green' && <ShieldCheck className="w-3.5 h-3.5" />}
              {derived?.statusTone === 'yellow' && <ShieldAlert className="w-3.5 h-3.5" />}
              {derived?.statusTone === 'red' && <ShieldX className="w-3.5 h-3.5" />}
              {derived?.statusLabel}
            </span>

            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border ${getToneClasses(
                derived?.confidenceTone || 'slate'
              )}`}
            >
              {derived?.confidenceTone === 'green' && <CheckCircle2 className="w-3.5 h-3.5" />}
              {derived?.confidenceTone === 'yellow' && <AlertCircle className="w-3.5 h-3.5" />}
              {derived?.confidenceTone === 'red' && <XCircle className="w-3.5 h-3.5" />}
              {result.confidence} Confidence
            </span>
          </div>
        </div>

        {derived?.desiredDateProvided && (
          <div className="mt-4 flex items-center gap-2 text-sm">
            {derived.onTimeLabel === 'On Time' && <CheckCircle2 className="w-4 h-4 text-green-600" />}
            {derived.onTimeLabel === 'Late' && <XCircle className="w-4 h-4 text-red-600" />}
            {derived.onTimeLabel === 'Adjusted' && <Info className="w-4 h-4 text-yellow-600" />}
            <span className="font-medium text-slate-700">{derived.onTimeLabel}</span>
            {derived.onTimeLabel === 'Adjusted' && (
              <span className="text-slate-500">(NO_EARLY_DELIVERY)</span>
            )}
          </div>
        )}

        <div className="mt-5 p-4 bg-slate-50 border border-slate-200 rounded-lg">
          <p className="text-xs uppercase font-semibold text-slate-500 mb-2">Delivery Policy Applied</p>
          <p className="text-sm font-semibold text-slate-800">{derived?.deliveryMode}</p>
          <p className="text-sm text-slate-600 mt-1">{derived?.deliveryModeCopy}</p>
        </div>

        {availabilityRows.length > 0 && (
          <div className="mt-5 border border-slate-200 rounded-lg overflow-hidden">
            <div className="bg-slate-50 px-4 py-2">
              <p className="text-xs uppercase font-semibold text-slate-500">Availability Summary</p>
            </div>
            <div className="divide-y divide-slate-200">
              {availabilityRows.map((row) => (
                <div key={row.item_code} className="grid grid-cols-4 gap-3 px-4 py-2 text-sm">
                  <div className="font-medium text-slate-800 truncate">{row.item_code}</div>
                  <div className="text-slate-600">Required: {row.required}</div>
                  <div className="text-slate-600">Fulfilled: {row.fulfilled}</div>
                  <div className={row.shortage > 0 ? "text-amber-700" : "text-green-700"}>
                    Shortage: {row.shortage}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm"
      >
        <button
          onClick={() => setShowExplanation(!showExplanation)}
          className="flex items-center justify-between w-full text-sm font-medium text-slate-900 hover:text-blue-600 transition"
        >
          <span>How this promise was calculated</span>
          <ChevronDown
            className={`w-4 h-4 transition ${showExplanation ? 'transform -rotate-180' : ''}`}
          />
        </button>

        <AnimatePresence>
          {showExplanation && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 space-y-5"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-slate-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2 text-slate-800 font-semibold">
                    <Truck className="w-4 h-4" /> Stock Evaluation
                  </div>
                  <p className="text-sm text-slate-600">Warehouse used: {derived?.warehouses}</p>
                  <p className="text-sm text-slate-600">Quantity available: {derived?.totalStock}</p>
                  <p className="text-sm text-slate-600">
                    Stock sufficient: {derived && derived.totalStock >= derived.totalRequired ? 'Yes' : 'No'}
                  </p>
                  <p className="text-xs text-slate-500 mt-2">In-transit stock ignored for reliability.</p>
                </div>

                <div className="border border-slate-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2 text-slate-800 font-semibold">
                    <Info className="w-4 h-4" /> Incoming Supply
                  </div>
                  {derived?.incomingLines && derived.incomingLines.length > 0 ? (
                    <ul className="text-sm text-slate-600 space-y-1">
                      {derived.incomingLines.map((line, idx) => (
                        <li key={idx}>
                          {line.source === 'purchase_order' ? 'PO' : 'Production'} →
                          {line.expected_date || line.available_date || 'Date TBD'}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-slate-600">No incoming supply used</p>
                  )}
                </div>
              </div>

              <div className="border border-slate-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2 text-slate-800 font-semibold">
                  <Calendar className="w-4 h-4" /> Calendar & Rules
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-slate-600">
                    <p>Workweek: {getWorkweekLabel()}</p>
                    <p>Weekend skipped: {getWeekendLabel()}</p>
                  <p>Cutoff time: 14:00</p>
                  <p>Buffer days: +1 day</p>
                </div>
              </div>

              <div className="border border-slate-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2 text-slate-800 font-semibold">
                  <Info className="w-4 h-4" /> Assumptions
                </div>
                <ul className="text-sm text-slate-600 space-y-1">
                  <li>Default warehouse policy applied unless overridden.</li>
                  <li>Standard processing lead time assumed (1 day).</li>
                  <li>Calendar rules applied per organization defaults.</li>
                </ul>
              </div>

              {result.reasons && result.reasons.length > 0 && (
                <div className="border border-slate-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2 text-slate-800 font-semibold">
                    <Info className="w-4 h-4" /> System Notes
                  </div>
                  <ul className="text-sm text-slate-600 space-y-1">
                    {result.reasons.map((reason, idx) => (
                      <li key={idx}>• {reason}</li>
                    ))}
                  </ul>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {derived?.showRecommendations && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm"
        >
          <h3 className="text-sm font-semibold text-slate-900 mb-3">Recommended Actions</h3>
          <div className="flex flex-wrap gap-2">
            {(result.options && result.options.length > 0
              ? result.options.map((opt) => opt.description || opt.type)
              : [
                  'Split shipment (suggested)',
                  'Alternate warehouse (suggested)',
                  'Expedite supplier PO (suggested)',
                  'Partial fulfill (suggested)',
                ]
            ).map((action, idx) => (
              <span
                key={idx}
                className="inline-flex items-center px-3 py-1.5 rounded-full bg-blue-100 text-blue-700 text-xs font-medium"
              >
                💡 {action}
              </span>
            ))}
          </div>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm"
      >
        <button
          onClick={() => setShowCustomerMessage(!showCustomerMessage)}
          className="flex items-center justify-between w-full text-sm font-medium text-slate-900 hover:text-blue-600 transition"
        >
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            <span>Customer Message</span>
          </div>
          <ChevronDown
            className={`w-4 h-4 transition ${showCustomerMessage ? 'transform -rotate-180' : ''}`}
          />
        </button>

        <AnimatePresence>
          {showCustomerMessage && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 space-y-3"
            >
              <div className="flex gap-2">
                {(['formal', 'friendly'] as const).map((tone) => (
                  <button
                    key={tone}
                    onClick={() => setMessageTone(tone)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                      messageTone === tone
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {tone.charAt(0).toUpperCase() + tone.slice(1)}
                  </button>
                ))}
              </div>

              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                <pre className="text-xs text-slate-700 whitespace-pre-wrap font-sans">
                  {generateCustomerMessage()}
                </pre>
              </div>

              <button
                onClick={handleCopyMessage}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition font-medium text-sm"
              >
                {messageCopied ? (
                  <>
                    <Check className="w-4 h-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy Message
                  </>
                )}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
