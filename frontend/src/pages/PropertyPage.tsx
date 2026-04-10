// SPDX-FileCopyrightText: 2026 Tim Sutton <tim@kartoza.com>
// SPDX-License-Identifier: EUPL-1.2

import { useState, useMemo, useEffect, useCallback } from 'react'
import { useParams, Link as RouterLink } from 'react-router-dom'
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  Spinner,
  Center,
  Grid,
  GridItem,
  Badge,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Card,
  CardBody,
  Icon,
  Divider,
  Button,
  useColorModeValue,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  Image,
  SimpleGrid,
  AspectRatio,
} from '@chakra-ui/react'
import { useQuery } from '@tanstack/react-query'
import {
  FiHome,
  FiMapPin,
  FiGrid,
  FiChevronRight,
  FiCalendar,
  FiSquare,
  FiX,
  FiStar,
} from 'react-icons/fi'
import { api, type Dwelling, type Area, type Media } from '../api'
import PropertyMap from '../components/map/PropertyMap'
import { AmbientAudioPlayer } from '../components/media'
import { usePageTracking } from '../hooks/usePageTracking'
import { SEOHead } from '../components/common/SEOHead'
import QuoteOverlay from '../components/property/QuoteOverlay'

export default function PropertyPage() {
  const { slug } = useParams<{ slug: string }>()
  const [selectedEntity, setSelectedEntity] = useState<{
    type: 'property' | 'dwelling' | 'area'
    id: string
    name: string
  } | null>(null)
  const [slideshowIndex, setSlideshowIndex] = useState(0)
  const [manualBackground, setManualBackground] = useState<string | null>(null)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [transitioningToImage, setTransitioningToImage] = useState<string | null>(null)
  const [rippleOrigin, setRippleOrigin] = useState({ x: 50, y: 50 })

  const cardBg = useColorModeValue('whiteAlpha.900', 'blackAlpha.800')
  const cardBorder = useColorModeValue('whiteAlpha.300', 'whiteAlpha.200')

  const { data: property, isLoading, error } = useQuery({
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

  // Track property views for analytics
  usePageTracking({ propertyId: property?.id })

  // Filter media by type
  const propertyImages = useMemo(
    () => allMedia.filter((m) => m.entity_type === 'property' && m.type === 'image'),
    [allMedia]
  )
  // Only include starred audio as ambient soundscapes
  const audioTracks = useMemo(
    () => allMedia.filter((m) => m.type === 'audio' && m.starred),
    [allMedia]
  )

  // Get media for a specific entity
  const getEntityMedia = (entityType: string, entityId: string) => {
    return allMedia.filter((m) => m.entity_type === entityType && m.entity_id === entityId)
  }

  // Get starred images for slideshow based on current context
  const starredImages = useMemo(() => {
    let images: Media[] = []
    if (selectedEntity) {
      const entityMedia = getEntityMedia(selectedEntity.type, selectedEntity.id)
      images = entityMedia.filter((m) => m.type === 'image' && m.starred)
      // If no starred images in entity, use all entity images
      if (images.length === 0) {
        images = entityMedia.filter((m) => m.type === 'image')
      }
    } else {
      // For property, use starred property images
      images = propertyImages.filter((m) => m.starred)
      // If no starred images, use all property images
      if (images.length === 0) {
        images = propertyImages
      }
    }
    return images
  }, [selectedEntity, propertyImages, allMedia])

  // Get current and next background images for transition
  const currentBackgroundImage = useMemo(() => {
    if (manualBackground) {
      return manualBackground
    }
    if (starredImages.length === 0) {
      return null
    }
    return starredImages[slideshowIndex % starredImages.length]?.url || null
  }, [manualBackground, starredImages, slideshowIndex])


  // Slideshow timer - change every 8 seconds when multiple starred images
  useEffect(() => {
    if (manualBackground || starredImages.length <= 1) {
      return
    }

    const timer = setInterval(() => {
      const nextIndex = (slideshowIndex + 1) % starredImages.length
      const nextImage = starredImages[nextIndex]?.url
      if (nextImage) {
        setTransitioningToImage(nextImage)
        setIsTransitioning(true)
        // Random ripple origin for organic feel
        setRippleOrigin({
          x: 20 + Math.random() * 60,
          y: 20 + Math.random() * 60,
        })

        // After transition animation (4s), change to next image
        setTimeout(() => {
          setSlideshowIndex(nextIndex)
          setIsTransitioning(false)
          setTransitioningToImage(null)
        }, 4000)
      }
    }, 8000)

    return () => clearInterval(timer)
  }, [manualBackground, starredImages, slideshowIndex])

  // Reset slideshow when entity changes
  useEffect(() => {
    setSlideshowIndex(0)
    setManualBackground(null)
    setIsTransitioning(false)
  }, [selectedEntity])

  // Handle clicking an image to set it as background
  const handleImageClick = useCallback((imageUrl: string, event: React.MouseEvent) => {
    // Don't transition to the same image
    if (imageUrl === currentBackgroundImage) return

    const rect = event.currentTarget.getBoundingClientRect()
    const x = ((event.clientX - rect.left) / rect.width) * 100
    const y = ((event.clientY - rect.top) / rect.height) * 100

    setTransitioningToImage(imageUrl)
    setRippleOrigin({ x, y })
    setIsTransitioning(true)

    setTimeout(() => {
      setManualBackground(imageUrl)
      setIsTransitioning(false)
      setTransitioningToImage(null)
    }, 4000)
  }, [currentBackgroundImage])

  // Create map markers from dwellings and areas
  const mapMarkers = useMemo(() => {
    const markers: Array<{
      id: string
      lat: number
      lng: number
      label: string
      type: 'dwelling' | 'area' | 'property'
      onClick?: () => void
    }> = []

    dwellings.forEach((d) => {
      markers.push({
        id: d.id,
        lat: (property?.latitude || 0) + (Math.random() - 0.5) * 0.001,
        lng: (property?.longitude || 0) + (Math.random() - 0.5) * 0.001,
        label: d.name,
        type: 'dwelling',
        onClick: () => setSelectedEntity({ type: 'dwelling', id: d.id, name: d.name }),
      })
    })

    areas.forEach((a) => {
      markers.push({
        id: a.id,
        lat: (property?.latitude || 0) + (Math.random() - 0.5) * 0.002,
        lng: (property?.longitude || 0) + (Math.random() - 0.5) * 0.002,
        label: a.name,
        type: 'area',
        onClick: () => setSelectedEntity({ type: 'area', id: a.id, name: a.name }),
      })
    })

    return markers
  }, [dwellings, areas, property])

  if (isLoading) {
    return (
      <Center minH="100vh" bg="gray.900">
        <Spinner size="xl" color="luxury.gold" />
      </Center>
    )
  }

  if (error || !property) {
    return (
      <Container maxW="container.xl" py={16}>
        <VStack spacing={4} textAlign="center">
          <Heading>Property Not Found</Heading>
          <Text color="gray.600">
            The property you're looking for doesn't exist or has been removed.
          </Text>
          <Button as={RouterLink} to="/properties" colorScheme="brand">
            Browse Properties
          </Button>
        </VStack>
      </Container>
    )
  }

  // Build SEO metadata
  const seoDescription = property.description
    ? property.description.slice(0, 157) + (property.description.length > 157 ? '...' : '')
    : `Beautiful property in ${property.city}, ${property.country}. View details, photos, and schedule a tour.`

  const structuredData = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'RealEstateListing',
    name: property.name,
    description: seoDescription,
    url: window.location.href,
    address: {
      '@type': 'PostalAddress',
      streetAddress: property.address_line1,
      addressLocality: property.city,
      addressRegion: property.state,
      postalCode: property.postal_code,
      addressCountry: property.country,
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: property.latitude,
      longitude: property.longitude,
    },
    offers: {
      '@type': 'Offer',
      priceCurrency: property.currency || 'EUR',
      price: property.price_min,
    },
  })

  return (
    <Box minH="100vh" position="relative" overflow="auto">
      <SEOHead
        title={`${property.name}${property.city ? ` in ${property.city}` : ''}`}
        description={seoDescription}
        url={window.location.href}
        type="website"
        structuredData={structuredData}
      />

      {/* Ambient Audio Player */}
      {audioTracks.length > 0 && (
        <AmbientAudioPlayer audioTracks={audioTracks} autoplay />
      )}

      {/* Fixed Full-Page Background Image with Ken Burns Effect */}
      <Box
        position="fixed"
        top={0}
        left={0}
        right={0}
        bottom={0}
        zIndex={0}
        bg="gray.900"
        overflow="hidden"
      >
        {currentBackgroundImage ? (
          <>
            {/* Current background image with Ken Burns effect */}
            <Box
              key={currentBackgroundImage}
              as="img"
              src={currentBackgroundImage}
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
                animation: 'kenburns 25s ease-in-out infinite alternate',
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

            {/* Ripple transition to new image */}
            {transitioningToImage && isTransitioning && (
              <Box
                position="absolute"
                top={0}
                left={0}
                w="100%"
                h="100%"
                overflow="hidden"
                sx={{
                  clipPath: `circle(0% at ${rippleOrigin.x}% ${rippleOrigin.y}%)`,
                  animation: 'rippleExpand 4s cubic-bezier(0.25, 0.1, 0.25, 1) forwards',
                  '@keyframes rippleExpand': {
                    '0%': {
                      clipPath: `circle(0% at ${rippleOrigin.x}% ${rippleOrigin.y}%)`,
                    },
                    '100%': {
                      clipPath: `circle(150% at ${rippleOrigin.x}% ${rippleOrigin.y}%)`,
                    },
                  },
                }}
              >
                <Box
                  as="img"
                  src={transitioningToImage}
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

            {/* Dark overlay for readability */}
            <Box
              position="absolute"
              top={0}
              left={0}
              right={0}
              bottom={0}
              bg="blackAlpha.500"
            />

            {/* Quote overlay */}
            {quotes.length > 0 && (
              <QuoteOverlay quotes={quotes} interval={15000} />
            )}
          </>
        ) : (
          <Box
            position="absolute"
            top={0}
            left={0}
            right={0}
            bottom={0}
            bgGradient="linear(to-br, gray.800, gray.900)"
          />
        )}
      </Box>

      {/* Scrollable Content */}
      <Box position="relative" zIndex={10} minH="100vh">
        {/* Header with breadcrumb and title */}
        <Box
          py={6}
          px={4}
          bgGradient="linear(to-b, blackAlpha.700, transparent)"
        >
          <Container maxW="container.xl">
            <Breadcrumb
              separator={<FiChevronRight color="white" />}
              color="whiteAlpha.800"
              fontSize="sm"
              mb={4}
            >
              <BreadcrumbItem>
                <BreadcrumbLink as={RouterLink} to="/" color="whiteAlpha.800" _hover={{ color: 'white' }}>
                  Home
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbItem>
                <BreadcrumbLink as={RouterLink} to="/properties" color="whiteAlpha.800" _hover={{ color: 'white' }}>
                  Properties
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbItem isCurrentPage>
                <BreadcrumbLink color="white">{property.name}</BreadcrumbLink>
              </BreadcrumbItem>
            </Breadcrumb>

            <HStack justify="space-between" align="start" flexWrap="wrap" gap={4}>
              <Box>
                <Heading size="2xl" color="white" textShadow="0 2px 10px rgba(0,0,0,0.5)">
                  {selectedEntity ? selectedEntity.name : property.name}
                </Heading>
                <HStack spacing={4} mt={2} flexWrap="wrap">
                  <HStack color="whiteAlpha.900">
                    <Icon as={FiMapPin} />
                    <Text>{property.city}, {property.country}</Text>
                  </HStack>
                  {property.status === 'published' && (
                    <Badge colorScheme="green" fontSize="sm">Available</Badge>
                  )}
                  {selectedEntity && (
                    <Badge colorScheme="blue" fontSize="sm">
                      Viewing: {selectedEntity.type}
                    </Badge>
                  )}
                </HStack>
              </Box>

              <HStack>
                {selectedEntity && (
                  <Button
                    leftIcon={<FiX />}
                    variant="outline"
                    colorScheme="whiteAlpha"
                    size="sm"
                    onClick={() => setSelectedEntity(null)}
                  >
                    Back to Property
                  </Button>
                )}
                <Button
                  as={RouterLink}
                  to={`/explore/${slug}`}
                  variant="solid"
                  colorScheme="brand"
                  size="sm"
                >
                  Explore Full Screen
                </Button>
              </HStack>
            </HStack>
          </Container>
        </Box>

        {/* Main Content */}
        <Container maxW="container.xl" py={8}>
          <Grid templateColumns={{ base: '1fr', lg: '2fr 1fr' }} gap={8}>
            {/* Left Column - Details */}
            <GridItem>
              <VStack spacing={6} align="stretch">
                {/* Price Card */}
                <Card bg={cardBg} backdropFilter="blur(10px)" borderWidth="1px" borderColor={cardBorder} shadow="xl">
                  <CardBody>
                    <Text fontSize="3xl" fontWeight="bold" color="luxury.gold">
                      {property.currency} {property.price_min?.toLocaleString()}
                      {property.price_max && property.price_max !== property.price_min && (
                        <Text as="span" fontSize="xl" color="gray.500">
                          {' '}- {property.price_max.toLocaleString()}
                        </Text>
                      )}
                    </Text>
                  </CardBody>
                </Card>

                {/* Description */}
                <Card bg={cardBg} backdropFilter="blur(10px)" borderWidth="1px" borderColor={cardBorder} shadow="xl">
                  <CardBody>
                    <Heading size="md" mb={4}>About This Property</Heading>
                    <Text fontSize="lg" whiteSpace="pre-wrap">
                      {property.description || 'No description available.'}
                    </Text>
                  </CardBody>
                </Card>

                {/* Tabs for Dwellings, Areas, Location */}
                <Card bg={cardBg} backdropFilter="blur(10px)" borderWidth="1px" borderColor={cardBorder} shadow="xl" overflow="hidden">
                  <Tabs colorScheme="brand" isLazy>
                    <TabList px={4} pt={4}>
                      <Tab>
                        <HStack>
                          <Icon as={FiHome} />
                          <Text>Dwellings ({dwellings.length})</Text>
                        </HStack>
                      </Tab>
                      <Tab>
                        <HStack>
                          <Icon as={FiGrid} />
                          <Text>Areas ({areas.length})</Text>
                        </HStack>
                      </Tab>
                      <Tab>
                        <HStack>
                          <Icon as={FiMapPin} />
                          <Text>Location</Text>
                        </HStack>
                      </Tab>
                    </TabList>

                    <TabPanels>
                      {/* Dwellings Tab */}
                      <TabPanel>
                        {dwellings.length === 0 ? (
                          <Text color="gray.500">No dwellings listed yet.</Text>
                        ) : (
                          <VStack spacing={4} align="stretch">
                            {dwellings.map((dwelling) => (
                              <DwellingCard
                                key={dwelling.id}
                                dwelling={dwelling}
                                isSelected={selectedEntity?.id === dwelling.id}
                                onClick={() => setSelectedEntity(
                                  selectedEntity?.id === dwelling.id ? null : { type: 'dwelling', id: dwelling.id, name: dwelling.name }
                                )}
                                media={getEntityMedia('dwelling', dwelling.id)}
                                onImageClick={handleImageClick}
                              />
                            ))}
                          </VStack>
                        )}
                      </TabPanel>

                      {/* Areas Tab */}
                      <TabPanel>
                        {areas.length === 0 ? (
                          <Text color="gray.500">No areas listed yet.</Text>
                        ) : (
                          <VStack spacing={4} align="stretch">
                            {areas.map((area) => (
                              <AreaCard
                                key={area.id}
                                area={area}
                                isSelected={selectedEntity?.id === area.id}
                                onClick={() => setSelectedEntity(
                                  selectedEntity?.id === area.id ? null : { type: 'area', id: area.id, name: area.name }
                                )}
                                media={getEntityMedia('area', area.id)}
                                onImageClick={handleImageClick}
                              />
                            ))}
                          </VStack>
                        )}
                      </TabPanel>

                      {/* Location Tab */}
                      <TabPanel>
                        <VStack spacing={4} align="stretch">
                          <Box>
                            <Text fontWeight="bold">{property.address_line1}</Text>
                            {property.address_line2 && <Text>{property.address_line2}</Text>}
                            <Text>
                              {property.city}, {property.state} {property.postal_code}
                            </Text>
                            <Text>{property.country}</Text>
                          </Box>
                          <Divider />
                          <Text fontSize="sm" color="gray.500">
                            Coordinates: {property.latitude?.toFixed(6)}, {property.longitude?.toFixed(6)}
                          </Text>
                        </VStack>
                      </TabPanel>
                    </TabPanels>
                  </Tabs>
                </Card>

                {/* Image Gallery Thumbnails */}
                {propertyImages.length > 0 && (
                  <Card bg={cardBg} backdropFilter="blur(10px)" borderWidth="1px" borderColor={cardBorder} shadow="xl">
                    <CardBody>
                      <HStack justify="space-between" mb={4}>
                        <Heading size="md">Gallery ({propertyImages.length} photos)</Heading>
                        {starredImages.length > 1 && !manualBackground && (
                          <Badge colorScheme="yellow" fontSize="xs">
                            Slideshow: {slideshowIndex + 1}/{starredImages.length}
                          </Badge>
                        )}
                      </HStack>
                      <SimpleGrid columns={{ base: 3, md: 4, lg: 5 }} spacing={2}>
                        {propertyImages.map((img, idx) => (
                          <AspectRatio key={img.id || idx} ratio={1}>
                            <Box position="relative" w="100%" h="100%">
                              <Image
                                src={img.url}
                                alt={img.file_name || `Photo ${idx + 1}`}
                                objectFit="cover"
                                borderRadius="md"
                                cursor="pointer"
                                opacity={currentBackgroundImage === img.url ? 1 : 0.7}
                                border={currentBackgroundImage === img.url ? '3px solid' : 'none'}
                                borderColor="luxury.gold"
                                _hover={{ opacity: 1, transform: 'scale(1.05)' }}
                                transition="all 0.2s"
                                onClick={(e) => handleImageClick(img.url, e)}
                                w="100%"
                                h="100%"
                              />
                              {/* Star indicator */}
                              {img.starred && (
                                <Box
                                  position="absolute"
                                  top={1}
                                  left={1}
                                  bg="yellow.400"
                                  borderRadius="full"
                                  p={0.5}
                                  pointerEvents="none"
                                >
                                  <Icon as={FiStar} boxSize={3} color="white" fill="white" />
                                </Box>
                              )}
                            </Box>
                          </AspectRatio>
                        ))}
                      </SimpleGrid>
                      {manualBackground && (
                        <Button
                          size="sm"
                          variant="ghost"
                          mt={3}
                          onClick={() => setManualBackground(null)}
                        >
                          Resume slideshow
                        </Button>
                      )}
                    </CardBody>
                  </Card>
                )}
              </VStack>
            </GridItem>

            {/* Right Column - Map */}
            <GridItem>
              <Box position="sticky" top={4}>
                <Card bg={cardBg} backdropFilter="blur(10px)" borderWidth="1px" borderColor={cardBorder} shadow="xl" overflow="hidden">
                  <CardBody p={0}>
                    <PropertyMap
                      latitude={property.latitude}
                      longitude={property.longitude}
                      zoom={16}
                      markers={mapMarkers}
                      height="400px"
                      onMarkerClick={(markerId) => {
                        const dwelling = dwellings.find((d) => d.id === markerId)
                        const area = areas.find((a) => a.id === markerId)
                        if (dwelling) {
                          setSelectedEntity({ type: 'dwelling', id: dwelling.id, name: dwelling.name })
                        } else if (area) {
                          setSelectedEntity({ type: 'area', id: area.id, name: area.name })
                        }
                      }}
                    />
                  </CardBody>
                </Card>

                {/* Map Legend */}
                <Card bg={cardBg} backdropFilter="blur(10px)" borderWidth="1px" borderColor={cardBorder} shadow="xl" mt={4}>
                  <CardBody>
                    <Text fontWeight="bold" mb={2}>Map Legend</Text>
                    <VStack align="start" spacing={2}>
                      <HStack>
                        <Box w={4} h={4} borderRadius="full" bg="#c9a227" />
                        <Text fontSize="sm">Property Center</Text>
                      </HStack>
                      <HStack>
                        <Box w={4} h={4} borderRadius="full" bg="#2d3748" />
                        <Text fontSize="sm">Dwelling</Text>
                      </HStack>
                      <HStack>
                        <Box w={4} h={4} borderRadius="full" bg="#38a169" />
                        <Text fontSize="sm">Outdoor Area</Text>
                      </HStack>
                    </VStack>
                  </CardBody>
                </Card>
              </Box>
            </GridItem>
          </Grid>
        </Container>

        {/* Footer */}
        <Box py={8} textAlign="center">
          <Text
            color="white"
            fontSize="sm"
            bg="blackAlpha.600"
            px={4}
            py={2}
            borderRadius="full"
            display="inline-block"
          >
            Made with 💗 by{' '}
            <a href="https://kartoza.com" target="_blank" rel="noopener noreferrer" style={{ color: '#c9a227' }}>
              Kartoza
            </a>
            {' | '}
            <a href="https://github.com/sponsors/timlinux" target="_blank" rel="noopener noreferrer" style={{ color: '#c9a227' }}>
              Donate!
            </a>
            {' | '}
            <a href="https://github.com/timlinux/PropertyForSale" target="_blank" rel="noopener noreferrer" style={{ color: '#c9a227' }}>
              GitHub
            </a>
          </Text>
        </Box>
      </Box>
    </Box>
  )
}

interface DwellingCardProps {
  dwelling: Dwelling
  isSelected: boolean
  onClick: () => void
  media: Media[]
  onImageClick?: (url: string, event: React.MouseEvent) => void
}

function DwellingCard({ dwelling, isSelected, onClick, media, onImageClick }: DwellingCardProps) {
  const borderColor = useColorModeValue('gray.200', 'gray.600')
  const selectedBorder = useColorModeValue('luxury.gold', 'yellow.400')
  const images = media.filter((m) => m.type === 'image')
  const starredCount = images.filter((m) => m.starred).length

  return (
    <Box
      p={4}
      borderRadius="md"
      border="2px solid"
      borderColor={isSelected ? selectedBorder : borderColor}
      cursor="pointer"
      transition="all 0.2s"
      bg={isSelected ? 'blackAlpha.200' : 'transparent'}
      _hover={{ borderColor: selectedBorder, shadow: 'md' }}
      onClick={onClick}
    >
      <HStack justify="space-between" mb={2}>
        <Heading size="sm">{dwelling.name}</Heading>
        <HStack>
          {starredCount > 0 && (
            <Badge colorScheme="yellow">
              <HStack spacing={1}>
                <Icon as={FiStar} boxSize={3} />
                <Text>{starredCount}</Text>
              </HStack>
            </Badge>
          )}
          {images.length > 0 && (
            <Badge colorScheme="green">{images.length} photos</Badge>
          )}
          <Badge colorScheme="blue">{dwelling.type}</Badge>
        </HStack>
      </HStack>

      <HStack spacing={4} fontSize="sm" color="gray.600">
        {dwelling.floor_count && (
          <HStack>
            <Icon as={FiHome} />
            <Text>{dwelling.floor_count} floors</Text>
          </HStack>
        )}
        {dwelling.year_built && (
          <HStack>
            <Icon as={FiCalendar} />
            <Text>Built {dwelling.year_built}</Text>
          </HStack>
        )}
        {dwelling.size_sqm && (
          <HStack>
            <Icon as={FiSquare} />
            <Text>{dwelling.size_sqm} m²</Text>
          </HStack>
        )}
      </HStack>

      {dwelling.description && (
        <Text mt={2} fontSize="sm" color="gray.500" noOfLines={isSelected ? undefined : 2}>
          {dwelling.description}
        </Text>
      )}

      {/* Show media gallery when selected */}
      {isSelected && images.length > 0 && (
        <Box mt={4} onClick={(e) => e.stopPropagation()}>
          <Divider mb={3} />
          <SimpleGrid columns={{ base: 2, md: 3 }} spacing={2}>
            {images.map((img) => (
              <AspectRatio key={img.id || img.url} ratio={4 / 3}>
                <Box position="relative" w="100%" h="100%">
                  <Image
                    src={img.url}
                    alt={img.file_name || 'Dwelling photo'}
                    objectFit="cover"
                    borderRadius="md"
                    cursor="pointer"
                    _hover={{ transform: 'scale(1.05)' }}
                    transition="all 0.2s"
                    onClick={(e) => onImageClick?.(img.url, e)}
                    w="100%"
                    h="100%"
                  />
                  {img.starred && (
                    <Box
                      position="absolute"
                      top={1}
                      left={1}
                      bg="yellow.400"
                      borderRadius="full"
                      p={0.5}
                      pointerEvents="none"
                    >
                      <Icon as={FiStar} boxSize={3} color="white" fill="white" />
                    </Box>
                  )}
                </Box>
              </AspectRatio>
            ))}
          </SimpleGrid>
        </Box>
      )}
    </Box>
  )
}

interface AreaCardProps {
  area: Area
  isSelected: boolean
  onClick: () => void
  media: Media[]
  onImageClick?: (url: string, event: React.MouseEvent) => void
}

function AreaCard({ area, isSelected, onClick, media, onImageClick }: AreaCardProps) {
  const borderColor = useColorModeValue('gray.200', 'gray.600')
  const selectedBorder = useColorModeValue('green.400', 'green.300')
  const images = media.filter((m) => m.type === 'image')
  const starredCount = images.filter((m) => m.starred).length

  return (
    <Box
      p={4}
      borderRadius="md"
      border="2px solid"
      borderColor={isSelected ? selectedBorder : borderColor}
      cursor="pointer"
      transition="all 0.2s"
      bg={isSelected ? 'blackAlpha.200' : 'transparent'}
      _hover={{ borderColor: selectedBorder, shadow: 'md' }}
      onClick={onClick}
    >
      <HStack justify="space-between" mb={2}>
        <Heading size="sm">{area.name}</Heading>
        <HStack>
          {starredCount > 0 && (
            <Badge colorScheme="yellow">
              <HStack spacing={1}>
                <Icon as={FiStar} boxSize={3} />
                <Text>{starredCount}</Text>
              </HStack>
            </Badge>
          )}
          {images.length > 0 && (
            <Badge colorScheme="blue">{images.length} photos</Badge>
          )}
          <Badge colorScheme="green">{area.type}</Badge>
        </HStack>
      </HStack>

      <HStack spacing={4} fontSize="sm" color="gray.600">
        {area.size_sqm && (
          <HStack>
            <Icon as={FiSquare} />
            <Text>{area.size_sqm} m²</Text>
          </HStack>
        )}
      </HStack>

      {area.description && (
        <Text mt={2} fontSize="sm" color="gray.500" noOfLines={isSelected ? undefined : 2}>
          {area.description}
        </Text>
      )}

      {/* Show media gallery when selected */}
      {isSelected && images.length > 0 && (
        <Box mt={4} onClick={(e) => e.stopPropagation()}>
          <Divider mb={3} />
          <SimpleGrid columns={{ base: 2, md: 3 }} spacing={2}>
            {images.map((img) => (
              <AspectRatio key={img.id || img.url} ratio={4 / 3}>
                <Box position="relative" w="100%" h="100%">
                  <Image
                    src={img.url}
                    alt={img.file_name || 'Area photo'}
                    objectFit="cover"
                    borderRadius="md"
                    cursor="pointer"
                    _hover={{ transform: 'scale(1.05)' }}
                    transition="all 0.2s"
                    onClick={(e) => onImageClick?.(img.url, e)}
                    w="100%"
                    h="100%"
                  />
                  {img.starred && (
                    <Box
                      position="absolute"
                      top={1}
                      left={1}
                      bg="yellow.400"
                      borderRadius="full"
                      p={0.5}
                      pointerEvents="none"
                    >
                      <Icon as={FiStar} boxSize={3} color="white" fill="white" />
                    </Box>
                  )}
                </Box>
              </AspectRatio>
            ))}
          </SimpleGrid>
        </Box>
      )}
    </Box>
  )
}
