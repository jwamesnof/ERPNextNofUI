'use client';

import React, { useEffect, useRef, useState } from 'react';
import { DayPicker } from 'react-day-picker';
import { format, isValid, parseISO } from 'date-fns';
import { Calendar, X } from 'lucide-react';
import { WEEKEND_DAYS } from '@/lib/weekend';

interface DatePickerInputProps {
  id?: string;
  value?: string;
  onChange: (value: string | null) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function DatePickerInput({
  id,
  value,
  onChange,
  placeholder = 'Select a date',
  disabled = false,
}: DatePickerInputProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedDate = value ? parseISO(value) : undefined;
  const displayValue = selectedDate && isValid(selectedDate)
    ? format(selectedDate, 'MMM dd, yyyy')
    : '';

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <button
          id={id}
          type="button"
          disabled={disabled}
          aria-haspopup="dialog"
          aria-expanded={open}
          onClick={() => setOpen((prev) => !prev)}
          className="w-full flex items-center gap-3 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white text-left"
        >
          <Calendar className="w-4 h-4 text-slate-400" />
          <span className={displayValue ? 'text-slate-900 flex-1' : 'text-slate-400 flex-1'}>
            {displayValue || placeholder}
          </span>
        </button>
        
        {displayValue && !disabled && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onChange(null);
              setOpen(false);
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-100 rounded transition-colors"
            title="Clear date"
          >
            <X className="w-4 h-4 text-slate-400 hover:text-slate-600" />
          </button>
        )}
      </div>

      {open && (
        <div className="absolute z-50 mt-2 bg-white border border-slate-200 rounded-lg shadow-lg p-3">
          <DayPicker
            mode="single"
            selected={selectedDate}
            onSelect={(date) => {
              if (!date) {
                onChange(null);
                return;
              }
              onChange(format(date, 'yyyy-MM-dd'));
              setOpen(false);
            }}
            weekStartsOn={0}
            modifiers={{
              weekend: (date) => WEEKEND_DAYS.includes(date.getDay() as typeof WEEKEND_DAYS[number]),
            }}
            modifiersClassNames={{
              weekend: 'otp-weekend-day',
            }}
            className="otp-day-picker"
          />
          
          {displayValue && (
            <div className="mt-2 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => {
                  onChange(null);
                  setOpen(false);
                }}
                className="w-full px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50 rounded transition-colors"
              >
                Clear selection
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
