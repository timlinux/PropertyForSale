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
  Icon,
  Flex,
} from '@chakra-ui/react'
import { FiMap, FiHome, FiBarChart2, FiPlay, FiArrowRight } from 'react-icons/fi'

export default function HomePage() {
  return (
    <Box>
      {/* Hero Section - Apple style: massive whitespace, centered content */}
      <Box
        minH={{ base: '80vh', md: '90vh' }}
        display="flex"
        alignItems="center"
        justifyContent="center"
        bg="white"
        position="relative"
        overflow="hidden"
      >
        <Container maxW="1000px" textAlign="center">
          <VStack spacing={{ base: 6, md: 8 }}>
            {/* Eyebrow text */}
            <Text
              fontSize="14px"
              fontWeight="600"
              textTransform="uppercase"
              letterSpacing="0.08em"
              color="accent.500"
            >
              Premium Real Estate
            </Text>

            {/* Main headline - massive, impactful */}
            <Heading
              as="h1"
              size="4xl"
              maxW="900px"
            >
              Find your place in the world.
            </Heading>

            {/* Subtitle - subdued, supporting */}
            <Text
              fontSize={{ base: '19px', md: '21px' }}
              color="neutral.400"
              maxW="600px"
              lineHeight="1.5"
            >
              Immersive 3D tours. Interactive maps. Every detail, beautifully presented.
            </Text>

            {/* CTAs - Apple style with proper spacing */}
            <HStack spacing={4} pt={4}>
              <Button
                as={RouterLink}
                to="/properties"
                size="lg"
                variant="solid"
                rightIcon={<FiArrowRight />}
              >
                Browse Properties
              </Button>
              <Button
                as={RouterLink}
                to="/about"
                size="lg"
                variant="outline"
              >
                Learn More
              </Button>
            </HStack>
          </VStack>
        </Container>
      </Box>

      {/* Features Section - clean grid with generous spacing */}
      <Box bg="neutral.100" py={{ base: 20, md: 32 }}>
        <Container maxW="1200px">
          <VStack spacing={{ base: 12, md: 20 }}>
            {/* Section header */}
            <VStack spacing={4} textAlign="center" maxW="700px">
              <Heading as="h2" size="2xl">
                Experience properties differently.
              </Heading>
              <Text fontSize="19px" color="neutral.400" lineHeight="1.5">
                Every feature designed to help you make the right decision.
              </Text>
            </VStack>

            {/* Features grid */}
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={{ base: 6, md: 8 }} w="full">
              <FeatureCard
                icon={FiPlay}
                title="3D Virtual Tours"
                description="Walk through properties from anywhere. 360° video and interactive 3D models bring spaces to life."
              />
              <FeatureCard
                icon={FiMap}
                title="Interactive Maps"
                description="Explore every corner with precision. Click to navigate, zoom to discover."
              />
              <FeatureCard
                icon={FiHome}
                title="Detailed Floor Plans"
                description="Understand the space completely. 2D blueprints and 3D visualizations in perfect harmony."
              />
              <FeatureCard
                icon={FiBarChart2}
                title="Market Insights"
                description="Data-driven decisions. Comprehensive analytics to guide your investment."
              />
            </SimpleGrid>
          </VStack>
        </Container>
      </Box>

      {/* Showcase Section - full-width visual impact */}
      <Box py={{ base: 20, md: 32 }}>
        <Container maxW="1200px">
          <Flex
            direction={{ base: 'column', lg: 'row' }}
            align="center"
            gap={{ base: 12, lg: 20 }}
          >
            {/* Image placeholder - would be a beautiful property photo */}
            <Box
              flex="1"
              bg="neutral.200"
              borderRadius="2xl"
              minH={{ base: '300px', md: '500px' }}
              w="full"
              position="relative"
              overflow="hidden"
            >
              <Box
                position="absolute"
                inset="0"
                bg="linear-gradient(135deg, neutral.100 0%, neutral.300 100%)"
                display="flex"
                alignItems="center"
                justifyContent="center"
              >
                <Text color="neutral.400" fontSize="lg">Property Showcase</Text>
              </Box>
            </Box>

            {/* Content */}
            <VStack
              flex="1"
              align={{ base: 'center', lg: 'flex-start' }}
              textAlign={{ base: 'center', lg: 'left' }}
              spacing={6}
            >
              <Text
                fontSize="12px"
                fontWeight="600"
                textTransform="uppercase"
                letterSpacing="0.08em"
                color="neutral.400"
              >
                Featured Collection
              </Text>
              <Heading as="h2" size="xl">
                Curated properties that inspire.
              </Heading>
              <Text fontSize="17px" color="neutral.400" lineHeight="1.6">
                Each listing is carefully selected and beautifully presented.
                High-resolution imagery, comprehensive details, and immersive
                experiences that let you truly understand a space.
              </Text>
              <Button
                as={RouterLink}
                to="/properties"
                variant="link"
                rightIcon={<FiArrowRight />}
                fontSize="17px"
                mt={2}
              >
                View all properties
              </Button>
            </VStack>
          </Flex>
        </Container>
      </Box>

      {/* CTA Section - minimal, elegant */}
      <Box bg="neutral.800" color="white" py={{ base: 24, md: 32 }}>
        <Container maxW="800px" textAlign="center">
          <VStack spacing={6}>
            <Heading as="h2" size="2xl" color="white">
              Ready to explore?
            </Heading>
            <Text fontSize="19px" color="neutral.400" maxW="500px" lineHeight="1.5">
              Start your journey to finding the perfect property.
            </Text>
            <Button
              as={RouterLink}
              to="/properties"
              size="lg"
              bg="white"
              color="neutral.800"
              _hover={{ bg: 'neutral.100' }}
              mt={4}
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

function FeatureCard({ icon: IconComponent, title, description }: FeatureCardProps) {
  return (
    <Box
      p={{ base: 8, md: 10 }}
      bg="white"
      borderRadius="2xl"
      transition="all 0.3s cubic-bezier(0.25, 0.1, 0.25, 1)"
      _hover={{
        transform: 'translateY(-4px)',
        boxShadow: 'lg'
      }}
    >
      <VStack align="flex-start" spacing={4}>
        <Flex
          w="48px"
          h="48px"
          bg="neutral.100"
          borderRadius="xl"
          align="center"
          justify="center"
        >
          <Icon as={IconComponent} boxSize={5} color="neutral.600" />
        </Flex>
        <Heading as="h3" size="md" fontWeight="600">
          {title}
        </Heading>
        <Text color="neutral.400" lineHeight="1.5">
          {description}
        </Text>
      </VStack>
    </Box>
  )
}
