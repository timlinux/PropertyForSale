// SPDX-FileCopyrightText: 2026 Tim Sutton <tim@kartoza.com>
// SPDX-License-Identifier: EUPL-1.2

import { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom'
import {
  Box,
  HStack,
  VStack,
  Text,
  IconButton,
  Spinner,
  Center,
  Input,
  InputGroup,
  InputLeftElement,
  useDisclosure,
  Kbd,
  Tooltip,
  Image,
  Flex,
  Button,
} from '@chakra-ui/react'
import { useQuery } from '@tanstack/react-query'
import {
  FiChevronLeft,
  FiChevronRight,
  FiSearch,
  FiHome,
  FiGrid,
  FiLayers,
  FiX,
  FiImage,
  FiStar,
  FiInfo,
  FiMaximize,
} from 'react-icons/fi'
import { api } from '../api'
import { usePageTracking } from '../hooks/usePageTracking'
import { AmbientAudioPlayer } from '../components/media'
import { ParticleHourglass } from '../components/ui/ParticleHourglass'

interface NavigationContext {
  level: 'property' | 'dwelling' | 'room' | 'area'
  propertySlug: string
  dwellingId?: string
  dwellingName?: string
  roomId?: string
  roomName?: string
  areaId?: string
  areaName?: string
}

interface EntityNode {
  id: string
  name: string
  type: 'property' | 'dwelling' | 'room' | 'area'
  parentId?: string
  mediaCount: number
  children?: EntityNode[]
}

export default function PropertyExplorer() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()

  // Navigation state
  const [context, setContext] = useState<NavigationContext>({
    level: 'property',
    propertySlug: slug || '',
  })
  const [mediaIndex, setMediaIndex] = useState(0)
  const [showUI, setShowUI] = useState(true)
  const [showInfo, setShowInfo] = useState(false)
  const [showFilmstrip, setShowFilmstrip] = useState(false)
  const [rippleOrigin, setRippleOrigin] = useState({ x: 50, y: 50 })
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [nextImageUrl, setNextImageUrl] = useState<string | null>(null)

  // Touch/swipe handling
  const touchStartX = useRef<number | null>(null)
  const touchStartY = useRef<number | null>(null)

  // Quick jump panel
  const { isOpen: isSearchOpen, onOpen: onSearchOpen, onClose: onSearchClose } = useDisclosure()
  const [searchQuery, setSearchQuery] = useState('')
  const searchInputRef = useRef<HTMLInputElement>(null)
  const [selectedSearchIndex, setSelectedSearchIndex] = useState(0)

  // Auto-hide UI timer
  const uiTimerRef = useRef<NodeJS.Timeout>()

  // Fetch property data
  const { data: property, isLoading: propertyLoading } = useQuery({
    queryKey: ['property', slug],
    queryFn: () => api.getPropertyBySlug(slug!),
    enabled: !!slug,
  })

  const { data: dwellingsData } = useQuery({
    queryKey: ['property-dwellings', property?.slug],
    queryFn: () => api.getPropertyDwellings(property!.slug),
    enabled: !!property?.slug,
  })

  const { data: areasData } = useQuery({
    queryKey: ['property-areas', property?.slug],
    queryFn: () => api.getPropertyAreas(property!.slug),
    enabled: !!property?.slug,
  })

  const { data: mediaData } = useQuery({
    queryKey: ['property-media', property?.slug],
    queryFn: () => api.getPropertyMedia(property!.slug),
    enabled: !!property?.slug,
  })

  const { data: quotesData } = useQuery({
    queryKey: ['property-quotes', property?.slug],
    queryFn: () => api.getPropertyQuotes(property!.slug),
    enabled: !!property?.slug,
  })

  const dwellings = dwellingsData?.data || []
  const areas = areasData?.data || []
  const allMedia = mediaData?.data || []
  const quotes = quotesData?.data || []

  // Quote cycling state
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0)
  const [quoteVisible, setQuoteVisible] = useState(true)
  const [quoteProgress, setQuoteProgress] = useState(0)
  const quoteIntervalRef = useRef<NodeJS.Timeout>()
  const quoteProgressRef = useRef<NodeJS.Timeout>()

  // Extracted color from current image
  const [imageColor, setImageColor] = useState('#0071e3')

  const QUOTE_DURATION = 10000 // 10 seconds
  const PROGRESS_INTERVAL = 50 // Update progress every 50ms

  const currentQuote = quotes[currentQuoteIndex]

  // Get starred audio tracks for ambient soundscape
  const audioTracks = useMemo(() =>
    allMedia.filter((m) => m.type === 'audio' && m.starred),
    [allMedia]
  )

  // Track views
  usePageTracking({ propertyId: property?.id })

  // Get current entity's media
  const currentMedia = useMemo(() => {
    let entityType: string
    let entityId: string

    switch (context.level) {
      case 'dwelling':
        entityType = 'dwelling'
        entityId = context.dwellingId || ''
        break
      case 'room':
        entityType = 'room'
        entityId = context.roomId || ''
        break
      case 'area':
        entityType = 'area'
        entityId = context.areaId || ''
        break
      default:
        entityType = 'property'
        entityId = property?.id || ''
    }

    return allMedia
      .filter(m => m.entity_type === entityType && m.entity_id === entityId && m.type === 'image')
      .sort((a, b) => {
        if (a.starred && !b.starred) return -1
        if (!a.starred && b.starred) return 1
        return a.sort_order - b.sort_order
      })
  }, [context, allMedia, property])

  // Current image
  const currentImage = currentMedia[mediaIndex] || null
  const hasNextMedia = mediaIndex < currentMedia.length - 1
  const hasPrevMedia = mediaIndex > 0

  // Build entity tree for quick jump
  const entityTree = useMemo((): EntityNode[] => {
    if (!property) return []

    const getMediaCount = (type: string, id: string) =>
      allMedia.filter(m => m.entity_type === type && m.entity_id === id).length

    const propertyNode: EntityNode = {
      id: property.id,
      name: property.name,
      type: 'property',
      mediaCount: getMediaCount('property', property.id),
      children: [],
    }

    dwellings.forEach(dwelling => {
      const dwellingNode: EntityNode = {
        id: dwelling.id,
        name: dwelling.name,
        type: 'dwelling',
        parentId: property.id,
        mediaCount: getMediaCount('dwelling', dwelling.id),
        children: [],
      }

      if (dwelling.rooms) {
        dwelling.rooms.forEach(room => {
          dwellingNode.children?.push({
            id: room.id,
            name: room.name,
            type: 'room',
            parentId: dwelling.id,
            mediaCount: getMediaCount('room', room.id),
          })
        })
      }

      propertyNode.children?.push(dwellingNode)
    })

    areas.forEach(area => {
      propertyNode.children?.push({
        id: area.id,
        name: area.name,
        type: 'area',
        parentId: property.id,
        mediaCount: getMediaCount('area', area.id),
      })
    })

    return [propertyNode]
  }, [property, dwellings, areas, allMedia])

  // Flatten tree for search
  const flatEntities = useMemo(() => {
    const flat: EntityNode[] = []
    const traverse = (nodes: EntityNode[], depth = 0) => {
      nodes.forEach(node => {
        flat.push({ ...node, children: undefined })
        if (node.children) traverse(node.children, depth + 1)
      })
    }
    traverse(entityTree)
    return flat
  }, [entityTree])

  // Filter entities by search
  const filteredEntities = useMemo(() => {
    if (!searchQuery.trim()) return flatEntities
    const query = searchQuery.toLowerCase()
    return flatEntities.filter(e => e.name.toLowerCase().includes(query))
  }, [flatEntities, searchQuery])

  // Reset search index when results change
  useEffect(() => {
    setSelectedSearchIndex(0)
  }, [filteredEntities])

  // Generate random ripple origin
  const getRandomRippleOrigin = useCallback(() => ({
    x: 15 + Math.random() * 70,
    y: 15 + Math.random() * 70,
  }), [])

  // Cycle through quotes and media every 10 seconds with progress bar
  useEffect(() => {
    // Reset progress when slide changes
    setQuoteProgress(0)

    // Progress bar animation
    let elapsed = 0
    quoteProgressRef.current = setInterval(() => {
      elapsed += PROGRESS_INTERVAL
      setQuoteProgress((elapsed / QUOTE_DURATION) * 100)
    }, PROGRESS_INTERVAL)

    // Slide transition - stagger quote and image changes for smooth zen experience
    quoteIntervalRef.current = setTimeout(() => {
      // Start the ripple for next image immediately
      const nextMediaIndex = mediaIndex + 1 < currentMedia.length ? mediaIndex + 1 : 0
      if (currentMedia.length > 1) {
        setNextImageUrl(currentMedia[nextMediaIndex]?.url || null)
        setRippleOrigin(getRandomRippleOrigin())
        setIsTransitioning(true)
      }

      // Fade out quote at midpoint of ripple (4s into 8s transition)
      setTimeout(() => {
        if (quotes.length > 0) {
          setQuoteVisible(false)
        }
      }, 4000)

      // Change quote and fade back in shortly after
      setTimeout(() => {
        if (quotes.length > 0) {
          setCurrentQuoteIndex((prev) => (prev + 1) % quotes.length)
          setQuoteVisible(true)
        }
      }, 5000)

      // Complete the image transition after full ripple duration
      setTimeout(() => {
        if (currentMedia.length > 1) {
          setMediaIndex(nextMediaIndex)
          setIsTransitioning(false)
        }
      }, 8000)
    }, QUOTE_DURATION)

    return () => {
      if (quoteIntervalRef.current) clearTimeout(quoteIntervalRef.current)
      if (quoteProgressRef.current) clearInterval(quoteProgressRef.current)
    }
  }, [currentQuoteIndex, quotes.length, mediaIndex, currentMedia, getRandomRippleOrigin, QUOTE_DURATION, PROGRESS_INTERVAL])

  // Reset quote index when quotes/media change
  useEffect(() => {
    setCurrentQuoteIndex(0)
    setQuoteVisible(true)
    setQuoteProgress(0)
  }, [quotes])

  // Extract dominant color from current image
  useEffect(() => {
    if (!currentImage?.url) return

    const img = new window.Image()
    img.crossOrigin = 'anonymous'
    img.src = currentImage.url

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        // Sample a small version for performance
        const sampleSize = 50
        canvas.width = sampleSize
        canvas.height = sampleSize
        ctx.drawImage(img, 0, 0, sampleSize, sampleSize)

        const imageData = ctx.getImageData(0, 0, sampleSize, sampleSize)
        const data = imageData.data

        // Find the most vibrant/saturated color
        let bestColor = { r: 0, g: 113, b: 227 } // fallback blue
        let bestSaturation = 0

        for (let i = 0; i < data.length; i += 16) { // Sample every 4th pixel
          const r = data[i]
          const g = data[i + 1]
          const b = data[i + 2]

          // Calculate saturation
          const max = Math.max(r, g, b)
          const min = Math.min(r, g, b)
          const lightness = (max + min) / 2
          const saturation = max === min ? 0 : (max - min) / (lightness > 127 ? (510 - max - min) : (max + min))

          // Prefer saturated colors that aren't too dark or too light
          if (saturation > bestSaturation && lightness > 40 && lightness < 200) {
            bestSaturation = saturation
            bestColor = { r, g, b }
          }
        }

        // Darken the color slightly for better readability
        const darken = 0.7
        const finalR = Math.round(bestColor.r * darken)
        const finalG = Math.round(bestColor.g * darken)
        const finalB = Math.round(bestColor.b * darken)

        setImageColor(`rgb(${finalR}, ${finalG}, ${finalB})`)
      } catch {
        // CORS or other error - use fallback
        setImageColor('#0071e3')
      }
    }
  }, [currentImage?.url])

  // Navigation functions
  const goToEntity = useCallback((node: EntityNode) => {
    setMediaIndex(0)

    if (node.type === 'property') {
      setContext({ level: 'property', propertySlug: slug! })
    } else if (node.type === 'dwelling') {
      setContext({
        level: 'dwelling',
        propertySlug: slug!,
        dwellingId: node.id,
        dwellingName: node.name,
      })
    } else if (node.type === 'room') {
      const dwelling = dwellings.find(d => d.rooms?.some(r => r.id === node.id))
      if (dwelling) {
        setContext({
          level: 'room',
          propertySlug: slug!,
          dwellingId: dwelling.id,
          dwellingName: dwelling.name,
          roomId: node.id,
          roomName: node.name,
        })
      }
    } else if (node.type === 'area') {
      setContext({
        level: 'area',
        propertySlug: slug!,
        areaId: node.id,
        areaName: node.name,
      })
    }

    onSearchClose()
    setSearchQuery('')
  }, [slug, dwellings, onSearchClose])

  const goUp = useCallback(() => {
    setMediaIndex(0)
    if (context.level === 'room') {
      setContext({
        level: 'dwelling',
        propertySlug: context.propertySlug,
        dwellingId: context.dwellingId,
        dwellingName: context.dwellingName,
      })
    } else if (context.level === 'dwelling' || context.level === 'area') {
      setContext({ level: 'property', propertySlug: context.propertySlug })
    }
  }, [context])

  // Trigger ripple when entity changes
  const prevContextRef = useRef(context)
  useEffect(() => {
    if (prevContextRef.current !== context && currentMedia.length > 0) {
      setNextImageUrl(currentMedia[0]?.url || null)
      setRippleOrigin(getRandomRippleOrigin())
      setIsTransitioning(true)
      setTimeout(() => {
        setIsTransitioning(false)
      }, 8000)
    }
    prevContextRef.current = context
  }, [context, currentMedia, getRandomRippleOrigin])

  const navigateMedia = useCallback((direction: 'next' | 'prev') => {
    if (direction === 'next' && hasNextMedia) {
      setNextImageUrl(currentMedia[mediaIndex + 1]?.url || null)
      setRippleOrigin(getRandomRippleOrigin())
      setIsTransitioning(true)

      setTimeout(() => {
        setMediaIndex(i => i + 1)
        setIsTransitioning(false)
      }, 8000)
    } else if (direction === 'prev' && hasPrevMedia) {
      setNextImageUrl(currentMedia[mediaIndex - 1]?.url || null)
      setRippleOrigin(getRandomRippleOrigin())
      setIsTransitioning(true)

      setTimeout(() => {
        setMediaIndex(i => i - 1)
        setIsTransitioning(false)
      }, 8000)
    }
  }, [hasNextMedia, hasPrevMedia, currentMedia, mediaIndex, getRandomRippleOrigin])

  const navigateToImage = useCallback((index: number) => {
    if (index === mediaIndex || index < 0 || index >= currentMedia.length) return

    setNextImageUrl(currentMedia[index]?.url || null)
    setRippleOrigin(getRandomRippleOrigin())
    setIsTransitioning(true)

    setTimeout(() => {
      setMediaIndex(index)
      setIsTransitioning(false)
    }, 8000)
  }, [mediaIndex, currentMedia, getRandomRippleOrigin])

  const navigateSibling = useCallback((direction: 'next' | 'prev') => {
    setMediaIndex(0)

    if (context.level === 'dwelling') {
      const idx = dwellings.findIndex(d => d.id === context.dwellingId)
      const newIdx = direction === 'next' ? idx + 1 : idx - 1
      if (newIdx >= 0 && newIdx < dwellings.length) {
        setContext({
          level: 'dwelling',
          propertySlug: context.propertySlug,
          dwellingId: dwellings[newIdx].id,
          dwellingName: dwellings[newIdx].name,
        })
      }
    } else if (context.level === 'room' && context.dwellingId) {
      const dwelling = dwellings.find(d => d.id === context.dwellingId)
      const rooms = dwelling?.rooms || []
      const idx = rooms.findIndex(r => r.id === context.roomId)
      const newIdx = direction === 'next' ? idx + 1 : idx - 1
      if (newIdx >= 0 && newIdx < rooms.length) {
        setContext({
          ...context,
          roomId: rooms[newIdx].id,
          roomName: rooms[newIdx].name,
        })
      }
    } else if (context.level === 'area') {
      const idx = areas.findIndex(a => a.id === context.areaId)
      const newIdx = direction === 'next' ? idx + 1 : idx - 1
      if (newIdx >= 0 && newIdx < areas.length) {
        setContext({
          level: 'area',
          propertySlug: context.propertySlug,
          areaId: areas[newIdx].id,
          areaName: areas[newIdx].name,
        })
      }
    }
  }, [context, dwellings, areas])

  // Auto-hide UI
  const resetUITimer = useCallback(() => {
    setShowUI(true)
    if (uiTimerRef.current) {
      clearTimeout(uiTimerRef.current)
    }
    uiTimerRef.current = setTimeout(() => {
      if (!isSearchOpen && !showInfo) {
        setShowUI(false)
        setShowFilmstrip(false)
      }
    }, 3000)
  }, [isSearchOpen, showInfo])

  // Toggle UI on tap/click
  const handleBackgroundClick = useCallback(() => {
    if (showUI) {
      setShowUI(false)
      setShowFilmstrip(false)
    } else {
      resetUITimer()
    }
  }, [showUI, resetUITimer])

  // Touch/swipe handlers
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
  }, [])

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return

    const deltaX = e.changedTouches[0].clientX - touchStartX.current
    const deltaY = e.changedTouches[0].clientY - touchStartY.current
    const absX = Math.abs(deltaX)
    const absY = Math.abs(deltaY)

    // Only trigger swipe if horizontal movement is dominant and significant
    if (absX > 50 && absX > absY * 1.5) {
      if (deltaX > 0) {
        navigateMedia('prev')
      } else {
        navigateMedia('next')
      }
    } else if (absY > 50 && absY > absX * 1.5) {
      // Vertical swipe - show/hide filmstrip
      if (deltaY < 0) {
        setShowFilmstrip(true)
        resetUITimer()
      } else {
        setShowFilmstrip(false)
      }
    }

    touchStartX.current = null
    touchStartY.current = null
  }, [navigateMedia, resetUITimer])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isSearchOpen) {
        switch (e.key) {
          case 'Escape':
            onSearchClose()
            setSearchQuery('')
            break
          case 'ArrowDown':
            e.preventDefault()
            setSelectedSearchIndex(i => Math.min(i + 1, filteredEntities.length - 1))
            break
          case 'ArrowUp':
            e.preventDefault()
            setSelectedSearchIndex(i => Math.max(i - 1, 0))
            break
          case 'Enter':
            if (filteredEntities[selectedSearchIndex]) {
              goToEntity(filteredEntities[selectedSearchIndex])
            }
            break
        }
        return
      }

      resetUITimer()

      switch (e.key) {
        case 'ArrowRight':
          navigateMedia('next')
          break
        case 'ArrowLeft':
          navigateMedia('prev')
          break
        case 'ArrowUp':
          e.preventDefault()
          if (e.shiftKey) {
            goUp()
          } else {
            navigateSibling('prev')
          }
          break
        case 'ArrowDown':
          e.preventDefault()
          navigateSibling('next')
          break
        case '/':
        case 'k':
          if (e.key === '/' || e.ctrlKey || e.metaKey) {
            e.preventDefault()
            onSearchOpen()
          }
          break
        case 'i':
          setShowInfo(prev => !prev)
          break
        case 'f':
          setShowFilmstrip(prev => !prev)
          break
        case 'Escape':
          if (showInfo) {
            setShowInfo(false)
          } else if (showFilmstrip) {
            setShowFilmstrip(false)
          } else {
            navigate('/properties')
          }
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isSearchOpen, onSearchClose, onSearchOpen, navigateMedia, navigateSibling, goUp, navigate, resetUITimer, filteredEntities, selectedSearchIndex, goToEntity, showInfo, showFilmstrip])

  // Mouse movement shows UI
  useEffect(() => {
    const handleMouseMove = () => resetUITimer()
    window.addEventListener('mousemove', handleMouseMove)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      if (uiTimerRef.current) clearTimeout(uiTimerRef.current)
    }
  }, [resetUITimer])

  // Focus search input
  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [isSearchOpen])

  // Context breadcrumb
  const breadcrumb = useMemo(() => {
    const parts: string[] = [property?.name || '']
    if (context.level === 'dwelling' || context.level === 'room') {
      parts.push(context.dwellingName || '')
    }
    if (context.level === 'room') {
      parts.push(context.roomName || '')
    }
    if (context.level === 'area') {
      parts.push(context.areaName || '')
    }
    return parts.filter(Boolean).join(' › ')
  }, [context, property])

  if (propertyLoading) {
    return (
      <Center position="fixed" inset={0} bg="black">
        <Spinner size="xl" color="white" />
      </Center>
    )
  }

  if (!property) {
    return (
      <Center position="fixed" inset={0} bg="black" color="white">
        <VStack spacing={4}>
          <Text>Property not found</Text>
          <Text fontSize="sm" color="whiteAlpha.600" cursor="pointer" onClick={() => navigate('/properties')}>
            Return to properties
          </Text>
        </VStack>
      </Center>
    )
  }

  return (
    <Box
      position="fixed"
      inset={0}
      bg="black"
      overflow="hidden"
      cursor={showUI ? 'default' : 'none'}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Ambient Audio Player */}
      {audioTracks.length > 0 && (
        <AmbientAudioPlayer audioTracks={audioTracks} autoplay />
      )}

      {/* Full-screen image with Ken Burns effect */}
      {currentImage ? (
        <Box position="absolute" inset={0} overflow="hidden" onClick={handleBackgroundClick}>
          <Box
            key={currentImage.url}
            as="img"
            src={currentImage.url}
            alt=""
            position="absolute"
            top="50%"
            left="50%"
            minW="100%"
            minH="100%"
            w="auto"
            h="auto"
            objectFit="cover"
            sx={{
              transform: 'translate(-50%, -50%) scale(1.15)',
              animation: 'kenburns 20s ease-in-out infinite alternate',
              '@keyframes kenburns': {
                '0%': {
                  transform: 'translate(-50%, -50%) scale(1.15)',
                  objectPosition: '30% 30%',
                },
                '50%': {
                  transform: 'translate(-50%, -50%) scale(1.25)',
                  objectPosition: '70% 50%',
                },
                '100%': {
                  transform: 'translate(-50%, -50%) scale(1.15)',
                  objectPosition: '50% 70%',
                },
              },
            }}
          />

          {/* Ripple transition */}
          {isTransitioning && nextImageUrl && (
            <Box
              position="absolute"
              inset={0}
              overflow="hidden"
              sx={{
                clipPath: `circle(0% at ${rippleOrigin.x}% ${rippleOrigin.y}%)`,
                animation: 'ripple 8s cubic-bezier(0.15, 0.0, 0.25, 1) forwards',
                '@keyframes ripple': {
                  to: { clipPath: `circle(200% at ${rippleOrigin.x}% ${rippleOrigin.y}%)` },
                },
              }}
            >
              <Box
                as="img"
                src={nextImageUrl}
                alt=""
                position="absolute"
                top="50%"
                left="50%"
                minW="100%"
                minH="100%"
                w="auto"
                h="auto"
                objectFit="cover"
                sx={{
                  transform: 'translate(-50%, -50%) scale(1.15)',
                }}
              />
            </Box>
          )}
        </Box>
      ) : (
        <Center position="absolute" inset={0} color="whiteAlpha.400" onClick={handleBackgroundClick}>
          <VStack spacing={4}>
            <FiImage size={80} />
            <Text fontSize="lg">No images</Text>
            <Text fontSize="sm">Press / to navigate to another section</Text>
          </VStack>
        </Center>
      )}

      {/* Quote overlay with hourglass timer */}
      {currentQuote && (
        <Box
          position="absolute"
          bottom={showFilmstrip ? '180px' : '100px'}
          left="50%"
          transform="translateX(-50%)"
          maxW="90%"
          textAlign="center"
          opacity={quoteVisible ? 1 : 0}
          transition="opacity 0.8s ease-in-out"
          pointerEvents="none"
          zIndex={5}
        >
          <Box
            bg="rgba(255, 255, 255, 0.65)"
            backdropFilter="blur(40px)"
            border="1px solid"
            borderColor="whiteAlpha.300"
            boxShadow="0 25px 80px rgba(0, 0, 0, 0.15)"
            px={{ base: 8, md: 12, lg: 16 }}
            py={{ base: 6, md: 8, lg: 10 }}
            borderRadius="3xl"
            maxW="900px"
            sx={{ WebkitBackdropFilter: 'blur(40px)' }}
          >
            <HStack spacing={{ base: 4, md: 6, lg: 8 }} align="center" justify="center">
              {/* Quote text */}
              <Text
                color={imageColor}
                fontSize={{ base: '2xl', md: '4xl', lg: '5xl' }}
                fontWeight="300"
                fontStyle="italic"
                letterSpacing="tight"
                lineHeight="1.3"
                fontFamily="'Georgia', 'Times New Roman', serif"
                transition="color 1s ease-in-out"
              >
                "{currentQuote.text}"
              </Text>

              {/* Hourglass timer inside the container */}
              <Box flexShrink={0} opacity={0.8}>
                <ParticleHourglass
                  progress={quoteProgress}
                  size={60}
                  color={imageColor}
                />
              </Box>
            </HStack>
          </Box>

          {currentMedia.length > 1 && (
            <HStack justify="center" mt={4} spacing={2}>
              {currentMedia.map((_, idx) => (
                <Box
                  key={idx}
                  w={2.5}
                  h={2.5}
                  borderRadius="full"
                  bg={idx === mediaIndex ? 'white' : 'whiteAlpha.400'}
                  boxShadow={idx === mediaIndex ? '0 0 8px rgba(255,255,255,0.5)' : 'none'}
                  transition="all 0.3s"
                />
              ))}
            </HStack>
          )}
        </Box>
      )}

      {/* Starred indicator */}
      {currentImage?.starred && showUI && (
        <Box
          position="absolute"
          top={4}
          right={4}
          bg="white"
          border="1px solid"
          borderColor="neutral.200"
          boxShadow="lg"
          borderRadius="full"
          p={2}
          color="yellow.500"
          transition="opacity 0.3s"
        >
          <FiStar size={18} fill="currentColor" />
        </Box>
      )}

      {/* Minimal top info bar */}
      <Box
        position="absolute"
        top={0}
        left={0}
        right={0}
        p={4}
        bgGradient="linear(to-b, blackAlpha.700, transparent)"
        opacity={showUI ? 1 : 0}
        transform={showUI ? 'translateY(0)' : 'translateY(-100%)'}
        transition="all 0.3s ease-out"
        pointerEvents={showUI ? 'auto' : 'none'}
      >
        <HStack justify="space-between">
          <HStack spacing={3}>
            <Tooltip label="Exit (Esc)">
              <IconButton
                aria-label="Exit"
                icon={<FiX />}
                bg="white"
                border="1px solid"
                borderColor="neutral.200"
                boxShadow="lg"
                color="accent.500"
                borderRadius="full"
                size="sm"
                _hover={{ bg: 'neutral.50' }}
                onClick={() => navigate('/properties')}
              />
            </Tooltip>
            <Box
              bg="white"
              border="1px solid"
              borderColor="neutral.200"
              boxShadow="lg"
              px={3}
              py={1}
              borderRadius="full"
            >
              <Text color="accent.500" fontSize="sm" fontWeight="medium">
                {breadcrumb}
              </Text>
            </Box>
          </HStack>

          <HStack spacing={2}>
            <Tooltip label="Info (i)">
              <IconButton
                aria-label="Info"
                icon={<FiInfo />}
                bg="white"
                border="1px solid"
                borderColor="neutral.200"
                boxShadow="lg"
                color="accent.500"
                borderRadius="full"
                size="sm"
                _hover={{ bg: 'neutral.50' }}
                onClick={() => setShowInfo(prev => !prev)}
              />
            </Tooltip>
            <Tooltip label="Search (/)">
              <IconButton
                aria-label="Search"
                icon={<FiSearch />}
                bg="white"
                border="1px solid"
                borderColor="neutral.200"
                boxShadow="lg"
                color="accent.500"
                borderRadius="full"
                size="sm"
                _hover={{ bg: 'neutral.50' }}
                onClick={onSearchOpen}
              />
            </Tooltip>
          </HStack>
        </HStack>
      </Box>

      {/* Navigation arrows - edges of screen */}
      {showUI && currentMedia.length > 1 && (
        <>
          <Center
            position="absolute"
            left={4}
            top="50%"
            transform="translateY(-50%)"
            h="60px"
            w="60px"
            borderRadius="full"
            bg="white"
            border="1px solid"
            borderColor="neutral.200"
            boxShadow="lg"
            cursor={hasPrevMedia ? 'pointer' : 'default'}
            opacity={hasPrevMedia ? 1 : 0.4}
            _hover={{ bg: hasPrevMedia ? 'neutral.50' : 'white' }}
            transition="all 0.2s"
            onClick={(e) => { e.stopPropagation(); navigateMedia('prev'); }}
          >
            <FiChevronLeft size={32} color="#0071e3" />
          </Center>

          <Center
            position="absolute"
            right={4}
            top="50%"
            transform="translateY(-50%)"
            h="60px"
            w="60px"
            borderRadius="full"
            bg="white"
            border="1px solid"
            borderColor="neutral.200"
            boxShadow="lg"
            cursor={hasNextMedia ? 'pointer' : 'default'}
            opacity={hasNextMedia ? 1 : 0.4}
            _hover={{ bg: hasNextMedia ? 'neutral.50' : 'white' }}
            transition="all 0.2s"
            onClick={(e) => { e.stopPropagation(); navigateMedia('next'); }}
          >
            <FiChevronRight size={32} color="#0071e3" />
          </Center>
        </>
      )}

      {/* Filmstrip - swipe up or press 'f' */}
      <Box
        position="absolute"
        bottom={0}
        left={0}
        right={0}
        bg="white"
        borderTop="1px solid"
        borderColor="neutral.200"
        boxShadow="lg"
        py={3}
        px={4}
        transform={showFilmstrip ? 'translateY(0)' : 'translateY(100%)'}
        transition="transform 0.3s ease-out"
      >
        <Flex
          gap={2}
          overflowX="auto"
          pb={2}
          sx={{
            '&::-webkit-scrollbar': { height: '4px' },
            '&::-webkit-scrollbar-thumb': { bg: 'neutral.300', borderRadius: 'full' },
          }}
        >
          {currentMedia.map((img, idx) => (
            <Box
              key={img.id}
              position="relative"
              flexShrink={0}
              w="100px"
              h="70px"
              borderRadius="md"
              overflow="hidden"
              border="2px solid"
              borderColor={idx === mediaIndex ? 'accent.500' : 'transparent'}
              opacity={idx === mediaIndex ? 1 : 0.6}
              cursor="pointer"
              transition="all 0.2s"
              _hover={{ opacity: 1, borderColor: 'accent.300' }}
              onClick={() => navigateToImage(idx)}
            >
              <Image
                src={img.url}
                alt=""
                w="100%"
                h="100%"
                objectFit="cover"
              />
              {img.starred && (
                <Box
                  position="absolute"
                  top={1}
                  left={1}
                  bg="white"
                  borderRadius="full"
                  p={0.5}
                  color="yellow.500"
                >
                  <FiStar size={10} fill="currentColor" />
                </Box>
              )}
            </Box>
          ))}
        </Flex>
      </Box>

      {/* Info panel overlay */}
      {showInfo && property && (
        <Box
          position="absolute"
          bottom={0}
          left={0}
          right={0}
          bg="blackAlpha.900"
          backdropFilter="blur(20px)"
          p={6}
          maxH="50vh"
          overflowY="auto"
        >
          <VStack align="start" spacing={4}>
            <HStack justify="space-between" w="100%">
              <Text color="white" fontSize="xl" fontWeight="bold">{property.name}</Text>
              <IconButton
                aria-label="Close"
                icon={<FiX />}
                variant="ghost"
                colorScheme="whiteAlpha"
                size="sm"
                onClick={() => setShowInfo(false)}
              />
            </HStack>

            <Text color="whiteAlpha.800" fontSize="lg">
              {property.currency} {property.price_min?.toLocaleString()}
              {property.price_max && property.price_max !== property.price_min && (
                <Text as="span" color="whiteAlpha.600"> - {property.price_max.toLocaleString()}</Text>
              )}
            </Text>

            <Text color="whiteAlpha.700" fontSize="sm">
              {property.city}, {property.country}
            </Text>

            {property.description && (
              <Text color="whiteAlpha.600" fontSize="sm" whiteSpace="pre-wrap">
                {property.description}
              </Text>
            )}

            <HStack spacing={4} pt={2}>
              <VStack align="start" spacing={0}>
                <Text color="whiteAlpha.500" fontSize="xs">Dwellings</Text>
                <Text color="white" fontSize="lg" fontWeight="bold">{dwellings.length}</Text>
              </VStack>
              <VStack align="start" spacing={0}>
                <Text color="whiteAlpha.500" fontSize="xs">Areas</Text>
                <Text color="white" fontSize="lg" fontWeight="bold">{areas.length}</Text>
              </VStack>
              <VStack align="start" spacing={0}>
                <Text color="whiteAlpha.500" fontSize="xs">Photos</Text>
                <Text color="white" fontSize="lg" fontWeight="bold">{allMedia.filter(m => m.type === 'image').length}</Text>
              </VStack>
            </HStack>

            <Button
              as={RouterLink}
              to={`/property/${slug}`}
              size="sm"
              colorScheme="whiteAlpha"
              variant="outline"
              mt={4}
            >
              View Full Details
            </Button>
          </VStack>
        </Box>
      )}

      {/* Quick Jump Search */}
      {isSearchOpen && (
        <Center
          position="absolute"
          inset={0}
          bg="blackAlpha.800"
          backdropFilter="blur(8px)"
          onClick={onSearchClose}
        >
          <Box
            bg="neutral.800"
            borderRadius="xl"
            w="100%"
            maxW="450px"
            mx={4}
            overflow="hidden"
            shadow="2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <Box p={4} borderBottomWidth="1px" borderColor="neutral.600">
              <InputGroup size="lg">
                <InputLeftElement pointerEvents="none">
                  <FiSearch color="gray" />
                </InputLeftElement>
                <Input
                  ref={searchInputRef}
                  placeholder="Jump to..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  bg="neutral.700"
                  border="none"
                  color="white"
                  _placeholder={{ color: 'neutral.500' }}
                  _focus={{ boxShadow: 'none', bg: 'neutral.700' }}
                />
              </InputGroup>
              <HStack mt={2} spacing={4} color="neutral.500" fontSize="xs">
                <HStack><Kbd>↑↓</Kbd><Text>navigate</Text></HStack>
                <HStack><Kbd>Enter</Kbd><Text>select</Text></HStack>
                <HStack><Kbd>Esc</Kbd><Text>close</Text></HStack>
              </HStack>
            </Box>

            <Box maxH="300px" overflowY="auto">
              {filteredEntities.map((entity, idx) => (
                <HStack
                  key={entity.id}
                  p={3}
                  cursor="pointer"
                  bg={idx === selectedSearchIndex ? 'accent.500' : 'transparent'}
                  _hover={{ bg: idx === selectedSearchIndex ? 'accent.500' : 'neutral.700' }}
                  onClick={() => goToEntity(entity)}
                  spacing={3}
                >
                  <Box color={idx === selectedSearchIndex ? 'white' : 'neutral.400'}>
                    {entity.type === 'property' && <FiHome />}
                    {entity.type === 'dwelling' && <FiLayers />}
                    {entity.type === 'room' && <FiGrid />}
                    {entity.type === 'area' && <FiMaximize />}
                  </Box>

                  <VStack align="start" spacing={0} flex={1}>
                    <Text color="white" fontSize="sm" fontWeight="medium">
                      {entity.name}
                    </Text>
                    <Text fontSize="xs" color={idx === selectedSearchIndex ? 'blue.200' : 'neutral.500'}>
                      {entity.type} • {entity.mediaCount} photos
                    </Text>
                  </VStack>
                </HStack>
              ))}

              {filteredEntities.length === 0 && (
                <Text color="neutral.500" textAlign="center" py={8} fontSize="sm">
                  No matches
                </Text>
              )}
            </Box>
          </Box>
        </Center>
      )}

    </Box>
  )
}
