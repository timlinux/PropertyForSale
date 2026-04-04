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
  useColorModeValue,
} from '@chakra-ui/react'
import { FiGithub, FiHeart } from 'react-icons/fi'

export default function Footer() {
  const bg = useColorModeValue('luxury.navy', 'gray.900')
  const color = useColorModeValue('white', 'gray.100')

  return (
    <Box as="footer" bg={bg} color={color} py={8}>
      <Container maxW="container.xl">
        <Flex
          direction={{ base: 'column', md: 'row' }}
          justify="space-between"
          align="center"
          gap={6}
        >
          {/* Left side */}
          <VStack align={{ base: 'center', md: 'flex-start' }} spacing={2}>
            <Text fontFamily="heading" fontSize="lg" fontWeight="bold">
              PropertyForSale
            </Text>
            <Text fontSize="sm" opacity={0.8}>
              Premium property sales platform
            </Text>
          </VStack>

          {/* Center links */}
          <HStack spacing={6} display={{ base: 'none', md: 'flex' }}>
            <Link as={RouterLink} to="/properties" fontSize="sm">
              Properties
            </Link>
            <Link as={RouterLink} to="/about" fontSize="sm">
              About
            </Link>
            <Link as={RouterLink} to="/privacy" fontSize="sm">
              Privacy
            </Link>
            <Link as={RouterLink} to="/terms" fontSize="sm">
              Terms
            </Link>
          </HStack>

          {/* Right side - Kartoza attribution */}
          <HStack spacing={1} fontSize="sm">
            <Text>Made with</Text>
            <Box as={FiHeart} color="red.400" />
            <Text>by</Text>
            <Link href="https://kartoza.com" isExternal color="luxury.gold">
              Kartoza
            </Link>
            <Text>|</Text>
            <Link
              href="https://github.com/sponsors/timlinux"
              isExternal
              color="luxury.gold"
            >
              Donate!
            </Link>
            <Text>|</Text>
            <Link
              href="https://github.com/timlinux/PropertyForSale"
              isExternal
              display="inline-flex"
              alignItems="center"
              gap={1}
            >
              <FiGithub />
              GitHub
            </Link>
          </HStack>
        </Flex>

        {/* Copyright */}
        <Text textAlign="center" fontSize="xs" mt={6} opacity={0.6}>
          &copy; {new Date().getFullYear()} PropertyForSale. Licensed under EUPL-1.2.
        </Text>
      </Container>
    </Box>
  )
}
