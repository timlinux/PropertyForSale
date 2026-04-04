// SPDX-FileCopyrightText: 2026 Tim Sutton <tim@kartoza.com>
// SPDX-License-Identifier: EUPL-1.2

import { Link as RouterLink } from 'react-router-dom'
import {
  Avatar,
  Box,
  Button,
  Container,
  Flex,
  HStack,
  IconButton,
  Link,
  Menu,
  MenuButton,
  MenuDivider,
  MenuItem,
  MenuList,
  Text,
} from '@chakra-ui/react'
import { FiMenu, FiLogOut, FiUser, FiGrid } from 'react-icons/fi'
import { useAuthStore } from '../../context/authStore'

export default function Header() {
  const { user, isAuthenticated, logout } = useAuthStore()

  const handleLogout = () => {
    logout()
  }

  return (
    <Box
      as="header"
      position="sticky"
      top={0}
      zIndex={100}
      bg="rgba(255, 255, 255, 0.8)"
      backdropFilter="saturate(180%) blur(20px)"
      borderBottom="1px solid"
      borderColor="neutral.200"
    >
      <Container maxW="1200px">
        <Flex h="48px" align="center" justify="space-between">
          {/* Logo - simple text, no fuss */}
          <Link
            as={RouterLink}
            to="/"
            fontSize="21px"
            fontWeight="600"
            color="neutral.800"
            letterSpacing="-0.01em"
            _hover={{ textDecoration: 'none', opacity: 0.7 }}
            transition="opacity 0.2s ease"
          >
            PropertyForSale
          </Link>

          {/* Desktop Navigation - minimal, evenly spaced */}
          <HStack
            spacing={8}
            display={{ base: 'none', md: 'flex' }}
            position="absolute"
            left="50%"
            transform="translateX(-50%)"
          >
            <NavLink to="/properties">Properties</NavLink>
            <NavLink to="/about">About</NavLink>
            <NavLink to="/contact">Contact</NavLink>
          </HStack>

          {/* Actions - clean, minimal */}
          <HStack spacing={3}>
            {isAuthenticated && user ? (
              <Menu>
                <MenuButton
                  as={Button}
                  variant="ghost"
                  size="sm"
                  p={0}
                  borderRadius="full"
                  minW="auto"
                >
                  <Avatar
                    size="sm"
                    name={user.name}
                    src={user.avatar_url}
                    bg="neutral.800"
                    color="white"
                  />
                </MenuButton>
                <MenuList
                  borderRadius="xl"
                  boxShadow="lg"
                  border="1px solid"
                  borderColor="neutral.200"
                  py={2}
                >
                  <Box px={4} py={2}>
                    <Text fontWeight="600" fontSize="14px">{user.name}</Text>
                    <Text fontSize="12px" color="neutral.400">{user.email}</Text>
                  </Box>
                  <MenuDivider borderColor="neutral.200" />
                  <MenuItem
                    icon={<FiUser size={16} />}
                    as={RouterLink}
                    to="/dashboard/profile"
                    fontSize="14px"
                  >
                    Profile
                  </MenuItem>
                  <MenuItem
                    icon={<FiGrid size={16} />}
                    as={RouterLink}
                    to="/dashboard"
                    fontSize="14px"
                  >
                    Dashboard
                  </MenuItem>
                  <MenuDivider borderColor="neutral.200" />
                  <MenuItem
                    icon={<FiLogOut size={16} />}
                    onClick={handleLogout}
                    fontSize="14px"
                    color="red.500"
                  >
                    Sign Out
                  </MenuItem>
                </MenuList>
              </Menu>
            ) : (
              <Button
                as={RouterLink}
                to="/login"
                size="sm"
                variant="dark"
                display={{ base: 'none', md: 'inline-flex' }}
                fontSize="12px"
                px={4}
              >
                Sign In
              </Button>
            )}

            <IconButton
              aria-label="Menu"
              icon={<FiMenu />}
              variant="ghost"
              size="sm"
              display={{ base: 'flex', md: 'none' }}
              color="neutral.800"
            />
          </HStack>
        </Flex>
      </Container>
    </Box>
  )
}

// Simple nav link component
function NavLink({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <Link
      as={RouterLink}
      to={to}
      fontSize="12px"
      fontWeight="400"
      color="neutral.800"
      _hover={{ opacity: 0.7, textDecoration: 'none' }}
      transition="opacity 0.2s ease"
    >
      {children}
    </Link>
  )
}
