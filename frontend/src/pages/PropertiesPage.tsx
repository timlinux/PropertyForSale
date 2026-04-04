// SPDX-FileCopyrightText: 2026 Tim Sutton <tim@kartoza.com>
// SPDX-License-Identifier: EUPL-1.2

import { Link as RouterLink } from 'react-router-dom'
import {
  Box,
  Container,
  Heading,
  SimpleGrid,
  Text,
  VStack,
  Spinner,
  Center,
  Image,
  Badge,
  HStack,
} from '@chakra-ui/react'
import { useQuery } from '@tanstack/react-query'
import { api, Property } from '../api'

export default function PropertiesPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['properties'],
    queryFn: () => api.getProperties(),
  })

  return (
    <Container maxW="container.xl" py={12}>
      <VStack spacing={8} align="stretch">
        <VStack spacing={2} align="flex-start">
          <Heading>Properties</Heading>
          <Text color="gray.600">
            Explore our curated selection of premium properties
          </Text>
        </VStack>

        {isLoading ? (
          <Center minH="200px">
            <Spinner size="xl" color="luxury.gold" />
          </Center>
        ) : (
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
            {data?.data?.map((property: Property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
            {(!data?.data || data.data.length === 0) && (
              <Text color="gray.500">No properties available yet.</Text>
            )}
          </SimpleGrid>
        )}
      </VStack>
    </Container>
  )
}

interface PropertyCardProps {
  property: Property
}

function PropertyCard({ property }: PropertyCardProps) {
  return (
    <Box
      as={RouterLink}
      to={`/property/${property.slug}`}
      bg="white"
      borderRadius="lg"
      overflow="hidden"
      boxShadow="md"
      _hover={{ transform: 'translateY(-4px)', boxShadow: 'lg' }}
      transition="all 0.2s"
    >
      {/* Image */}
      <Box h="200px" bg="gray.200" position="relative">
        <Image
          src={`https://picsum.photos/seed/${property.id}/400/200`}
          alt={property.name}
          objectFit="cover"
          w="full"
          h="full"
        />
        <Badge
          position="absolute"
          top={3}
          right={3}
          colorScheme={property.status === 'published' ? 'green' : 'gray'}
        >
          {property.status}
        </Badge>
      </Box>

      {/* Content */}
      <VStack p={4} align="stretch" spacing={2}>
        <Heading size="md" noOfLines={1}>
          {property.name}
        </Heading>
        <Text color="gray.600" fontSize="sm" noOfLines={1}>
          {property.city}, {property.country}
        </Text>
        <HStack justify="space-between" align="flex-end">
          <Text fontWeight="bold" color="luxury.gold" fontSize="lg">
            {property.currency} {property.price_min?.toLocaleString()}
          </Text>
        </HStack>
      </VStack>
    </Box>
  )
}
