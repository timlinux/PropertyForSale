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
  Flex,
  HStack,
  Icon,
  Button,
} from '@chakra-ui/react'
import { useQuery } from '@tanstack/react-query'
import { FiMaximize, FiInfo } from 'react-icons/fi'
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
          <Center minH="300px">
            <Spinner size="lg" color="neutral.400" thickness="2px" />
          </Center>
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

interface PropertyCardProps {
  property: Property
}

function PropertyCard({ property }: PropertyCardProps) {
  return (
    <Box
      display="block"
      borderRadius="2xl"
      overflow="hidden"
      bg="white"
      position="relative"
      transition="all 0.3s cubic-bezier(0.25, 0.1, 0.25, 1)"
      role="group"
      _hover={{
        transform: 'scale(1.02)',
        '& .property-image': {
          transform: 'scale(1.05)',
        },
      }}
    >
      {/* Clickable image container - links to explorer */}
      <Box
        as={RouterLink}
        to={`/explore/${property.slug}`}
        display="block"
        h={{ base: '240px', md: '280px' }}
        bg="neutral.100"
        position="relative"
        overflow="hidden"
        borderRadius="2xl"
        cursor="pointer"
      >
        <Image
          className="property-image"
          src={`https://picsum.photos/seed/${property.id}/600/400`}
          alt={property.name}
          objectFit="cover"
          w="full"
          h="full"
          transition="transform 0.5s cubic-bezier(0.25, 0.1, 0.25, 1)"
        />

        {/* Hover overlay with action buttons */}
        <Box
          position="absolute"
          top={0}
          left={0}
          right={0}
          bottom={0}
          bg="blackAlpha.600"
          opacity={0}
          _groupHover={{ opacity: 1 }}
          transition="opacity 0.3s"
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <VStack spacing={3}>
            <HStack
              bg="white"
              color="neutral.800"
              px={4}
              py={2}
              borderRadius="full"
              fontWeight="600"
              fontSize="14px"
              boxShadow="lg"
            >
              <Icon as={FiMaximize} />
              <Text>Explore</Text>
            </HStack>
          </VStack>
        </Box>

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
          >
            {property.status}
          </Badge>
        )}
      </Box>

      {/* Content - clean, minimal */}
      <VStack p={4} align="stretch" spacing={1}>
        <Flex justify="space-between" align="center">
          <Text fontSize="17px" fontWeight="600" color="neutral.800" noOfLines={1}>
            {property.name}
          </Text>
          <Button
            as={RouterLink}
            to={`/property/${property.slug}`}
            size="xs"
            variant="ghost"
            color="neutral.400"
            leftIcon={<Icon as={FiInfo} />}
            opacity={0}
            _groupHover={{ opacity: 1 }}
            transition="opacity 0.3s"
          >
            Details
          </Button>
        </Flex>
        <Text color="neutral.400" fontSize="14px" noOfLines={1}>
          {property.city}{property.city && property.country ? ', ' : ''}{property.country}
        </Text>
        <Flex justify="space-between" align="center" pt={1}>
          <Text fontWeight="600" color="neutral.800" fontSize="17px">
            {property.currency || 'EUR'} {property.price_min?.toLocaleString() || '—'}
          </Text>
        </Flex>
      </VStack>
    </Box>
  )
}
