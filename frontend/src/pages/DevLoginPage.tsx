// SPDX-FileCopyrightText: 2026 Tim Sutton <tim@kartoza.com>
// SPDX-License-Identifier: EUPL-1.2

import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Button,
  Container,
  Heading,
  Text,
  VStack,
  Spinner,
  Alert,
  AlertIcon,
} from '@chakra-ui/react'
import { useAuthStore } from '../context/authStore'

export default function DevLoginPage() {
  const navigate = useNavigate()
  const { setUser, setTokens, isAuthenticated } = useAuthStore()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard')
    }
  }, [isAuthenticated, navigate])

  const handleDevLogin = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/v1/auth/dev-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error('Dev login failed')
      }

      const data = await response.json()

      // Store user and tokens
      setUser(data.user)
      setTokens({
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresAt: new Date(data.expires_at),
      })

      // Redirect to dashboard
      navigate('/dashboard')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Box minH="100vh" display="flex" alignItems="center" justifyContent="center">
      <Container maxW="400px">
        <VStack spacing={8} textAlign="center">
          <VStack spacing={3}>
            <Text
              fontSize="12px"
              fontWeight="600"
              textTransform="uppercase"
              letterSpacing="0.08em"
              color="neutral.400"
            >
              Development Only
            </Text>
            <Heading size="xl">Dev Login</Heading>
            <Text color="neutral.400" fontSize="14px">
              Quick authentication for local development.
              Creates an admin user automatically.
            </Text>
          </VStack>

          {error && (
            <Alert status="error" borderRadius="lg">
              <AlertIcon />
              {error}
            </Alert>
          )}

          <Button
            onClick={handleDevLogin}
            isLoading={isLoading}
            loadingText="Signing in..."
            size="lg"
            w="full"
            variant="dark"
          >
            {isLoading ? <Spinner size="sm" /> : 'Sign in as Dev User'}
          </Button>

          <Text fontSize="12px" color="neutral.300">
            This endpoint only works when ENV=development
          </Text>
        </VStack>
      </Container>
    </Box>
  )
}
