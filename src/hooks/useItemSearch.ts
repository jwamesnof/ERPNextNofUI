/**
 * useItemSearch - Item search and validation hook
 * 
 * Behavior:
 * - Checks if backend item search endpoint exists
 * - If exists: fetches list of valid items and provides autocomplete
 * - If not exists: allows manual entry with validation on blur (if endpoint exists)
 * - Validates items against backend; if invalid, marks with error
 */

import { useState, useEffect, useCallback } from 'react'

export interface Item {
  item_code: string
  item_name?: string
  description?: string
}

export interface UseItemSearchResult {
  items: Item[]
  isLoading: boolean
  hasEndpoint: boolean
  searchItems: (query: string) => Item[]
  validateItem: (itemCode: string) => Promise<{ valid: boolean; error?: string }>
}

const ITEM_SEARCH_ENDPOINT = '/api/items/search'
const ITEM_VALIDATE_ENDPOINT = '/api/items/validate'

export function useItemSearch(): UseItemSearchResult {
  const [items, setItems] = useState<Item[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [hasEndpoint, setHasEndpoint] = useState(false)

  // Check if backend has item search endpoint on mount
  useEffect(() => {
    const checkEndpoint = async () => {
      try {
        const apiBaseUrl =
          process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8001'
        
        // Try to fetch items list
        const response = await fetch(`${apiBaseUrl}/api/items/search?query=`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        })
        
        if (response.ok) {
          const data = await response.json()
          setItems(Array.isArray(data) ? data : data.items || [])
          setHasEndpoint(true)
        } else {
          // Endpoint doesn't exist or isn't ready
          setHasEndpoint(false)
        }
      } catch (error) {
        // Backend endpoint not available
        setHasEndpoint(false)
      }
    }

    checkEndpoint()
  }, [])

  // Search items by query string
  const searchItems = useCallback(
    (query: string): Item[] => {
      if (!query.trim()) return items

      const lowerQuery = query.toLowerCase()
      return items.filter(
        (item) =>
          item.item_code.toLowerCase().includes(lowerQuery) ||
          item.item_name?.toLowerCase().includes(lowerQuery)
      )
    },
    [items]
  )

  // Validate single item against backend
  const validateItem = useCallback(
    async (itemCode: string): Promise<{ valid: boolean; error?: string }> => {
      if (!itemCode.trim()) {
        return { valid: false, error: 'Item code is required' }
      }

      if (!hasEndpoint) {
        // No validation endpoint, assume valid (will validate on POST response)
        return { valid: true }
      }

      try {
        const apiBaseUrl =
          process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8001'
        
        const response = await fetch(
          `${apiBaseUrl}/api/items/validate?item_code=${encodeURIComponent(itemCode)}`,
          {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
          }
        )

        if (response.ok) {
          const data = await response.json()
          return { valid: data.valid !== false }
        } else if (response.status === 404) {
          return { valid: false, error: 'Item not found' }
        } else {
          return { valid: false, error: 'Validation failed' }
        }
      } catch (error) {
        // If endpoint fails, assume valid (will validate on POST response)
        return { valid: true }
      }
    },
    [hasEndpoint]
  )

  return {
    items,
    isLoading,
    hasEndpoint,
    searchItems,
    validateItem,
  }
}
