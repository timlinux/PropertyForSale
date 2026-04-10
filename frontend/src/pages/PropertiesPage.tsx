// SPDX-FileCopyrightText: 2026 Tim Sutton <tim@kartoza.com>
// SPDX-License-Identifier: EUPL-1.2

import { useMemo } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import {
  Box,
  Container,
  Heading,
  SimpleGrid,
  Text,
  VStack,
  Center,
  Image,
  Badge,
  Flex,
  Icon,
  Button,
  Skeleton,
} from '@chakra-ui/react'
import { useQuery } from '@tanstack/react-query'
import { FiMaximize, FiInfo, FiImage } from 'react-icons/fi'
import { api, Property } from '../api'

export default function PropertiesPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['properties'],
    queryFn: () => api.getProperties(),
  })

  return (
    <Box bg="white" minH="100vh">
      {/* Page header - clean, minimal */}
      <Box pt={{ base: 16, md: 24 }} pb={{ base: 12, md: 16 }}>
        <Container maxW="1200px" textAlign="center">
          <VStack spacing={4}>
            <Text
              fontSize="12px"
              fontWeight="600"
              textTransform="uppercase"
              letterSpacing="0.08em"
              color="neutral.400"
            >
              Browse
            </Text>
            <Heading as="h1" size="3xl">
              Properties
            </Heading>
            <Text fontSize="19px" color="neutral.400" maxW="500px">
              Explore our curated selection of premium properties.
            </Text>
          </VStack>
        </Container>
      </Box>

      {/* Properties grid */}
      <Container maxW="1200px" pb={24}>
        {isLoading ? (
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={8}>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <PropertyCardSkeleton key={i} />
            ))}
          </SimpleGrid>
        ) : (
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={8}>
            {data?.data?.map((property: Property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
            {(!data?.data || data.data.length === 0) && (
              <Box gridColumn={{ md: 'span 2', lg: 'span 3' }} textAlign="center" py={16}>
                <VStack spacing={4}>
                  <Text color="neutral.400" fontSize="19px">
                    No properties available yet.
                  </Text>
                  <Text color="neutral.300" fontSize="14px">
                    Check back soon for new listings.
                  </Text>
                </VStack>
              </Box>
            )}
          </SimpleGrid>
        )}
      </Container>
    </Box>
  )
}

function PropertyCardSkeleton() {
  return (
    <Box
      borderRadius="2xl"
      overflow="hidden"
      bg="white"
      boxShadow="0 4px 24px rgba(0, 0, 0, 0.04)"
      border="1px solid"
      borderColor="neutral.100"
    >
      {/* Image skeleton */}
      <Skeleton h={{ base: '220px', md: '260px' }} borderRadius={0} />

      {/* Content skeleton */}
      <VStack p={5} align="stretch" spacing={3}>
        {/* Location */}
        <Skeleton h="13px" w="40%" />

        {/* Property name */}
        <Skeleton h="24px" w="80%" />

        {/* Price and button row */}
        <Flex justify="space-between" align="center" pt={1}>
          <Skeleton h="26px" w="120px" />
          <Skeleton h="32px" w="80px" borderRadius="md" />
        </Flex>
      </VStack>
    </Box>
  )
}

interface PropertyCardProps {
  property: Property
}

function PropertyCard({ property }: PropertyCardProps) {
  // Fetch media for this property
  const { data: mediaData } = useQuery({
    queryKey: ['property-media', property.slug],
    queryFn: () => api.getPropertyMedia(property.slug),
    enabled: !!property.slug,
  })

  // Get a random starred image (or any image if no starred)
  const thumbnailUrl = useMemo(() => {
    const allMedia = mediaData?.data || []
    const images = allMedia.filter(m => m.type === 'image')

    // Prefer starred images
    const starredImages = images.filter(m => m.starred)
    const pool = starredImages.length > 0 ? starredImages : images

    if (pool.length === 0) return null

    // Use property id as seed for consistent random selection per property
    const seed = property.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
    const randomIndex = seed % pool.length
    return pool[randomIndex]?.url || null
  }, [mediaData, property.id])

  return (
    <Box
      display="block"
      borderRadius="2xl"
      overflow="hidden"
      bg="white"
      position="relative"
      boxShadow="0 4px 24px rgba(0, 0, 0, 0.04)"
      border="1px solid"
      borderColor="neutral.100"
      transition="all 0.4s cubic-bezier(0.25, 0.1, 0.25, 1)"
      role="group"
      _hover={{
        transform: 'translateY(-8px)',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.12)',
        borderColor: 'neutral.200',
        '& .property-image': {
          transform: 'scale(1.08)',
        },
      }}
    >
      {/* Clickable image container - links to explorer */}
      <Box
        as={RouterLink}
        to={`/explore/${property.slug}`}
        display="block"
        h={{ base: '220px', md: '260px' }}
        bg="neutral.100"
        position="relative"
        overflow="hidden"
        cursor="pointer"
      >
        {thumbnailUrl ? (
          <Image
            className="property-image"
            src={thumbnailUrl}
            alt={property.name}
            objectFit="cover"
            w="full"
            h="full"
            transition="transform 0.6s cubic-bezier(0.25, 0.1, 0.25, 1)"
          />
        ) : (
          <Center w="full" h="full" color="neutral.300">
            <VStack spacing={2}>
              <Icon as={FiImage} boxSize={12} />
              <Text fontSize="sm">No images</Text>
            </VStack>
          </Center>
        )}

        {/* Subtle gradient overlay for text readability */}
        <Box
          position="absolute"
          bottom={0}
          left={0}
          right={0}
          h="50%"
          bgGradient="linear(to-t, blackAlpha.400, transparent)"
          opacity={0}
          _groupHover={{ opacity: 1 }}
          transition="opacity 0.3s"
          pointerEvents="none"
        />

        {/* Explore icon on hover */}
        <Center
          position="absolute"
          top="50%"
          left="50%"
          transform="translate(-50%, -50%) scale(0.8)"
          opacity={0}
          _groupHover={{ opacity: 1, transform: 'translate(-50%, -50%) scale(1)' }}
          transition="all 0.3s cubic-bezier(0.25, 0.1, 0.25, 1)"
        >
          <Box
            bg="white"
            borderRadius="full"
            p={4}
            boxShadow="lg"
          >
            <Icon as={FiMaximize} boxSize={6} color="neutral.700" />
          </Box>
        </Center>

        {property.status !== 'published' && (
          <Badge
            position="absolute"
            top={4}
            left={4}
            bg="white"
            color="neutral.600"
            fontSize="11px"
            fontWeight="500"
            px={3}
            py={1}
            borderRadius="full"
            zIndex={1}
            textTransform="capitalize"
          >
            {property.status}
          </Badge>
        )}
      </Box>

      {/* Content - refined hierarchy */}
      <VStack p={5} align="stretch" spacing={2}>
        {/* Location as eyebrow */}
        <Text
          fontSize="13px"
          fontWeight="500"
          color="neutral.400"
          textTransform="uppercase"
          letterSpacing="0.05em"
        >
          {property.city}{property.city && property.country ? ', ' : ''}{property.country || 'Location TBD'}
        </Text>

        {/* Property name - prominent */}
        <Text fontSize="19px" fontWeight="600" color="neutral.800" noOfLines={1}>
          {property.name}
        </Text>

        {/* Price - accent color, bold */}
        <Flex justify="space-between" align="center" pt={1}>
          <Text fontWeight="700" color="accent.500" fontSize="21px">
            {property.currency || 'EUR'} {property.price_min?.toLocaleString() || '—'}
          </Text>
          <Button
            as={RouterLink}
            to={`/property/${property.slug}`}
            size="sm"
            variant="ghost"
            color="neutral.400"
            rightIcon={<Icon as={FiInfo} />}
            _hover={{ color: 'accent.500', bg: 'accent.50' }}
          >
            Details
          </Button>
        </Flex>
      </VStack>
    </Box>
  )
}
