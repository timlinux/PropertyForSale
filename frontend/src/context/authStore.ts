// SPDX-FileCopyrightText: 2026 Tim Sutton <tim@kartoza.com>
// SPDX-License-Identifier: EUPL-1.2

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface User {
  id: string
  email: string
  name: string
  avatar_url: string
  role: 'viewer' | 'agent' | 'admin'
}

export interface Tokens {
  accessToken: string
  refreshToken: string
  expiresAt: Date
}

interface AuthState {
  user: User | null
  tokens: Tokens | null
  isAuthenticated: boolean
  isLoading: boolean

  setUser: (user: User | null) => void
  setTokens: (tokens: Tokens | null) => void
  logout: () => void
  refreshTokens: () => Promise<void>
}

const API_BASE = '/api/v1'

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      tokens: null,
      isAuthenticated: false,
      isLoading: false,

      setUser: (user) => set({ user, isAuthenticated: !!user }),

      setTokens: (tokens) => {
        if (tokens) {
          // Convert string date to Date object if needed
          const expiresAt = tokens.expiresAt instanceof Date
            ? tokens.expiresAt
            : new Date(tokens.expiresAt)

          set({
            tokens: { ...tokens, expiresAt },
            isAuthenticated: true,
          })

          // Fetch user info
          get().fetchUser()
        } else {
          set({ tokens: null, isAuthenticated: false, user: null })
        }
      },

      logout: async () => {
        const tokens = get().tokens
        if (tokens?.refreshToken) {
          try {
            await fetch(`${API_BASE}/auth/logout`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ refresh_token: tokens.refreshToken }),
            })
          } catch (e) {
            // Ignore errors during logout
          }
        }
        set({ user: null, tokens: null, isAuthenticated: false })
      },

      refreshTokens: async () => {
        const tokens = get().tokens
        if (!tokens?.refreshToken) {
          set({ user: null, tokens: null, isAuthenticated: false })
          return
        }

        try {
          const response = await fetch(`${API_BASE}/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh_token: tokens.refreshToken }),
          })

          if (!response.ok) {
            throw new Error('Failed to refresh tokens')
          }

          const newTokens = await response.json()
          set({
            tokens: {
              accessToken: newTokens.access_token,
              refreshToken: newTokens.refresh_token,
              expiresAt: new Date(newTokens.expires_at),
            },
          })
        } catch (e) {
          set({ user: null, tokens: null, isAuthenticated: false })
        }
      },

      fetchUser: async () => {
        const tokens = get().tokens
        if (!tokens?.accessToken) return

        set({ isLoading: true })
        try {
          const response = await fetch(`${API_BASE}/auth/me`, {
            headers: {
              Authorization: `Bearer ${tokens.accessToken}`,
            },
          })

          if (!response.ok) {
            if (response.status === 401) {
              // Try to refresh tokens
              await get().refreshTokens()
              return
            }
            throw new Error('Failed to fetch user')
          }

          const user = await response.json()
          set({ user, isAuthenticated: true })
        } catch (e) {
          set({ user: null, isAuthenticated: false })
        } finally {
          set({ isLoading: false })
        }
      },
    }),
    {
      name: 'propertyforsale-auth',
      partialize: (state) => ({
        tokens: state.tokens,
      }),
    }
  )
)

// Helper hook to get auth headers
export function useAuthHeaders(): Record<string, string> {
  const tokens = useAuthStore((state) => state.tokens)
  if (!tokens?.accessToken) return {}
  return { Authorization: `Bearer ${tokens.accessToken}` }
}
