// SPDX-FileCopyrightText: 2026 Tim Sutton <tim@kartoza.com>
// SPDX-License-Identifier: EUPL-1.2

import { useState, useEffect, useCallback } from 'react'

interface ABVariant {
  id: string
  name: string
  content: Record<string, unknown>
  weight: number
}

interface UseABTestOptions {
  testId: string
  onAssigned?: (variant: ABVariant) => void
}

interface UseABTestReturn {
  variant: ABVariant | null
  isLoading: boolean
  error: string | null
  getContent: <T>(key: string, defaultValue: T) => T
}

// Get or create session ID for consistent variant assignment
function getSessionId(): string {
  const storageKey = 'pfs_session_id'
  let sessionId = sessionStorage.getItem(storageKey)
  if (!sessionId) {
    sessionId = crypto.randomUUID()
    sessionStorage.setItem(storageKey, sessionId)
  }
  return sessionId
}

// Cache variant assignments to avoid repeated API calls
const variantCache = new Map<string, ABVariant>()

export function useABTest({ testId, onAssigned }: UseABTestOptions): UseABTestReturn {
  const [variant, setVariant] = useState<ABVariant | null>(() => {
    // Check cache first
    return variantCache.get(testId) || null
  })
  const [isLoading, setIsLoading] = useState(!variantCache.has(testId))
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Skip if already cached
    if (variantCache.has(testId)) {
      return
    }

    const assignVariant = async () => {
      try {
        const sessionId = getSessionId()
        const response = await fetch(`/api/v1/ab-tests/${testId}/assign`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ session_id: sessionId }),
        })

        if (!response.ok) {
          // Test might not exist or not be running - that's OK
          if (response.status === 404 || response.status === 400) {
            setIsLoading(false)
            return
          }
          throw new Error('Failed to assign variant')
        }

        const data = await response.json()
        const assignedVariant = data.variant as ABVariant

        // Cache the assignment
        variantCache.set(testId, assignedVariant)
        setVariant(assignedVariant)
        onAssigned?.(assignedVariant)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setIsLoading(false)
      }
    }

    assignVariant()
  }, [testId, onAssigned])

  // Helper to get content from variant with type safety
  const getContent = useCallback(
    <T,>(key: string, defaultValue: T): T => {
      if (!variant?.content) return defaultValue
      const value = variant.content[key]
      return (value as T) ?? defaultValue
    },
    [variant]
  )

  return { variant, isLoading, error, getContent }
}

// Component wrapper for A/B test variants
interface ABTestVariantProps {
  testId: string
  control: React.ReactNode
  variants: Record<string, React.ReactNode>
  fallback?: React.ReactNode
}

export function ABTestVariant({
  testId,
  control,
  variants,
  fallback = null,
}: ABTestVariantProps) {
  const { variant, isLoading } = useABTest({ testId })

  if (isLoading) {
    return <>{fallback}</>
  }

  if (!variant) {
    return <>{control}</>
  }

  const variantContent = variants[variant.name]
  if (variantContent) {
    return <>{variantContent}</>
  }

  return <>{control}</>
}
