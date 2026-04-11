// SPDX-FileCopyrightText: 2026 Tim Sutton <tim@kartoza.com>
// SPDX-License-Identifier: EUPL-1.2

import { useRef, useEffect, useState } from 'react'
import { Box, useColorModeValue } from '@chakra-ui/react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'

interface PropertyMapProps {
  latitude: number
  longitude: number
  zoom?: number
  markers?: Array<{
    id: string
    lat: number
    lng: number
    label: string
    type?: 'structure' | 'area' | 'property'
    onClick?: () => void
  }>
  interactive?: boolean
  height?: string
  onMarkerClick?: (markerId: string) => void
}

export default function PropertyMap({
  latitude,
  longitude,
  zoom = 15,
  markers = [],
  interactive = true,
  height = '400px',
  onMarkerClick,
}: PropertyMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<maplibregl.Map | null>(null)
  const [loaded, setLoaded] = useState(false)

  const borderColor = useColorModeValue('gray.200', 'gray.600')

  useEffect(() => {
    if (!mapContainer.current) return

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          'osm-tiles': {
            type: 'raster',
            tiles: [
              'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
            ],
            tileSize: 256,
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          },
        },
        layers: [
          {
            id: 'osm-tiles',
            type: 'raster',
            source: 'osm-tiles',
            minzoom: 0,
            maxzoom: 19,
          },
        ],
      },
      center: [longitude, latitude],
      zoom,
      interactive,
    })

    map.current.addControl(new maplibregl.NavigationControl(), 'top-right')
    map.current.addControl(new maplibregl.ScaleControl(), 'bottom-left')

    map.current.on('load', () => {
      setLoaded(true)
    })

    return () => {
      map.current?.remove()
    }
  }, [latitude, longitude, zoom, interactive])

  // Add markers
  useEffect(() => {
    if (!map.current || !loaded) return

    // Clear existing markers
    const existingMarkers = document.querySelectorAll('.maplibregl-marker')
    existingMarkers.forEach((marker) => marker.remove())

    // Add property center marker
    new maplibregl.Marker({ color: '#c9a227' })
      .setLngLat([longitude, latitude])
      .setPopup(new maplibregl.Popup().setHTML('<strong>Property Location</strong>'))
      .addTo(map.current)

    // Add custom markers
    markers.forEach((markerData) => {
      const color = markerData.type === 'structure' ? '#2d3748' :
                    markerData.type === 'area' ? '#38a169' : '#c9a227'

      const el = document.createElement('div')
      el.className = 'custom-marker'
      el.style.width = '30px'
      el.style.height = '30px'
      el.style.borderRadius = '50%'
      el.style.backgroundColor = color
      el.style.border = '3px solid white'
      el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)'
      el.style.cursor = 'pointer'

      el.addEventListener('click', () => {
        if (markerData.onClick) {
          markerData.onClick()
        }
        if (onMarkerClick) {
          onMarkerClick(markerData.id)
        }
      })

      new maplibregl.Marker(el)
        .setLngLat([markerData.lng, markerData.lat])
        .setPopup(new maplibregl.Popup().setHTML(`<strong>${markerData.label}</strong>`))
        .addTo(map.current!)
    })
  }, [loaded, markers, latitude, longitude, onMarkerClick])

  return (
    <Box
      ref={mapContainer}
      h={height}
      w="100%"
      borderRadius="lg"
      overflow="hidden"
      border="1px solid"
      borderColor={borderColor}
    />
  )
}
