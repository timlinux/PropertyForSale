// SPDX-FileCopyrightText: 2026 Tim Sutton <tim@kartoza.com>
// SPDX-License-Identifier: EUPL-1.2

import { useState, useCallback, useRef, useEffect } from 'react'
import {
  Box,
  Grid,
  GridItem,
  Image,
  AspectRatio,
  IconButton,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalBody,
  ModalCloseButton,
  HStack,
  Text,
  Badge,
  Icon,
} from '@chakra-ui/react'
import { FiChevronLeft, FiChevronRight, FiPlay, FiVolume2 } from 'react-icons/fi'
import type { Media } from '../../api'

interface MediaGalleryProps {
  media: Media[]
  onMediaClick?: (media: Media) => void
}

export default function MediaGallery({ media, onMediaClick: _onMediaClick }: MediaGalleryProps) {
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [selectedIndex, setSelectedIndex] = useState(0)

  const images = media.filter((m) => m.type === 'image')
  const videos = media.filter((m) => m.type === 'video' || m.type === 'video360')
  const audio = media.filter((m) => m.type === 'audio')

  const allVisualMedia = [...images, ...videos]

  const handlePrev = useCallback(() => {
    setSelectedIndex((prev) => (prev > 0 ? prev - 1 : allVisualMedia.length - 1))
  }, [allVisualMedia.length])

  const handleNext = useCallback(() => {
    setSelectedIndex((prev) => (prev < allVisualMedia.length - 1 ? prev + 1 : 0))
  }, [allVisualMedia.length])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowLeft') handlePrev()
      if (e.key === 'ArrowRight') handleNext()
      if (e.key === 'Escape') onClose()
    },
    [handlePrev, handleNext, onClose]
  )

  const openLightbox = (index: number) => {
    setSelectedIndex(index)
    onOpen()
  }

  if (allVisualMedia.length === 0) {
    return (
      <Box
        h="300px"
        bg="gray.100"
        borderRadius="lg"
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <Text color="gray.500">No media available</Text>
      </Box>
    )
  }

  return (
    <>
      {/* Main Gallery Grid */}
      <Grid
        templateColumns={{ base: '1fr', md: 'repeat(4, 1fr)' }}
        templateRows={{ base: 'repeat(3, 200px)', md: 'repeat(2, 200px)' }}
        gap={2}
        borderRadius="lg"
        overflow="hidden"
      >
        {/* Hero Image */}
        <GridItem
          colSpan={{ base: 1, md: 2 }}
          rowSpan={2}
          position="relative"
          cursor="pointer"
          onClick={() => openLightbox(0)}
          overflow="hidden"
        >
          <GalleryItem media={allVisualMedia[0]} />
        </GridItem>

        {/* Secondary Images */}
        {allVisualMedia.slice(1, 5).map((item, index) => (
          <GridItem
            key={item.id}
            position="relative"
            cursor="pointer"
            onClick={() => openLightbox(index + 1)}
            overflow="hidden"
          >
            <GalleryItem media={item} />

            {/* Show more overlay on last item */}
            {index === 3 && allVisualMedia.length > 5 && (
              <Box
                position="absolute"
                inset={0}
                bg="blackAlpha.600"
                display="flex"
                alignItems="center"
                justifyContent="center"
                zIndex={2}
              >
                <Text color="white" fontSize="xl" fontWeight="bold">
                  +{allVisualMedia.length - 5} more
                </Text>
              </Box>
            )}
          </GridItem>
        ))}
      </Grid>

      {/* Audio indicator */}
      {audio.length > 0 && (
        <HStack mt={2} color="gray.600" fontSize="sm">
          <FiVolume2 />
          <Text>{audio.length} ambient audio track{audio.length > 1 ? 's' : ''}</Text>
        </HStack>
      )}

      {/* Lightbox Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="full">
        <ModalOverlay bg="blackAlpha.900" />
        <ModalContent
          bg="transparent"
          boxShadow="none"
          onKeyDown={handleKeyDown}
          tabIndex={0}
        >
          <ModalCloseButton color="white" size="lg" zIndex={10} />
          <ModalBody
            display="flex"
            alignItems="center"
            justifyContent="center"
            p={0}
            position="relative"
          >
            {/* Navigation buttons */}
            <IconButton
              aria-label="Previous"
              icon={<FiChevronLeft size={32} />}
              position="absolute"
              left={4}
              variant="ghost"
              color="white"
              _hover={{ bg: 'whiteAlpha.200' }}
              onClick={handlePrev}
              zIndex={10}
            />
            <IconButton
              aria-label="Next"
              icon={<FiChevronRight size={32} />}
              position="absolute"
              right={4}
              variant="ghost"
              color="white"
              _hover={{ bg: 'whiteAlpha.200' }}
              onClick={handleNext}
              zIndex={10}
            />

            {/* Current media */}
            <Box maxW="90vw" maxH="90vh">
              {allVisualMedia[selectedIndex]?.type === 'image' ? (
                <Image
                  src={allVisualMedia[selectedIndex]?.url}
                  alt={allVisualMedia[selectedIndex]?.file_name || 'Property image'}
                  maxH="90vh"
                  objectFit="contain"
                />
              ) : (
                <AspectRatio ratio={16 / 9} maxW="90vw">
                  <video
                    src={allVisualMedia[selectedIndex]?.url}
                    controls
                    autoPlay
                    style={{ maxHeight: '90vh' }}
                  />
                </AspectRatio>
              )}
            </Box>

            {/* Counter */}
            <Text
              position="absolute"
              bottom={4}
              color="white"
              fontSize="sm"
              bg="blackAlpha.600"
              px={3}
              py={1}
              borderRadius="full"
            >
              {selectedIndex + 1} / {allVisualMedia.length}
            </Text>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  )
}

// Gallery item with hover preview for videos
interface GalleryItemProps {
  media: Media
}

function GalleryItem({ media }: GalleryItemProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isHovering, setIsHovering] = useState(false)

  useEffect(() => {
    if (media.type !== 'video' && media.type !== 'video360') return

    if (isHovering && videoRef.current) {
      videoRef.current.play().catch(() => {})
    } else if (videoRef.current) {
      videoRef.current.pause()
      videoRef.current.currentTime = 0
    }
  }, [isHovering, media.type])

  const isVideo = media.type === 'video' || media.type === 'video360'

  if (isVideo) {
    return (
      <Box
        position="relative"
        w="100%"
        h="100%"
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        {/* Show thumbnail when not hovering, video when hovering */}
        {media.thumbnail_url && !isHovering ? (
          <Image
            src={media.thumbnail_url}
            alt={media.file_name || 'Video thumbnail'}
            objectFit="cover"
            w="100%"
            h="100%"
            transition="transform 0.3s"
            _hover={{ transform: 'scale(1.05)' }}
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

        {/* Play icon overlay when not playing */}
        {!isHovering && (
          <Box
            position="absolute"
            inset={0}
            bg="blackAlpha.300"
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            <Icon as={FiPlay} boxSize={12} color="white" />
          </Box>
        )}

        {/* Video type badge */}
        <Badge
          position="absolute"
          top={2}
          right={2}
          bg="blackAlpha.700"
          color="white"
          display="flex"
          alignItems="center"
          gap={1}
          px={2}
          py={1}
        >
          <FiPlay />
          {media.type === 'video360' ? '360°' : 'Video'}
        </Badge>
      </Box>
    )
  }

  // Regular image
  return (
    <Image
      src={media.url}
      alt={media.file_name || 'Property image'}
      objectFit="cover"
      w="100%"
      h="100%"
      transition="transform 0.3s"
      _hover={{ transform: 'scale(1.05)' }}
    />
  )
}
