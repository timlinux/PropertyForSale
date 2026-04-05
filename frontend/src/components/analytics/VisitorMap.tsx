// SPDX-FileCopyrightText: 2026 Tim Sutton <tim@kartoza.com>
// SPDX-License-Identifier: EUPL-1.2

import { useEffect, useRef } from 'react'
import { Box, Text, Flex } from '@chakra-ui/react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import { VisitorLocation } from '../../api'

interface VisitorMapProps {
  locations: VisitorLocation[]
}

export function VisitorMap({ locations }: VisitorMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const mapRef = useRef<maplibregl.Map | null>(null)

  useEffect(() => {
    if (!mapContainer.current) return
    if (mapRef.current) return

    mapRef.current = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          'carto-light': {
            type: 'raster',
            tiles: [
              'https://basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png',
            ],
            tileSize: 256,
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
          },
        },
        layers: [
          {
            id: 'carto-light-layer',
            type: 'raster',
            source: 'carto-light',
            minzoom: 0,
            maxzoom: 19,
          },
        ],
      },
      center: [0, 20],
      zoom: 1.5,
      attributionControl: false,
    })

    mapRef.current.addControl(
      new maplibregl.NavigationControl({ showCompass: false }),
      'top-right'
    )

    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [])

  // Add markers when locations change
  useEffect(() => {
    const map = mapRef.current
    if (!map || locations.length === 0) return

    // Wait for map to load
    const addMarkers = () => {
      // Clear existing markers
      const existingMarkers = document.querySelectorAll('.visitor-marker')
      existingMarkers.forEach((m) => m.remove())

      // Add markers for each location
      locations.forEach((location) => {
        if (!location.latitude || !location.longitude) return

        const el = document.createElement('div')
        el.className = 'visitor-marker'
        el.style.cssText = `
          width: ${Math.min(40, 12 + location.count * 2)}px;
          height: ${Math.min(40, 12 + location.count * 2)}px;
          background: rgba(29, 29, 31, 0.8);
          border-radius: 50%;
          border: 2px solid white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.2);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 10px;
          font-weight: 600;
        `
        if (location.count > 1) {
          el.textContent = String(location.count)
        }

        new maplibregl.Marker({ element: el })
          .setLngLat([location.longitude, location.latitude])
          .setPopup(
            new maplibregl.Popup({ offset: 25 }).setHTML(`
              <div style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; padding: 4px;">
                <div style="font-weight: 600; font-size: 14px;">${location.city || 'Unknown'}</div>
                <div style="color: #6e6e73; font-size: 12px;">${location.country || ''}</div>
                <div style="margin-top: 4px; font-size: 12px;">${location.count} visitor${location.count !== 1 ? 's' : ''}</div>
              </div>
            `)
          )
          .addTo(map)
      })

      // Fit bounds to show all markers
      if (locations.length > 1) {
        const bounds = new maplibregl.LngLatBounds()
        locations.forEach((loc) => {
          if (loc.latitude && loc.longitude) {
            bounds.extend([loc.longitude, loc.latitude])
          }
        })
        map.fitBounds(bounds, { padding: 50, maxZoom: 8 })
      } else if (locations.length === 1 && locations[0].latitude && locations[0].longitude) {
        map.flyTo({
          center: [locations[0].longitude, locations[0].latitude],
          zoom: 4,
        })
      }
    }

    if (map.loaded()) {
      addMarkers()
    } else {
      map.on('load', addMarkers)
    }
  }, [locations])

  if (locations.length === 0) {
    return (
      <Box
        bg="white"
        borderRadius="2xl"
        p={6}
        border="1px solid"
        borderColor="neutral.100"
        h="400px"
      >
        <Text
          fontSize="13px"
          fontWeight="500"
          color="neutral.400"
          textTransform="uppercase"
          letterSpacing="0.04em"
          mb={4}
        >
          Visitor Locations
        </Text>
        <Flex h="320px" align="center" justify="center" bg="neutral.50" borderRadius="xl">
          <Text color="neutral.300" fontSize="14px">
            No visitor location data yet
          </Text>
        </Flex>
      </Box>
    )
  }

  return (
    <Box
      bg="white"
      borderRadius="2xl"
      p={6}
      border="1px solid"
      borderColor="neutral.100"
    >
      <Text
        fontSize="13px"
        fontWeight="500"
        color="neutral.400"
        textTransform="uppercase"
        letterSpacing="0.04em"
        mb={4}
      >
        Visitor Locations
      </Text>
      <Box
        ref={mapContainer}
        h="320px"
        borderRadius="xl"
        overflow="hidden"
        sx={{
          '.maplibregl-ctrl-top-right': {
            top: '8px',
            right: '8px',
          },
          '.maplibregl-ctrl-group': {
            borderRadius: '8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          },
        }}
      />
    </Box>
  )
}
