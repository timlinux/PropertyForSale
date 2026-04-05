// SPDX-FileCopyrightText: 2026 Tim Sutton <tim@kartoza.com>
// SPDX-License-Identifier: EUPL-1.2

import {
  Box,
  SimpleGrid,
  Text,
  VStack,
  Icon,
  useColorModeValue,
} from '@chakra-ui/react'
import {
  FiType,
  FiImage,
  FiGrid,
  FiVideo,
  FiStar,
  FiDollarSign,
  FiMessageSquare,
  FiMousePointer,
  FiMail,
  FiMapPin,
  FiHome,
  FiMinus,
  FiCode,
  FiMaximize,
  FiLayout,
} from 'react-icons/fi'
import type { BlockType } from '../../api'

interface BlockOption {
  type: BlockType
  label: string
  icon: React.ElementType
  description: string
}

const blockOptions: BlockOption[] = [
  { type: 'hero', label: 'Hero', icon: FiLayout, description: 'Full-width hero section with image' },
  { type: 'text', label: 'Text', icon: FiType, description: 'Rich text content block' },
  { type: 'image', label: 'Image', icon: FiImage, description: 'Single image with caption' },
  { type: 'gallery', label: 'Gallery', icon: FiGrid, description: 'Image gallery grid' },
  { type: 'video', label: 'Video', icon: FiVideo, description: 'Video player' },
  { type: 'video360', label: '360 Video', icon: FiVideo, description: '360-degree video' },
  { type: 'features', label: 'Features', icon: FiStar, description: 'Feature list with icons' },
  { type: 'pricing', label: 'Pricing', icon: FiDollarSign, description: 'Pricing table' },
  { type: 'testimonial', label: 'Testimonial', icon: FiMessageSquare, description: 'Customer quotes' },
  { type: 'cta', label: 'Call to Action', icon: FiMousePointer, description: 'Action button section' },
  { type: 'contact', label: 'Contact', icon: FiMail, description: 'Contact form' },
  { type: 'map', label: 'Map', icon: FiMapPin, description: 'Interactive map' },
  { type: 'properties', label: 'Properties', icon: FiHome, description: 'Property listings' },
  { type: 'divider', label: 'Divider', icon: FiMinus, description: 'Visual separator' },
  { type: 'html', label: 'HTML', icon: FiCode, description: 'Custom HTML code' },
  { type: 'spacer', label: 'Spacer', icon: FiMaximize, description: 'Empty space' },
]

interface BlockPaletteProps {
  onAddBlock: (type: BlockType) => void
}

export function BlockPalette({ onAddBlock }: BlockPaletteProps) {
  const bgHover = useColorModeValue('gray.100', 'gray.700')
  const borderColor = useColorModeValue('gray.200', 'gray.600')

  return (
    <Box>
      <Text fontWeight="semibold" mb={3} fontSize="sm" color="gray.500">
        Add Block
      </Text>
      <SimpleGrid columns={2} spacing={2}>
        {blockOptions.map((option) => (
          <Box
            key={option.type}
            p={3}
            borderRadius="md"
            border="1px solid"
            borderColor={borderColor}
            cursor="pointer"
            _hover={{ bg: bgHover }}
            onClick={() => onAddBlock(option.type)}
            transition="all 0.2s"
          >
            <VStack spacing={1} align="start">
              <Icon as={option.icon} boxSize={4} color="blue.500" />
              <Text fontSize="xs" fontWeight="medium">
                {option.label}
              </Text>
            </VStack>
          </Box>
        ))}
      </SimpleGrid>
    </Box>
  )
}

export { blockOptions }
