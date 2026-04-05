// SPDX-FileCopyrightText: 2026 Tim Sutton <tim@kartoza.com>
// SPDX-License-Identifier: EUPL-1.2

import { useState, useCallback } from 'react'
import {
  Box,
  Grid,
  GridItem,
  VStack,
  HStack,
  Button,
  Input,
  Textarea,
  FormControl,
  FormLabel,
  Select,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  useToast,
  Heading,
  Text,
  Badge,
  Divider,
  useColorModeValue,
  Spinner,
  Alert,
  AlertIcon,
} from '@chakra-ui/react'
import { FiSave, FiEye, FiUpload, FiClock } from 'react-icons/fi'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api, Page, PageBlock, BlockType, PageTemplate } from '../../api'
import { BlockPalette } from './BlockPalette'
import { BlockEditor } from './BlockEditor'
import { PageVersionHistory } from './PageVersionHistory'

interface PageBuilderProps {
  page: Page
  onClose?: () => void
}

export function PageBuilder({ page: initialPage, onClose: _onClose }: PageBuilderProps) {
  const [page, setPage] = useState<Page>(initialPage)
  const [blocks, setBlocks] = useState<PageBlock[]>(initialPage.blocks || [])
  const [hasChanges, setHasChanges] = useState(false)
  const [activeTab, setActiveTab] = useState(0)

  const toast = useToast()
  const queryClient = useQueryClient()
  const borderColor = useColorModeValue('gray.200', 'gray.600')
  const bgColor = useColorModeValue('gray.50', 'gray.900')

  // Mutations
  const updatePageMutation = useMutation({
    mutationFn: (data: Partial<Page>) => api.updatePage(page.id, data),
    onSuccess: (updatedPage) => {
      setPage(updatedPage)
      queryClient.invalidateQueries({ queryKey: ['pages'] })
      toast({ title: 'Page saved', status: 'success', duration: 2000 })
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to save page', description: error.message, status: 'error' })
    },
  })

  const createBlockMutation = useMutation({
    mutationFn: (data: { block_type: BlockType; position: number; data?: Record<string, unknown> }) =>
      api.createBlock(page.id, data),
    onSuccess: (newBlock) => {
      setBlocks((prev) => [...prev, newBlock].sort((a, b) => a.position - b.position))
      setHasChanges(true)
    },
  })

  const updateBlockMutation = useMutation({
    mutationFn: ({ blockId, data }: { blockId: string; data: Partial<PageBlock> }) =>
      api.updateBlock(page.id, blockId, data),
  })

  const deleteBlockMutation = useMutation({
    mutationFn: (blockId: string) => api.deleteBlock(page.id, blockId),
    onSuccess: (_, blockId) => {
      setBlocks((prev) => prev.filter((b) => b.id !== blockId))
      setHasChanges(true)
    },
  })

  const reorderBlocksMutation = useMutation({
    mutationFn: (blockIds: string[]) => api.reorderBlocks(page.id, blockIds),
  })

  const publishMutation = useMutation({
    mutationFn: () => api.publishPage(page.id),
    onSuccess: () => {
      setPage((prev) => ({ ...prev, status: 'published' }))
      queryClient.invalidateQueries({ queryKey: ['pages'] })
      toast({ title: 'Page published', status: 'success', duration: 2000 })
    },
  })

  const unpublishMutation = useMutation({
    mutationFn: () => api.unpublishPage(page.id),
    onSuccess: () => {
      setPage((prev) => ({ ...prev, status: 'draft' }))
      queryClient.invalidateQueries({ queryKey: ['pages'] })
      toast({ title: 'Page unpublished', status: 'info', duration: 2000 })
    },
  })

  // Handlers
  const handleAddBlock = useCallback((type: BlockType) => {
    createBlockMutation.mutate({
      block_type: type,
      position: blocks.length,
      data: getDefaultDataForType(type),
    })
  }, [blocks.length, createBlockMutation])

  const handleUpdateBlock = useCallback((blockId: string, data: Record<string, unknown>, settings?: Record<string, unknown>) => {
    setBlocks((prev) =>
      prev.map((b) => (b.id === blockId ? { ...b, data, settings: settings || b.settings } : b))
    )
    setHasChanges(true)
    // Debounced save
    updateBlockMutation.mutate({ blockId, data: { data, settings } })
  }, [updateBlockMutation])

  const handleDeleteBlock = useCallback((blockId: string) => {
    deleteBlockMutation.mutate(blockId)
  }, [deleteBlockMutation])

  const handleMoveBlock = useCallback((blockId: string, direction: 'up' | 'down') => {
    setBlocks((prev) => {
      const index = prev.findIndex((b) => b.id === blockId)
      if (index === -1) return prev
      const newIndex = direction === 'up' ? index - 1 : index + 1
      if (newIndex < 0 || newIndex >= prev.length) return prev

      const newBlocks = [...prev]
      const [removed] = newBlocks.splice(index, 1)
      newBlocks.splice(newIndex, 0, removed)

      // Update positions
      const orderedBlocks = newBlocks.map((b, i) => ({ ...b, position: i }))

      // Save new order
      reorderBlocksMutation.mutate(orderedBlocks.map((b) => b.id))

      return orderedBlocks
    })
    setHasChanges(true)
  }, [reorderBlocksMutation])

  const handleSave = useCallback(async () => {
    await updatePageMutation.mutateAsync({
      title: page.title,
      slug: page.slug,
      description: page.description,
      template: page.template,
      meta_title: page.meta_title,
      meta_description: page.meta_description,
      og_image: page.og_image,
    })
    setHasChanges(false)
  }, [page, updatePageMutation])

  const handlePageFieldChange = useCallback((field: keyof Page, value: string) => {
    setPage((prev) => ({ ...prev, [field]: value }))
    setHasChanges(true)
  }, [])

  const isLoading = updatePageMutation.isPending || publishMutation.isPending || unpublishMutation.isPending

  return (
    <Box h="100%" display="flex" flexDirection="column">
      {/* Header */}
      <HStack
        p={4}
        borderBottom="1px solid"
        borderColor={borderColor}
        justify="space-between"
        bg={useColorModeValue('white', 'gray.800')}
      >
        <HStack spacing={4}>
          <Heading size="md">{page.title || 'Untitled Page'}</Heading>
          <Badge colorScheme={page.status === 'published' ? 'green' : 'gray'}>
            {page.status}
          </Badge>
          {hasChanges && (
            <Badge colorScheme="yellow">Unsaved changes</Badge>
          )}
        </HStack>
        <HStack spacing={2}>
          <Button
            leftIcon={<FiSave />}
            size="sm"
            onClick={handleSave}
            isLoading={updatePageMutation.isPending}
            isDisabled={!hasChanges}
          >
            Save
          </Button>
          <Button
            leftIcon={<FiEye />}
            size="sm"
            variant="outline"
            as="a"
            href={`/pages/public/${page.slug}`}
            target="_blank"
          >
            Preview
          </Button>
          {page.status === 'draft' ? (
            <Button
              leftIcon={<FiUpload />}
              size="sm"
              colorScheme="blue"
              onClick={() => publishMutation.mutate()}
              isLoading={publishMutation.isPending}
            >
              Publish
            </Button>
          ) : (
            <Button
              size="sm"
              variant="outline"
              onClick={() => unpublishMutation.mutate()}
              isLoading={unpublishMutation.isPending}
            >
              Unpublish
            </Button>
          )}
        </HStack>
      </HStack>

      {/* Main content */}
      <Grid templateColumns="1fr 300px" flex={1} overflow="hidden">
        {/* Editor area */}
        <GridItem overflow="auto" p={4} bg={bgColor}>
          <Tabs index={activeTab} onChange={setActiveTab}>
            <TabList>
              <Tab>Content</Tab>
              <Tab>Settings</Tab>
              <Tab>
                <HStack spacing={1}>
                  <FiClock />
                  <Text>History</Text>
                </HStack>
              </Tab>
            </TabList>

            <TabPanels>
              {/* Content Tab */}
              <TabPanel px={0}>
                <VStack spacing={4} align="stretch">
                  {blocks.length === 0 ? (
                    <Alert status="info">
                      <AlertIcon />
                      No blocks yet. Add blocks from the palette on the right.
                    </Alert>
                  ) : (
                    blocks.map((block, index) => (
                      <BlockEditor
                        key={block.id}
                        block={block}
                        isFirst={index === 0}
                        isLast={index === blocks.length - 1}
                        onUpdate={(data, settings) => handleUpdateBlock(block.id, data, settings)}
                        onDelete={() => handleDeleteBlock(block.id)}
                        onMoveUp={() => handleMoveBlock(block.id, 'up')}
                        onMoveDown={() => handleMoveBlock(block.id, 'down')}
                      />
                    ))
                  )}
                </VStack>
              </TabPanel>

              {/* Settings Tab */}
              <TabPanel px={0}>
                <VStack spacing={4} align="stretch" maxW="600px">
                  <FormControl>
                    <FormLabel>Page Title</FormLabel>
                    <Input
                      value={page.title}
                      onChange={(e) => handlePageFieldChange('title', e.target.value)}
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel>Slug (URL)</FormLabel>
                    <Input
                      value={page.slug}
                      onChange={(e) => handlePageFieldChange('slug', e.target.value)}
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel>Description</FormLabel>
                    <Textarea
                      value={page.description || ''}
                      onChange={(e) => handlePageFieldChange('description', e.target.value)}
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel>Template</FormLabel>
                    <Select
                      value={page.template}
                      onChange={(e) => handlePageFieldChange('template', e.target.value as PageTemplate)}
                    >
                      <option value="blank">Blank</option>
                      <option value="landing">Landing Page</option>
                      <option value="property">Property Page</option>
                      <option value="contact">Contact Page</option>
                      <option value="about">About Page</option>
                    </Select>
                  </FormControl>

                  <Divider />
                  <Heading size="sm">SEO Settings</Heading>

                  <FormControl>
                    <FormLabel>Meta Title</FormLabel>
                    <Input
                      value={page.meta_title || ''}
                      onChange={(e) => handlePageFieldChange('meta_title', e.target.value)}
                      placeholder={page.title}
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel>Meta Description</FormLabel>
                    <Textarea
                      value={page.meta_description || ''}
                      onChange={(e) => handlePageFieldChange('meta_description', e.target.value)}
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel>Open Graph Image URL</FormLabel>
                    <Input
                      value={page.og_image || ''}
                      onChange={(e) => handlePageFieldChange('og_image', e.target.value)}
                    />
                  </FormControl>
                </VStack>
              </TabPanel>

              {/* History Tab */}
              <TabPanel px={0}>
                <PageVersionHistory pageId={page.id} currentVersion={page.version_number} />
              </TabPanel>
            </TabPanels>
          </Tabs>
        </GridItem>

        {/* Sidebar */}
        <GridItem
          borderLeft="1px solid"
          borderColor={borderColor}
          overflow="auto"
          p={4}
          bg={useColorModeValue('white', 'gray.800')}
        >
          <BlockPalette onAddBlock={handleAddBlock} />
        </GridItem>
      </Grid>

      {isLoading && (
        <Box
          position="fixed"
          top={0}
          left={0}
          right={0}
          bottom={0}
          bg="blackAlpha.300"
          display="flex"
          alignItems="center"
          justifyContent="center"
          zIndex={1000}
        >
          <Spinner size="xl" />
        </Box>
      )}
    </Box>
  )
}

function getDefaultDataForType(type: BlockType): Record<string, unknown> {
  switch (type) {
    case 'hero':
      return { title: 'Hero Title', subtitle: 'Subtitle text', button_text: 'Learn More' }
    case 'text':
      return { content: 'Enter your text here...', alignment: 'left' }
    case 'image':
      return { url: '', alt: '', caption: '' }
    case 'video':
      return { url: '', autoplay: false, loop: false }
    case 'cta':
      return { heading: 'Call to Action', description: '', button_text: 'Get Started' }
    case 'spacer':
      return { height: 40 }
    case 'divider':
      return { style: 'solid' }
    default:
      return {}
  }
}
