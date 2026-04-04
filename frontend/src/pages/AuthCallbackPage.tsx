// SPDX-FileCopyrightText: 2026 Tim Sutton <tim@kartoza.com>
// SPDX-License-Identifier: EUPL-1.2

import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Center, Spinner, Text, VStack } from '@chakra-ui/react'
import { useAuthStore } from '../context/authStore'

export default function AuthCallbackPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { setTokens } = useAuthStore()

  useEffect(() => {
    const accessToken = searchParams.get('access_token')
    const refreshToken = searchParams.get('refresh_token')
    const expiresAt = searchParams.get('expires_at')
    const error = searchParams.get('error')

    if (error) {
      navigate('/login?error=' + error)
      return
    }

    if (accessToken && refreshToken && expiresAt) {
      // Store tokens
      setTokens({
        accessToken,
        refreshToken,
        expiresAt: new Date(expiresAt),
      })

      // Redirect to dashboard
      navigate('/dashboard')
    } else {
      // Missing tokens, redirect to login
      navigate('/login?error=missing_tokens')
    }
  }, [searchParams, navigate, setTokens])

  return (
    <Center minH="50vh">
      <VStack spacing={4}>
        <Spinner size="xl" color="luxury.gold" />
        <Text>Completing sign in...</Text>
      </VStack>
    </Center>
  )
}
