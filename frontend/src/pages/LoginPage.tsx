// SPDX-FileCopyrightText: 2026 Tim Sutton <tim@kartoza.com>
// SPDX-License-Identifier: EUPL-1.2

import {
  Box,
  Button,
  Container,
  Divider,
  Heading,
  HStack,
  Text,
  VStack,
} from '@chakra-ui/react'
import { FiGithub } from 'react-icons/fi'
import { FaGoogle, FaApple, FaMicrosoft, FaFacebook } from 'react-icons/fa'

export default function LoginPage() {
  const handleOAuthLogin = (provider: string) => {
    window.location.href = `/api/v1/auth/${provider}`
  }

  return (
    <Container maxW="md" py={16}>
      <VStack spacing={8}>
        <VStack spacing={2} textAlign="center">
          <Heading>Welcome Back</Heading>
          <Text color="gray.600">Sign in to manage your properties</Text>
        </VStack>

        <Box
          w="full"
          bg="white"
          p={8}
          borderRadius="lg"
          boxShadow="lg"
        >
          <VStack spacing={4}>
            <Button
              w="full"
              size="lg"
              leftIcon={<FaGoogle />}
              onClick={() => handleOAuthLogin('google')}
              bg="white"
              border="1px"
              borderColor="gray.300"
              _hover={{ bg: 'gray.50' }}
            >
              Continue with Google
            </Button>

            <Button
              w="full"
              size="lg"
              leftIcon={<FaApple />}
              onClick={() => handleOAuthLogin('apple')}
              bg="black"
              color="white"
              _hover={{ bg: 'gray.800' }}
            >
              Continue with Apple
            </Button>

            <Button
              w="full"
              size="lg"
              leftIcon={<FaMicrosoft />}
              onClick={() => handleOAuthLogin('microsoft')}
              bg="#00a4ef"
              color="white"
              _hover={{ bg: '#0078d4' }}
            >
              Continue with Microsoft
            </Button>

            <Button
              w="full"
              size="lg"
              leftIcon={<FiGithub />}
              onClick={() => handleOAuthLogin('github')}
              bg="gray.800"
              color="white"
              _hover={{ bg: 'gray.700' }}
            >
              Continue with GitHub
            </Button>

            <Button
              w="full"
              size="lg"
              leftIcon={<FaFacebook />}
              onClick={() => handleOAuthLogin('facebook')}
              bg="#1877f2"
              color="white"
              _hover={{ bg: '#166fe5' }}
            >
              Continue with Facebook
            </Button>
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
