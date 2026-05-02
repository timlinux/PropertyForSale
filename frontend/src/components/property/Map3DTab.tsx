// SPDX-FileCopyrightText: 2026 Tim Sutton <tim@kartoza.com>
// SPDX-License-Identifier: EUPL-1.2

import { useState, useCallback } from 'react'
import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Alert,
  AlertIcon,
  Badge,
  Box,
  Button,
  Card,
  CardBody,
  CardHeader,
  Center,
  Code,
  FormControl,
  FormLabel,
  Heading,
  HStack,
  Input,
  Link,
  ListItem,
  OrderedList,
  Spinner,
  Text,
  Textarea,
  UnorderedList,
  useToast,
  VStack,
} from '@chakra-ui/react'
import { FiTrash2, FiUpload, FiRefreshCw, FiExternalLink, FiInfo } from 'react-icons/fi'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api, Property, Media } from '../../api'
import QGISSceneViewer from '../viewer3d/QGISSceneViewer'

interface Map3DTabProps {
  property: Property
}

export default function Map3DTab({ property }: Map3DTabProps) {
  const queryClient = useQueryClient()
  const toast = useToast()
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isDragOver, setIsDragOver] = useState(false)
  const [description, setDescription] = useState('')
  const [editingDescription, setEditingDescription] = useState(false)
  const [tempDescription, setTempDescription] = useState('')

  // Fetch media for this property
  const { data: mediaData, isLoading } = useQuery({
    queryKey: ['media', property.slug],
    queryFn: () => api.getPropertyMedia(property.slug),
  })

  // Find the scene3d media
  const scene3d = (mediaData?.data || []).find((m: Media) => m.type === 'scene3d')

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteMedia(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media', property.slug] })
      toast({ title: '3D Map deleted', status: 'success', duration: 3000 })
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to delete', description: error.message, status: 'error', duration: 5000 })
    },
  })

  // Update description mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, caption }: { id: string; caption: string }) =>
      api.updateMedia(id, { caption }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media', property.slug] })
      setEditingDescription(false)
      toast({ title: 'Description updated', status: 'success', duration: 2000 })
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to update', description: error.message, status: 'error', duration: 5000 })
    },
  })

  const handleFileUpload = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return

    const file = files[0]
    if (!file.name.toLowerCase().endsWith('.zip')) {
      toast({ title: 'Please upload a ZIP file', status: 'warning', duration: 3000 })
      return
    }

    setIsUploading(true)
    setUploadProgress(10)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('entity_type', 'property')
      formData.append('entity_id', property.id)

      setUploadProgress(30)
      await api.uploadScene(formData, description)
      setUploadProgress(100)

      queryClient.invalidateQueries({ queryKey: ['media', property.slug] })
      setDescription('')
      toast({
        title: '3D Map uploaded successfully',
        description: 'Your QGIS scene has been processed and is ready to view.',
        status: 'success',
        duration: 5000,
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed'
      toast({
        title: 'Upload failed',
        description: errorMessage,
        status: 'error',
        duration: 8000,
      })
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }, [property.id, property.slug, description, queryClient, toast])

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = () => {
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    handleFileUpload(e.dataTransfer.files)
  }

  const handleDelete = () => {
    if (scene3d && window.confirm('Are you sure you want to delete this 3D map? This action cannot be undone.')) {
      deleteMutation.mutate(scene3d.id)
    }
  }

  const handleEditDescription = () => {
    setTempDescription(scene3d?.caption || '')
    setEditingDescription(true)
  }

  const handleSaveDescription = () => {
    if (scene3d) {
      updateMutation.mutate({ id: scene3d.id, caption: tempDescription })
    }
  }

  if (isLoading) {
    return (
      <Center py={16}>
        <Spinner size="lg" />
      </Center>
    )
  }

  return (
    <VStack spacing={6} align="stretch">
      {/* Introduction Card */}
      <Card>
        <CardBody>
          <HStack spacing={3} align="flex-start">
            <Box color="blue.500" mt={1}>
              <FiInfo size={20} />
            </Box>
            <Box>
              <Text fontWeight="500">3D Property Map</Text>
              <Text fontSize="sm" color="gray.600">
                Create an interactive 3D terrain view of your property using QGIS and the Qgis2threejs plugin.
                This allows potential buyers to explore the topography, buildings, and landscape of your property
                in an immersive 3D environment.
              </Text>
            </Box>
          </HStack>
        </CardBody>
      </Card>

      {/* Instructions Accordion */}
      <Accordion allowToggle>
        <AccordionItem border="1px" borderColor="gray.200" borderRadius="lg">
          <AccordionButton py={4} _expanded={{ bg: 'blue.50' }}>
            <Box flex="1" textAlign="left">
              <Heading size="sm">How to Create a 3D Map with QGIS</Heading>
            </Box>
            <AccordionIcon />
          </AccordionButton>
          <AccordionPanel pb={6}>
            <VStack spacing={4} align="stretch">
              <Box>
                <Heading size="xs" mb={2}>Requirements</Heading>
                <UnorderedList spacing={1} fontSize="sm" color="gray.700">
                  <ListItem>
                    <Link href="https://qgis.org" isExternal color="blue.500">
                      QGIS 3.x <FiExternalLink style={{ display: 'inline', marginLeft: '4px' }} />
                    </Link>
                    {' '}(free and open source GIS software)
                  </ListItem>
                  <ListItem>Qgis2threejs plugin (install via QGIS Plugin Manager)</ListItem>
                  <ListItem>Digital Elevation Model (DEM) raster of your property</ListItem>
                  <ListItem>Aerial/satellite imagery (optional but recommended)</ListItem>
                </UnorderedList>
              </Box>

              <Box>
                <Heading size="xs" mb={2}>Step 1: Install Qgis2threejs</Heading>
                <OrderedList spacing={1} fontSize="sm" color="gray.700">
                  <ListItem>Open QGIS</ListItem>
                  <ListItem>Go to <Code>Plugins</Code> {'>'} <Code>Manage and Install Plugins</Code></ListItem>
                  <ListItem>Search for "Qgis2threejs"</ListItem>
                  <ListItem>Click <Code>Install Plugin</Code></ListItem>
                </OrderedList>
              </Box>

              <Box>
                <Heading size="xs" mb={2}>Step 2: Prepare Your Data</Heading>
                <OrderedList spacing={1} fontSize="sm" color="gray.700">
                  <ListItem>Load your DEM raster layer (elevation data)</ListItem>
                  <ListItem>Load orthophoto/aerial imagery if available</ListItem>
                  <ListItem>Set the project CRS to match your data</ListItem>
                  <ListItem>Optionally add building footprints or other vector layers</ListItem>
                </OrderedList>
              </Box>

              <Box>
                <Heading size="xs" mb={2}>Step 3: Create the 3D Scene</Heading>
                <OrderedList spacing={1} fontSize="sm" color="gray.700">
                  <ListItem>Go to <Code>Web</Code> {'>'} <Code>Qgis2threejs</Code> {'>'} <Code>Qgis2threejs Exporter</Code></ListItem>
                  <ListItem>Select your DEM as the terrain layer</ListItem>
                  <ListItem>Add imagery as terrain texture</ListItem>
                  <ListItem>Adjust vertical exaggeration if needed (1.5-2x often works well)</ListItem>
                  <ListItem>Preview in the built-in viewer and adjust settings</ListItem>
                </OrderedList>
              </Box>

              <Box>
                <Heading size="xs" mb={2}>Step 4: Export and Upload</Heading>
                <OrderedList spacing={1} fontSize="sm" color="gray.700">
                  <ListItem>Click <Code>File</Code> {'>'} <Code>Export to Web</Code></ListItem>
                  <ListItem>Choose a folder for the export</ListItem>
                  <ListItem>Create a ZIP file containing the entire exported folder</ListItem>
                  <ListItem>Upload the ZIP file using the upload area below</ListItem>
                </OrderedList>
              </Box>

              <Alert status="info" borderRadius="md">
                <AlertIcon />
                <Box fontSize="sm">
                  <Text fontWeight="500">Tips for best results:</Text>
                  <UnorderedList mt={1}>
                    <ListItem>Keep file sizes reasonable (under 50MB)</ListItem>
                    <ListItem>Use compressed textures (JPEG for photos)</ListItem>
                    <ListItem>Simplify terrain resolution for faster loading</ListItem>
                    <ListItem>Test the scene in a browser before uploading</ListItem>
                  </UnorderedList>
                </Box>
              </Alert>
            </VStack>
          </AccordionPanel>
        </AccordionItem>
      </Accordion>

      {/* Upload / Current Scene Card */}
      <Card>
        <CardHeader>
          <HStack justify="space-between">
            <Heading size="md">{scene3d ? 'Current 3D Map' : 'Upload 3D Map'}</Heading>
            {scene3d && (
              <Badge colorScheme="green" fontSize="sm">Active</Badge>
            )}
          </HStack>
        </CardHeader>
        <CardBody>
          {scene3d ? (
            // Display existing scene
            <VStack spacing={4} align="stretch">
              {/* Scene preview */}
              <Box borderRadius="lg" overflow="hidden">
                <QGISSceneViewer
                  sceneUrl={scene3d.url}
                  height="400px"
                  showControls={true}
                  title={scene3d.caption || '3D Property Map'}
                />
              </Box>

              {/* Scene info */}
              <HStack spacing={4} fontSize="sm" color="gray.500" flexWrap="wrap">
                <Text>File: {scene3d.file_name}</Text>
                <Text>Uploaded: {new Date(scene3d.created_at).toLocaleDateString()}</Text>
                <Text>Size: {(scene3d.file_size / 1024 / 1024).toFixed(2)} MB</Text>
              </HStack>

              {/* Description */}
              <FormControl>
                <FormLabel fontSize="sm">Description</FormLabel>
                {editingDescription ? (
                  <VStack align="stretch" spacing={2}>
                    <Textarea
                      value={tempDescription}
                      onChange={(e) => setTempDescription(e.target.value)}
                      placeholder="Describe your 3D map..."
                      rows={3}
                    />
                    <HStack>
                      <Button
                        size="sm"
                        colorScheme="blue"
                        onClick={handleSaveDescription}
                        isLoading={updateMutation.isPending}
                      >
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditingDescription(false)}
                      >
                        Cancel
                      </Button>
                    </HStack>
                  </VStack>
                ) : (
                  <HStack>
                    <Text color={scene3d.caption ? 'gray.700' : 'gray.400'} flex={1}>
                      {scene3d.caption || 'No description provided'}
                    </Text>
                    <Button size="xs" variant="ghost" onClick={handleEditDescription}>
                      Edit
                    </Button>
                  </HStack>
                )}
              </FormControl>

              {/* Actions */}
              <HStack spacing={3} pt={2}>
                <Button
                  leftIcon={<FiRefreshCw />}
                  variant="outline"
                  onClick={() => {
                    if (window.confirm('Replace the current 3D map? The existing map will be deleted.')) {
                      deleteMutation.mutate(scene3d.id)
                    }
                  }}
                  isLoading={deleteMutation.isPending}
                >
                  Replace Map
                </Button>
                <Button
                  leftIcon={<FiTrash2 />}
                  variant="outline"
                  colorScheme="red"
                  onClick={handleDelete}
                  isLoading={deleteMutation.isPending}
                >
                  Delete Map
                </Button>
              </HStack>
            </VStack>
          ) : (
            // Upload form
            <VStack spacing={4} align="stretch">
              {/* Upload area */}
              <Box
                p={8}
                border="2px dashed"
                borderColor={isDragOver ? 'blue.400' : 'gray.200'}
                borderRadius="lg"
                bg={isDragOver ? 'blue.50' : 'gray.50'}
                textAlign="center"
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                transition="all 0.2s"
                position="relative"
                cursor="pointer"
              >
                {isUploading ? (
                  <VStack spacing={3}>
                    <Spinner size="lg" color="blue.500" />
                    <Text fontWeight="500">
                      {uploadProgress < 30 ? 'Preparing upload...' :
                       uploadProgress < 100 ? 'Processing scene...' :
                       'Complete!'}
                    </Text>
                    <Text fontSize="sm" color="gray.500">{uploadProgress}%</Text>
                  </VStack>
                ) : (
                  <VStack spacing={3}>
                    <Box color="gray.400">
                      <FiUpload size={48} />
                    </Box>
                    <Text fontWeight="500">Drag & drop your Qgis2threejs ZIP export here</Text>
                    <Text fontSize="sm" color="gray.500">or click to browse</Text>
                    <Text fontSize="xs" color="gray.400">(Max 50MB, ZIP files only)</Text>
                    <Input
                      type="file"
                      accept=".zip"
                      onChange={(e) => handleFileUpload(e.target.files)}
                      position="absolute"
                      opacity={0}
                      cursor="pointer"
                      top={0}
                      left={0}
                      w="100%"
                      h="100%"
                    />
                  </VStack>
                )}
              </Box>

              {/* Description input */}
              <FormControl>
                <FormLabel fontSize="sm">Description (optional)</FormLabel>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your 3D map, e.g., 'Interactive terrain view showing the property boundaries, main house, and surrounding olive groves.'"
                  rows={3}
                />
              </FormControl>

              {/* Security notice */}
              <Alert status="info" borderRadius="md" fontSize="sm">
                <AlertIcon />
                <Box>
                  <Text fontWeight="500">Security Notice</Text>
                  <Text>
                    ZIP files are scanned for security. Only standard Qgis2threejs exports are accepted.
                    Files containing scripts or executable content may be rejected.
                  </Text>
                </Box>
              </Alert>
            </VStack>
          )}
        </CardBody>
      </Card>
    </VStack>
  )
}
