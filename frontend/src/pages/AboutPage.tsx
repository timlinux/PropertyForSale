// SPDX-FileCopyrightText: 2026 Tim Sutton <tim@kartoza.com>
// SPDX-License-Identifier: EUPL-1.2

import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  SimpleGrid,
  Icon,
  Link,
  HStack,
  Flex,
} from '@chakra-ui/react'
import {
  FiMap,
  FiHome,
  FiPlay,
  FiHeart,
  FiGithub,
  FiCode,
  FiGlobe,
  FiShield,
} from 'react-icons/fi'
import { SEOHead } from '../components/common/SEOHead'

export default function AboutPage() {
  return (
    <Box>
      <SEOHead
        title="About Us"
        description="Learn about PropertyForSale - an open source premium real estate platform with immersive 3D experiences."
      />

      {/* Hero Section */}
      <Box py={{ base: 16, md: 24 }} bg="white">
        <Container maxW="800px" textAlign="center">
          <VStack spacing={6}>
            <Text
              fontSize="14px"
              fontWeight="600"
              textTransform="uppercase"
              letterSpacing="0.08em"
              color="accent.500"
            >
              About Us
            </Text>
            <Heading as="h1" size="3xl">
              Reimagining real estate
            </Heading>
            <Text fontSize="19px" color="neutral.400" maxW="600px" lineHeight="1.5">
              We believe finding your perfect property should be an immersive,
              beautiful experience that brings spaces to life before you visit.
            </Text>
          </VStack>
        </Container>
      </Box>

      {/* Mission Section */}
      <Box py={{ base: 12, md: 20 }} bg="neutral.100">
        <Container maxW="1000px">
          <Flex
            direction={{ base: 'column', lg: 'row' }}
            align="center"
            gap={{ base: 12, lg: 16 }}
          >
            <Box
              flex="1"
              bg="neutral.200"
              borderRadius="2xl"
              minH="300px"
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              <Icon as={FiGlobe} boxSize={20} color="neutral.400" />
            </Box>
            <VStack
              flex="1"
              align={{ base: 'center', lg: 'flex-start' }}
              textAlign={{ base: 'center', lg: 'left' }}
              spacing={6}
            >
              <Heading as="h2" size="xl">
                Our Mission
              </Heading>
              <Text fontSize="17px" color="neutral.400" lineHeight="1.6">
                To create the most beautiful and immersive property viewing
                experience on the web. We combine cutting-edge technology with
                thoughtful design to help you truly understand a space before
                you step inside.
              </Text>
              <Text fontSize="17px" color="neutral.400" lineHeight="1.6">
                Every property deserves to be presented at its best. Our
                platform brings together 3D tours, interactive maps, and rich
                media to give you the complete picture.
              </Text>
            </VStack>
          </Flex>
        </Container>
      </Box>

      {/* Features */}
      <Box py={{ base: 16, md: 24 }}>
        <Container maxW="1000px">
          <VStack spacing={12}>
            <VStack spacing={4} textAlign="center" maxW="700px">
              <Heading as="h2" size="xl">
                What makes us different
              </Heading>
              <Text fontSize="17px" color="neutral.400" lineHeight="1.5">
                Built with care, designed for you.
              </Text>
            </VStack>

            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={8} w="full">
              <FeatureCard
                icon={FiPlay}
                title="Immersive Media"
                description="360° video tours, 3D models, and high-resolution imagery bring properties to life."
              />
              <FeatureCard
                icon={FiMap}
                title="Interactive Maps"
                description="Navigate through floor plans and property maps with precision and ease."
              />
              <FeatureCard
                icon={FiHome}
                title="Rich Details"
                description="Comprehensive information about every structure, room, and outdoor area."
              />
              <FeatureCard
                icon={FiCode}
                title="Open Source"
                description="Built in the open, licensed under EUPL-1.2. Contribute, fork, or learn from our code."
              />
            </SimpleGrid>
          </VStack>
        </Container>
      </Box>

      {/* Technology */}
      <Box py={{ base: 12, md: 20 }} bg="neutral.800" color="white">
        <Container maxW="800px" textAlign="center">
          <VStack spacing={8}>
            <Icon as={FiShield} boxSize={12} color="neutral.400" />
            <Heading as="h2" size="xl" color="white">
              Built with modern technology
            </Heading>
            <Text fontSize="17px" color="neutral.400" lineHeight="1.6" maxW="600px">
              Go backend for performance and reliability. React frontend with
              Chakra UI for a beautiful, accessible interface. PostgreSQL for
              robust data management. Deployed with Nix for reproducibility.
            </Text>
          </VStack>
        </Container>
      </Box>

      {/* Open Source CTA */}
      <Box py={{ base: 16, md: 24 }}>
        <Container maxW="800px" textAlign="center">
          <VStack spacing={6}>
            <Heading as="h2" size="xl">
              Join the community
            </Heading>
            <Text fontSize="17px" color="neutral.400" lineHeight="1.6" maxW="600px">
              PropertyForSale is open source. Star us on GitHub, contribute code,
              report issues, or sponsor development.
            </Text>
            <HStack spacing={4} pt={4}>
              <Link
                href="https://github.com/timlinux/PropertyForSale"
                isExternal
                display="flex"
                alignItems="center"
                gap={2}
                px={6}
                py={3}
                bg="neutral.800"
                color="white"
                borderRadius="xl"
                fontWeight="500"
                _hover={{ bg: 'neutral.700' }}
                transition="all 0.2s"
              >
                <FiGithub />
                View on GitHub
              </Link>
              <Link
                href="https://github.com/sponsors/timlinux"
                isExternal
                display="flex"
                alignItems="center"
                gap={2}
                px={6}
                py={3}
                bg="white"
                color="neutral.800"
                borderRadius="xl"
                fontWeight="500"
                border="1px solid"
                borderColor="neutral.200"
                _hover={{ borderColor: 'neutral.400' }}
                transition="all 0.2s"
              >
                <FiHeart />
                Sponsor
              </Link>
            </HStack>
          </VStack>
        </Container>
      </Box>

      {/* Kartoza Attribution */}
      <Box py={8} borderTop="1px solid" borderColor="neutral.200">
        <Container maxW="800px" textAlign="center">
          <HStack justify="center" spacing={1} fontSize="14px" color="neutral.400">
            <Text>Made with</Text>
            <Icon as={FiHeart} color="red.400" />
            <Text>by</Text>
            <Link
              href="https://kartoza.com"
              isExternal
              color="neutral.800"
              fontWeight="500"
              _hover={{ color: 'accent.500' }}
            >
              Kartoza
            </Link>
            <Text>|</Text>
            <Link
              href="https://github.com/sponsors/timlinux"
              isExternal
              color="neutral.800"
              fontWeight="500"
              _hover={{ color: 'accent.500' }}
            >
              Donate!
            </Link>
            <Text>|</Text>
            <Link
              href="https://github.com/timlinux/PropertyForSale"
              isExternal
              color="neutral.800"
              fontWeight="500"
              _hover={{ color: 'accent.500' }}
            >
              GitHub
            </Link>
          </HStack>
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
      p={8}
      bg="neutral.100"
      borderRadius="2xl"
      transition="all 0.3s cubic-bezier(0.25, 0.1, 0.25, 1)"
      _hover={{
        transform: 'translateY(-4px)',
        boxShadow: 'lg',
      }}
    >
      <VStack align="flex-start" spacing={4}>
        <Box
          w="48px"
          h="48px"
          bg="white"
          borderRadius="xl"
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <Icon as={IconComponent} boxSize={5} color="neutral.600" />
        </Box>
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
