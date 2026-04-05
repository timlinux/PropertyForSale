// SPDX-FileCopyrightText: 2026 Tim Sutton <tim@kartoza.com>
// SPDX-License-Identifier: EUPL-1.2

import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Badge,
  Input,
  Select,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  useToast,
  Spinner,
  Alert,
  AlertIcon,
  useColorModeValue,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useDisclosure,
  FormControl,
  FormLabel,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
} from '@chakra-ui/react'
import { FiPlus, FiMoreVertical, FiEdit, FiTrash2, FiEye, FiCopy } from 'react-icons/fi'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState, useRef } from 'react'
import { api, Page, PageTemplate } from '../../api'

interface PagesListProps {
  onEditPage: (page: Page) => void
}

export function PagesList({ onEditPage }: PagesListProps) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [pageToDelete, setPageToDelete] = useState<Page | null>(null)
  const { isOpen: isCreateOpen, onOpen: onCreateOpen, onClose: onCreateClose } = useDisclosure()
  const { isOpen: isDeleteOpen, onOpen: onDeleteOpen, onClose: onDeleteClose } = useDisclosure()
  const cancelRef = useRef<HTMLButtonElement>(null)

  const toast = useToast()
  const queryClient = useQueryClient()
  const borderColor = useColorModeValue('gray.200', 'gray.600')

  // Create page form state
  const [newPage, setNewPage] = useState({
    slug: '',
    title: '',
    description: '',
    template: 'blank' as PageTemplate,
  })

  const { data, isLoading, error } = useQuery({
    queryKey: ['pages', { search, status: statusFilter }],
    queryFn: () => api.getPages({ search: search || undefined, status: statusFilter || undefined }),
  })

  const createMutation = useMutation({
    mutationFn: api.createPage,
    onSuccess: (page) => {
      queryClient.invalidateQueries({ queryKey: ['pages'] })
      toast({ title: 'Page created', status: 'success', duration: 2000 })
      onCreateClose()
      setNewPage({ slug: '', title: '', description: '', template: 'blank' })
      onEditPage(page)
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to create page', description: error.message, status: 'error' })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deletePage(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pages'] })
      toast({ title: 'Page deleted', status: 'info', duration: 2000 })
      onDeleteClose()
      setPageToDelete(null)
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to delete page', description: error.message, status: 'error' })
    },
  })

  const duplicateMutation = useMutation({
    mutationFn: async (page: Page) => {
      return api.createPage({
        slug: `${page.slug}-copy`,
        title: `${page.title} (Copy)`,
        description: page.description,
        template: page.template,
        meta_title: page.meta_title,
        meta_description: page.meta_description,
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pages'] })
      toast({ title: 'Page duplicated', status: 'success', duration: 2000 })
    },
  })

  const handleCreatePage = () => {
    if (!newPage.slug || !newPage.title) {
      toast({ title: 'Please fill in slug and title', status: 'warning' })
      return
    }
    createMutation.mutate(newPage)
  }

  const handleDeleteClick = (page: Page) => {
    setPageToDelete(page)
    onDeleteOpen()
  }

  const handleConfirmDelete = () => {
    if (pageToDelete) {
      deleteMutation.mutate(pageToDelete.id)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'green'
      case 'draft':
        return 'gray'
      case 'archived':
        return 'red'
      default:
        return 'gray'
    }
  }

  if (error) {
    return (
      <Alert status="error">
        <AlertIcon />
        Failed to load pages
      </Alert>
    )
  }

  return (
    <Box>
      {/* Header */}
      <HStack justify="space-between" mb={6}>
        <HStack spacing={4}>
          <Input
            placeholder="Search pages..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            w="250px"
          />
          <Select
            placeholder="All statuses"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            w="150px"
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </Select>
        </HStack>
        <Button leftIcon={<FiPlus />} colorScheme="blue" onClick={onCreateOpen}>
          New Page
        </Button>
      </HStack>

      {/* Table */}
      {isLoading ? (
        <Box textAlign="center" py={8}>
          <Spinner />
        </Box>
      ) : !data?.pages?.length ? (
        <Alert status="info">
          <AlertIcon />
          No pages found. Create your first page to get started.
        </Alert>
      ) : (
        <Box border="1px solid" borderColor={borderColor} borderRadius="md" overflow="hidden">
          <Table>
            <Thead>
              <Tr>
                <Th>Title</Th>
                <Th>Slug</Th>
                <Th>Template</Th>
                <Th>Status</Th>
                <Th>Version</Th>
                <Th>Updated</Th>
                <Th w="50px"></Th>
              </Tr>
            </Thead>
            <Tbody>
              {data.pages.map((page) => (
                <Tr key={page.id} _hover={{ bg: useColorModeValue('gray.50', 'gray.700') }}>
                  <Td fontWeight="medium">{page.title}</Td>
                  <Td>
                    <Text fontFamily="mono" fontSize="sm">/{page.slug}</Text>
                  </Td>
                  <Td>
                    <Badge variant="outline">{page.template}</Badge>
                  </Td>
                  <Td>
                    <Badge colorScheme={getStatusColor(page.status)}>{page.status}</Badge>
                  </Td>
                  <Td>v{page.version_number}</Td>
                  <Td fontSize="sm" color="gray.500">
                    {formatDate(page.updated_at)}
                  </Td>
                  <Td>
                    <Menu>
                      <MenuButton
                        as={IconButton}
                        icon={<FiMoreVertical />}
                        variant="ghost"
                        size="sm"
                      />
                      <MenuList>
                        <MenuItem icon={<FiEdit />} onClick={() => onEditPage(page)}>
                          Edit
                        </MenuItem>
                        <MenuItem
                          icon={<FiEye />}
                          as="a"
                          href={`/pages/public/${page.slug}`}
                          target="_blank"
                        >
                          View
                        </MenuItem>
                        <MenuItem
                          icon={<FiCopy />}
                          onClick={() => duplicateMutation.mutate(page)}
                        >
                          Duplicate
                        </MenuItem>
                        <MenuItem
                          icon={<FiTrash2 />}
                          color="red.500"
                          onClick={() => handleDeleteClick(page)}
                        >
                          Delete
                        </MenuItem>
                      </MenuList>
                    </Menu>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Box>
      )}

      {/* Create Page Modal */}
      <Modal isOpen={isCreateOpen} onClose={onCreateClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Create New Page</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Title</FormLabel>
                <Input
                  value={newPage.title}
                  onChange={(e) => setNewPage({ ...newPage, title: e.target.value })}
                  placeholder="My New Page"
                />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>Slug (URL path)</FormLabel>
                <Input
                  value={newPage.slug}
                  onChange={(e) => setNewPage({ ...newPage, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                  placeholder="my-new-page"
                />
              </FormControl>
              <FormControl>
                <FormLabel>Description</FormLabel>
                <Input
                  value={newPage.description}
                  onChange={(e) => setNewPage({ ...newPage, description: e.target.value })}
                />
              </FormControl>
              <FormControl>
                <FormLabel>Template</FormLabel>
                <Select
                  value={newPage.template}
                  onChange={(e) => setNewPage({ ...newPage, template: e.target.value as PageTemplate })}
                >
                  <option value="blank">Blank</option>
                  <option value="landing">Landing Page</option>
                  <option value="property">Property Page</option>
                  <option value="contact">Contact Page</option>
                  <option value="about">About Page</option>
                </Select>
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onCreateClose}>
              Cancel
            </Button>
            <Button
              colorScheme="blue"
              onClick={handleCreatePage}
              isLoading={createMutation.isPending}
            >
              Create Page
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        isOpen={isDeleteOpen}
        leastDestructiveRef={cancelRef}
        onClose={onDeleteClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Delete Page
            </AlertDialogHeader>
            <AlertDialogBody>
              Are you sure you want to delete "{pageToDelete?.title}"? This action cannot be undone.
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onDeleteClose}>
                Cancel
              </Button>
              <Button
                colorScheme="red"
                onClick={handleConfirmDelete}
                ml={3}
                isLoading={deleteMutation.isPending}
              >
                Delete
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  )
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}
