// SPDX-FileCopyrightText: 2026 Tim Sutton <tim@kartoza.com>
// SPDX-License-Identifier: EUPL-1.2

import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { api } from '../api'

// Generate or retrieve session ID
function getSessionId(): string {
  const storageKey = 'pfs_session_id'
  let sessionId = sessionStorage.getItem(storageKey)
  if (!sessionId) {
    sessionId = crypto.randomUUID()
    sessionStorage.setItem(storageKey, sessionId)
  }
  return sessionId
}

// Track scroll depth
function getScrollDepth(): number {
  const scrollTop = window.scrollY
  const docHeight = document.documentElement.scrollHeight - window.innerHeight
  if (docHeight <= 0) return 100
  return Math.min(100, Math.round((scrollTop / docHeight) * 100))
}

interface UsePageTrackingOptions {
  propertyId?: string
}

export function usePageTracking(options?: UsePageTrackingOptions) {
  const location = useLocation()
  const startTimeRef = useRef<number>(Date.now())
  const maxScrollDepthRef = useRef<number>(0)

  useEffect(() => {
    // Reset on page change
    startTimeRef.current = Date.now()
    maxScrollDepthRef.current = 0

    const sessionId = getSessionId()
    const pagePath = location.pathname

    // Track scroll depth
    const handleScroll = () => {
      const currentDepth = getScrollDepth()
      if (currentDepth > maxScrollDepthRef.current) {
        maxScrollDepthRef.current = currentDepth
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })

    // Record page view when leaving
    const recordPageView = () => {
      const dwellTimeMs = Date.now() - startTimeRef.current

      // Only record if dwell time is meaningful (> 1 second)
      if (dwellTimeMs < 1000) return

      api.recordPageView({
        session_id: sessionId,
        property_id: options?.propertyId,
        page_path: pagePath,
        dwell_time_ms: dwellTimeMs,
        scroll_depth: maxScrollDepthRef.current,
        referrer: document.referrer,
      }).catch(() => {
        // Silently fail - analytics shouldn't break the app
      })
    }

    // Record on visibility change (tab switch, minimize)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        recordPageView()
      }
    }

    // Record before unload
    const handleBeforeUnload = () => {
      recordPageView()
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      window.removeEventListener('scroll', handleScroll)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('beforeunload', handleBeforeUnload)
      recordPageView()
    }
  }, [location.pathname, options?.propertyId])
}
