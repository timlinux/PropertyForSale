// SPDX-FileCopyrightText: 2026 Tim Sutton <tim@kartoza.com>
// SPDX-License-Identifier: EUPL-1.2

import { useRef, useState, useEffect } from 'react'
import {
  Box,
  Center,
  VStack,
  Text,
  Badge,
  Icon,
} from '@chakra-ui/react'
import { FiPlay, FiVolume2 } from 'react-icons/fi'
import type { Media } from '../../api'

interface MediaPreviewCardProps {
  media: Media
  height?: string
}

export default function MediaPreviewCard({ media, height = '150px' }: MediaPreviewCardProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)
  const [isHovering, setIsHovering] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)

  // Handle hover state changes
  useEffect(() => {
    if (isHovering) {
      if (media.type === 'video' || media.type === 'video360') {
        videoRef.current?.play().catch(() => {})
        setIsPlaying(true)
      } else if (media.type === 'audio') {
        audioRef.current?.play().catch(() => {})
        setIsPlaying(true)
      }
    } else {
      if (videoRef.current) {
        videoRef.current.pause()
        videoRef.current.currentTime = 0
      }
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.currentTime = 0
      }
      setIsPlaying(false)
    }
  }, [isHovering, media.type])

  const handleMouseEnter = () => setIsHovering(true)
  const handleMouseLeave = () => setIsHovering(false)

  // Image type
  if (media.type === 'image') {
    return (
      <Box
        as="img"
        src={media.thumbnail_url || media.url}
        alt={media.file_name}
        w="100%"
        h={height}
        objectFit="cover"
      />
    )
  }

  // Video type - show thumbnail or video preview on hover
  if (media.type === 'video' || media.type === 'video360') {
    return (
      <Box
        position="relative"
        w="100%"
        h={height}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        cursor="pointer"
        overflow="hidden"
      >
        {/* Thumbnail when not hovering, video when hovering */}
        {media.thumbnail_url && !isHovering ? (
          <Box
            as="img"
            src={media.thumbnail_url}
            alt={media.file_name}
            w="100%"
            h="100%"
            objectFit="cover"
          />
        ) : (
          <Box
            as="video"
            ref={videoRef}
            src={media.url}
            w="100%"
            h="100%"
            objectFit="cover"
            muted
            loop
            playsInline
          />
        )}

        {/* Video badge and play icon overlay */}
        <Box
          position="absolute"
          top={0}
          left={0}
          right={0}
          bottom={0}
          bg={isHovering ? 'transparent' : 'blackAlpha.300'}
          display="flex"
          alignItems="center"
          justifyContent="center"
          transition="all 0.2s"
        >
          {!isHovering && (
            <Icon as={FiPlay} boxSize={8} color="white" />
          )}
        </Box>

        {/* Type badge */}
        <Badge
          position="absolute"
          top={1}
          right={1}
          colorScheme={media.type === 'video360' ? 'purple' : 'blue'}
          fontSize="xs"
        >
          {media.type === 'video360' ? '360°' : 'Video'}
        </Badge>

        {/* Duration badge if available */}
        {media.duration && media.duration > 0 && (
          <Badge
            position="absolute"
            bottom={1}
            right={1}
            bg="blackAlpha.700"
            color="white"
            fontSize="xs"
          >
            {formatDuration(media.duration)}
          </Badge>
        )}
      </Box>
    )
  }

  // Audio type - show waveform-like visualization on hover
  if (media.type === 'audio') {
    return (
      <Box
        position="relative"
        w="100%"
        h={height}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        cursor="pointer"
      >
        <audio ref={audioRef} src={media.url} loop />

        <Center
          h="100%"
          bg={isPlaying ? 'green.100' : 'gray.100'}
          transition="all 0.3s"
        >
          <VStack spacing={2}>
            <Box position="relative">
              <Icon
                as={FiVolume2}
                boxSize={10}
                color={isPlaying ? 'green.500' : 'gray.500'}
              />
              {isPlaying && (
                <Box
                  position="absolute"
                  top={-1}
                  left={-1}
                  right={-1}
                  bottom={-1}
                  borderRadius="full"
                  border="2px solid"
                  borderColor="green.400"
                  animation="pulse 1s infinite"
                  sx={{
                    '@keyframes pulse': {
                      '0%': { transform: 'scale(1)', opacity: 1 },
                      '100%': { transform: 'scale(1.5)', opacity: 0 },
                    },
                  }}
                />
              )}
            </Box>
            <Text fontSize="xs" color={isPlaying ? 'green.600' : 'gray.500'} fontWeight="medium">
              {isPlaying ? 'Playing...' : 'Hover to preview'}
            </Text>
          </VStack>
        </Center>

        {/* Type badge */}
        <Badge
          position="absolute"
          top={1}
          right={1}
          colorScheme="green"
          fontSize="xs"
        >
          Audio
        </Badge>

        {/* Duration badge if available */}
        {media.duration && media.duration > 0 && (
          <Badge
            position="absolute"
            bottom={1}
            right={1}
            bg="blackAlpha.700"
            color="white"
            fontSize="xs"
          >
            {formatDuration(media.duration)}
          </Badge>
        )}
      </Box>
    )
  }

  // Other types (documents, 3D models) - show icon
  return (
    <Center h={height} bg="gray.100">
      <VStack>
        <Text fontSize="3xl">{getMediaIcon(media.type)}</Text>
        <Text fontSize="xs" color="gray.500" textTransform="uppercase">
          {media.type}
        </Text>
      </VStack>
    </Center>
  )
}

function getMediaIcon(type: string): string {
  switch (type) {
    case 'image': return '\u{1F5BC}\u{FE0F}'
    case 'video': return '\u{1F3AC}'
    case 'video360': return '\u{1F310}'
    case 'audio': return '\u{1F50A}'
    case 'model3d': return '\u{1F4E6}'
    default: return '\u{1F4C4}'
  }
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}
