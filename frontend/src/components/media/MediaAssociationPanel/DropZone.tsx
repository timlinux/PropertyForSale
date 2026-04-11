// SPDX-FileCopyrightText: 2026 Tim Sutton <tim@kartoza.com>
// SPDX-License-Identifier: EUPL-1.2

import { Box, Text, VStack, SimpleGrid, Center } from '@chakra-ui/react'
import { useState } from 'react'
import type { Media } from '../../../api'
import DraggableMediaCard from './DraggableMediaCard'

interface DropZoneProps {
  title: string
  subtitle?: string
  media: Media[]
  onDrop: (mediaId: string) => void
  onDragStart: (e: React.DragEvent, media: Media) => void
  onDragEnd: (e: React.DragEvent) => void
  draggingMediaId: string | null
  emptyMessage?: string
  colorScheme?: 'blue' | 'gray'
  isLoading?: boolean
}

export default function DropZone({
  title,
  subtitle,
  media,
  onDrop,
  onDragStart,
  onDragEnd,
  draggingMediaId,
  emptyMessage = 'No media',
  colorScheme = 'gray',
  isLoading = false,
}: DropZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setIsDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const mediaId = e.dataTransfer.getData('text/plain')
    if (mediaId) {
      onDrop(mediaId)
    }
  }

  const borderColor = isDragOver
    ? colorScheme === 'blue'
      ? 'blue.400'
      : 'gray.400'
    : colorScheme === 'blue'
      ? 'blue.200'
      : 'gray.200'

  const bgColor = isDragOver
    ? colorScheme === 'blue'
      ? 'blue.50'
      : 'gray.50'
    : 'white'

  return (
    <Box
      flex={1}
      borderWidth="2px"
      borderStyle={isDragOver ? 'solid' : 'dashed'}
      borderColor={borderColor}
      borderRadius="lg"
      bg={bgColor}
      p={3}
      minH="200px"
      transition="all 0.2s"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      position="relative"
    >
      {/* Header */}
      <VStack spacing={0} mb={3} align="stretch">
        <Text fontWeight="600" fontSize="sm" color={colorScheme === 'blue' ? 'blue.700' : 'gray.700'}>
          {title}
        </Text>
        {subtitle && (
          <Text fontSize="xs" color="gray.500">
            {subtitle}
          </Text>
        )}
      </VStack>

      {/* Drop zone glow effect when dragging over */}
      {isDragOver && (
        <Box
          position="absolute"
          top={0}
          left={0}
          right={0}
          bottom={0}
          borderRadius="lg"
          pointerEvents="none"
          boxShadow={`inset 0 0 20px ${colorScheme === 'blue' ? 'rgba(66, 153, 225, 0.3)' : 'rgba(160, 174, 192, 0.3)'}`}
          transition="all 0.2s"
        />
      )}

      {/* Media grid */}
      {isLoading ? (
        <Center h="120px">
          <Text color="gray.400" fontSize="sm">Loading...</Text>
        </Center>
      ) : media.length === 0 ? (
        <Center h="120px">
          <VStack spacing={1}>
            <Text color="gray.400" fontSize="sm" textAlign="center">
              {emptyMessage}
            </Text>
            {draggingMediaId && (
              <Text color={colorScheme === 'blue' ? 'blue.500' : 'gray.500'} fontSize="xs" fontWeight="500">
                Drop here
              </Text>
            )}
          </VStack>
        </Center>
      ) : (
        <SimpleGrid columns={{ base: 2, md: 3 }} spacing={2}>
          {media.map((item) => (
            <DraggableMediaCard
              key={item.id}
              media={item}
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
              isDragging={draggingMediaId === item.id}
            />
          ))}
        </SimpleGrid>
      )}

      {/* Item count */}
      <Text fontSize="xs" color="gray.400" mt={2} textAlign="right">
        {media.length} item{media.length !== 1 ? 's' : ''}
      </Text>
    </Box>
  )
}
