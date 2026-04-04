// SPDX-FileCopyrightText: 2026 Tim Sutton <tim@kartoza.com>
// SPDX-License-Identifier: EUPL-1.2

import { useRef, useEffect, useState } from 'react'
import {
  Box,
  IconButton,
  HStack,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  Text,
  useColorModeValue,
} from '@chakra-ui/react'
import {
  FiPlay,
  FiPause,
  FiVolume2,
  FiVolumeX,
  FiMaximize,
  FiMinimize,
} from 'react-icons/fi'

interface VideoPlayerProps {
  src: string
  poster?: string
  autoplay?: boolean
  muted?: boolean
  loop?: boolean
  controls?: boolean
}

export default function VideoPlayer({
  src,
  poster,
  autoplay = false,
  muted = false,
  loop = false,
  controls = true,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isPlaying, setIsPlaying] = useState(autoplay)
  const [isMuted, setIsMuted] = useState(muted)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)

  const controlBg = useColorModeValue('blackAlpha.700', 'blackAlpha.800')

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleTimeUpdate = () => setCurrentTime(video.currentTime)
    const handleDurationChange = () => setDuration(video.duration)
    const handlePlay = () => setIsPlaying(true)
    const handlePause = () => setIsPlaying(false)
    const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement)

    video.addEventListener('timeupdate', handleTimeUpdate)
    video.addEventListener('durationchange', handleDurationChange)
    video.addEventListener('play', handlePlay)
    video.addEventListener('pause', handlePause)
    document.addEventListener('fullscreenchange', handleFullscreenChange)

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate)
      video.removeEventListener('durationchange', handleDurationChange)
      video.removeEventListener('play', handlePlay)
      video.removeEventListener('pause', handlePause)
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
    }
  }, [])

  const togglePlay = () => {
    const video = videoRef.current
    if (!video) return

    if (isPlaying) {
      video.pause()
    } else {
      video.play()
    }
  }

  const toggleMute = () => {
    const video = videoRef.current
    if (!video) return

    video.muted = !isMuted
    setIsMuted(!isMuted)
  }

  const handleSeek = (value: number) => {
    const video = videoRef.current
    if (!video) return

    video.currentTime = value
    setCurrentTime(value)
  }

  const toggleFullscreen = () => {
    const container = containerRef.current
    if (!container) return

    if (isFullscreen) {
      document.exitFullscreen()
    } else {
      container.requestFullscreen()
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <Box
      ref={containerRef}
      position="relative"
      borderRadius="lg"
      overflow="hidden"
      bg="black"
      w="100%"
      _hover={{ '& > .controls': { opacity: 1 } }}
    >
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        autoPlay={autoplay}
        muted={muted}
        loop={loop}
        style={{ width: '100%', display: 'block' }}
        onClick={togglePlay}
      />

      {controls && (
        <Box
          className="controls"
          position="absolute"
          bottom={0}
          left={0}
          right={0}
          p={4}
          bg={controlBg}
          opacity={isPlaying ? 0 : 1}
          transition="opacity 0.3s"
        >
          {/* Progress bar */}
          <Slider
            value={currentTime}
            min={0}
            max={duration || 100}
            onChange={handleSeek}
            mb={2}
          >
            <SliderTrack bg="whiteAlpha.300">
              <SliderFilledTrack bg="luxury.gold" />
            </SliderTrack>
            <SliderThumb boxSize={3} />
          </Slider>

          {/* Controls */}
          <HStack justify="space-between">
            <HStack spacing={2}>
              <IconButton
                aria-label={isPlaying ? 'Pause' : 'Play'}
                icon={isPlaying ? <FiPause /> : <FiPlay />}
                onClick={togglePlay}
                variant="ghost"
                color="white"
                size="sm"
              />

              <IconButton
                aria-label={isMuted ? 'Unmute' : 'Mute'}
                icon={isMuted ? <FiVolumeX /> : <FiVolume2 />}
                onClick={toggleMute}
                variant="ghost"
                color="white"
                size="sm"
              />

              <Text color="white" fontSize="sm">
                {formatTime(currentTime)} / {formatTime(duration)}
              </Text>
            </HStack>

            <IconButton
              aria-label={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
              icon={isFullscreen ? <FiMinimize /> : <FiMaximize />}
              onClick={toggleFullscreen}
              variant="ghost"
              color="white"
              size="sm"
            />
          </HStack>
        </Box>
      )}
    </Box>
  )
}
