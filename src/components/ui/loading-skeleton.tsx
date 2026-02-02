'use client';

import React from 'react';

interface LoadingSkeletonProps {
  lines?: number;
  className?: string;
}

export function LoadingSkeleton({ lines = 3, className = '' }: LoadingSkeletonProps) {
  return (
    <div className={`space-y-2 animate-pulse ${className}`}>
      {Array.from({ length: lines }).map((_, index) => (
        <div
          key={`skeleton-line-${index}`}
          className={`h-3 rounded bg-slate-200 ${index === 0 ? 'w-2/3' : 'w-full'}`}
        />
      ))}
    </div>
  );
}
