// SPDX-FileCopyrightText: 2026 Tim Sutton <tim@kartoza.com>
// SPDX-License-Identifier: EUPL-1.2

import { useRef, useEffect, useState, useCallback } from 'react'
import {
  Box,
  IconButton,
  HStack,
  Text,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  Tooltip,
  useColorModeValue,
} from '@chakra-ui/react'
import { FiVolume2, FiVolumeX, FiMusic } from 'react-icons/fi'
import type { Media } from '../../api'

interface AmbientAudioPlayerProps {
  audioTracks: Media[]
  autoplay?: boolean
  defaultVolume?: number
}

export default function AmbientAudioPlayer({
  audioTracks,
  autoplay = false,
  defaultVolume = 0.3,
}: AmbientAudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const currentUrlRef = useRef<string | null>(null)
  const hideTimerRef = useRef<NodeJS.Timeout>()
  const [isPlaying, setIsPlaying] = useState(false)
  const [volume, setVolume] = useState(defaultVolume)
  const [isMuted, setIsMuted] = useState(false)
  const [currentTrack, setCurrentTrack] = useState(0)
  const [showVolumeSlider, setShowVolumeSlider] = useState(false)
  const [hasUserInteracted, setHasUserInteracted] = useState(false)
  const [autoplayBlocked, setAutoplayBlocked] = useState(false)
  const [isVisible, setIsVisible] = useState(true)

  const bg = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.600')
  const textColor = useColorModeValue('blue.600', 'blue.300')

  const activeTrack = audioTracks[currentTrack]
  const activeTrackUrl = activeTrack?.url

  // Auto-hide timer
  const resetHideTimer = useCallback(() => {
    setIsVisible(true)
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current)
    }
    hideTimerRef.current = setTimeout(() => {
      if (!showVolumeSlider) {
        setIsVisible(false)
      }
    }, 3000)
  }, [showVolumeSlider])

  // Show on mouse movement
  useEffect(() => {
    const handleMouseMove = () => resetHideTimer()
    window.addEventListener('mousemove', handleMouseMove)

    // Start the initial hide timer
    resetHideTimer()

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current)
    }
  }, [resetHideTimer])

  // Set up audio source when track changes
  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !activeTrackUrl) return

    // Only update source if it's actually different
    if (currentUrlRef.current !== activeTrackUrl) {
      currentUrlRef.current = activeTrackUrl
      audio.src = activeTrackUrl
      audio.loop = true
      audio.volume = isMuted ? 0 : volume
      audio.load()
    }
  }, [activeTrackUrl, isMuted, volume])

  // Handle autoplay when track is ready
  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !activeTrackUrl) return

    const handleCanPlay = () => {
      // Try to play if autoplay is enabled or user has already interacted
      if ((autoplay || hasUserInteracted) && audio.paused) {
        audio.play()
          .then(() => {
            setIsPlaying(true)
            setAutoplayBlocked(false)
          })
          .catch(() => {
            // Autoplay was prevented - show the prompt
            setIsPlaying(false)
            if (autoplay && !hasUserInteracted) {
              setAutoplayBlocked(true)
            }
          })
      }
    }

    // Listen for when audio is ready to play
    audio.addEventListener('canplaythrough', handleCanPlay)

    // Also try immediately in case audio is already loaded
    if (audio.readyState >= 4) {
      handleCanPlay()
    }

    return () => {
      audio.removeEventListener('canplaythrough', handleCanPlay)
    }
  }, [activeTrackUrl, autoplay, hasUserInteracted])

  // Sync isPlaying state with actual audio state
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const handlePlay = () => {
      setIsPlaying(true)
      setAutoplayBlocked(false)
    }
    const handlePause = () => setIsPlaying(false)

    audio.addEventListener('play', handlePlay)
    audio.addEventListener('pause', handlePause)

    return () => {
      audio.removeEventListener('play', handlePlay)
      audio.removeEventListener('pause', handlePause)
    }
  }, [])

  // Cleanup only on unmount
  useEffect(() => {
    const audio = audioRef.current
    return () => {
      if (audio) {
        audio.pause()
        audio.src = ''
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume
    }
  }, [volume, isMuted])

  const handlePlayPause = async () => {
    const audio = audioRef.current
    if (!audio) return

    // Track that user has interacted - allows autoplay on future track changes
    setHasUserInteracted(true)
    setAutoplayBlocked(false)

    if (isPlaying) {
      audio.pause()
      setIsPlaying(false)
    } else {
      try {
        await audio.play()
        setIsPlaying(true)
      } catch (error) {
        console.error('Audio playback failed:', error)
      }
    }
  }

  const handleTrackEnd = () => {
    if (audioTracks.length > 1) {
      const nextTrack = (currentTrack + 1) % audioTracks.length
      setCurrentTrack(nextTrack)
    }
  }

  const toggleMute = () => {
    setIsMuted(!isMuted)
  }

  const handleMouseEnter = () => {
    setShowVolumeSlider(true)
    setIsVisible(true)
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current)
    }
  }

  const handleMouseLeave = () => {
    setShowVolumeSlider(false)
    resetHideTimer()
  }

  if (!audioTracks.length) return null

  // Show expanded prompt when autoplay is blocked
  if (autoplayBlocked && !isPlaying) {
    return (
      <Box
        position="fixed"
        bottom={4}
        left={4}
        bg={bg}
        borderRadius="full"
        boxShadow="lg"
        border="1px solid"
        borderColor={borderColor}
        px={4}
        py={2}
        zIndex={100}
        cursor="pointer"
        onClick={handlePlayPause}
        opacity={isVisible ? 1 : 0}
        transform={isVisible ? 'translateY(0)' : 'translateY(10px)'}
        _hover={{ transform: 'scale(1.02)', boxShadow: 'xl' }}
        transition="all 0.3s ease-out"
        onMouseEnter={() => setIsVisible(true)}
      >
        <audio
          ref={audioRef}
          onEnded={handleTrackEnd}
          preload="auto"
        />

        <HStack spacing={3}>
          <Box
            as={FiMusic}
            size={20}
            color={textColor}
            animation="pulse 2s ease-in-out infinite"
            sx={{
              '@keyframes pulse': {
                '0%, 100%': { opacity: 1 },
                '50%': { opacity: 0.5 },
              },
            }}
          />
          <Text fontSize="sm" fontWeight="medium" color={textColor}>
            Click to enable sound
          </Text>
        </HStack>
      </Box>
    )
  }

  return (
    <Box
      position="fixed"
      bottom={4}
      left={4}
      bg={bg}
      borderRadius="full"
      boxShadow="lg"
      border="1px solid"
      borderColor={borderColor}
      p={2}
      zIndex={100}
      opacity={isVisible ? 1 : 0}
      transform={isVisible ? 'translateY(0)' : 'translateY(10px)'}
      transition="all 0.3s ease-out"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <audio
        ref={audioRef}
        onEnded={handleTrackEnd}
        preload="auto"
      />

      <HStack spacing={2}>
        {/* Play/Pause button */}
        <Tooltip
          label={isPlaying ? 'Pause ambient audio' : 'Play ambient audio'}
          hasArrow
        >
          <IconButton
            aria-label={isPlaying ? 'Pause' : 'Play'}
            icon={<FiMusic />}
            variant="ghost"
            borderRadius="full"
            size="sm"
            color={isPlaying ? 'luxury.gold' : textColor}
            onClick={handlePlayPause}
          />
        </Tooltip>

        {/* Volume controls - shown on hover */}
        {showVolumeSlider && (
          <>
            <IconButton
              aria-label={isMuted ? 'Unmute' : 'Mute'}
              icon={isMuted ? <FiVolumeX /> : <FiVolume2 />}
              variant="ghost"
              size="sm"
              color={textColor}
              onClick={toggleMute}
            />
            <Box w="80px">
              <Slider
                aria-label="Volume"
                value={isMuted ? 0 : volume * 100}
                onChange={(val) => {
                  setVolume(val / 100)
                  if (isMuted && val > 0) setIsMuted(false)
                }}
                min={0}
                max={100}
              >
                <SliderTrack>
                  <SliderFilledTrack bg="luxury.gold" />
                </SliderTrack>
                <SliderThumb />
              </Slider>
            </Box>
          </>
        )}

        {/* Track indicator */}
        {audioTracks.length > 1 && showVolumeSlider && (
          <Text fontSize="xs" color="gray.500" whiteSpace="nowrap">
            {currentTrack + 1}/{audioTracks.length}
          </Text>
        )}
      </HStack>
    </Box>
  )
}
