'use client';

import React from 'react';
import { AlertCircle, CheckCircle2, Info, TriangleAlert } from 'lucide-react';

export type AlertVariant = 'info' | 'success' | 'warning' | 'error';

const VARIANT_STYLES: Record<AlertVariant, { container: string; icon: React.ReactNode }> = {
  info: {
    container: 'bg-blue-50 border-blue-200 text-blue-800',
    icon: <Info className="w-4 h-4 text-blue-600" />,
  },
  success: {
    container: 'bg-green-50 border-green-200 text-green-800',
    icon: <CheckCircle2 className="w-4 h-4 text-green-600" />,
  },
  warning: {
    container: 'bg-amber-50 border-amber-200 text-amber-800',
    icon: <TriangleAlert className="w-4 h-4 text-amber-600" />,
  },
  error: {
    container: 'bg-red-50 border-red-200 text-red-800',
    icon: <AlertCircle className="w-4 h-4 text-red-600" />,
  },
};

interface AlertBannerProps {
  title: string;
  description?: string;
  variant?: AlertVariant;
  action?: React.ReactNode;
}

export function AlertBanner({ title, description, variant = 'info', action }: AlertBannerProps) {
  const styles = VARIANT_STYLES[variant];

  return (
    <div className={`border rounded-lg p-4 flex items-start gap-3 ${styles.container}`}>
      <div className="mt-0.5">{styles.icon}</div>
      <div className="flex-1">
        <p className="text-sm font-medium">{title}</p>
        {description && <p className="text-xs mt-1 opacity-90">{description}</p>}
      </div>
      {action && <div className="ml-2">{action}</div>}
    </div>
  );
}
