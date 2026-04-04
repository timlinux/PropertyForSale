// SPDX-FileCopyrightText: 2026 Tim Sutton <tim@kartoza.com>
// SPDX-License-Identifier: EUPL-1.2

import { Link as RouterLink } from 'react-router-dom'
import {
  Box,
  Container,
  Flex,
  HStack,
  IconButton,
  Link,
  useColorMode,
  useColorModeValue,
  Button,
} from '@chakra-ui/react'
import { FiSun, FiMoon, FiMenu } from 'react-icons/fi'

export default function Header() {
  const { colorMode, toggleColorMode } = useColorMode()
  const bg = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.700')

  return (
    <Box
      as="header"
      position="sticky"
      top={0}
      zIndex={100}
      bg={bg}
      borderBottom="1px"
      borderColor={borderColor}
      backdropFilter="blur(10px)"
    >
      <Container maxW="container.xl">
        <Flex h="16" align="center" justify="space-between">
          {/* Logo */}
          <Link
            as={RouterLink}
            to="/"
            fontFamily="heading"
            fontSize="xl"
            fontWeight="bold"
            color="luxury.navy"
            _hover={{ textDecoration: 'none', color: 'luxury.gold' }}
          >
            PropertyForSale
          </Link>

          {/* Desktop Navigation */}
          <HStack spacing={8} display={{ base: 'none', md: 'flex' }}>
            <Link as={RouterLink} to="/properties">
              Properties
            </Link>
            <Link as={RouterLink} to="/about">
              About
            </Link>
            <Link as={RouterLink} to="/contact">
              Contact
            </Link>
          </HStack>

          {/* Actions */}
          <HStack spacing={4}>
            <IconButton
              aria-label="Toggle color mode"
              icon={colorMode === 'light' ? <FiMoon /> : <FiSun />}
              onClick={toggleColorMode}
              variant="ghost"
              size="sm"
            />
            <Button
              as={RouterLink}
              to="/login"
              variant="outline"
              size="sm"
              display={{ base: 'none', md: 'inline-flex' }}
            >
              Sign In
            </Button>
            <IconButton
              aria-label="Menu"
              icon={<FiMenu />}
              variant="ghost"
              size="sm"
              display={{ base: 'flex', md: 'none' }}
            />
          </HStack>
        </Flex>
      </Container>
    </Box>
  )
}
