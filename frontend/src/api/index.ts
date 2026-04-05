// SPDX-FileCopyrightText: 2026 Tim Sutton <tim@kartoza.com>
// SPDX-License-Identifier: EUPL-1.2

import { useAuthStore } from '../context/authStore'

const API_BASE = '/api/v1'

export interface Property {
  id: string
  owner_id: string
  name: string
  slug: string
  description: string
  price_min: number
  price_max: number
  currency: string
  address_line1: string
  address_line2: string
  city: string
  state: string
  postal_code: string
  country: string
  latitude: number
  longitude: number
  status: 'draft' | 'published' | 'archived'
  created_at: string
  updated_at: string
  published_at: string | null
  dwellings?: Dwelling[]
  areas?: Area[]
}

export interface PropertyListResponse {
  data: Property[]
  total: number
  offset: number
  limit: number
}

export interface Dwelling {
  id: string
  property_id: string
  name: string
  type: string
  description: string
  floor_count: number
  year_built: number
  size_sqm: number
  sort_order: number
  created_at: string
  updated_at: string
  rooms?: Room[]
}

export interface Room {
  id: string
  dwelling_id: string
  name: string
  type: string
  description: string
  size_sqm: number
  floor: number
  sort_order: number
  created_at: string
  updated_at: string
}

export interface Area {
  id: string
  property_id: string
  name: string
  type: string
  description: string
  size_sqm: number
  sort_order: number
  created_at: string
  updated_at: string
}

export interface Media {
  id: string
  entity_type: 'property' | 'dwelling' | 'room' | 'area'
  entity_id: string
  type: 'image' | 'video' | 'video360' | 'audio' | 'document' | 'model3d'
  url: string
  thumbnail_url: string
  file_name: string
  file_size: number
  mime_type: string
  autoplay: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

export interface User {
  id: string
  email: string
  name: string
  avatar_url: string
  role: 'viewer' | 'agent' | 'admin'
  created_at: string
  updated_at: string
}

// Analytics types
export interface DashboardData {
  total_views: number
  unique_sessions: number
  avg_dwell_time_ms: number
  page_view_counts: Record<string, number>
  device_breakdown: Record<string, number>
}

export interface VisitorLocation {
  latitude: number
  longitude: number
  city: string
  country: string
  count: number
}

// A/B Testing types
export interface ABTest {
  id: string
  name: string
  description: string
  entity_type: string
  entity_id: string
  status: 'draft' | 'running' | 'completed' | 'cancelled'
  start_date: string | null
  end_date: string | null
  winner_variant_id: string | null
  created_at: string
  updated_at: string
}

export interface ABVariant {
  id: string
  ab_test_id: string
  name: string
  content: Record<string, unknown>
  weight: number
  created_at: string
  updated_at: string
}

export interface ABTestResults {
  test_id: string
  total_views: number
  variant_stats: ABVariantStats[]
}

export interface ABVariantStats {
  variant_id: string
  variant_name: string
  views: number
  avg_dwell_time_ms: number
  avg_scroll_depth: number
}

// Get auth headers from store
function getAuthHeaders(): Record<string, string> {
  const tokens = useAuthStore.getState().tokens
  if (!tokens?.accessToken) return {}
  return { Authorization: `Bearer ${tokens.accessToken}` }
}

// Base fetch function with auth support
async function fetchAPI<T>(
  endpoint: string,
  options?: RequestInit & { requireAuth?: boolean }
): Promise<T> {
  const { requireAuth = false, ...fetchOptions } = options || {}

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(requireAuth ? getAuthHeaders() : {}),
    ...((fetchOptions.headers as Record<string, string>) || {}),
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...fetchOptions,
    headers,
  })

  if (!response.ok) {
    // Handle token refresh on 401
    if (response.status === 401 && requireAuth) {
      const authStore = useAuthStore.getState()
      await authStore.refreshTokens()

      // Retry with new token
      const newHeaders = {
        ...headers,
        ...getAuthHeaders(),
      }
      const retryResponse = await fetch(`${API_BASE}${endpoint}`, {
        ...fetchOptions,
        headers: newHeaders,
      })

      if (!retryResponse.ok) {
        const error = await retryResponse.json().catch(() => ({ error: 'Request failed' }))
        throw new Error(error.error || 'Request failed')
      }

      return retryResponse.json()
    }

    const error = await response.json().catch(() => ({ error: 'Request failed' }))
    throw new Error(error.error || 'Request failed')
  }

  // Handle empty responses (204 No Content)
  if (response.status === 204) {
    return undefined as T
  }

  return response.json()
}

export const api = {
  // Auth
  getProviders: () => fetchAPI<{ providers: string[] }>('/auth/providers'),

  getCurrentUser: () =>
    fetchAPI<User>('/auth/me', { requireAuth: true }),

  // Properties (public)
  getProperties: (params?: {
    offset?: number
    limit?: number
    search?: string
    status?: string
    min_price?: number
    max_price?: number
  }) => {
    const searchParams = new URLSearchParams()
    if (params?.offset) searchParams.set('offset', String(params.offset))
    if (params?.limit) searchParams.set('limit', String(params.limit))
    if (params?.search) searchParams.set('search', params.search)
    if (params?.status) searchParams.set('status', params.status)
    if (params?.min_price) searchParams.set('min_price', String(params.min_price))
    if (params?.max_price) searchParams.set('max_price', String(params.max_price))
    const query = searchParams.toString()
    return fetchAPI<PropertyListResponse>(`/properties${query ? `?${query}` : ''}`)
  },

  getPropertyBySlug: (slug: string) =>
    fetchAPI<Property>(`/properties/${slug}`),

  // Properties (authenticated)
  createProperty: (data: Partial<Property>) =>
    fetchAPI<Property>('/properties', {
      method: 'POST',
      body: JSON.stringify(data),
      requireAuth: true,
    }),

  updateProperty: (id: string, data: Partial<Property>) =>
    fetchAPI<Property>(`/properties/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
      requireAuth: true,
    }),

  deleteProperty: (id: string) =>
    fetchAPI<void>(`/properties/${id}`, {
      method: 'DELETE',
      requireAuth: true,
    }),

  // Dwellings
  getPropertyDwellings: (propertyId: string) =>
    fetchAPI<{ data: Dwelling[] }>(`/properties/${propertyId}/dwellings`),

  createDwelling: (data: Partial<Dwelling>) =>
    fetchAPI<Dwelling>('/dwellings', {
      method: 'POST',
      body: JSON.stringify(data),
      requireAuth: true,
    }),

  updateDwelling: (id: string, data: Partial<Dwelling>) =>
    fetchAPI<Dwelling>(`/dwellings/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
      requireAuth: true,
    }),

  deleteDwelling: (id: string) =>
    fetchAPI<void>(`/dwellings/${id}`, {
      method: 'DELETE',
      requireAuth: true,
    }),

  // Rooms
  getDwellingRooms: (dwellingId: string) =>
    fetchAPI<{ data: Room[] }>(`/dwellings/${dwellingId}/rooms`),

  createRoom: (data: Partial<Room>) =>
    fetchAPI<Room>('/rooms', {
      method: 'POST',
      body: JSON.stringify(data),
      requireAuth: true,
    }),

  updateRoom: (id: string, data: Partial<Room>) =>
    fetchAPI<Room>(`/rooms/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
      requireAuth: true,
    }),

  deleteRoom: (id: string) =>
    fetchAPI<void>(`/rooms/${id}`, {
      method: 'DELETE',
      requireAuth: true,
    }),

  // Areas
  getPropertyAreas: (propertyId: string) =>
    fetchAPI<{ data: Area[] }>(`/properties/${propertyId}/areas`),

  createArea: (data: Partial<Area>) =>
    fetchAPI<Area>('/areas', {
      method: 'POST',
      body: JSON.stringify(data),
      requireAuth: true,
    }),

  updateArea: (id: string, data: Partial<Area>) =>
    fetchAPI<Area>(`/areas/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
      requireAuth: true,
    }),

  deleteArea: (id: string) =>
    fetchAPI<void>(`/areas/${id}`, {
      method: 'DELETE',
      requireAuth: true,
    }),

  // Media
  getPropertyMedia: (propertyId: string) =>
    fetchAPI<{ data: Media[] }>(`/properties/${propertyId}/media`),

  uploadMedia: (formData: FormData) =>
    fetch(`${API_BASE}/media/upload`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: formData,
    }).then(async (res) => {
      if (!res.ok) {
        const error = await res.json().catch(() => ({ error: 'Upload failed' }))
        throw new Error(error.error || 'Upload failed')
      }
      return res.json() as Promise<Media>
    }),

  updateMedia: (id: string, data: { autoplay?: boolean; sort_order?: number }) =>
    fetchAPI<Media>(`/media/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
      requireAuth: true,
    }),

  deleteMedia: (id: string) =>
    fetchAPI<void>(`/media/${id}`, {
      method: 'DELETE',
      requireAuth: true,
    }),

  // Analytics
  recordPageView: (data: {
    session_id: string
    property_id?: string
    page_path: string
    dwell_time_ms?: number
    scroll_depth?: number
    referrer?: string
  }) =>
    fetchAPI('/analytics/pageview', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getDashboard: (params?: { property_id?: string; start_date?: string; end_date?: string }) => {
    const searchParams = new URLSearchParams()
    if (params?.property_id) searchParams.set('property_id', params.property_id)
    if (params?.start_date) searchParams.set('start_date', params.start_date)
    if (params?.end_date) searchParams.set('end_date', params.end_date)
    const query = searchParams.toString()
    return fetchAPI<DashboardData>(`/analytics/dashboard${query ? `?${query}` : ''}`, {
      requireAuth: true,
    })
  },

  getVisitorMap: (params?: { property_id?: string; start_date?: string; end_date?: string }) => {
    const searchParams = new URLSearchParams()
    if (params?.property_id) searchParams.set('property_id', params.property_id)
    if (params?.start_date) searchParams.set('start_date', params.start_date)
    if (params?.end_date) searchParams.set('end_date', params.end_date)
    const query = searchParams.toString()
    return fetchAPI<{ data: VisitorLocation[] }>(`/analytics/visitors/map${query ? `?${query}` : ''}`, {
      requireAuth: true,
    })
  },

  // A/B Testing
  listABTests: (params?: { status?: string; entity_type?: string }) => {
    const searchParams = new URLSearchParams()
    if (params?.status) searchParams.set('status', params.status)
    if (params?.entity_type) searchParams.set('entity_type', params.entity_type)
    const query = searchParams.toString()
    return fetchAPI<{ data: ABTest[]; total: number }>(`/ab-tests${query ? `?${query}` : ''}`, {
      requireAuth: true,
    })
  },

  createABTest: (data: {
    name: string
    description?: string
    entity_type: string
    entity_id: string
    start_date?: string
    end_date?: string
  }) =>
    fetchAPI<ABTest>('/ab-tests', {
      method: 'POST',
      body: JSON.stringify(data),
      requireAuth: true,
    }),

  getABTest: (id: string) =>
    fetchAPI<{ test: ABTest; variants: ABVariant[] }>(`/ab-tests/${id}`, {
      requireAuth: true,
    }),

  updateABTest: (id: string, data: Partial<ABTest>) =>
    fetchAPI<ABTest>(`/ab-tests/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
      requireAuth: true,
    }),

  deleteABTest: (id: string) =>
    fetchAPI<void>(`/ab-tests/${id}`, {
      method: 'DELETE',
      requireAuth: true,
    }),

  createABVariant: (testId: string, data: { name: string; content?: Record<string, unknown>; weight?: number }) =>
    fetchAPI<ABVariant>(`/ab-tests/${testId}/variants`, {
      method: 'POST',
      body: JSON.stringify(data),
      requireAuth: true,
    }),

  getABTestResults: (testId: string) =>
    fetchAPI<ABTestResults>(`/ab-tests/${testId}/results`, {
      requireAuth: true,
    }),

  assignABVariant: (testId: string, sessionId: string) =>
    fetchAPI<{ variant_id: string; variant: ABVariant }>(`/ab-tests/${testId}/assign`, {
      method: 'POST',
      body: JSON.stringify({ session_id: sessionId }),
    }),
}
