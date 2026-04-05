// SPDX-FileCopyrightText: 2026 Tim Sutton <tim@kartoza.com>
// SPDX-License-Identifier: EUPL-1.2

import {
  Box,
  VStack,
  HStack,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Select,
  Switch,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  IconButton,
  Icon,
  Text,
  Divider,
  useColorModeValue,
} from '@chakra-ui/react'
import { FiTrash2, FiChevronUp, FiChevronDown, FiMove } from 'react-icons/fi'
import type { PageBlock, BlockType } from '../../api'

interface BlockEditorProps {
  block: PageBlock
  isFirst: boolean
  isLast: boolean
  onUpdate: (data: Record<string, unknown>, settings?: Record<string, unknown>) => void
  onDelete: () => void
  onMoveUp: () => void
  onMoveDown: () => void
}

// Block-specific editors
function HeroEditor({ data, onChange }: { data: Record<string, unknown>; onChange: (d: Record<string, unknown>) => void }) {
  return (
    <VStack spacing={3} align="stretch">
      <FormControl>
        <FormLabel fontSize="sm">Title</FormLabel>
        <Input
          size="sm"
          value={(data.title as string) || ''}
          onChange={(e) => onChange({ ...data, title: e.target.value })}
        />
      </FormControl>
      <FormControl>
        <FormLabel fontSize="sm">Subtitle</FormLabel>
        <Input
          size="sm"
          value={(data.subtitle as string) || ''}
          onChange={(e) => onChange({ ...data, subtitle: e.target.value })}
        />
      </FormControl>
      <FormControl>
        <FormLabel fontSize="sm">Background Image URL</FormLabel>
        <Input
          size="sm"
          value={(data.image_url as string) || ''}
          onChange={(e) => onChange({ ...data, image_url: e.target.value })}
        />
      </FormControl>
      <FormControl>
        <FormLabel fontSize="sm">Button Text</FormLabel>
        <Input
          size="sm"
          value={(data.button_text as string) || ''}
          onChange={(e) => onChange({ ...data, button_text: e.target.value })}
        />
      </FormControl>
      <FormControl>
        <FormLabel fontSize="sm">Button Link</FormLabel>
        <Input
          size="sm"
          value={(data.button_url as string) || ''}
          onChange={(e) => onChange({ ...data, button_url: e.target.value })}
        />
      </FormControl>
    </VStack>
  )
}

function TextEditor({ data, onChange }: { data: Record<string, unknown>; onChange: (d: Record<string, unknown>) => void }) {
  return (
    <VStack spacing={3} align="stretch">
      <FormControl>
        <FormLabel fontSize="sm">Content</FormLabel>
        <Textarea
          size="sm"
          rows={6}
          value={(data.content as string) || ''}
          onChange={(e) => onChange({ ...data, content: e.target.value })}
          placeholder="Enter text content (supports Markdown)"
        />
      </FormControl>
      <FormControl>
        <FormLabel fontSize="sm">Alignment</FormLabel>
        <Select
          size="sm"
          value={(data.alignment as string) || 'left'}
          onChange={(e) => onChange({ ...data, alignment: e.target.value })}
        >
          <option value="left">Left</option>
          <option value="center">Center</option>
          <option value="right">Right</option>
        </Select>
      </FormControl>
    </VStack>
  )
}

function ImageEditor({ data, onChange }: { data: Record<string, unknown>; onChange: (d: Record<string, unknown>) => void }) {
  return (
    <VStack spacing={3} align="stretch">
      <FormControl>
        <FormLabel fontSize="sm">Image URL</FormLabel>
        <Input
          size="sm"
          value={(data.url as string) || ''}
          onChange={(e) => onChange({ ...data, url: e.target.value })}
        />
      </FormControl>
      <FormControl>
        <FormLabel fontSize="sm">Alt Text</FormLabel>
        <Input
          size="sm"
          value={(data.alt as string) || ''}
          onChange={(e) => onChange({ ...data, alt: e.target.value })}
        />
      </FormControl>
      <FormControl>
        <FormLabel fontSize="sm">Caption</FormLabel>
        <Input
          size="sm"
          value={(data.caption as string) || ''}
          onChange={(e) => onChange({ ...data, caption: e.target.value })}
        />
      </FormControl>
    </VStack>
  )
}

function VideoEditor({ data, onChange }: { data: Record<string, unknown>; onChange: (d: Record<string, unknown>) => void }) {
  return (
    <VStack spacing={3} align="stretch">
      <FormControl>
        <FormLabel fontSize="sm">Video URL</FormLabel>
        <Input
          size="sm"
          value={(data.url as string) || ''}
          onChange={(e) => onChange({ ...data, url: e.target.value })}
        />
      </FormControl>
      <FormControl display="flex" alignItems="center">
        <FormLabel fontSize="sm" mb={0}>Autoplay</FormLabel>
        <Switch
          isChecked={(data.autoplay as boolean) || false}
          onChange={(e) => onChange({ ...data, autoplay: e.target.checked })}
        />
      </FormControl>
      <FormControl display="flex" alignItems="center">
        <FormLabel fontSize="sm" mb={0}>Loop</FormLabel>
        <Switch
          isChecked={(data.loop as boolean) || false}
          onChange={(e) => onChange({ ...data, loop: e.target.checked })}
        />
      </FormControl>
    </VStack>
  )
}

function CTAEditor({ data, onChange }: { data: Record<string, unknown>; onChange: (d: Record<string, unknown>) => void }) {
  return (
    <VStack spacing={3} align="stretch">
      <FormControl>
        <FormLabel fontSize="sm">Heading</FormLabel>
        <Input
          size="sm"
          value={(data.heading as string) || ''}
          onChange={(e) => onChange({ ...data, heading: e.target.value })}
        />
      </FormControl>
      <FormControl>
        <FormLabel fontSize="sm">Description</FormLabel>
        <Textarea
          size="sm"
          rows={3}
          value={(data.description as string) || ''}
          onChange={(e) => onChange({ ...data, description: e.target.value })}
        />
      </FormControl>
      <FormControl>
        <FormLabel fontSize="sm">Button Text</FormLabel>
        <Input
          size="sm"
          value={(data.button_text as string) || ''}
          onChange={(e) => onChange({ ...data, button_text: e.target.value })}
        />
      </FormControl>
      <FormControl>
        <FormLabel fontSize="sm">Button URL</FormLabel>
        <Input
          size="sm"
          value={(data.button_url as string) || ''}
          onChange={(e) => onChange({ ...data, button_url: e.target.value })}
        />
      </FormControl>
    </VStack>
  )
}

function SpacerEditor({ data, onChange }: { data: Record<string, unknown>; onChange: (d: Record<string, unknown>) => void }) {
  return (
    <FormControl>
      <FormLabel fontSize="sm">Height (px)</FormLabel>
      <NumberInput
        size="sm"
        min={8}
        max={200}
        value={(data.height as number) || 40}
        onChange={(_, val) => onChange({ ...data, height: val })}
      >
        <NumberInputField />
        <NumberInputStepper>
          <NumberIncrementStepper />
          <NumberDecrementStepper />
        </NumberInputStepper>
      </NumberInput>
    </FormControl>
  )
}

function HTMLEditor({ data, onChange }: { data: Record<string, unknown>; onChange: (d: Record<string, unknown>) => void }) {
  return (
    <FormControl>
      <FormLabel fontSize="sm">HTML Code</FormLabel>
      <Textarea
        size="sm"
        rows={8}
        fontFamily="mono"
        value={(data.html as string) || ''}
        onChange={(e) => onChange({ ...data, html: e.target.value })}
        placeholder="<div>Custom HTML here</div>"
      />
    </FormControl>
  )
}

function GenericEditor({ data, onChange }: { data: Record<string, unknown>; onChange: (d: Record<string, unknown>) => void }) {
  return (
    <FormControl>
      <FormLabel fontSize="sm">JSON Data</FormLabel>
      <Textarea
        size="sm"
        rows={6}
        fontFamily="mono"
        value={JSON.stringify(data, null, 2)}
        onChange={(e) => {
          try {
            onChange(JSON.parse(e.target.value))
          } catch {
            // Invalid JSON, ignore
          }
        }}
      />
    </FormControl>
  )
}

function getEditorForType(type: BlockType) {
  switch (type) {
    case 'hero':
      return HeroEditor
    case 'text':
      return TextEditor
    case 'image':
      return ImageEditor
    case 'video':
    case 'video360':
      return VideoEditor
    case 'cta':
      return CTAEditor
    case 'spacer':
      return SpacerEditor
    case 'html':
      return HTMLEditor
    default:
      return GenericEditor
  }
}

const blockTypeLabels: Record<BlockType, string> = {
  hero: 'Hero',
  text: 'Text',
  image: 'Image',
  gallery: 'Gallery',
  video: 'Video',
  video360: '360 Video',
  features: 'Features',
  pricing: 'Pricing',
  testimonial: 'Testimonial',
  cta: 'Call to Action',
  contact: 'Contact',
  map: 'Map',
  properties: 'Properties',
  divider: 'Divider',
  html: 'HTML',
  spacer: 'Spacer',
}

export function BlockEditor({
  block,
  isFirst,
  isLast,
  onUpdate,
  onDelete,
  onMoveUp,
  onMoveDown,
}: BlockEditorProps) {
  const borderColor = useColorModeValue('gray.200', 'gray.600')
  const bgColor = useColorModeValue('white', 'gray.800')
  const Editor = getEditorForType(block.block_type)

  return (
    <Box
      border="1px solid"
      borderColor={borderColor}
      borderRadius="md"
      bg={bgColor}
      overflow="hidden"
    >
      <HStack
        p={2}
        bg={useColorModeValue('gray.50', 'gray.700')}
        borderBottom="1px solid"
        borderColor={borderColor}
        justify="space-between"
      >
        <HStack>
          <Icon as={FiMove} color="gray.400" cursor="grab" />
          <Text fontSize="sm" fontWeight="medium">
            {blockTypeLabels[block.block_type]}
          </Text>
        </HStack>
        <HStack spacing={1}>
          <IconButton
            aria-label="Move up"
            icon={<FiChevronUp />}
            size="xs"
            variant="ghost"
            isDisabled={isFirst}
            onClick={onMoveUp}
          />
          <IconButton
            aria-label="Move down"
            icon={<FiChevronDown />}
            size="xs"
            variant="ghost"
            isDisabled={isLast}
            onClick={onMoveDown}
          />
          <Divider orientation="vertical" h={4} />
          <IconButton
            aria-label="Delete block"
            icon={<FiTrash2 />}
            size="xs"
            variant="ghost"
            colorScheme="red"
            onClick={onDelete}
          />
        </HStack>
      </HStack>
      <Box p={3}>
        <Editor
          data={block.data || {}}
          onChange={(newData) => onUpdate(newData, block.settings)}
        />
      </Box>
    </Box>
  )
}
