// SPDX-FileCopyrightText: 2026 Tim Sutton <tim@kartoza.com>
// SPDX-License-Identifier: EUPL-1.2

import { useParams } from 'react-router-dom'
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  Spinner,
  Center,
} from '@chakra-ui/react'
import { useQuery } from '@tanstack/react-query'
import { api } from '../api'

export default function PropertyPage() {
  const { slug } = useParams<{ slug: string }>()

  const { data: property, isLoading, error } = useQuery({
    queryKey: ['property', slug],
    queryFn: () => api.getPropertyBySlug(slug!),
    enabled: !!slug,
  })

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
        </VStack>
      </Container>
    )
  }

  return (
    <Box>
      {/* Hero Image */}
      <Box
        h={{ base: '300px', md: '500px' }}
        bg="gray.200"
        position="relative"
      >
        <Box
          position="absolute"
          bottom={0}
          left={0}
          right={0}
          p={8}
          bgGradient="linear(to-t, blackAlpha.700, transparent)"
          color="white"
        >
          <Container maxW="container.xl">
            <Heading size="2xl">{property.name}</Heading>
            <Text fontSize="xl" mt={2}>
              {property.city}, {property.country}
            </Text>
          </Container>
        </Box>
      </Box>

      {/* Content */}
      <Container maxW="container.xl" py={12}>
        <VStack spacing={8} align="stretch">
          {/* Price */}
          <Box>
            <Text fontSize="3xl" fontWeight="bold" color="luxury.gold">
              {property.currency} {property.price_min?.toLocaleString()}
              {property.price_max && property.price_max !== property.price_min && (
                <> - {property.price_max.toLocaleString()}</>
              )}
            </Text>
          </Box>

          {/* Description */}
          <Box>
            <Heading size="lg" mb={4}>About This Property</Heading>
            <Text fontSize="lg" color="gray.600" whiteSpace="pre-wrap">
              {property.description || 'No description available.'}
            </Text>
          </Box>

          {/* Location */}
          <Box>
            <Heading size="lg" mb={4}>Location</Heading>
            <Text>
              {property.address_line1}
              {property.address_line2 && <>, {property.address_line2}</>}
            </Text>
            <Text>
              {property.city}, {property.state} {property.postal_code}
            </Text>
            <Text>{property.country}</Text>
          </Box>

          {/* Map placeholder */}
          <Box
            h="400px"
            bg="gray.100"
            borderRadius="lg"
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            <Text color="gray.500">Interactive Map Coming Soon</Text>
          </Box>
        </VStack>
      </Container>
    </Box>
  )
}
