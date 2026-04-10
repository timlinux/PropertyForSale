// SPDX-FileCopyrightText: 2026 Tim Sutton <tim@kartoza.com>
// SPDX-License-Identifier: EUPL-1.2

import { useState, useEffect } from 'react'
import { Box, Text, HStack } from '@chakra-ui/react'
import type { Quote } from '../../api'

interface QuoteOverlayProps {
  quotes: Quote[]
  interval?: number // Interval in milliseconds (default: 10000 = 10s)
}

export default function QuoteOverlay({ quotes, interval = 10000 }: QuoteOverlayProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    if (quotes.length <= 1) return

    const timer = setInterval(() => {
      // Fade out
      setIsVisible(false)

      // Change quote after fade out
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % quotes.length)
        setIsVisible(true)
      }, 500) // Match fade duration
    }, interval)

    return () => clearInterval(timer)
  }, [quotes.length, interval])

  if (quotes.length === 0) return null

  const currentQuote = quotes[currentIndex]

  return (
    <Box
      position="absolute"
      bottom="15%"
      left={0}
      right={0}
      display="flex"
      justifyContent="center"
      alignItems="center"
      px={8}
      pointerEvents="none"
      zIndex={2}
    >
      <Box
        bg="white"
        border="1px solid"
        borderColor="neutral.200"
        boxShadow="0 8px 40px rgba(0, 0, 0, 0.15)"
        px={{ base: 6, md: 10 }}
        py={{ base: 4, md: 6 }}
        borderRadius="2xl"
        maxW="800px"
        opacity={isVisible ? 1 : 0}
        transform={isVisible ? 'translateY(0)' : 'translateY(20px)'}
        transition="all 0.5s cubic-bezier(0.25, 0.1, 0.25, 1)"
      >
        <Text
          color="accent.600"
          fontSize={{ base: 'xl', md: '2xl', lg: '3xl' }}
          fontWeight="light"
          fontStyle="italic"
          letterSpacing="wide"
          lineHeight="tall"
          textAlign="center"
        >
          "{currentQuote.text}"
        </Text>
      </Box>

      {/* Dot indicators */}
      {quotes.length > 1 && (
        <HStack
          position="absolute"
          bottom={-8}
          left="50%"
          transform="translateX(-50%)"
          spacing={2}
        >
          {quotes.map((_, idx) => (
            <Box
              key={idx}
              w={2}
              h={2}
              borderRadius="full"
              bg={idx === currentIndex ? 'white' : 'whiteAlpha.500'}
              transition="background 0.3s"
            />
          ))}
        </HStack>
      )}
    </Box>
  )
}
