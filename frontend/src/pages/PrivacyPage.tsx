// SPDX-FileCopyrightText: 2026 Tim Sutton <tim@kartoza.com>
// SPDX-License-Identifier: EUPL-1.2

import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  Link,
  HStack,
  Icon,
} from '@chakra-ui/react'
import { FiHeart } from 'react-icons/fi'
import { SEOHead } from '../components/common/SEOHead'

export default function PrivacyPage() {
  return (
    <Box>
      <SEOHead
        title="Privacy Policy"
        description="PropertyForSale privacy policy - how we handle your data."
      />

      {/* Hero */}
      <Box py={{ base: 12, md: 16 }} bg="white">
        <Container maxW="800px">
          <VStack spacing={4} align="flex-start">
            <Heading as="h1" size="2xl">
              Privacy Policy
            </Heading>
            <Text fontSize="14px" color="neutral.400">
              Last updated: April 2026
            </Text>
          </VStack>
        </Container>
      </Box>

      {/* Content */}
      <Box py={{ base: 8, md: 12 }} bg="neutral.50">
        <Container maxW="800px">
          <VStack spacing={8} align="flex-start">
            <PolicySection title="Overview">
              PropertyForSale is committed to protecting your privacy. This policy
              explains how we collect, use, and safeguard your information when
              you use our platform.
            </PolicySection>

            <PolicySection title="Information We Collect">
              We collect information you provide directly, such as when you create
              an account, list a property, or contact us. This may include your
              name, email address, and property details. We also automatically
              collect certain information about your device and how you use our
              platform.
            </PolicySection>

            <PolicySection title="How We Use Your Information">
              We use your information to provide and improve our services, process
              transactions, communicate with you, and ensure the security of our
              platform. We do not sell your personal information to third parties.
            </PolicySection>

            <PolicySection title="Data Security">
              We implement appropriate technical and organizational measures to
              protect your personal information against unauthorized access,
              alteration, disclosure, or destruction.
            </PolicySection>

            <PolicySection title="Cookies">
              We use cookies and similar technologies to enhance your experience,
              analyze usage patterns, and provide personalized content. You can
              control cookie settings through your browser.
            </PolicySection>

            <PolicySection title="Your Rights">
              You have the right to access, correct, or delete your personal
              information. You may also object to certain processing activities
              or request data portability. Contact us to exercise these rights.
            </PolicySection>

            <PolicySection title="Open Source">
              PropertyForSale is open source software licensed under EUPL-1.2.
              This means you can inspect exactly how our software handles data
              by reviewing our source code on GitHub.
            </PolicySection>

            <PolicySection title="Contact Us">
              If you have questions about this privacy policy or our data
              practices, please contact us through our GitHub repository or
              the contact information provided on our website.
            </PolicySection>
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

function PolicySection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Box>
      <Heading as="h2" size="md" mb={3}>
        {title}
      </Heading>
      <Text color="neutral.600" lineHeight="1.7">
        {children}
      </Text>
    </Box>
  )
}
