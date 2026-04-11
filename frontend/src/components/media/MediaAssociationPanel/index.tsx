// SPDX-FileCopyrightText: 2026 Tim Sutton <tim@kartoza.com>
// SPDX-License-Identifier: EUPL-1.2

import { useState, useCallback } from 'react'
import { HStack, VStack, useToast, Box, Button, Text } from '@chakra-ui/react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { FiArrowLeft, FiArrowRight } from 'react-icons/fi'
import { api, Media } from '../../../api'
import DropZone from './DropZone'

interface MediaAssociationPanelProps {
  propertySlug: string
  propertyId: string
  entityType: 'structure' | 'room' | 'area'
  entityId: string
  entityName: string
}

export default function MediaAssociationPanel({
  propertySlug,
  propertyId,
  entityType,
  entityId,
  entityName,
}: MediaAssociationPanelProps) {
  const toast = useToast()
  const queryClient = useQueryClient()
  const [draggingMedia, setDraggingMedia] = useState<Media | null>(null)
  const [showMobileButtons, setShowMobileButtons] = useState(false)
  const [selectedForMove, setSelectedForMove] = useState<Media | null>(null)

  // Fetch all property media
  const { data: mediaData, isLoading } = useQuery({
    queryKey: ['media', propertySlug],
    queryFn: () => api.getPropertyMedia(propertySlug),
  })

  const allMedia = mediaData?.data || []

  // Split media into property-level (unassigned) and entity-specific
  const propertyMedia = allMedia.filter(
    (m) => m.entity_type === 'property' && m.entity_id === propertyId
  )
  const entityMedia = allMedia.filter(
    (m) => m.entity_type === entityType && m.entity_id === entityId
  )

  // Mutation for updating media association
  const updateMediaMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { entity_type: string; entity_id: string } }) =>
      api.updateMedia(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media', propertySlug] })
    },
    onError: () => {
      toast({
        title: 'Failed to move media',
        status: 'error',
        duration: 3000,
      })
    },
  })

  // Drag handlers
  const handleDragStart = useCallback((_e: React.DragEvent, media: Media) => {
    setDraggingMedia(media)
  }, [])

  const handleDragEnd = useCallback(() => {
    setDraggingMedia(null)
  }, [])

  // Drop handlers
  const handleDropToEntity = useCallback(
    (mediaId: string) => {
      const media = allMedia.find((m) => m.id === mediaId)
      if (!media) return

      // Only move if it's currently at property level
      if (media.entity_type === 'property') {
        updateMediaMutation.mutate({
          id: mediaId,
          data: { entity_type: entityType, entity_id: entityId },
        })
        toast({
          title: `Media assigned to ${entityName}`,
          status: 'success',
          duration: 2000,
        })
      }
      setDraggingMedia(null)
    },
    [allMedia, entityType, entityId, entityName, updateMediaMutation, toast]
  )

  const handleDropToProperty = useCallback(
    (mediaId: string) => {
      const media = allMedia.find((m) => m.id === mediaId)
      if (!media) return

      // Only move if it's currently assigned to this entity
      if (media.entity_type === entityType && media.entity_id === entityId) {
        updateMediaMutation.mutate({
          id: mediaId,
          data: { entity_type: 'property', entity_id: propertyId },
        })
        toast({
          title: 'Media returned to property level',
          status: 'success',
          duration: 2000,
        })
      }
      setDraggingMedia(null)
    },
    [allMedia, entityType, entityId, propertyId, updateMediaMutation, toast]
  )

  // Mobile fallback - use buttons instead of drag
  const handleMobileMove = (direction: 'toEntity' | 'toProperty') => {
    if (!selectedForMove) return

    if (direction === 'toEntity' && selectedForMove.entity_type === 'property') {
      updateMediaMutation.mutate({
        id: selectedForMove.id,
        data: { entity_type: entityType, entity_id: entityId },
      })
      toast({
        title: `Media assigned to ${entityName}`,
        status: 'success',
        duration: 2000,
      })
    } else if (direction === 'toProperty' && selectedForMove.entity_type === entityType) {
      updateMediaMutation.mutate({
        id: selectedForMove.id,
        data: { entity_type: 'property', entity_id: propertyId },
      })
      toast({
        title: 'Media returned to property level',
        status: 'success',
        duration: 2000,
      })
    }
    setSelectedForMove(null)
    setShowMobileButtons(false)
  }

  // Touch device detection
  const isTouchDevice = typeof window !== 'undefined' && 'ontouchstart' in window

  return (
    <VStack spacing={3} align="stretch" w="100%">
      {/* Mobile move buttons */}
      {showMobileButtons && selectedForMove && isTouchDevice && (
        <Box
          p={2}
          bg="blue.50"
          borderRadius="md"
          transition="all 0.2s"
        >
          <HStack justify="center" spacing={4}>
            <Text fontSize="sm" color="gray.600">
              Move "{selectedForMove.file_name.slice(0, 20)}..."
            </Text>
            {selectedForMove.entity_type === 'property' ? (
              <Button
                size="sm"
                colorScheme="blue"
                rightIcon={<FiArrowRight />}
                onClick={() => handleMobileMove('toEntity')}
                isLoading={updateMediaMutation.isPending}
              >
                To {entityName}
              </Button>
            ) : (
              <Button
                size="sm"
                colorScheme="gray"
                leftIcon={<FiArrowLeft />}
                onClick={() => handleMobileMove('toProperty')}
                isLoading={updateMediaMutation.isPending}
              >
                To Property
              </Button>
            )}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setSelectedForMove(null)
                setShowMobileButtons(false)
              }}
            >
              Cancel
            </Button>
          </HStack>
        </Box>
      )}

      {/* Two-panel layout */}
      <HStack spacing={3} align="stretch">
        <DropZone
          title="Property Media"
          subtitle="Unassigned media"
          media={propertyMedia}
          onDrop={handleDropToProperty}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          draggingMediaId={draggingMedia?.id || null}
          emptyMessage="No unassigned media"
          colorScheme="gray"
          isLoading={isLoading}
        />

        {/* Direction indicator */}
        <VStack justify="center" spacing={1} py={4}>
          <Box
            w="24px"
            h="24px"
            borderRadius="full"
            bg={draggingMedia ? 'blue.100' : 'gray.100'}
            display="flex"
            alignItems="center"
            justifyContent="center"
            transition="all 0.2s"
          >
            <FiArrowRight
              size={14}
              color={draggingMedia ? '#3182CE' : '#A0AEC0'}
            />
          </Box>
          <Box
            w="24px"
            h="24px"
            borderRadius="full"
            bg={draggingMedia ? 'blue.100' : 'gray.100'}
            display="flex"
            alignItems="center"
            justifyContent="center"
            transition="all 0.2s"
          >
            <FiArrowLeft
              size={14}
              color={draggingMedia ? '#3182CE' : '#A0AEC0'}
            />
          </Box>
        </VStack>

        <DropZone
          title={entityName}
          subtitle={`${entityType.charAt(0).toUpperCase() + entityType.slice(1)} media`}
          media={entityMedia}
          onDrop={handleDropToEntity}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          draggingMediaId={draggingMedia?.id || null}
          emptyMessage={`Drag media here to assign to ${entityName}`}
          colorScheme="blue"
          isLoading={isLoading}
        />
      </HStack>

      {/* Instructions */}
      <Text fontSize="xs" color="gray.400" textAlign="center">
        Drag media between panels to associate or disassociate
      </Text>
    </VStack>
  )
}
