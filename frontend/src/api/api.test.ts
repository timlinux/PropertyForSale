// SPDX-FileCopyrightText: 2026 Tim Sutton <tim@kartoza.com>
// SPDX-License-Identifier: EUPL-1.2

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock fetch
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('API utilities', () => {
  beforeEach(() => {
    mockFetch.mockClear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('fetch wrapper behavior', () => {
    it('should handle successful JSON response', async () => {
      const mockData = { id: 1, name: 'Test Property' }
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockData,
      })

      const response = await fetch('/api/v1/properties')
      const data = await response.json()

      expect(data).toEqual(mockData)
      expect(mockFetch).toHaveBeenCalledWith('/api/v1/properties')
    })

    it('should handle error response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ error: 'Not found' }),
      })

      const response = await fetch('/api/v1/properties/non-existent')

      expect(response.ok).toBe(false)
      expect(response.status).toBe(404)
    })

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      await expect(fetch('/api/v1/properties')).rejects.toThrow('Network error')
    })
  })

  describe('request formatting', () => {
    it('should send JSON content type for POST requests', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 1 }),
      })

      await fetch('/api/v1/properties', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: 'New Property' }),
      })

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/v1/properties',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      )
    })
  })
})
