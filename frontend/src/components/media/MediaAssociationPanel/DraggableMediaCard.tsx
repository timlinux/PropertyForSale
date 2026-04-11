// SPDX-FileCopyrightText: 2026 Tim Sutton <tim@kartoza.com>
// SPDX-License-Identifier: EUPL-1.2

import { Box, Image, Text, Badge, Center, VStack, Icon } from '@chakra-ui/react'
import { FiPlay, FiVolume2 } from 'react-icons/fi'
import type { Media } from '../../../api'

interface DraggableMediaCardProps {
  media: Media
  onDragStart: (e: React.DragEvent, media: Media) => void
  onDragEnd: (e: React.DragEvent) => void
  isDragging?: boolean
}

export default function DraggableMediaCard({
  media,
  onDragStart,
  onDragEnd,
  isDragging = false,
}: DraggableMediaCardProps) {
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', media.id)
    onDragStart(e, media)
  }

  return (
    <Box
      draggable
      onDragStart={handleDragStart}
      onDragEnd={onDragEnd}
      cursor="grab"
      borderRadius="md"
      overflow="hidden"
      bg="white"
      boxShadow="sm"
      opacity={isDragging ? 0.5 : 1}
      transform={isDragging ? 'scale(0.95)' : 'scale(1)'}
      transition="all 0.2s ease"
      _hover={{ boxShadow: 'md', transform: 'scale(1.02)' }}
      _active={{ cursor: 'grabbing', transform: 'scale(1.05)' }}
    >
      <Box position="relative" h="80px">
        {media.type === 'image' && (
          <Image
            src={media.thumbnail_url || media.url}
            alt={media.file_name}
            w="100%"
            h="100%"
            objectFit="cover"
            pointerEvents="none"
          />
        )}
        {(media.type === 'video' || media.type === 'video360') && (
          <>
            <Image
              src={media.thumbnail_url || media.url}
              alt={media.file_name}
              w="100%"
              h="100%"
              objectFit="cover"
              pointerEvents="none"
            />
            <Center
              position="absolute"
              top={0}
              left={0}
              right={0}
              bottom={0}
              bg="blackAlpha.300"
            >
              <Icon as={FiPlay} boxSize={6} color="white" />
            </Center>
            <Badge
              position="absolute"
              top={1}
              right={1}
              colorScheme={media.type === 'video360' ? 'purple' : 'blue'}
              fontSize="xx-small"
            >
              {media.type === 'video360' ? '360' : 'VID'}
            </Badge>
          </>
        )}
        {media.type === 'audio' && (
          <Center h="100%" bg="green.50">
            <VStack spacing={1}>
              <Icon as={FiVolume2} boxSize={6} color="green.500" />
              <Badge colorScheme="green" fontSize="xx-small">
                Audio
              </Badge>
            </VStack>
          </Center>
        )}
        {media.type === 'model3d' && (
          <Center h="100%" bg="purple.50">
            <VStack spacing={1}>
              <Text fontSize="xl">3D</Text>
              <Badge colorScheme="purple" fontSize="xx-small">
                Model
              </Badge>
            </VStack>
          </Center>
        )}
        {media.type === 'scene3d' && (
          <Center h="100%" bg="cyan.50">
            <VStack spacing={1}>
              <Text fontSize="xl">3D</Text>
              <Badge colorScheme="cyan" fontSize="xx-small">
                Scene
              </Badge>
            </VStack>
          </Center>
        )}
        {media.type === 'document' && (
          <Center h="100%" bg="gray.100">
            <VStack spacing={1}>
              <Text fontSize="xl">DOC</Text>
              <Badge colorScheme="gray" fontSize="xx-small">
                Doc
              </Badge>
            </VStack>
          </Center>
        )}
      </Box>
      <Box p={1.5} bg="gray.50">
        <Text fontSize="xx-small" noOfLines={1} color="gray.600">
          {media.file_name}
        </Text>
      </Box>
    </Box>
  )
}
