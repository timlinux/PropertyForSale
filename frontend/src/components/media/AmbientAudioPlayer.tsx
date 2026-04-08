// SPDX-FileCopyrightText: 2026 Tim Sutton <tim@kartoza.com>
// SPDX-License-Identifier: EUPL-1.2

import { useRef, useEffect, useState } from 'react'
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
  const [isPlaying, setIsPlaying] = useState(false)
  const [volume, setVolume] = useState(defaultVolume)
  const [isMuted, setIsMuted] = useState(false)
  const [currentTrack, setCurrentTrack] = useState(0)
  const [showVolumeSlider, setShowVolumeSlider] = useState(false)

  const bg = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.600')

  const activeTrack = audioTracks[currentTrack]

  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !activeTrack) return

    audio.volume = isMuted ? 0 : volume
    audio.src = activeTrack.url
    // Always loop for ambient soundscapes
    audio.loop = true

    if (autoplay) {
      // Autoplay is restricted by browsers, need user interaction first
      // For starred audio (ambient soundscapes), always try to autoplay
      const playPromise = audio.play()
      if (playPromise !== undefined) {
        playPromise
          .then(() => setIsPlaying(true))
          .catch(() => {
            // Autoplay was prevented, user must click to play
            setIsPlaying(false)
          })
      }
    }

    return () => {
      audio.pause()
    }
  }, [activeTrack, autoplay])

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume
    }
  }, [volume, isMuted])

  const handlePlayPause = async () => {
    const audio = audioRef.current
    if (!audio) return

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

  if (!audioTracks.length) return null

  return (
    <Box
      position="fixed"
      bottom={4}
      right={4}
      bg={bg}
      borderRadius="full"
      boxShadow="lg"
      border="1px solid"
      borderColor={borderColor}
      p={2}
      zIndex={100}
      onMouseEnter={() => setShowVolumeSlider(true)}
      onMouseLeave={() => setShowVolumeSlider(false)}
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
            color={isPlaying ? 'luxury.gold' : undefined}
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
