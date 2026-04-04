// SPDX-FileCopyrightText: 2026 Tim Sutton <tim@kartoza.com>
// SPDX-License-Identifier: EUPL-1.2

import { Link as RouterLink } from 'react-router-dom'
import {
  Box,
  Button,
  Container,
  Heading,
  HStack,
  SimpleGrid,
  Text,
  VStack,
  useColorModeValue,
} from '@chakra-ui/react'
import { FiMap, FiHome, FiBarChart2, FiVideo } from 'react-icons/fi'

export default function HomePage() {
  const heroBg = useColorModeValue(
    'linear-gradient(135deg, #1a365d 0%, #2d3748 100%)',
    'linear-gradient(135deg, #1a202c 0%, #2d3748 100%)'
  )

  return (
    <Box>
      {/* Hero Section */}
      <Box
        bg={heroBg}
        color="white"
        py={{ base: 20, md: 32 }}
        position="relative"
        overflow="hidden"
      >
        {/* Decorative element */}
        <Box
          position="absolute"
          top="-50%"
          right="-10%"
          w="60%"
          h="200%"
          bg="luxury.gold"
          opacity={0.1}
          transform="rotate(15deg)"
          borderRadius="full"
        />

        <Container maxW="container.xl" position="relative">
          <VStack spacing={6} align="flex-start" maxW="2xl">
            <Heading
              as="h1"
              size={{ base: 'xl', md: '3xl' }}
              fontWeight="bold"
              lineHeight="1.2"
            >
              Discover Your Dream Property with Immersive Experiences
            </Heading>
            <Text fontSize={{ base: 'lg', md: 'xl' }} opacity={0.9} maxW="xl">
              Explore properties like never before with interactive 3D tours,
              detailed floor plans, and comprehensive analytics.
            </Text>
            <HStack spacing={4} pt={4}>
              <Button
                as={RouterLink}
                to="/properties"
                size="lg"
                bg="luxury.gold"
                color="white"
                _hover={{ bg: 'white', color: 'luxury.navy' }}
              >
                Browse Properties
              </Button>
              <Button
                as={RouterLink}
                to="/about"
                size="lg"
                variant="outline"
                borderColor="white"
                color="white"
                _hover={{ bg: 'white', color: 'luxury.navy' }}
              >
                Learn More
              </Button>
            </HStack>
          </VStack>
        </Container>
      </Box>

      {/* Features Section */}
      <Container maxW="container.xl" py={{ base: 16, md: 24 }}>
        <VStack spacing={12}>
          <VStack spacing={4} textAlign="center" maxW="2xl">
            <Heading as="h2" size="xl">
              Experience Properties Like Never Before
            </Heading>
            <Text fontSize="lg" color="gray.600">
              Our cutting-edge platform combines stunning visuals with powerful
              analytics to help you find the perfect property.
            </Text>
          </VStack>

          <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={8} w="full">
            <FeatureCard
              icon={FiVideo}
              title="3D Virtual Tours"
              description="Immerse yourself in 360-degree video walkthroughs and interactive 3D models."
            />
            <FeatureCard
              icon={FiMap}
              title="Interactive Maps"
              description="Navigate property features with clickable maps and explore every corner."
            />
            <FeatureCard
              icon={FiHome}
              title="Floor Plans"
              description="View architectural plans in both 2D and 3D for complete spatial understanding."
            />
            <FeatureCard
              icon={FiBarChart2}
              title="Market Analytics"
              description="Access comprehensive data and insights to make informed decisions."
            />
          </SimpleGrid>
        </VStack>
      </Container>

      {/* CTA Section */}
      <Box bg="luxury.navy" color="white" py={{ base: 16, md: 24 }}>
        <Container maxW="container.xl">
          <VStack spacing={6} textAlign="center">
            <Heading as="h2" size="xl" color="white">
              Ready to Find Your Perfect Property?
            </Heading>
            <Text fontSize="lg" opacity={0.9} maxW="2xl">
              Start exploring our curated selection of premium properties today.
            </Text>
            <Button
              as={RouterLink}
              to="/properties"
              size="lg"
              bg="luxury.gold"
              color="white"
              _hover={{ bg: 'white', color: 'luxury.navy' }}
            >
              Get Started
            </Button>
          </VStack>
        </Container>
      </Box>
    </Box>
  )
}

interface FeatureCardProps {
  icon: React.ElementType
  title: string
  description: string
}

function FeatureCard({ icon: Icon, title, description }: FeatureCardProps) {
  return (
    <VStack
      p={6}
      bg="white"
      borderRadius="lg"
      boxShadow="md"
      spacing={4}
      align="flex-start"
      _hover={{ transform: 'translateY(-4px)', boxShadow: 'lg' }}
      transition="all 0.2s"
    >
      <Box
        p={3}
        bg="luxury.gold"
        borderRadius="md"
        color="white"
      >
        <Icon size={24} />
      </Box>
      <Heading as="h3" size="md">
        {title}
      </Heading>
      <Text color="gray.600">{description}</Text>
    </VStack>
  )
}
