// SPDX-FileCopyrightText: 2026 Tim Sutton <tim@kartoza.com>
// SPDX-License-Identifier: EUPL-1.2

import { useRef, useEffect, useState, useCallback } from 'react'
import {
  Box,
  IconButton,
  HStack,
  Text,
  Tooltip,
  Fade,
  useColorModeValue,
} from '@chakra-ui/react'
import { FiVolume2, FiVolumeX, FiMusic } from 'react-icons/fi'

interface AmbientAudioProps {
  src: string
  label?: string
  autoplay?: boolean
  loop?: boolean
  volume?: number
  fadeIn?: boolean
}

export default function AmbientAudio({
  src,
  label = 'Ambient Sound',
  autoplay = true,
  loop = true,
  volume = 0.3,
  fadeIn = true,
}: AmbientAudioProps) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [hasInteracted, setHasInteracted] = useState(false)
  const [showPrompt, setShowPrompt] = useState(autoplay)

  const bg = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.700')

  // Handle user interaction to enable audio (browser autoplay policy)
  const handleUserInteraction = useCallback(() => {
    const audio = audioRef.current
    if (!audio || hasInteracted) return

    setHasInteracted(true)
    setShowPrompt(false)

    if (autoplay) {
      audio.volume = fadeIn ? 0 : volume
      audio.play()
        .then(() => {
          setIsPlaying(true)
          // Fade in volume
          if (fadeIn) {
            let currentVolume = 0
            const fadeInterval = setInterval(() => {
              currentVolume += 0.02
              if (currentVolume >= volume) {
                audio.volume = volume
                clearInterval(fadeInterval)
              } else {
                audio.volume = currentVolume
              }
            }, 50)
          }
        })
        .catch(() => {
          // Autoplay blocked, user will need to click play
        })
    }
  }, [autoplay, fadeIn, hasInteracted, volume])

  // Add click listener for user interaction
  useEffect(() => {
    if (!autoplay) return

    const handleClick = () => handleUserInteraction()
    document.addEventListener('click', handleClick, { once: true })

    return () => {
      document.removeEventListener('click', handleClick)
    }
  }, [autoplay, handleUserInteraction])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      const audio = audioRef.current
      if (audio) {
        // Fade out before stopping
        let currentVolume = audio.volume
        const fadeOutInterval = setInterval(() => {
          currentVolume -= 0.05
          if (currentVolume <= 0) {
            audio.pause()
            clearInterval(fadeOutInterval)
          } else {
            audio.volume = currentVolume
          }
        }, 30)
      }
    }
  }, [])

  const togglePlay = () => {
    const audio = audioRef.current
    if (!audio) return

    if (!hasInteracted) {
      handleUserInteraction()
      return
    }

    if (isPlaying) {
      audio.pause()
      setIsPlaying(false)
    } else {
      audio.play()
      setIsPlaying(true)
    }
  }

  const toggleMute = () => {
    const audio = audioRef.current
    if (!audio) return

    audio.muted = !isMuted
    setIsMuted(!isMuted)
  }

  return (
    <>
      <audio
        ref={audioRef}
        src={src}
        loop={loop}
        preload="auto"
      />

      {/* Floating ambient audio control */}
      <Box
        position="fixed"
        bottom={4}
        right={4}
        zIndex={50}
      >
        <Fade in={showPrompt}>
          <Box
            position="absolute"
            bottom="100%"
            right={0}
            mb={2}
            p={3}
            bg={bg}
            borderRadius="md"
            boxShadow="md"
            border="1px solid"
            borderColor={borderColor}
            minW="200px"
          >
            <HStack>
              <FiMusic />
              <Text fontSize="sm">
                Click anywhere to enable ambient sounds
              </Text>
            </HStack>
          </Box>
        </Fade>

        <HStack
          bg={bg}
          borderRadius="full"
          boxShadow="lg"
          border="1px solid"
          borderColor={borderColor}
          p={2}
          spacing={2}
        >
          <Tooltip label={label}>
            <IconButton
              aria-label={isPlaying ? 'Pause ambient audio' : 'Play ambient audio'}
              icon={isPlaying ? <FiVolume2 /> : <FiVolumeX />}
              onClick={togglePlay}
              variant={isPlaying ? 'solid' : 'ghost'}
              colorScheme={isPlaying ? 'green' : 'gray'}
              borderRadius="full"
              size="sm"
            />
          </Tooltip>

          {isPlaying && (
            <Tooltip label={isMuted ? 'Unmute' : 'Mute'}>
              <IconButton
                aria-label={isMuted ? 'Unmute' : 'Mute'}
                icon={isMuted ? <FiVolumeX /> : <FiVolume2 />}
                onClick={toggleMute}
                variant="ghost"
                borderRadius="full"
                size="sm"
              />
            </Tooltip>
          )}
        </HStack>
      </Box>
    </>
  )
}
