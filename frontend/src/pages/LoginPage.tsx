// SPDX-FileCopyrightText: 2026 Tim Sutton <tim@kartoza.com>
// SPDX-License-Identifier: EUPL-1.2

import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  Alert,
  AlertIcon,
  Box,
  Button,
  Container,
  Divider,
  Heading,
  HStack,
  Text,
  VStack,
  useToast,
} from '@chakra-ui/react'
import { FiGithub, FiUser } from 'react-icons/fi'
import { FaGoogle, FaApple, FaMicrosoft, FaFacebook } from 'react-icons/fa'
import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '../context/authStore'

const isDev = import.meta.env.DEV

interface ProviderConfig {
  name: string
  icon: React.ElementType
  label: string
  bg: string
  color: string
  hoverBg: string
}

const providerConfigs: Record<string, ProviderConfig> = {
  google: {
    name: 'google',
    icon: FaGoogle,
    label: 'Continue with Google',
    bg: 'white',
    color: 'gray.700',
    hoverBg: 'gray.50',
  },
  apple: {
    name: 'apple',
    icon: FaApple,
    label: 'Continue with Apple',
    bg: 'black',
    color: 'white',
    hoverBg: 'gray.800',
  },
  microsoft: {
    name: 'microsoft',
    icon: FaMicrosoft,
    label: 'Continue with Microsoft',
    bg: '#00a4ef',
    color: 'white',
    hoverBg: '#0078d4',
  },
  github: {
    name: 'github',
    icon: FiGithub,
    label: 'Continue with GitHub',
    bg: 'gray.800',
    color: 'white',
    hoverBg: 'gray.700',
  },
  facebook: {
    name: 'facebook',
    icon: FaFacebook,
    label: 'Continue with Facebook',
    bg: '#1877f2',
    color: 'white',
    hoverBg: '#166fe5',
  },
}

async function fetchProviders(): Promise<string[]> {
  const response = await fetch('/api/v1/auth/providers')
  if (!response.ok) {
    throw new Error('Failed to fetch providers')
  }
  const data = await response.json()
  return data.providers || []
}

export default function LoginPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const toast = useToast()
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const setTokens = useAuthStore((state) => state.setTokens)
  const setUser = useAuthStore((state) => state.setUser)
  const [isDevLoading, setIsDevLoading] = useState(false)

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard')
    }
  }, [isAuthenticated, navigate])

  // Show error from callback
  useEffect(() => {
    const error = searchParams.get('error')
    if (error) {
      toast({
        title: 'Authentication failed',
        description: getErrorMessage(error),
        status: 'error',
        duration: 5000,
        isClosable: true,
      })
    }
  }, [searchParams, toast])

  // Fetch available providers
  const { data: providers = [], isLoading } = useQuery({
    queryKey: ['auth-providers'],
    queryFn: fetchProviders,
  })

  const handleOAuthLogin = (provider: string) => {
    // Redirect to backend OAuth endpoint
    window.location.href = `/api/v1/auth/${provider}`
  }

  const handleDevLogin = async () => {
    setIsDevLoading(true)
    try {
      const response = await fetch('/api/v1/auth/dev-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'admin@example.com',
          name: 'Admin User',
          role: 'admin',
        }),
      })

      if (!response.ok) {
        throw new Error('Dev login failed')
      }

      const data = await response.json()

      // Set tokens
      setTokens({
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresAt: new Date(data.expires_at),
      })

      // Set user
      setUser(data.user)

      toast({
        title: 'Logged in',
        description: `Welcome, ${data.user.name}!`,
        status: 'success',
        duration: 3000,
      })

      navigate('/dashboard')
    } catch (error) {
      toast({
        title: 'Login failed',
        description: 'Dev login failed. Make sure the server is in development mode.',
        status: 'error',
        duration: 5000,
      })
    } finally {
      setIsDevLoading(false)
    }
  }

  const error = searchParams.get('error')

  return (
    <Container maxW="md" py={16}>
      <VStack spacing={8}>
        <VStack spacing={2} textAlign="center">
          <Heading>Welcome Back</Heading>
          <Text color="gray.600">Sign in to manage your properties</Text>
        </VStack>

        {error && (
          <Alert status="error" borderRadius="md">
            <AlertIcon />
            {getErrorMessage(error)}
          </Alert>
        )}

        <Box w="full" bg="white" p={8} borderRadius="lg" boxShadow="lg">
          <VStack spacing={4}>
            {/* Dev Login Button - only in development */}
            {isDev && (
              <>
                <Button
                  w="full"
                  size="lg"
                  leftIcon={<FiUser />}
                  onClick={handleDevLogin}
                  isLoading={isDevLoading}
                  colorScheme="purple"
                  variant="solid"
                >
                  Dev Login (Admin)
                </Button>
                <Divider />
              </>
            )}

            {isLoading ? (
              <Text color="gray.500">Loading providers...</Text>
            ) : providers.length === 0 && !isDev ? (
              <Text color="gray.500">
                No authentication providers configured.
                Please contact the administrator.
              </Text>
            ) : providers.length > 0 && (
              providers.map((provider) => {
                const config = providerConfigs[provider]
                if (!config) return null

                const Icon = config.icon
                return (
                  <Button
                    key={provider}
                    w="full"
                    size="lg"
                    leftIcon={<Icon />}
                    onClick={() => handleOAuthLogin(provider)}
                    bg={config.bg}
                    color={config.color}
                    border={provider === 'google' ? '1px' : undefined}
                    borderColor={provider === 'google' ? 'gray.300' : undefined}
                    _hover={{ bg: config.hoverBg }}
                  >
                    {config.label}
                  </Button>
                )
              })
            )}
          </VStack>

          <HStack my={6}>
            <Divider />
            <Text fontSize="sm" color="gray.500" whiteSpace="nowrap">
              Secure login
            </Text>
            <Divider />
          </HStack>

          <Text fontSize="sm" color="gray.500" textAlign="center">
            By signing in, you agree to our Terms of Service and Privacy Policy.
          </Text>
        </Box>
      </VStack>
    </Container>
  )
}

function getErrorMessage(error: string): string {
  switch (error) {
    case 'authentication_failed':
      return 'Authentication failed. Please try again.'
    case 'missing_tokens':
      return 'Authentication incomplete. Please try again.'
    case 'unauthorized':
      return 'You are not authorized to access this resource.'
    default:
      return error
  }
}
