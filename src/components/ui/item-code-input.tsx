'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { Combobox, ComboboxOption } from './combobox'
import { AlertCircle } from 'lucide-react'

interface ItemCodeInputProps {
  value: string
  onChange: (value: string) => void
  onBlur?: () => void
  disabled?: boolean
  hasEndpoint: boolean
  availableItems: Array<{ item_code: string; item_name?: string }>
  onValidationChange?: (isValid: boolean, error?: string) => void
  validateItem?: (itemCode: string) => Promise<{ valid: boolean; error?: string }>
  error?: string
}

export function ItemCodeInput({
  value,
  onChange,
  onBlur,
  disabled,
  hasEndpoint,
  availableItems,
  onValidationChange,
  validateItem,
  error,
}: ItemCodeInputProps) {
  const [validationError, setValidationError] = useState<string | undefined>(error)
  const [isValidating, setIsValidating] = useState(false)

  // Convert available items to combobox options
  const options: ComboboxOption[] = availableItems.map((item) => ({
    value: item.item_code,
    label: item.item_code,
    description: item.item_name,
  }))

  // Handle blur validation if endpoint exists
  const handleBlur = useCallback(async () => {
    if (onBlur) onBlur()

    if (!value.trim()) {
      setValidationError('Item code is required')
      onValidationChange?.(false, 'Item code is required')
      return
    }

    if (!hasEndpoint || !validateItem) {
      // No validation endpoint available, will validate on POST
      setValidationError(undefined)
      onValidationChange?.(true)
      return
    }

    // Validate with endpoint
    setIsValidating(true)
    try {
      const result = await validateItem(value)
      if (!result.valid) {
        setValidationError(result.error || 'Item not found')
        onValidationChange?.(false, result.error)
      } else {
        setValidationError(undefined)
        onValidationChange?.(true)
      }
    } catch (err) {
      // Validation failed, assume valid (will validate on POST)
      setValidationError(undefined)
      onValidationChange?.(true)
    } finally {
      setIsValidating(false)
    }
  }, [value, hasEndpoint, validateItem, onBlur, onValidationChange])

  // If no endpoint and no items available, show simple text input
  if (!hasEndpoint || options.length === 0) {
    return (
      <div>
        <div className="relative">
          <input
            type="text"
            placeholder="e.g., SKU001"
            autoCorrect="off"
            autoCapitalize="none"
            spellCheck={false}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onBlur={handleBlur}
            disabled={disabled || isValidating}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm transition ${
              validationError
                ? 'border-red-300 bg-red-50'
                : 'border-slate-300'
            }`}
          />
        </div>
        {validationError && (
          <div className="flex items-start gap-2 mt-1">
            <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-red-600">{validationError}</p>
          </div>
        )}
      </div>
    )
  }

  // Show combobox with available items
  return (
    <div>
      <Combobox
        placeholder="Search item code..."
        options={options}
        value={value}
        onChange={onChange}
        disabled={disabled || isValidating}
        emptyLabel="No items found"
        testId="item-code-search"
      />
      {validationError && (
        <div className="flex items-start gap-2 mt-1">
          <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-red-600">{validationError}</p>
        </div>
      )}
    </div>
  )
}
