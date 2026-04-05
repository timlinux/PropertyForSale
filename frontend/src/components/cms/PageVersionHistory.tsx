// SPDX-FileCopyrightText: 2026 Tim Sutton <tim@kartoza.com>
// SPDX-License-Identifier: EUPL-1.2

import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Badge,
  Spinner,
  Alert,
  AlertIcon,
  useToast,
  useColorModeValue,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useDisclosure,
  Code,
} from '@chakra-ui/react'
import { FiClock, FiRotateCcw, FiEye } from 'react-icons/fi'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { api, PageVersion } from '../../api'

interface PageVersionHistoryProps {
  pageId: string
  currentVersion: number
}

export function PageVersionHistory({ pageId, currentVersion }: PageVersionHistoryProps) {
  const [selectedVersion, setSelectedVersion] = useState<PageVersion | null>(null)
  const { isOpen, onOpen, onClose } = useDisclosure()
  const toast = useToast()
  const queryClient = useQueryClient()

  const borderColor = useColorModeValue('gray.200', 'gray.600')
  const bgHover = useColorModeValue('gray.50', 'gray.700')

  const { data: versions, isLoading, error } = useQuery({
    queryKey: ['pageVersions', pageId],
    queryFn: () => api.getPageVersions(pageId),
  })

  const rollbackMutation = useMutation({
    mutationFn: (version: number) => api.rollbackPageVersion(pageId, version),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pages'] })
      queryClient.invalidateQueries({ queryKey: ['pageVersions', pageId] })
      toast({
        title: 'Rolled back successfully',
        description: 'The page has been restored to the selected version.',
        status: 'success',
        duration: 3000,
      })
      onClose()
    },
    onError: (error: Error) => {
      toast({
        title: 'Rollback failed',
        description: error.message,
        status: 'error',
      })
    },
  })

  const handleViewVersion = (version: PageVersion) => {
    setSelectedVersion(version)
    onOpen()
  }

  const handleRollback = () => {
    if (selectedVersion) {
      rollbackMutation.mutate(selectedVersion.version_number)
    }
  }

  if (isLoading) {
    return (
      <Box textAlign="center" py={8}>
        <Spinner />
        <Text mt={2} color="gray.500">Loading version history...</Text>
      </Box>
    )
  }

  if (error) {
    return (
      <Alert status="error">
        <AlertIcon />
        Failed to load version history
      </Alert>
    )
  }

  if (!versions || versions.length === 0) {
    return (
      <Alert status="info">
        <AlertIcon />
        No version history available yet. Versions are created when you publish or make significant changes.
      </Alert>
    )
  }

  return (
    <>
      <VStack spacing={2} align="stretch">
        <Text fontSize="sm" color="gray.500" mb={2}>
          {versions.length} version{versions.length !== 1 ? 's' : ''} available
        </Text>

        {versions.map((version) => (
          <Box
            key={version.id}
            p={3}
            border="1px solid"
            borderColor={borderColor}
            borderRadius="md"
            _hover={{ bg: bgHover }}
            cursor="pointer"
            onClick={() => handleViewVersion(version)}
          >
            <HStack justify="space-between">
              <VStack align="start" spacing={1}>
                <HStack>
                  <Badge colorScheme={version.version_number === currentVersion ? 'green' : 'gray'}>
                    v{version.version_number}
                  </Badge>
                  {version.version_number === currentVersion && (
                    <Badge colorScheme="blue">Current</Badge>
                  )}
                </HStack>
                <Text fontSize="sm" fontWeight="medium">
                  {version.title || 'Untitled'}
                </Text>
                {version.note && (
                  <Text fontSize="xs" color="gray.500">
                    {version.note}
                  </Text>
                )}
                <HStack fontSize="xs" color="gray.500">
                  <FiClock size={12} />
                  <Text>{formatDate(version.created_at)}</Text>
                </HStack>
              </VStack>
              <Button
                size="xs"
                leftIcon={<FiEye />}
                variant="ghost"
                onClick={(e) => {
                  e.stopPropagation()
                  handleViewVersion(version)
                }}
              >
                View
              </Button>
            </HStack>
          </Box>
        ))}
      </VStack>

      {/* Version Detail Modal */}
      <Modal isOpen={isOpen} onClose={onClose} size="xl">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            Version {selectedVersion?.version_number}
            {selectedVersion?.version_number === currentVersion && (
              <Badge ml={2} colorScheme="blue">Current</Badge>
            )}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {selectedVersion && (
              <VStack align="stretch" spacing={4}>
                <Box>
                  <Text fontWeight="medium" mb={1}>Title</Text>
                  <Text>{selectedVersion.title || 'Untitled'}</Text>
                </Box>

                {selectedVersion.note && (
                  <Box>
                    <Text fontWeight="medium" mb={1}>Note</Text>
                    <Text>{selectedVersion.note}</Text>
                  </Box>
                )}

                <Box>
                  <Text fontWeight="medium" mb={1}>Created</Text>
                  <Text>{formatDate(selectedVersion.created_at)}</Text>
                </Box>

                <Box>
                  <Text fontWeight="medium" mb={1}>Data Preview</Text>
                  <Code
                    display="block"
                    whiteSpace="pre"
                    p={3}
                    borderRadius="md"
                    fontSize="xs"
                    maxH="200px"
                    overflow="auto"
                  >
                    {JSON.stringify(selectedVersion.data, null, 2)}
                  </Code>
                </Box>
              </VStack>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onClose}>
              Close
            </Button>
            {selectedVersion && selectedVersion.version_number !== currentVersion && (
              <Button
                leftIcon={<FiRotateCcw />}
                colorScheme="orange"
                onClick={handleRollback}
                isLoading={rollbackMutation.isPending}
              >
                Rollback to this version
              </Button>
            )}
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  )
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}
