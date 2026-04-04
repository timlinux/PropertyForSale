// SPDX-FileCopyrightText: 2026 Tim Sutton <tim@kartoza.com>
// SPDX-License-Identifier: EUPL-1.2

import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
} from '@chakra-ui/react'

export default function DashboardPage() {
  return (
    <Container maxW="container.xl" py={12}>
      <VStack spacing={8} align="stretch">
        <VStack spacing={2} align="flex-start">
          <Heading>Dashboard</Heading>
          <Text color="gray.600">
            Manage your properties and view analytics
          </Text>
        </VStack>

        <Box
          bg="white"
          p={8}
          borderRadius="lg"
          boxShadow="md"
          textAlign="center"
        >
          <Text color="gray.500">
            Dashboard coming soon. Please sign in to access your properties.
          </Text>
        </Box>
      </VStack>
    </Container>
  )
}
