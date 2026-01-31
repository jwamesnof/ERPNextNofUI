'use client';

import React, { Component, ReactNode } from 'react';
import { AlertCircle, CheckCircle2, XCircle, ShieldAlert, TrendingUp, AlertTriangle, Info, X } from 'lucide-react';
import { useBackendHealth } from '@/hooks/useBackendHealth';
import type { APIError, HealthCheckResponse } from '@/lib/api/types';

// Types
type PromiseStatus = 'OK' | 'CANNOT_FULFILL' | 'CANNOT_PROMISE_RELIABLY';
type ConfidenceLevel = 'HIGH' | 'MEDIUM' | 'LOW';
type BlockerType = 'error' | 'warning' | 'info';

interface Blocker {
  type: BlockerType;
  title: string;
  description: string;
  details?: string[];
}

interface Fulfillment {
  source: string;
  qty: number;
  available_date?: string;
  ship_ready_date?: string;
  date?: string;
  warehouse?: string | null;
  details?: string;
}

interface PromiseOption {
  date?: string;
  confidence?: ConfidenceLevel;
  days_advantage?: number;
  notes?: string;
  type?: string;
  description?: string;
  impact?: string;
  po_id?: string | null;
}

// PromiseStatusBadge Component
export function PromiseStatusBadge({ status }: { status: PromiseStatus }) {
  const config = {
    OK: {
      label: 'Confirmed',
      icon: CheckCircle2,
      className: 'bg-green-100 text-green-800 border-green-200',
    },
    CANNOT_FULFILL: {
      label: 'Cannot Fulfill',
      icon: XCircle,
      className: 'bg-red-100 text-red-800 border-red-200',
    },
    CANNOT_PROMISE_RELIABLY: {
      label: 'At Risk',
      icon: AlertTriangle,
      className: 'bg-amber-100 text-amber-800 border-amber-200',
    },
  }[status];

  const Icon = config.icon;

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border font-medium ${config.className}`}>
      <Icon className="w-4 h-4" />
      <span>{config.label}</span>
    </div>
  );
}

// ConfidenceBadge Component
export function ConfidenceBadge({
  confidence,
  size = 'md',
  showLabel = false,
}: {
  confidence: ConfidenceLevel;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}) {
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base',
  }[size];

  const config = {
    HIGH: {
      label: 'High Confidence',
      className: 'bg-green-100 text-green-800 border-green-200',
    },
    MEDIUM: {
      label: 'Medium Confidence',
      className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    },
    LOW: {
      label: 'Low Confidence',
      className: 'bg-red-100 text-red-800 border-red-200',
    },
  }[confidence];

  return (
    <span className={`inline-flex items-center rounded-full border font-medium ${sizeClasses} ${config.className}`}>
      {showLabel ? config.label : confidence}
    </span>
  );
}

// BlockersDisplay Component
export function BlockersDisplay({ blockers, title }: { blockers: Blocker[]; title?: string }) {
  if (!blockers || blockers.length === 0) {
    return null;
  }

  const getIcon = (type: BlockerType) => {
    switch (type) {
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-amber-500" />;
      case 'info':
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const getBgColor = (type: BlockerType) => {
    switch (type) {
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'warning':
        return 'bg-amber-50 border-amber-200';
      case 'info':
        return 'bg-blue-50 border-blue-200';
    }
  };

  return (
    <div className="space-y-3">
      {title && <h3 className="font-semibold text-slate-900">{title}</h3>}
      <div className="space-y-2">
        {blockers.map((blocker, idx) => (
          <div key={idx} className={`p-4 rounded-lg border ${getBgColor(blocker.type)}`}>
            <div className="flex items-start gap-3">
              {getIcon(blocker.type)}
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-slate-900">{blocker.title}</h4>
                <p className="text-sm text-slate-600 mt-1">{blocker.description}</p>
                {blocker.details && blocker.details.length > 0 && (
                  <ul className="mt-2 space-y-1 text-sm text-slate-600">
                    {blocker.details.map((detail, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-slate-400">•</span>
                        <span>{detail}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// FulfillmentTimeline Component
export function FulfillmentTimeline({ fulfillments }: { fulfillments: Fulfillment[] }) {
  if (!fulfillments || fulfillments.length === 0) {
    return <p className="text-slate-500 text-sm">No fulfillment data available</p>;
  }

  return (
    <div className="space-y-3">
      {fulfillments.map((fulfillment, idx) => (
        <div key={idx} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
            <span className="text-xs font-semibold text-blue-700">{idx + 1}</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold text-slate-900 capitalize">{fulfillment.source.replace('_', ' ')}</span>
              <span className="text-sm text-slate-600">• {fulfillment.qty} units</span>
            </div>
            {fulfillment.warehouse && (
              <p className="text-sm text-slate-600">Warehouse: {fulfillment.warehouse}</p>
            )}
            {fulfillment.available_date && (
              <p className="text-sm text-slate-600">Available: {fulfillment.available_date}</p>
            )}
            {fulfillment.date && (
              <p className="text-sm text-slate-600">Expected: {fulfillment.date}</p>
            )}
            {fulfillment.details && (
              <p className="text-sm text-slate-500 mt-1">{fulfillment.details}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// PromiseOptions Component
export function PromiseOptions({ options }: { options: PromiseOption[] }) {
  if (!options || options.length === 0) {
    return <p className="text-slate-500 text-sm">No alternative options available</p>;
  }

  return (
    <div className="space-y-3">
      {options.map((option, idx) => (
        <div key={idx} className="p-4 border border-slate-200 rounded-lg hover:border-blue-300 transition-colors">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                {option.date && <span className="font-semibold text-slate-900">{option.date}</span>}
                {option.confidence && <ConfidenceBadge confidence={option.confidence} size="sm" />}
                {option.days_advantage !== undefined && option.days_advantage !== 0 && (
                  <span className={`text-sm ${option.days_advantage > 0 ? 'text-green-600' : 'text-amber-600'}`}>
                    {option.days_advantage > 0 ? '+' : ''}{option.days_advantage} days
                  </span>
                )}
              </div>
              {option.notes && <p className="text-sm text-slate-600">{option.notes}</p>}
              {option.description && <p className="text-sm text-slate-600">{option.description}</p>}
              {option.impact && <p className="text-xs text-slate-500 mt-1">{option.impact}</p>}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// HealthStatusIndicator Component
export function HealthStatusIndicator({ compact = false }: { compact?: boolean }) {
  const { data: health, isLoading } = useBackendHealth() as { data: HealthCheckResponse | undefined; isLoading: boolean };

  if (isLoading) {
    return (
      <div className="inline-flex items-center gap-2 text-slate-400">
        <div className="w-2 h-2 bg-slate-300 rounded-full animate-pulse" />
        <span className="text-sm">Checking...</span>
      </div>
    );
  }

  const isHealthy = health?.status === 'healthy';

  if (compact) {
    return (
      <div className={`inline-flex items-center gap-2 ${isHealthy ? 'text-green-600' : 'text-red-600'}`}>
        <div className={`w-2 h-2 rounded-full ${isHealthy ? 'bg-green-500' : 'bg-red-500'}`} />
        {!isHealthy && <AlertCircle className="w-4 h-4" />}
      </div>
    );
  }

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border ${
      isHealthy
        ? 'bg-green-50 text-green-800 border-green-200'
        : 'bg-red-50 text-red-800 border-red-200'
    }`}>
      <div className={`w-2 h-2 rounded-full ${isHealthy ? 'bg-green-500' : 'bg-red-500'}`} />
      <span className="font-medium">{isHealthy ? 'Healthy' : 'Unhealthy'}</span>
      {health?.erpnext_connected !== undefined && (
        <span className="text-xs opacity-75">• ERPNext: {health.erpnext_connected ? 'Connected' : 'Disconnected'}</span>
      )}
    </div>
  );
}

// ErrorDisplay Component
export function ErrorDisplay({
  error,
  onDismiss,
}: {
  error: APIError | null;
  onDismiss?: () => void;
}) {
  if (!error) return null;

  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
      <div className="flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <h4 className="font-semibold text-red-900">{error.code || 'Error'}</h4>
              <p className="text-sm text-red-800 mt-1">{error.message}</p>
            </div>
            {onDismiss && (
              <button
                onClick={onDismiss}
                className="flex-shrink-0 text-red-600 hover:text-red-800"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          
          {error.validationErrors && error.validationErrors.length > 0 && (
            <div className="mt-3 space-y-1">
              <p className="text-xs font-semibold text-red-900">Validation Errors:</p>
              <ul className="space-y-1">
                {error.validationErrors.map((ve, idx) => (
                  <li key={idx} className="text-xs text-red-800">
                    <span className="font-medium">{ve.field}:</span> {ve.message}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ErrorBoundary Component
interface ErrorBoundaryProps {
  children: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-8">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 border border-red-200">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="w-6 h-6 text-red-600" />
              <h2 className="text-xl font-bold text-red-900">Something went wrong</h2>
            </div>
            <p className="text-slate-600 mb-4">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// ProcurementModal Component
export function ProcurementModal({
  isOpen,
  onClose,
  items,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  items: Array<{ item_code: string; qty_needed: number; warehouse: string }>;
  onSuccess: (result: any) => void;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-slate-900">Create Material Request</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="p-6 space-y-4">
          <p className="text-slate-600">
            The following items will be added to a new Material Request:
          </p>
          
          <div className="space-y-2">
            {items.map((item, idx) => (
              <div key={idx} className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-slate-900">{item.item_code}</span>
                  <span className="text-sm text-slate-600">
                    {item.qty_needed} units • {item.warehouse}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="p-6 border-t border-slate-200 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onSuccess({ success: true, items });
              onClose();
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Create Material Request
          </button>
        </div>
      </div>
    </div>
  );
}
