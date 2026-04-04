// SPDX-FileCopyrightText: 2026 Tim Sutton <tim@kartoza.com>
// SPDX-License-Identifier: EUPL-1.2

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
  created_at: string
  updated_at: string
}

export interface Room {
  id: string
  dwelling_id: string
  name: string
  type: string
  description: string
  size_sqm: number
  floor: number
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
  created_at: string
  updated_at: string
}

export interface Media {
  id: string
  entity_type: string
  entity_id: string
  type: 'image' | 'video' | 'video360' | 'audio' | 'document' | 'model3d'
  url: string
  thumbnail_url: string
  file_name: string
  autoplay: boolean
  created_at: string
  updated_at: string
}

async function fetchAPI<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }))
    throw new Error(error.error || 'Request failed')
  }

  return response.json()
}

export const api = {
  // Properties
  getProperties: (params?: { offset?: number; limit?: number; search?: string }) => {
    const searchParams = new URLSearchParams()
    if (params?.offset) searchParams.set('offset', String(params.offset))
    if (params?.limit) searchParams.set('limit', String(params.limit))
    if (params?.search) searchParams.set('search', params.search)
    const query = searchParams.toString()
    return fetchAPI<PropertyListResponse>(`/properties${query ? `?${query}` : ''}`)
  },

  getPropertyBySlug: (slug: string) =>
    fetchAPI<Property>(`/properties/${slug}`),

  createProperty: (data: Partial<Property>) =>
    fetchAPI<Property>('/properties', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateProperty: (id: string, data: Partial<Property>) =>
    fetchAPI<Property>(`/properties/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteProperty: (id: string) =>
    fetchAPI<void>(`/properties/${id}`, { method: 'DELETE' }),

  // Dwellings
  getPropertyDwellings: (propertyId: string) =>
    fetchAPI<{ data: Dwelling[] }>(`/properties/${propertyId}/dwellings`),

  // Areas
  getPropertyAreas: (propertyId: string) =>
    fetchAPI<{ data: Area[] }>(`/properties/${propertyId}/areas`),

  // Media
  getPropertyMedia: (propertyId: string) =>
    fetchAPI<{ data: Media[] }>(`/properties/${propertyId}/media`),

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
}
