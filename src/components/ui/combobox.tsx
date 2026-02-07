'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, Search } from 'lucide-react';

export interface ComboboxOption {
  value: string;
  label: string;
  description?: string;
  meta?: string;
}

interface ComboboxProps {
  label?: string;
  placeholder?: string;
  options: ComboboxOption[];
  value?: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  emptyLabel?: string;
  onQueryChange?: (query: string) => void;
  testId?: string;
}

export function Combobox({
  label,
  placeholder = 'Search...',
  options,
  value,
  onChange,
  disabled,
  emptyLabel = 'No results found',
  onQueryChange,
  testId,
}: ComboboxProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const prevValueRef = useRef(value);

  // Only sync query when the value prop itself changes (external updates)
  // This prevents clearing the search box during API refetches with new options
  useEffect(() => {
    if (value !== prevValueRef.current) {
      prevValueRef.current = value;
      
      if (value === undefined || value === null || value === '') {
        // Value was cleared externally
        setQuery('');
      } else {
        // Value was set externally - find matching option and sync label
        const selectedOption = options.find((opt) => opt.value === value);
        if (selectedOption) {
          setQuery(selectedOption.label);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  useEffect(() => {
    onQueryChange?.(query);
  }, [query, onQueryChange]);

  const filtered = useMemo(() => {
    if (!query.trim()) return options;
    const lower = query.toLowerCase();
    return options.filter((option) =>
      `${option.label} ${option.description || ''} ${option.meta || ''}`.toLowerCase().includes(lower)
    );
  }, [options, query]);

  const handleSelect = (option: ComboboxOption) => {
    onChange(option.value);
    setQuery(option.label);
    setIsOpen(false);
  };

  return (
    <div className="relative" data-testid={testId}>
      {label && <label className="block text-sm font-medium text-slate-700 mb-2">{label}</label>}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
        <input
          type="text"
          role="combobox"
          aria-expanded={isOpen}
          aria-controls={testId ? `${testId}-listbox` : undefined}
          value={query}
          placeholder={placeholder}
          onChange={(event) => {
            setQuery(event.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onBlur={() => setTimeout(() => setIsOpen(false), 150)}
          disabled={disabled}
          className={`w-full pl-9 pr-9 py-2 border rounded-lg text-sm transition focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
            disabled
              ? 'bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed'
              : 'bg-white border-slate-300 text-slate-900'
          }`}
          data-testid={testId ? `${testId}-input` : undefined}
        />
        <ChevronDown className="absolute right-3 top-3 h-4 w-4 text-slate-400" />
      </div>

      {isOpen && !disabled && (
        <div
          role="listbox"
          id={testId ? `${testId}-listbox` : undefined}
          className="absolute z-20 mt-2 w-full max-h-64 overflow-auto rounded-lg border border-slate-200 bg-white shadow-lg"
        >
          {filtered.length === 0 && (
            <div className="px-4 py-3 text-xs text-slate-500">{emptyLabel}</div>
          )}
          {filtered.map((option) => {
            const isSelected = option.value === value;
            return (
              <button
                type="button"
                key={option.value}
                role="option"
                aria-selected={isSelected}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => handleSelect(option)}
                className="w-full text-left px-4 py-3 hover:bg-blue-50 transition flex items-start gap-3"
                data-testid={testId ? `${testId}-option-${option.value}` : undefined}
              >
                <div className="mt-0.5 text-blue-600">{isSelected && <Check className="h-4 w-4" />}</div>
                <div>
                  <p className="text-sm font-medium text-slate-900">{option.label}</p>
                  {option.description && <p className="text-xs text-slate-500 mt-0.5">{option.description}</p>}
                  {option.meta && <p className="text-[11px] text-slate-400 mt-0.5">{option.meta}</p>}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
