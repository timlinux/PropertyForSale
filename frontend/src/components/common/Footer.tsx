// SPDX-FileCopyrightText: 2026 Tim Sutton <tim@kartoza.com>
// SPDX-License-Identifier: EUPL-1.2

import { Link as RouterLink } from 'react-router-dom'
import {
  Box,
  Container,
  Flex,
  HStack,
  Link,
  Text,
  VStack,
  SimpleGrid,
} from '@chakra-ui/react'
import { FiGithub, FiHeart } from 'react-icons/fi'

export default function Footer() {
  return (
    <Box as="footer" bg="neutral.100" borderTop="1px solid" borderColor="neutral.200">
      {/* Main footer content */}
      <Container maxW="1200px" py={12}>
        <SimpleGrid columns={{ base: 1, md: 4 }} spacing={8}>
          {/* Brand */}
          <VStack align={{ base: 'center', md: 'flex-start' }} spacing={3}>
            <Text fontSize="12px" fontWeight="600" color="neutral.800">
              PropertyForSale
            </Text>
            <Text fontSize="12px" color="neutral.400" maxW="200px" textAlign={{ base: 'center', md: 'left' }}>
              Premium real estate platform with immersive experiences.
            </Text>
          </VStack>

          {/* Explore */}
          <VStack align={{ base: 'center', md: 'flex-start' }} spacing={3}>
            <Text fontSize="12px" fontWeight="600" color="neutral.800">
              Explore
            </Text>
            <FooterLink to="/properties">Properties</FooterLink>
            <FooterLink to="/about">About</FooterLink>
            <FooterLink to="/contact">Contact</FooterLink>
          </VStack>

          {/* Legal */}
          <VStack align={{ base: 'center', md: 'flex-start' }} spacing={3}>
            <Text fontSize="12px" fontWeight="600" color="neutral.800">
              Legal
            </Text>
            <FooterLink to="/privacy">Privacy Policy</FooterLink>
            <FooterLink to="/terms">Terms of Service</FooterLink>
          </VStack>

          {/* Connect */}
          <VStack align={{ base: 'center', md: 'flex-start' }} spacing={3}>
            <Text fontSize="12px" fontWeight="600" color="neutral.800">
              Connect
            </Text>
            <Link
              href="https://github.com/timlinux/PropertyForSale"
              isExternal
              fontSize="12px"
              color="neutral.400"
              _hover={{ color: 'neutral.800' }}
              display="flex"
              alignItems="center"
              gap={1}
            >
              <FiGithub size={12} />
              GitHub
            </Link>
            <Link
              href="https://github.com/sponsors/timlinux"
              isExternal
              fontSize="12px"
              color="neutral.400"
              _hover={{ color: 'neutral.800' }}
            >
              Sponsor
            </Link>
          </VStack>
        </SimpleGrid>
      </Container>

      {/* Bottom bar */}
      <Box borderTop="1px solid" borderColor="neutral.200">
        <Container maxW="1200px" py={4}>
          <Flex
            direction={{ base: 'column', md: 'row' }}
            justify="space-between"
            align="center"
            gap={4}
          >
            <Text fontSize="12px" color="neutral.400">
              Copyright &copy; {new Date().getFullYear()} PropertyForSale. Licensed under EUPL-1.2.
            </Text>

            {/* Kartoza attribution */}
            <HStack spacing={1} fontSize="12px" color="neutral.400">
              <Text>Made with</Text>
              <Box as={FiHeart} color="red.400" />
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
            </HStack>
          </Flex>
        </Container>
      </Box>
    </Box>
  )
}

function FooterLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <Link
      as={RouterLink}
      to={to}
      fontSize="12px"
      color="neutral.400"
      _hover={{ color: 'neutral.800', textDecoration: 'none' }}
      transition="color 0.2s ease"
    >
      {children}
    </Link>
  )
}
