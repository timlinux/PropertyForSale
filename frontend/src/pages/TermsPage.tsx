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

export default function TermsPage() {
  return (
    <Box>
      <SEOHead
        title="Terms of Service"
        description="PropertyForSale terms of service - rules and guidelines for using our platform."
      />

      {/* Hero */}
      <Box py={{ base: 12, md: 16 }} bg="white">
        <Container maxW="800px">
          <VStack spacing={4} align="flex-start">
            <Heading as="h1" size="2xl">
              Terms of Service
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
            <TermsSection title="Acceptance of Terms">
              By accessing or using PropertyForSale, you agree to be bound by
              these Terms of Service. If you do not agree to these terms, please
              do not use our platform.
            </TermsSection>

            <TermsSection title="Use of Service">
              PropertyForSale provides a platform for listing and viewing real
              estate properties. You may use our service for lawful purposes
              only. You agree not to misuse our platform or interfere with its
              normal operation.
            </TermsSection>

            <TermsSection title="User Accounts">
              When you create an account, you are responsible for maintaining
              the security of your account and for all activities that occur
              under your account. You must provide accurate and complete
              information when creating your account.
            </TermsSection>

            <TermsSection title="Property Listings">
              Users who list properties are responsible for ensuring that all
              information provided is accurate and truthful. Misleading or
              fraudulent listings are prohibited and may result in account
              termination.
            </TermsSection>

            <TermsSection title="Intellectual Property">
              PropertyForSale and its content are licensed under the European
              Union Public License (EUPL-1.2). This is an open source license
              that allows you to use, modify, and distribute the software
              under certain conditions.
            </TermsSection>

            <TermsSection title="User Content">
              You retain ownership of content you upload to our platform. By
              uploading content, you grant us a license to use, store, and
              display that content as necessary to provide our services.
            </TermsSection>

            <TermsSection title="Limitation of Liability">
              PropertyForSale is provided "as is" without warranties of any
              kind. We are not liable for any damages arising from your use
              of our platform or any property transactions facilitated through it.
            </TermsSection>

            <TermsSection title="Changes to Terms">
              We may update these terms from time to time. We will notify users
              of significant changes. Continued use of the platform after changes
              constitutes acceptance of the new terms.
            </TermsSection>

            <TermsSection title="Contact">
              For questions about these terms, please contact us through our
              GitHub repository or the contact information on our website.
            </TermsSection>
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

function TermsSection({ title, children }: { title: string; children: React.ReactNode }) {
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
