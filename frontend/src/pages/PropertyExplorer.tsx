// SPDX-FileCopyrightText: 2026 Tim Sutton <tim@kartoza.com>
// SPDX-License-Identifier: EUPL-1.2

import { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
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
  Badge,
  Tooltip,
  Fade,
  useColorModeValue,
} from '@chakra-ui/react'
import { useQuery } from '@tanstack/react-query'
import {
  FiChevronLeft,
  FiChevronRight,
  FiChevronUp,
  FiSearch,
  FiHome,
  FiGrid,
  FiLayers,
  FiX,
  FiImage,
  FiStar,
} from 'react-icons/fi'
import { api } from '../api'
import { usePageTracking } from '../hooks/usePageTracking'

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
  const [showControls, setShowControls] = useState(true)
  const [rippleOrigin, setRippleOrigin] = useState({ x: 50, y: 50 })
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [nextImageUrl, setNextImageUrl] = useState<string | null>(null)

  // Quick jump panel
  const { isOpen: isSearchOpen, onOpen: onSearchOpen, onClose: onSearchClose } = useDisclosure()
  const [searchQuery, setSearchQuery] = useState('')
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Hide controls timer
  const controlsTimerRef = useRef<NodeJS.Timeout>()

  const controlsBg = useColorModeValue('blackAlpha.700', 'blackAlpha.800')

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

  const dwellings = dwellingsData?.data || []
  const areas = areasData?.data || []
  const allMedia = mediaData?.data || []

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
        // Starred images first
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

    // Add dwellings with their rooms
    dwellings.forEach(dwelling => {
      const dwellingNode: EntityNode = {
        id: dwelling.id,
        name: dwelling.name,
        type: 'dwelling',
        parentId: property.id,
        mediaCount: getMediaCount('dwelling', dwelling.id),
        children: [],
      }

      // Add rooms
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

    // Add areas
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

  const navigateMedia = useCallback((direction: 'next' | 'prev') => {
    if (direction === 'next' && hasNextMedia) {
      // Prepare transition
      setNextImageUrl(currentMedia[mediaIndex + 1]?.url || null)
      setRippleOrigin({ x: 80, y: 50 })
      setIsTransitioning(true)

      setTimeout(() => {
        setMediaIndex(i => i + 1)
        setIsTransitioning(false)
      }, 500)
    } else if (direction === 'prev' && hasPrevMedia) {
      setNextImageUrl(currentMedia[mediaIndex - 1]?.url || null)
      setRippleOrigin({ x: 20, y: 50 })
      setIsTransitioning(true)

      setTimeout(() => {
        setMediaIndex(i => i - 1)
        setIsTransitioning(false)
      }, 500)
    }
  }, [hasNextMedia, hasPrevMedia, currentMedia, mediaIndex])

  // Trigger ripple when entity changes
  const prevContextRef = useRef(context)
  useEffect(() => {
    if (prevContextRef.current !== context && currentMedia.length > 0) {
      setNextImageUrl(currentMedia[0]?.url || null)
      setRippleOrigin({ x: 50, y: 50 })
      setIsTransitioning(true)
      setTimeout(() => {
        setIsTransitioning(false)
      }, 500)
    }
    prevContextRef.current = context
  }, [context, currentMedia])

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

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isSearchOpen) {
        if (e.key === 'Escape') {
          onSearchClose()
        }
        return
      }

      switch (e.key) {
        case 'ArrowRight':
          navigateMedia('next')
          break
        case 'ArrowLeft':
          navigateMedia('prev')
          break
        case 'ArrowUp':
          if (e.shiftKey) {
            goUp()
          } else {
            navigateSibling('prev')
          }
          break
        case 'ArrowDown':
          if (e.shiftKey) {
            // Could navigate into rooms
          } else {
            navigateSibling('next')
          }
          break
        case '/':
        case 'k':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault()
            onSearchOpen()
          }
          break
        case 'Escape':
          navigate('/properties')
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isSearchOpen, onSearchClose, onSearchOpen, navigateMedia, navigateSibling, goUp, navigate])

  // Auto-hide controls
  useEffect(() => {
    const handleMouseMove = () => {
      setShowControls(true)
      if (controlsTimerRef.current) {
        clearTimeout(controlsTimerRef.current)
      }
      controlsTimerRef.current = setTimeout(() => {
        if (!isSearchOpen) {
          setShowControls(false)
        }
      }, 3000)
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      if (controlsTimerRef.current) {
        clearTimeout(controlsTimerRef.current)
      }
    }
  }, [isSearchOpen])

  // Focus search input when opened
  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [isSearchOpen])

  // Get context display name
  const contextName = useMemo(() => {
    switch (context.level) {
      case 'dwelling':
        return context.dwellingName
      case 'room':
        return `${context.dwellingName} > ${context.roomName}`
      case 'area':
        return context.areaName
      default:
        return property?.name
    }
  }, [context, property])

  // Check if can navigate siblings
  const canNavigateSibling = useMemo(() => {
    if (context.level === 'property') return { prev: false, next: false }

    if (context.level === 'dwelling') {
      const idx = dwellings.findIndex(d => d.id === context.dwellingId)
      return { prev: idx > 0, next: idx < dwellings.length - 1 }
    }

    if (context.level === 'room' && context.dwellingId) {
      const dwelling = dwellings.find(d => d.id === context.dwellingId)
      const rooms = dwelling?.rooms || []
      const idx = rooms.findIndex(r => r.id === context.roomId)
      return { prev: idx > 0, next: idx < rooms.length - 1 }
    }

    if (context.level === 'area') {
      const idx = areas.findIndex(a => a.id === context.areaId)
      return { prev: idx > 0, next: idx < areas.length - 1 }
    }

    return { prev: false, next: false }
  }, [context, dwellings, areas])

  if (propertyLoading) {
    return (
      <Center minH="100vh" bg="black">
        <Spinner size="xl" color="white" />
      </Center>
    )
  }

  if (!property) {
    return (
      <Center minH="100vh" bg="black" color="white">
        <Text>Property not found</Text>
      </Center>
    )
  }

  return (
    <Box position="fixed" top={0} left={0} right={0} bottom={0} bg="black" overflow="hidden">
      {/* Full-screen background image */}
      {currentImage ? (
        <>
          <Box
            as="img"
            src={currentImage.url}
            alt=""
            position="absolute"
            top={0}
            left={0}
            w="100%"
            h="100%"
            objectFit="contain"
            bg="black"
          />

          {/* Transition overlay */}
          {isTransitioning && nextImageUrl && (
            <Box
              position="absolute"
              top={0}
              left={0}
              w="100%"
              h="100%"
              overflow="hidden"
              sx={{
                clipPath: `circle(0% at ${rippleOrigin.x}% ${rippleOrigin.y}%)`,
                animation: 'rippleExpand 0.5s ease-out forwards',
                '@keyframes rippleExpand': {
                  '0%': { clipPath: `circle(0% at ${rippleOrigin.x}% ${rippleOrigin.y}%)` },
                  '100%': { clipPath: `circle(150% at ${rippleOrigin.x}% ${rippleOrigin.y}%)` },
                },
              }}
            >
              <Box
                as="img"
                src={nextImageUrl}
                alt=""
                position="absolute"
                top={0}
                left={0}
                w="100%"
                h="100%"
                objectFit="contain"
                bg="black"
              />
            </Box>
          )}
        </>
      ) : (
        <Center h="100%" color="whiteAlpha.600">
          <VStack spacing={4}>
            <FiImage size={64} />
            <Text>No images for this {context.level}</Text>
            <Text fontSize="sm">Navigate to another section or upload images</Text>
          </VStack>
        </Center>
      )}

      {/* Starred indicator */}
      {currentImage?.starred && (
        <Box position="absolute" top={4} right={4} color="yellow.400">
          <FiStar size={24} fill="currentColor" />
        </Box>
      )}

      {/* Navigation Controls - Bottom Panel */}
      <Fade in={showControls}>
        <Box
          position="absolute"
          bottom={0}
          left={0}
          right={0}
          bg={controlsBg}
          backdropFilter="blur(10px)"
          py={3}
          px={4}
        >
          <HStack justify="space-between" maxW="container.xl" mx="auto">
            {/* Left: Context breadcrumb */}
            <HStack spacing={2} flex={1}>
              <Tooltip label="Back to property list (Esc)">
                <IconButton
                  aria-label="Exit"
                  icon={<FiX />}
                  variant="ghost"
                  colorScheme="whiteAlpha"
                  size="sm"
                  onClick={() => navigate('/properties')}
                />
              </Tooltip>

              {context.level !== 'property' && (
                <Tooltip label="Go up (Shift+Up)">
                  <IconButton
                    aria-label="Go up"
                    icon={<FiChevronUp />}
                    variant="ghost"
                    colorScheme="whiteAlpha"
                    size="sm"
                    onClick={goUp}
                  />
                </Tooltip>
              )}

              <Text color="white" fontSize="sm" fontWeight="medium" noOfLines={1}>
                {contextName}
              </Text>

              <Badge
                colorScheme={context.level === 'property' ? 'blue' : context.level === 'area' ? 'green' : 'purple'}
                fontSize="xs"
              >
                {context.level}
              </Badge>
            </HStack>

            {/* Center: Media navigation */}
            <HStack spacing={1}>
              <Tooltip label="Previous image (Left arrow)">
                <IconButton
                  aria-label="Previous image"
                  icon={<FiChevronLeft />}
                  variant="ghost"
                  colorScheme="whiteAlpha"
                  size="sm"
                  isDisabled={!hasPrevMedia}
                  onClick={() => navigateMedia('prev')}
                />
              </Tooltip>

              <Text color="whiteAlpha.800" fontSize="sm" minW="60px" textAlign="center">
                {currentMedia.length > 0 ? `${mediaIndex + 1} / ${currentMedia.length}` : '0 / 0'}
              </Text>

              <Tooltip label="Next image (Right arrow)">
                <IconButton
                  aria-label="Next image"
                  icon={<FiChevronRight />}
                  variant="ghost"
                  colorScheme="whiteAlpha"
                  size="sm"
                  isDisabled={!hasNextMedia}
                  onClick={() => navigateMedia('next')}
                />
              </Tooltip>
            </HStack>

            {/* Right: Entity navigation + Search */}
            <HStack spacing={2} flex={1} justify="flex-end">
              {context.level !== 'property' && (
                <>
                  <Tooltip label={`Previous ${context.level} (Up arrow)`}>
                    <IconButton
                      aria-label={`Previous ${context.level}`}
                      icon={<FiChevronUp />}
                      variant="ghost"
                      colorScheme="whiteAlpha"
                      size="sm"
                      isDisabled={!canNavigateSibling.prev}
                      onClick={() => navigateSibling('prev')}
                    />
                  </Tooltip>

                  <Tooltip label={`Next ${context.level} (Down arrow)`}>
                    <IconButton
                      aria-label={`Next ${context.level}`}
                      icon={<FiChevronUp style={{ transform: 'rotate(180deg)' }} />}
                      variant="ghost"
                      colorScheme="whiteAlpha"
                      size="sm"
                      isDisabled={!canNavigateSibling.next}
                      onClick={() => navigateSibling('next')}
                    />
                  </Tooltip>
                </>
              )}

              <Tooltip label="Quick jump (Ctrl+K)">
                <IconButton
                  aria-label="Quick jump"
                  icon={<FiSearch />}
                  variant="ghost"
                  colorScheme="whiteAlpha"
                  size="sm"
                  onClick={onSearchOpen}
                />
              </Tooltip>
            </HStack>
          </HStack>
        </Box>
      </Fade>

      {/* Quick Jump Search Panel */}
      {isSearchOpen && (
        <Box
          position="absolute"
          top={0}
          left={0}
          right={0}
          bottom={0}
          bg="blackAlpha.800"
          backdropFilter="blur(8px)"
          onClick={onSearchClose}
        >
          <Center h="100%" onClick={(e) => e.stopPropagation()}>
            <Box
              bg="gray.800"
              borderRadius="xl"
              w="100%"
              maxW="500px"
              maxH="70vh"
              overflow="hidden"
              shadow="2xl"
            >
              {/* Search Input */}
              <Box p={4} borderBottomWidth="1px" borderColor="gray.700">
                <InputGroup size="lg">
                  <InputLeftElement pointerEvents="none">
                    <FiSearch color="gray" />
                  </InputLeftElement>
                  <Input
                    ref={searchInputRef}
                    placeholder="Jump to..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    bg="gray.900"
                    border="none"
                    color="white"
                    _placeholder={{ color: 'gray.500' }}
                    _focus={{ boxShadow: 'none' }}
                  />
                </InputGroup>
                <HStack mt={2} spacing={2}>
                  <Kbd>Enter</Kbd>
                  <Text fontSize="xs" color="gray.500">to select</Text>
                  <Kbd>Esc</Kbd>
                  <Text fontSize="xs" color="gray.500">to close</Text>
                </HStack>
              </Box>

              {/* Results */}
              <Box maxH="50vh" overflowY="auto" p={2}>
                {filteredEntities.map((entity, idx) => (
                  <HStack
                    key={entity.id}
                    p={3}
                    borderRadius="md"
                    cursor="pointer"
                    bg={idx === 0 ? 'blue.600' : 'transparent'}
                    _hover={{ bg: idx === 0 ? 'blue.500' : 'gray.700' }}
                    onClick={() => goToEntity(entity)}
                    spacing={3}
                  >
                    {entity.type === 'property' && <FiHome />}
                    {entity.type === 'dwelling' && <FiLayers />}
                    {entity.type === 'room' && <FiGrid />}
                    {entity.type === 'area' && <FiGrid color="green" />}

                    <VStack align="start" spacing={0} flex={1}>
                      <Text color="white" fontWeight="medium">
                        {entity.name}
                      </Text>
                      <Text fontSize="xs" color="gray.400" textTransform="capitalize">
                        {entity.type}
                      </Text>
                    </VStack>

                    <Badge colorScheme="blue" fontSize="xs">
                      {entity.mediaCount} images
                    </Badge>
                  </HStack>
                ))}

                {filteredEntities.length === 0 && (
                  <Text color="gray.500" textAlign="center" py={8}>
                    No matches found
                  </Text>
                )}
              </Box>
            </Box>
          </Center>
        </Box>
      )}
    </Box>
  )
}
