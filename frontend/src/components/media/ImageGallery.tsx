// SPDX-FileCopyrightText: 2026 Tim Sutton <tim@kartoza.com>
// SPDX-License-Identifier: EUPL-1.2

import { useState, useCallback } from 'react'
import {
  Box,
  Image,
  SimpleGrid,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalBody,
  ModalCloseButton,
  IconButton,
  HStack,
  useDisclosure,
  AspectRatio,
} from '@chakra-ui/react'
import { FiChevronLeft, FiChevronRight, FiMaximize2 } from 'react-icons/fi'
import type { Media } from '../../api'

interface ImageGalleryProps {
  images: Media[]
  columns?: { base: number; md: number; lg: number }
}

export default function ImageGallery({
  images,
  columns = { base: 2, md: 3, lg: 4 },
}: ImageGalleryProps) {
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [selectedIndex, setSelectedIndex] = useState(0)

  const handleImageClick = useCallback((index: number) => {
    setSelectedIndex(index)
    onOpen()
  }, [onOpen])

  const handlePrevious = useCallback(() => {
    setSelectedIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1))
  }, [images.length])

  const handleNext = useCallback(() => {
    setSelectedIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0))
  }, [images.length])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') handlePrevious()
    if (e.key === 'ArrowRight') handleNext()
    if (e.key === 'Escape') onClose()
  }, [handlePrevious, handleNext, onClose])

  if (images.length === 0) {
    return (
      <Box
        h="200px"
        bg="gray.100"
        borderRadius="lg"
        display="flex"
        alignItems="center"
        justifyContent="center"
        color="gray.500"
      >
        No images available
      </Box>
    )
  }

  const selectedImage = images[selectedIndex]

  return (
    <>
      <SimpleGrid columns={columns} spacing={4}>
        {images.map((image, index) => (
          <Box
            key={image.id}
            position="relative"
            borderRadius="lg"
            overflow="hidden"
            cursor="pointer"
            onClick={() => handleImageClick(index)}
            _hover={{
              '& > .overlay': { opacity: 1 },
            }}
          >
            <AspectRatio ratio={4 / 3}>
              <Image
                src={image.thumbnail_url || image.url}
                alt={image.file_name}
                objectFit="cover"
              />
            </AspectRatio>
            <Box
              className="overlay"
              position="absolute"
              inset={0}
              bg="blackAlpha.500"
              opacity={0}
              transition="opacity 0.2s"
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              <FiMaximize2 color="white" size={24} />
            </Box>
          </Box>
        ))}
      </SimpleGrid>

      {/* Lightbox Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="6xl" isCentered>
        <ModalOverlay bg="blackAlpha.900" />
        <ModalContent
          bg="transparent"
          boxShadow="none"
          maxW="90vw"
          maxH="90vh"
          onKeyDown={handleKeyDown}
          tabIndex={0}
        >
          <ModalCloseButton color="white" size="lg" zIndex={10} />
          <ModalBody p={0} position="relative">
            <HStack justify="center" align="center" h="80vh">
              <IconButton
                aria-label="Previous image"
                icon={<FiChevronLeft size={32} />}
                onClick={handlePrevious}
                variant="ghost"
                color="white"
                size="lg"
                _hover={{ bg: 'whiteAlpha.200' }}
              />

              <Image
                src={selectedImage?.url}
                alt={selectedImage?.file_name}
                maxH="80vh"
                maxW="70vw"
                objectFit="contain"
              />

              <IconButton
                aria-label="Next image"
                icon={<FiChevronRight size={32} />}
                onClick={handleNext}
                variant="ghost"
                color="white"
                size="lg"
                _hover={{ bg: 'whiteAlpha.200' }}
              />
            </HStack>

            {/* Thumbnail strip */}
            <HStack
              justify="center"
              spacing={2}
              mt={4}
              overflowX="auto"
              py={2}
            >
              {images.map((image, index) => (
                <Box
                  key={image.id}
                  w="60px"
                  h="45px"
                  borderRadius="md"
                  overflow="hidden"
                  cursor="pointer"
                  opacity={index === selectedIndex ? 1 : 0.5}
                  border={index === selectedIndex ? '2px solid' : 'none'}
                  borderColor="luxury.gold"
                  transition="all 0.2s"
                  onClick={() => setSelectedIndex(index)}
                >
                  <Image
                    src={image.thumbnail_url || image.url}
                    alt={image.file_name}
                    w="100%"
                    h="100%"
                    objectFit="cover"
                  />
                </Box>
              ))}
            </HStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  )
}
