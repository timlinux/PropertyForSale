// SPDX-FileCopyrightText: 2026 Tim Sutton <tim@kartoza.com>
// SPDX-License-Identifier: EUPL-1.2

import { useState, useMemo } from 'react'
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
} from '@chakra-ui/react'
import { useQuery } from '@tanstack/react-query'
import {
  FiHome,
  FiMapPin,
  FiGrid,
  FiChevronRight,
  FiCalendar,
  FiSquare,
} from 'react-icons/fi'
import { api, type Dwelling, type Area } from '../api'
import PropertyMap from '../components/map/PropertyMap'
import { MediaGallery, AmbientAudioPlayer } from '../components/media'
import { usePageTracking } from '../hooks/usePageTracking'

export default function PropertyPage() {
  const { slug } = useParams<{ slug: string }>()
  const [selectedEntity, setSelectedEntity] = useState<{
    type: 'property' | 'dwelling' | 'area'
    id: string
  } | null>(null)

  const bgColor = useColorModeValue('gray.50', 'gray.900')
  const cardBg = useColorModeValue('white', 'gray.800')

  const { data: property, isLoading, error } = useQuery({
    queryKey: ['property', slug],
    queryFn: () => api.getPropertyBySlug(slug!),
    enabled: !!slug,
  })

  const { data: dwellingsData } = useQuery({
    queryKey: ['property-dwellings', property?.id],
    queryFn: () => api.getPropertyDwellings(property!.id),
    enabled: !!property?.id,
  })

  const { data: areasData } = useQuery({
    queryKey: ['property-areas', property?.id],
    queryFn: () => api.getPropertyAreas(property!.id),
    enabled: !!property?.id,
  })

  const { data: mediaData } = useQuery({
    queryKey: ['property-media', property?.id],
    queryFn: () => api.getPropertyMedia(property!.id),
    enabled: !!property?.id,
  })

  const dwellings = dwellingsData?.data || []
  const areas = areasData?.data || []
  const allMedia = mediaData?.data || []

  // Track property views for analytics
  usePageTracking({ propertyId: property?.id })

  // Filter media by type
  const propertyMedia = useMemo(
    () => allMedia.filter((m) => m.entity_type === 'property'),
    [allMedia]
  )
  const audioTracks = useMemo(
    () => allMedia.filter((m) => m.type === 'audio'),
    [allMedia]
  )

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
      // In a real app, dwellings would have their own coordinates
      // For now, offset slightly from property center
      markers.push({
        id: d.id,
        lat: (property?.latitude || 0) + (Math.random() - 0.5) * 0.001,
        lng: (property?.longitude || 0) + (Math.random() - 0.5) * 0.001,
        label: d.name,
        type: 'dwelling',
        onClick: () => setSelectedEntity({ type: 'dwelling', id: d.id }),
      })
    })

    areas.forEach((a) => {
      markers.push({
        id: a.id,
        lat: (property?.latitude || 0) + (Math.random() - 0.5) * 0.002,
        lng: (property?.longitude || 0) + (Math.random() - 0.5) * 0.002,
        label: a.name,
        type: 'area',
        onClick: () => setSelectedEntity({ type: 'area', id: a.id }),
      })
    })

    return markers
  }, [dwellings, areas, property])

  if (isLoading) {
    return (
      <Center minH="50vh">
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

  return (
    <Box bg={bgColor} minH="100vh">
      {/* Ambient Audio Player */}
      {audioTracks.length > 0 && (
        <AmbientAudioPlayer audioTracks={audioTracks} autoplay />
      )}

      {/* Hero Media Gallery */}
      <Box position="relative">
        <MediaGallery media={propertyMedia} />

        {/* Overlay with property info */}
        <Box
          position="absolute"
          bottom={0}
          left={0}
          right={0}
          p={{ base: 4, md: 8 }}
          bgGradient="linear(to-t, blackAlpha.800, transparent)"
          color="white"
        >
          <Container maxW="container.xl">
            <Breadcrumb
              separator={<FiChevronRight />}
              color="whiteAlpha.800"
              fontSize="sm"
              mb={2}
            >
              <BreadcrumbItem>
                <BreadcrumbLink as={RouterLink} to="/">Home</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbItem>
                <BreadcrumbLink as={RouterLink} to="/properties">Properties</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbItem isCurrentPage>
                <BreadcrumbLink>{property.name}</BreadcrumbLink>
              </BreadcrumbItem>
            </Breadcrumb>

            <Heading size="2xl" mb={2}>{property.name}</Heading>
            <HStack spacing={4} flexWrap="wrap">
              <HStack>
                <Icon as={FiMapPin} />
                <Text>{property.city}, {property.country}</Text>
              </HStack>
              {property.status === 'published' && (
                <Badge colorScheme="green" fontSize="sm">Available</Badge>
              )}
            </HStack>
          </Container>
        </Box>
      </Box>

      {/* Main Content */}
      <Container maxW="container.xl" py={8}>
        <Grid templateColumns={{ base: '1fr', lg: '2fr 1fr' }} gap={8}>
          {/* Left Column - Details */}
          <GridItem>
            <VStack spacing={8} align="stretch">
              {/* Price Card */}
              <Card bg={cardBg} shadow="md">
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
              <Card bg={cardBg} shadow="md">
                <CardBody>
                  <Heading size="md" mb={4}>About This Property</Heading>
                  <Text fontSize="lg" color="gray.600" whiteSpace="pre-wrap">
                    {property.description || 'No description available.'}
                  </Text>
                </CardBody>
              </Card>

              {/* Tabs for Dwellings, Areas, Location */}
              <Card bg={cardBg} shadow="md" overflow="hidden">
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
                              onClick={() => setSelectedEntity({ type: 'dwelling', id: dwelling.id })}
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
                              onClick={() => setSelectedEntity({ type: 'area', id: area.id })}
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
            </VStack>
          </GridItem>

          {/* Right Column - Map */}
          <GridItem>
            <Box position="sticky" top={4}>
              <Card bg={cardBg} shadow="md" overflow="hidden">
                <CardBody p={0}>
                  <PropertyMap
                    latitude={property.latitude}
                    longitude={property.longitude}
                    zoom={16}
                    markers={mapMarkers}
                    height="500px"
                    onMarkerClick={(markerId) => {
                      const dwelling = dwellings.find((d) => d.id === markerId)
                      const area = areas.find((a) => a.id === markerId)
                      if (dwelling) {
                        setSelectedEntity({ type: 'dwelling', id: dwelling.id })
                      } else if (area) {
                        setSelectedEntity({ type: 'area', id: area.id })
                      }
                    }}
                  />
                </CardBody>
              </Card>

              {/* Map Legend */}
              <Card bg={cardBg} shadow="md" mt={4}>
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
      <Box py={8} textAlign="center" borderTop="1px" borderColor="gray.200">
        <Text color="gray.500" fontSize="sm">
          Made with 💗 by{' '}
          <a href="https://kartoza.com" target="_blank" rel="noopener noreferrer">
            Kartoza
          </a>
          {' | '}
          <a href="https://github.com/sponsors/timlinux" target="_blank" rel="noopener noreferrer">
            Donate!
          </a>
          {' | '}
          <a href="https://github.com/timlinux/PropertyForSale" target="_blank" rel="noopener noreferrer">
            GitHub
          </a>
        </Text>
      </Box>
    </Box>
  )
}

interface DwellingCardProps {
  dwelling: Dwelling
  isSelected: boolean
  onClick: () => void
}

function DwellingCard({ dwelling, isSelected, onClick }: DwellingCardProps) {
  const borderColor = useColorModeValue('gray.200', 'gray.600')
  const selectedBorder = useColorModeValue('luxury.gold', 'yellow.400')

  return (
    <Box
      p={4}
      borderRadius="md"
      border="2px solid"
      borderColor={isSelected ? selectedBorder : borderColor}
      cursor="pointer"
      transition="all 0.2s"
      _hover={{ borderColor: selectedBorder, shadow: 'md' }}
      onClick={onClick}
    >
      <HStack justify="space-between" mb={2}>
        <Heading size="sm">{dwelling.name}</Heading>
        <Badge colorScheme="blue">{dwelling.type}</Badge>
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
        <Text mt={2} fontSize="sm" color="gray.500" noOfLines={2}>
          {dwelling.description}
        </Text>
      )}
    </Box>
  )
}

interface AreaCardProps {
  area: Area
  isSelected: boolean
  onClick: () => void
}

function AreaCard({ area, isSelected, onClick }: AreaCardProps) {
  const borderColor = useColorModeValue('gray.200', 'gray.600')
  const selectedBorder = useColorModeValue('green.400', 'green.300')

  return (
    <Box
      p={4}
      borderRadius="md"
      border="2px solid"
      borderColor={isSelected ? selectedBorder : borderColor}
      cursor="pointer"
      transition="all 0.2s"
      _hover={{ borderColor: selectedBorder, shadow: 'md' }}
      onClick={onClick}
    >
      <HStack justify="space-between" mb={2}>
        <Heading size="sm">{area.name}</Heading>
        <Badge colorScheme="green">{area.type}</Badge>
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
        <Text mt={2} fontSize="sm" color="gray.500" noOfLines={2}>
          {area.description}
        </Text>
      )}
    </Box>
  )
}
