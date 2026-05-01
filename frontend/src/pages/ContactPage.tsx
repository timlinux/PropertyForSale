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
} from '@chakra-ui/react'
import { FiMail, FiMapPin, FiPhone, FiGithub, FiHeart } from 'react-icons/fi'
import { SEOHead } from '../components/common/SEOHead'

export default function ContactPage() {
  return (
    <Box>
      <SEOHead
        title="Contact Us"
        description="Get in touch with our team. We're here to help with any questions about our properties."
      />

      {/* Hero Section */}
      <Box py={{ base: 16, md: 24 }} bg="white">
        <Container maxW="800px" textAlign="center">
          <VStack spacing={6}>
            <Heading as="h1" size="3xl">
              Get in touch
            </Heading>
            <Text fontSize="19px" color="neutral.400" maxW="600px" lineHeight="1.5">
              Have questions about a property or our platform? We'd love to hear from you.
            </Text>
          </VStack>
        </Container>
      </Box>

      {/* Contact Methods */}
      <Box py={{ base: 12, md: 20 }} bg="neutral.100">
        <Container maxW="1000px">
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={8}>
            <ContactCard
              icon={FiMail}
              title="Email"
              description="Send us an email anytime"
              detail="hello@propertyforsale.example"
              href="mailto:hello@propertyforsale.example"
            />
            <ContactCard
              icon={FiPhone}
              title="Phone"
              description="Mon-Fri from 9am to 5pm"
              detail="+1 (555) 123-4567"
              href="tel:+15551234567"
            />
            <ContactCard
              icon={FiMapPin}
              title="Office"
              description="Visit us at our office"
              detail="123 Property Lane, Real Estate City"
            />
          </SimpleGrid>
        </Container>
      </Box>

      {/* Open Source Section */}
      <Box py={{ base: 16, md: 24 }}>
        <Container maxW="800px" textAlign="center">
          <VStack spacing={6}>
            <Heading as="h2" size="xl">
              Open Source Project
            </Heading>
            <Text fontSize="17px" color="neutral.400" lineHeight="1.6" maxW="600px">
              PropertyForSale is an open source project. You can contribute,
              report issues, or fork the project on GitHub.
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

interface ContactCardProps {
  icon: React.ElementType
  title: string
  description: string
  detail: string
  href?: string
}

function ContactCard({ icon: IconComponent, title, description, detail, href }: ContactCardProps) {
  const content = (
    <VStack
      p={8}
      bg="white"
      borderRadius="2xl"
      spacing={4}
      textAlign="center"
      h="full"
      transition="all 0.3s cubic-bezier(0.25, 0.1, 0.25, 1)"
      _hover={{
        transform: 'translateY(-4px)',
        boxShadow: 'lg',
      }}
    >
      <Box
        w="48px"
        h="48px"
        bg="neutral.100"
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
      <Text fontSize="14px" color="neutral.400">
        {description}
      </Text>
      <Text fontSize="14px" fontWeight="500" color="neutral.800">
        {detail}
      </Text>
    </VStack>
  )

  if (href) {
    return (
      <Link href={href} _hover={{ textDecoration: 'none' }}>
        {content}
      </Link>
    )
  }

  return content
}
