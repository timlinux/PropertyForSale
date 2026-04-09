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
  const hideTimerRef = useRef<NodeJS.Timeout>()
  const [isPlaying, setIsPlaying] = useState(false)
  const [volume, setVolume] = useState(defaultVolume)
  const [isMuted, setIsMuted] = useState(false)
  const [currentTrack, setCurrentTrack] = useState(0)
  const [showVolumeSlider, setShowVolumeSlider] = useState(false)
  const [autoplayBlocked, setAutoplayBlocked] = useState(false)
  const [isVisible, setIsVisible] = useState(true)

  const bg = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.600')
  const textColor = useColorModeValue('blue.600', 'blue.300')

  const activeTrack = audioTracks[currentTrack]

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
    resetHideTimer()

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current)
    }
  }, [resetHideTimer])

  // Try autoplay when component mounts
  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !autoplay) return

    // Small delay to ensure audio element is ready
    const timer = setTimeout(() => {
      audio.play()
        .then(() => {
          setIsPlaying(true)
          setAutoplayBlocked(false)
        })
        .catch((err) => {
          console.log('Autoplay blocked:', err.message)
          setAutoplayBlocked(true)
        })
    }, 100)

    return () => clearTimeout(timer)
  }, [autoplay, activeTrack?.url])

  // Update volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume
    }
  }, [volume, isMuted])

  // Sync playing state
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const handlePlay = () => {
      setIsPlaying(true)
      setAutoplayBlocked(false)
    }
    const handlePause = () => setIsPlaying(false)
    const handleError = (e: Event) => {
      console.error('Audio error:', e)
    }

    audio.addEventListener('play', handlePlay)
    audio.addEventListener('pause', handlePause)
    audio.addEventListener('error', handleError)

    return () => {
      audio.removeEventListener('play', handlePlay)
      audio.removeEventListener('pause', handlePause)
      audio.removeEventListener('error', handleError)
    }
  }, [])

  const handlePlayPause = async () => {
    const audio = audioRef.current
    if (!audio) {
      console.error('No audio element')
      return
    }

    setAutoplayBlocked(false)

    if (isPlaying) {
      audio.pause()
    } else {
      try {
        await audio.play()
        setIsPlaying(true)
      } catch (error) {
        console.error('Play failed:', error)
      }
    }
  }

  const handleTrackEnd = () => {
    if (audioTracks.length > 1) {
      setCurrentTrack((currentTrack + 1) % audioTracks.length)
    }
  }

  const toggleMute = () => setIsMuted(!isMuted)

  const handleMouseEnter = () => {
    setShowVolumeSlider(true)
    setIsVisible(true)
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current)
  }

  const handleMouseLeave = () => {
    setShowVolumeSlider(false)
    resetHideTimer()
  }

  if (!audioTracks.length || !activeTrack) {
    return null
  }

  // Show "click to enable" when autoplay blocked
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
        {/* Audio element with src directly set */}
        <audio
          ref={audioRef}
          src={activeTrack.url}
          loop
          preload="auto"
          onEnded={handleTrackEnd}
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
      {/* Audio element with src directly set - same pattern as MediaPreviewCard */}
      <audio
        ref={audioRef}
        src={activeTrack.url}
        loop
        preload="auto"
        onEnded={handleTrackEnd}
      />

      <HStack spacing={2}>
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

        {audioTracks.length > 1 && showVolumeSlider && (
          <Text fontSize="xs" color="gray.500" whiteSpace="nowrap">
            {currentTrack + 1}/{audioTracks.length}
          </Text>
        )}
      </HStack>
    </Box>
  )
}
