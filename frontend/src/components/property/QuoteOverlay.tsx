// SPDX-FileCopyrightText: 2026 Tim Sutton <tim@kartoza.com>
// SPDX-License-Identifier: EUPL-1.2

import { useState, useEffect } from 'react'
import { Box, Text } from '@chakra-ui/react'
import type { Quote } from '../../api'

interface QuoteOverlayProps {
  quotes: Quote[]
  interval?: number // Interval in milliseconds (default: 15000 = 15s)
}

export default function QuoteOverlay({ quotes, interval = 15000 }: QuoteOverlayProps) {
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
      bottom="20%"
      left={0}
      right={0}
      display="flex"
      justifyContent="center"
      alignItems="center"
      px={8}
      pointerEvents="none"
      zIndex={2}
    >
      <Text
        fontSize={{ base: '2xl', md: '4xl', lg: '5xl' }}
        fontWeight="bold"
        color="white"
        textAlign="center"
        textShadow="0 4px 20px rgba(0,0,0,0.8), 0 2px 8px rgba(0,0,0,0.6)"
        fontStyle="italic"
        letterSpacing="wide"
        opacity={isVisible ? 1 : 0}
        transform={isVisible ? 'translateY(0)' : 'translateY(20px)'}
        transition="all 0.5s ease-in-out"
        maxW="80%"
        sx={{
          '&::before': {
            content: '"""',
            marginRight: '0.2em',
            opacity: 0.7,
          },
          '&::after': {
            content: '"""',
            marginLeft: '0.2em',
            opacity: 0.7,
          },
        }}
      >
        {currentQuote.text}
      </Text>
    </Box>
  )
}
