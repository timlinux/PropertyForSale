// SPDX-FileCopyrightText: 2026 Tim Sutton <tim@kartoza.com>
// SPDX-License-Identifier: EUPL-1.2

import { useRef, useState, useEffect, useCallback } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import {
  Box,
  IconButton,
  HStack,
  VStack,
  Text,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  Spinner,
  Center,
  Tooltip,
  useColorModeValue,
} from '@chakra-ui/react'
import {
  FiPlay,
  FiPause,
  FiVolume2,
  FiVolumeX,
  FiMaximize,
  FiMinimize,
  FiRotateCcw,
} from 'react-icons/fi'
import * as THREE from 'three'

interface Video360PlayerProps {
  src: string
  poster?: string
  height?: string
  autoPlay?: boolean
  muted?: boolean
  loop?: boolean
}

export default function Video360Player({
  src,
  poster,
  height = '500px',
  autoPlay = false,
  muted = true,
  loop = true,
}: Video360PlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const [isPlaying, setIsPlaying] = useState(autoPlay)
  const [isLoading, setIsLoading] = useState(true)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(muted ? 0 : 1)
  const [isMuted, setIsMuted] = useState(muted)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showControls, setShowControls] = useState(true)

  const controlsBg = useColorModeValue('whiteAlpha.900', 'blackAlpha.800')

  // Create video element
  useEffect(() => {
    const video = document.createElement('video')
    video.src = src
    video.crossOrigin = 'anonymous'
    video.loop = loop
    video.muted = muted
    video.playsInline = true
    if (poster) video.poster = poster

    video.addEventListener('loadeddata', () => {
      setIsLoading(false)
      setDuration(video.duration)
    })

    video.addEventListener('timeupdate', () => {
      setCurrentTime(video.currentTime)
    })

    video.addEventListener('play', () => setIsPlaying(true))
    video.addEventListener('pause', () => setIsPlaying(false))

    if (autoPlay) {
      video.play().catch(() => {
        // Autoplay blocked, user interaction needed
        setIsPlaying(false)
      })
    }

    videoRef.current = video

    return () => {
      video.pause()
      video.src = ''
    }
  }, [src, poster, autoPlay, muted, loop])

  const togglePlay = useCallback(() => {
    const video = videoRef.current
    if (!video) return

    if (isPlaying) {
      video.pause()
    } else {
      video.play()
    }
  }, [isPlaying])

  const toggleMute = useCallback(() => {
    const video = videoRef.current
    if (!video) return

    video.muted = !isMuted
    setIsMuted(!isMuted)
  }, [isMuted])

  const handleVolumeChange = useCallback((val: number) => {
    const video = videoRef.current
    if (!video) return

    video.volume = val / 100
    setVolume(val / 100)
    setIsMuted(val === 0)
  }, [])

  const handleSeek = useCallback((val: number) => {
    const video = videoRef.current
    if (!video) return

    video.currentTime = (val / 100) * duration
  }, [duration])

  const toggleFullscreen = async () => {
    if (!containerRef.current) return

    if (!document.fullscreenElement) {
      await containerRef.current.requestFullscreen()
      setIsFullscreen(true)
    } else {
      await document.exitFullscreen()
      setIsFullscreen(false)
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
      h={height}
      borderRadius="lg"
      overflow="hidden"
      bg="black"
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
    >
      <Canvas>
        {isLoading ? (
          <Html center>
            <Center>
              <VStack>
                <Spinner size="xl" color="yellow.500" />
                <Text color="white">Loading 360° Video...</Text>
              </VStack>
            </Center>
          </Html>
        ) : (
          <Video360Sphere videoElement={videoRef.current} />
        )}
      </Canvas>

      {/* 360° badge */}
      <Box
        position="absolute"
        top={4}
        left={4}
        bg="blackAlpha.700"
        color="white"
        px={3}
        py={1}
        borderRadius="full"
        fontSize="sm"
        fontWeight="bold"
      >
        360°
      </Box>

      {/* Instructions */}
      <Text
        position="absolute"
        top={4}
        right={4}
        color="white"
        fontSize="xs"
        bg="blackAlpha.600"
        px={2}
        py={1}
        borderRadius="md"
      >
        Drag to look around
      </Text>

      {/* Controls */}
      {showControls && (
        <Box
          position="absolute"
          bottom={0}
          left={0}
          right={0}
          bg={controlsBg}
          p={3}
          transition="opacity 0.3s"
        >
          {/* Progress bar */}
          <Slider
            aria-label="Video progress"
            value={duration > 0 ? (currentTime / duration) * 100 : 0}
            onChange={handleSeek}
            mb={2}
          >
            <SliderTrack>
              <SliderFilledTrack bg="luxury.gold" />
            </SliderTrack>
            <SliderThumb />
          </Slider>

          <HStack justify="space-between">
            <HStack spacing={2}>
              <Tooltip label={isPlaying ? 'Pause' : 'Play'} hasArrow>
                <IconButton
                  aria-label={isPlaying ? 'Pause' : 'Play'}
                  icon={isPlaying ? <FiPause /> : <FiPlay />}
                  variant="ghost"
                  size="sm"
                  onClick={togglePlay}
                />
              </Tooltip>

              <Tooltip label={isMuted ? 'Unmute' : 'Mute'} hasArrow>
                <IconButton
                  aria-label={isMuted ? 'Unmute' : 'Mute'}
                  icon={isMuted ? <FiVolumeX /> : <FiVolume2 />}
                  variant="ghost"
                  size="sm"
                  onClick={toggleMute}
                />
              </Tooltip>

              <Box w="60px">
                <Slider
                  aria-label="Volume"
                  value={isMuted ? 0 : volume * 100}
                  onChange={handleVolumeChange}
                  size="sm"
                >
                  <SliderTrack>
                    <SliderFilledTrack bg="luxury.gold" />
                  </SliderTrack>
                  <SliderThumb boxSize={3} />
                </Slider>
              </Box>

              <Text fontSize="xs" color="gray.500">
                {formatTime(currentTime)} / {formatTime(duration)}
              </Text>
            </HStack>

            <HStack spacing={2}>
              <Tooltip label="Reset View" hasArrow>
                <IconButton
                  aria-label="Reset view"
                  icon={<FiRotateCcw />}
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    window.dispatchEvent(new CustomEvent('reset-360-view'))
                  }}
                />
              </Tooltip>

              <Tooltip label={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'} hasArrow>
                <IconButton
                  aria-label="Fullscreen"
                  icon={isFullscreen ? <FiMinimize /> : <FiMaximize />}
                  variant="ghost"
                  size="sm"
                  onClick={toggleFullscreen}
                />
              </Tooltip>
            </HStack>
          </HStack>
        </Box>
      )}
    </Box>
  )
}

interface Video360SphereProps {
  videoElement: HTMLVideoElement | null
}

function Video360Sphere({ videoElement }: Video360SphereProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const { camera, gl } = useThree()
  const [isDragging, setIsDragging] = useState(false)
  const [lastMouse, setLastMouse] = useState({ x: 0, y: 0 })

  // Create video texture
  const [videoTexture] = useState(() => {
    if (!videoElement) return null
    const texture = new THREE.VideoTexture(videoElement)
    texture.minFilter = THREE.LinearFilter
    texture.magFilter = THREE.LinearFilter
    texture.format = THREE.RGBAFormat
    return texture
  })

  // Handle mouse drag for looking around
  useEffect(() => {
    const canvas = gl.domElement

    const handleMouseDown = (e: MouseEvent) => {
      setIsDragging(true)
      setLastMouse({ x: e.clientX, y: e.clientY })
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return

      const deltaX = e.clientX - lastMouse.x
      const deltaY = e.clientY - lastMouse.y

      camera.rotation.y -= deltaX * 0.002
      camera.rotation.x -= deltaY * 0.002

      // Clamp vertical rotation
      camera.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, camera.rotation.x))

      setLastMouse({ x: e.clientX, y: e.clientY })
    }

    const handleMouseUp = () => {
      setIsDragging(false)
    }

    const handleResetView = () => {
      camera.rotation.set(0, 0, 0)
    }

    canvas.addEventListener('mousedown', handleMouseDown)
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    window.addEventListener('reset-360-view', handleResetView)

    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
      window.removeEventListener('reset-360-view', handleResetView)
    }
  }, [camera, gl, isDragging, lastMouse])

  // Update texture each frame
  useFrame(() => {
    if (videoTexture) {
      videoTexture.needsUpdate = true
    }
  })

  if (!videoTexture) return null

  return (
    <mesh ref={meshRef} scale={[-1, 1, 1]}>
      <sphereGeometry args={[500, 60, 40]} />
      <meshBasicMaterial map={videoTexture} side={THREE.BackSide} />
    </mesh>
  )
}
