// SPDX-FileCopyrightText: 2026 Tim Sutton <tim@kartoza.com>
// SPDX-License-Identifier: EUPL-1.2

import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
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
  FormControl,
  FormLabel,
  Heading,
  HStack,
  IconButton,
  Image,
  Input,
  InputGroup,
  InputLeftAddon,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Select,
  SimpleGrid,
  Spinner,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
  Textarea,
  useDisclosure,
  useToast,
  VStack,
} from '@chakra-ui/react'
import { FiPlus, FiTrash2, FiHome, FiLayers, FiMapPin, FiStar, FiEdit2 } from 'react-icons/fi'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api, Property, Structure, Room, Area, Quote, Media } from '../../api'
import { useAuthHeaders } from '../../context/authStore'
import { MediaPreviewCard } from '../media'

export default function PropertyEdit() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()

  const { data: property, isLoading, error } = useQuery({
    queryKey: ['property', slug],
    queryFn: () => api.getPropertyBySlug(slug!),
    enabled: !!slug,
  })

  if (isLoading) {
    return (
      <Center py={16}>
        <Spinner size="lg" />
      </Center>
    )
  }

  if (error || !property) {
    return (
      <Alert status="error">
        <AlertIcon />
        Property not found
      </Alert>
    )
  }

  return (
    <VStack spacing={6} align="stretch">
      <HStack justify="space-between">
        <VStack align="flex-start" spacing={0}>
          <Text fontSize="sm" color="gray.500">Editing</Text>
          <Heading size="lg">{property.name}</Heading>
        </VStack>
        <HStack>
          <Button variant="ghost" onClick={() => navigate('/dashboard/properties')}>
            Back to Properties
          </Button>
        </HStack>
      </HStack>

      <Tabs colorScheme="blue" variant="enclosed">
        <TabList>
          <Tab>Basic Info</Tab>
          <Tab>Structures & Rooms</Tab>
          <Tab>Outdoor Areas</Tab>
          <Tab>Media</Tab>
          <Tab>Quotes</Tab>
        </TabList>

        <TabPanels>
          <TabPanel px={0}>
            <BasicInfoTab property={property} />
          </TabPanel>
          <TabPanel px={0}>
            <StructuresTab property={property} />
          </TabPanel>
          <TabPanel px={0}>
            <AreasTab property={property} />
          </TabPanel>
          <TabPanel px={0}>
            <MediaTab property={property} />
          </TabPanel>
          <TabPanel px={0}>
            <QuotesTab property={property} />
          </TabPanel>
        </TabPanels>
      </Tabs>
    </VStack>
  )
}

// Basic Info Tab
function BasicInfoTab({ property }: { property: Property }) {
  const toast = useToast()
  const queryClient = useQueryClient()
  const authHeaders = useAuthHeaders()
  const [formData, setFormData] = useState({
    name: property.name,
    slug: property.slug,
    description: property.description || '',
    price_min: property.price_min,
    price_max: property.price_max,
    currency: property.currency,
    address_line1: property.address_line1 || '',
    address_line2: property.address_line2 || '',
    city: property.city || '',
    state: property.state || '',
    postal_code: property.postal_code || '',
    country: property.country || '',
    status: property.status,
  })

  const updateMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await fetch(`/api/v1/properties/${property.slug}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify(data),
      })
      if (!response.ok) throw new Error('Failed to update')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['property', property.slug] })
      queryClient.invalidateQueries({ queryKey: ['my-properties'] })
      toast({ title: 'Property updated', status: 'success', duration: 3000 })
    },
    onError: () => {
      toast({ title: 'Failed to update', status: 'error', duration: 3000 })
    },
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value === '' ? 0 : parseFloat(value) }))
  }

  return (
    <VStack spacing={6} align="stretch">
      <Card>
        <CardHeader>
          <Heading size="md">Basic Information</Heading>
        </CardHeader>
        <CardBody>
          <VStack spacing={4}>
            <FormControl>
              <FormLabel>Property Name</FormLabel>
              <Input name="name" value={formData.name} onChange={handleChange} />
            </FormControl>
            <FormControl>
              <FormLabel>URL Slug</FormLabel>
              <InputGroup>
                <InputLeftAddon>/property/</InputLeftAddon>
                <Input name="slug" value={formData.slug} onChange={handleChange} />
              </InputGroup>
            </FormControl>
            <FormControl>
              <FormLabel>Description</FormLabel>
              <Textarea name="description" value={formData.description} onChange={handleChange} rows={4} />
            </FormControl>
            <FormControl>
              <FormLabel>Status</FormLabel>
              <Select name="status" value={formData.status} onChange={handleChange}>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </Select>
            </FormControl>
          </VStack>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <Heading size="md">Pricing</Heading>
        </CardHeader>
        <CardBody>
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
            <FormControl>
              <FormLabel>Currency</FormLabel>
              <Select name="currency" value={formData.currency} onChange={handleChange}>
                <option value="EUR">EUR</option>
                <option value="USD">USD</option>
                <option value="GBP">GBP</option>
              </Select>
            </FormControl>
            <FormControl>
              <FormLabel>Min Price</FormLabel>
              <Input type="number" name="price_min" value={formData.price_min || ''} onChange={handleNumberChange} />
            </FormControl>
            <FormControl>
              <FormLabel>Max Price</FormLabel>
              <Input type="number" name="price_max" value={formData.price_max || ''} onChange={handleNumberChange} />
            </FormControl>
          </SimpleGrid>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <Heading size="md">Location</Heading>
        </CardHeader>
        <CardBody>
          <VStack spacing={4}>
            <FormControl>
              <FormLabel>Address Line 1</FormLabel>
              <Input name="address_line1" value={formData.address_line1} onChange={handleChange} />
            </FormControl>
            <FormControl>
              <FormLabel>Address Line 2</FormLabel>
              <Input name="address_line2" value={formData.address_line2} onChange={handleChange} />
            </FormControl>
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} w="full">
              <FormControl>
                <FormLabel>City</FormLabel>
                <Input name="city" value={formData.city} onChange={handleChange} />
              </FormControl>
              <FormControl>
                <FormLabel>State/Province</FormLabel>
                <Input name="state" value={formData.state} onChange={handleChange} />
              </FormControl>
              <FormControl>
                <FormLabel>Postal Code</FormLabel>
                <Input name="postal_code" value={formData.postal_code} onChange={handleChange} />
              </FormControl>
              <FormControl>
                <FormLabel>Country</FormLabel>
                <Input name="country" value={formData.country} onChange={handleChange} />
              </FormControl>
            </SimpleGrid>
          </VStack>
        </CardBody>
      </Card>

      <HStack justify="flex-end">
        <Button colorScheme="blue" onClick={() => updateMutation.mutate(formData)} isLoading={updateMutation.isPending}>
          Save Changes
        </Button>
      </HStack>
    </VStack>
  )
}

// Structures Tab
function StructuresTab({ property }: { property: Property }) {
  const toast = useToast()
  const queryClient = useQueryClient()
  const authHeaders = useAuthHeaders()
  const { isOpen, onOpen, onClose } = useDisclosure()

  const { data: structuresData } = useQuery({
    queryKey: ['structures', property.slug],
    queryFn: () => api.getPropertyStructures(property.slug),
  })

  const structures = structuresData?.data || []

  const createStructureMutation = useMutation({
    mutationFn: async (data: Partial<Structure>) => {
      const response = await fetch('/api/v1/structures', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({ ...data, property_id: property.id }),
      })
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to create structure')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['structures', property.slug] })
      toast({ title: 'Structure created', status: 'success', duration: 3000 })
      onClose()
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, status: 'error', duration: 5000 })
    },
  })

  const deleteStructureMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/v1/structures/${id}`, {
        method: 'DELETE',
        headers: authHeaders,
      })
      if (!response.ok) throw new Error('Failed to delete')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['structures', property.slug] })
      toast({ title: 'Structure deleted', status: 'success', duration: 3000 })
    },
  })

  return (
    <VStack spacing={4} align="stretch">
      <HStack justify="space-between">
        <Text color="gray.600">Manage structures (buildings) on this property</Text>
        <Button leftIcon={<FiPlus />} colorScheme="blue" size="sm" onClick={onOpen}>
          Add Structure
        </Button>
      </HStack>

      {structures.length === 0 ? (
        <Card>
          <CardBody>
            <VStack py={8} spacing={4}>
              <FiHome size={48} color="gray" />
              <Text color="gray.500">No structures yet</Text>
              <Button leftIcon={<FiPlus />} onClick={onOpen}>Add First Structure</Button>
            </VStack>
          </CardBody>
        </Card>
      ) : (
        <Accordion allowMultiple>
          {structures.map((structure) => (
            <StructureItem
              key={structure.id}
              structure={structure}
              onDelete={() => deleteStructureMutation.mutate(structure.id)}
            />
          ))}
        </Accordion>
      )}

      <StructureModal
        isOpen={isOpen}
        onClose={onClose}
        onSave={(data) => createStructureMutation.mutate(data)}
        isLoading={createStructureMutation.isPending}
      />
    </VStack>
  )
}

function StructureItem({ structure, onDelete }: { structure: Structure; onDelete: () => void }) {
  const authHeaders = useAuthHeaders()
  const queryClient = useQueryClient()
  const toast = useToast()
  const { isOpen, onOpen, onClose } = useDisclosure()

  const { data: roomsData } = useQuery({
    queryKey: ['rooms', structure.id],
    queryFn: () => api.getStructureRooms(structure.id),
  })

  const rooms = roomsData?.data || []

  const createRoomMutation = useMutation({
    mutationFn: async (data: Partial<Room>) => {
      const response = await fetch('/api/v1/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({ ...data, structure_id: structure.id }),
      })
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to create room')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms', structure.id] })
      toast({ title: 'Room created', status: 'success', duration: 3000 })
      onClose()
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, status: 'error', duration: 5000 })
    },
  })

  const deleteRoomMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/v1/rooms/${id}`, {
        method: 'DELETE',
        headers: authHeaders,
      })
      if (!response.ok) throw new Error('Failed to delete')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms', structure.id] })
      toast({ title: 'Room deleted', status: 'success', duration: 3000 })
    },
  })

  return (
    <AccordionItem>
      <AccordionButton>
        <HStack flex={1}>
          <FiHome />
          <Text fontWeight="600">{structure.name}</Text>
          {structure.type && <Text color="gray.500">({structure.type})</Text>}
        </HStack>
        <IconButton
          aria-label="Delete"
          icon={<FiTrash2 />}
          size="sm"
          variant="ghost"
          colorScheme="red"
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          mr={2}
        />
        <AccordionIcon />
      </AccordionButton>
      <AccordionPanel>
        <VStack align="stretch" spacing={4}>
          <SimpleGrid columns={3} spacing={4}>
            <Box>
              <Text fontSize="sm" color="gray.500">Type</Text>
              <Text>{structure.type || '-'}</Text>
            </Box>
            <Box>
              <Text fontSize="sm" color="gray.500">Size</Text>
              <Text>{structure.size_sqm ? `${structure.size_sqm} m²` : '-'}</Text>
            </Box>
            <Box>
              <Text fontSize="sm" color="gray.500">Year Built</Text>
              <Text>{structure.year_built || '-'}</Text>
            </Box>
          </SimpleGrid>

          {structure.description && (
            <Box>
              <Text fontSize="sm" color="gray.500">Description</Text>
              <Text>{structure.description}</Text>
            </Box>
          )}

          <Box>
            <HStack justify="space-between" mb={2}>
              <Text fontWeight="600">Rooms ({rooms.length})</Text>
              <Button size="xs" leftIcon={<FiPlus />} onClick={onOpen}>Add Room</Button>
            </HStack>
            {rooms.length > 0 && (
              <VStack align="stretch" spacing={1}>
                {rooms.map((room) => (
                  <HStack key={room.id} p={2} bg="gray.50" borderRadius="md" justify="space-between">
                    <HStack>
                      <FiLayers />
                      <Text>{room.name}</Text>
                      {room.type && <Text color="gray.500">({room.type})</Text>}
                      {room.size_sqm && <Text color="gray.500">{room.size_sqm} m²</Text>}
                    </HStack>
                    <IconButton
                      aria-label="Delete"
                      icon={<FiTrash2 />}
                      size="xs"
                      variant="ghost"
                      colorScheme="red"
                      onClick={() => deleteRoomMutation.mutate(room.id)}
                    />
                  </HStack>
                ))}
              </VStack>
            )}
          </Box>
        </VStack>

        <RoomModal
          isOpen={isOpen}
          onClose={onClose}
          onSave={(data) => createRoomMutation.mutate(data)}
          isLoading={createRoomMutation.isPending}
        />
      </AccordionPanel>
    </AccordionItem>
  )
}

// Areas Tab
function AreasTab({ property }: { property: Property }) {
  const toast = useToast()
  const queryClient = useQueryClient()
  const authHeaders = useAuthHeaders()
  const { isOpen, onOpen, onClose } = useDisclosure()

  const { data: areasData } = useQuery({
    queryKey: ['areas', property.slug],
    queryFn: () => api.getPropertyAreas(property.slug),
  })

  const areas = areasData?.data || []

  const createAreaMutation = useMutation({
    mutationFn: async (data: Partial<Area>) => {
      const response = await fetch('/api/v1/areas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({ ...data, property_id: property.id }),
      })
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to create area')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['areas', property.slug] })
      toast({ title: 'Area created', status: 'success', duration: 3000 })
      onClose()
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, status: 'error', duration: 5000 })
    },
  })

  const deleteAreaMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/v1/areas/${id}`, {
        method: 'DELETE',
        headers: authHeaders,
      })
      if (!response.ok) throw new Error('Failed to delete')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['areas', property.slug] })
      toast({ title: 'Area deleted', status: 'success', duration: 3000 })
    },
  })

  return (
    <VStack spacing={4} align="stretch">
      <HStack justify="space-between">
        <Text color="gray.600">Manage outdoor areas (gardens, fields, etc.)</Text>
        <Button leftIcon={<FiPlus />} colorScheme="blue" size="sm" onClick={onOpen}>
          Add Area
        </Button>
      </HStack>

      {areas.length === 0 ? (
        <Card>
          <CardBody>
            <VStack py={8} spacing={4}>
              <FiMapPin size={48} color="gray" />
              <Text color="gray.500">No outdoor areas yet</Text>
              <Button leftIcon={<FiPlus />} onClick={onOpen}>Add First Area</Button>
            </VStack>
          </CardBody>
        </Card>
      ) : (
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
          {areas.map((area: Area) => (
            <Card key={area.id}>
              <CardBody>
                <HStack justify="space-between" mb={2}>
                  <HStack>
                    <FiMapPin />
                    <Text fontWeight="600">{area.name}</Text>
                  </HStack>
                  <IconButton
                    aria-label="Delete"
                    icon={<FiTrash2 />}
                    size="sm"
                    variant="ghost"
                    colorScheme="red"
                    onClick={() => deleteAreaMutation.mutate(area.id)}
                  />
                </HStack>
                <SimpleGrid columns={2} spacing={2} fontSize="sm">
                  <Box>
                    <Text color="gray.500">Type</Text>
                    <Text>{area.type || '-'}</Text>
                  </Box>
                  <Box>
                    <Text color="gray.500">Size</Text>
                    <Text>{area.size_sqm ? `${area.size_sqm} m²` : '-'}</Text>
                  </Box>
                </SimpleGrid>
                {area.description && (
                  <Text fontSize="sm" mt={2} color="gray.600">{area.description}</Text>
                )}
              </CardBody>
            </Card>
          ))}
        </SimpleGrid>
      )}

      <AreaModal
        isOpen={isOpen}
        onClose={onClose}
        onSave={(data) => createAreaMutation.mutate(data)}
        isLoading={createAreaMutation.isPending}
      />
    </VStack>
  )
}

// Media Tab
function MediaTab({ property }: { property: Property }) {
  const queryClient = useQueryClient()
  const toast = useToast()
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isDragOver, setIsDragOver] = useState(false)
  const [selectedEntityType, setSelectedEntityType] = useState<'property' | 'structure' | 'room' | 'area'>('property')
  const [selectedEntityId, setSelectedEntityId] = useState<string>(property.id)
  const [editingMedia, setEditingMedia] = useState<{
    id: string
    caption: string
    linkedAudioId: string | null
  } | null>(null)

  // Fetch structures
  const { data: structuresData } = useQuery({
    queryKey: ['structures', property.slug],
    queryFn: () => api.getPropertyStructures(property.slug),
  })
  const structures = structuresData?.data || []

  // Fetch areas
  const { data: areasData } = useQuery({
    queryKey: ['areas', property.slug],
    queryFn: () => api.getPropertyAreas(property.slug),
  })
  const areas = areasData?.data || []

  // Build rooms list from all structures
  const allRooms: Array<Room & { structureName: string }> = []
  structures.forEach((structure: Structure) => {
    if (structure.rooms) {
      structure.rooms.forEach((room: Room) => {
        allRooms.push({ ...room, structureName: structure.name })
      })
    }
  })

  const { data: mediaData, isLoading: mediaLoading } = useQuery({
    queryKey: ['media', property.slug],
    queryFn: () => api.getPropertyMedia(property.slug),
  })

  const media = mediaData?.data || []

  // Filter media by selected entity
  const filteredMedia = media.filter((item) =>
    item.entity_type === selectedEntityType && item.entity_id === selectedEntityId
  )

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteMedia(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media', property.slug] })
      toast({ title: 'Media deleted', status: 'success', duration: 3000 })
    },
    onError: () => {
      toast({ title: 'Failed to delete media', status: 'error', duration: 3000 })
    },
  })

  const starMutation = useMutation({
    mutationFn: (id: string) => api.toggleMediaStar(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['media', property.slug] })
      toast({
        title: data.starred ? 'Media starred' : 'Star removed',
        status: 'success',
        duration: 2000,
      })
    },
    onError: () => {
      toast({ title: 'Failed to toggle star', status: 'error', duration: 3000 })
    },
  })

  const updateMediaMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { caption?: string; linked_audio_id?: string | null } }) =>
      api.updateMedia(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media', property.slug] })
      toast({ title: 'Media updated', status: 'success', duration: 2000 })
      setEditingMedia(null)
    },
    onError: () => {
      toast({ title: 'Failed to update media', status: 'error', duration: 3000 })
    },
  })

  // Get all audio files for linking
  const audioFiles = media.filter((m) => m.type === 'audio')

  // Update selected entity ID when type changes
  const handleEntityTypeChange = (type: 'property' | 'structure' | 'room' | 'area') => {
    setSelectedEntityType(type)
    if (type === 'property') {
      setSelectedEntityId(property.id)
    } else if (type === 'structure' && structures.length > 0) {
      setSelectedEntityId(structures[0].id)
    } else if (type === 'room' && allRooms.length > 0) {
      setSelectedEntityId(allRooms[0].id)
    } else if (type === 'area' && areas.length > 0) {
      setSelectedEntityId(areas[0].id)
    } else {
      setSelectedEntityId('')
    }
  }

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    if (!selectedEntityId) {
      toast({ title: 'Please select an entity first', status: 'warning', duration: 3000 })
      return
    }

    setIsUploading(true)
    setUploadProgress(0)

    const totalFiles = files.length
    let uploaded = 0

    for (const file of Array.from(files)) {
      try {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('entity_type', selectedEntityType)
        formData.append('entity_id', selectedEntityId)

        // Determine media type from file
        let mediaType = 'document'
        if (file.type.startsWith('image/')) mediaType = 'image'
        else if (file.type.startsWith('video/')) mediaType = 'video'
        else if (file.type.startsWith('audio/')) mediaType = 'audio'
        else if (file.name.match(/\.(glb|gltf|obj|fbx)$/i)) mediaType = 'model3d'

        formData.append('type', mediaType)

        await api.uploadMedia(formData)
        uploaded++
        setUploadProgress(Math.round((uploaded / totalFiles) * 100))
      } catch (error) {
        toast({
          title: `Failed to upload ${file.name}`,
          status: 'error',
          duration: 3000,
        })
      }
    }

    setIsUploading(false)
    setUploadProgress(0)
    queryClient.invalidateQueries({ queryKey: ['media', property.slug] })
    toast({
      title: `Uploaded ${uploaded} file(s)`,
      status: 'success',
      duration: 3000,
    })
  }

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

  const getEntityLabel = (entityType: string, entityId: string) => {
    if (entityType === 'property') return 'Property'
    if (entityType === 'structure') {
      const d = structures.find((d: Structure) => d.id === entityId)
      return d ? `Structure: ${d.name}` : 'Structure'
    }
    if (entityType === 'room') {
      const r = allRooms.find(r => r.id === entityId)
      return r ? `Room: ${r.name}` : 'Room'
    }
    if (entityType === 'area') {
      const a = areas.find((a: Area) => a.id === entityId)
      return a ? `Area: ${a.name}` : 'Area'
    }
    return entityType
  }

  return (
    <VStack spacing={6} align="stretch">
      {/* Entity selector */}
      <Card>
        <CardBody>
          <VStack spacing={4} align="stretch">
            <Text fontWeight="500">Upload media to:</Text>
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
              <FormControl>
                <FormLabel>Entity Type</FormLabel>
                <Select
                  value={selectedEntityType}
                  onChange={(e) => handleEntityTypeChange(e.target.value as typeof selectedEntityType)}
                >
                  <option value="property">Whole Property</option>
                  <option value="structure" disabled={structures.length === 0}>
                    Structure {structures.length === 0 && '(none added)'}
                  </option>
                  <option value="room" disabled={allRooms.length === 0}>
                    Room {allRooms.length === 0 && '(none added)'}
                  </option>
                  <option value="area" disabled={areas.length === 0}>
                    Outside Area {areas.length === 0 && '(none added)'}
                  </option>
                </Select>
              </FormControl>

              {selectedEntityType !== 'property' && (
                <FormControl>
                  <FormLabel>
                    {selectedEntityType === 'structure' && 'Select Structure'}
                    {selectedEntityType === 'room' && 'Select Room'}
                    {selectedEntityType === 'area' && 'Select Area'}
                  </FormLabel>
                  <Select
                    value={selectedEntityId}
                    onChange={(e) => setSelectedEntityId(e.target.value)}
                  >
                    {selectedEntityType === 'structure' &&
                      structures.map((d: Structure) => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))
                    }
                    {selectedEntityType === 'room' &&
                      allRooms.map((r) => (
                        <option key={r.id} value={r.id}>{r.structureName} → {r.name}</option>
                      ))
                    }
                    {selectedEntityType === 'area' &&
                      areas.map((a: Area) => (
                        <option key={a.id} value={a.id}>{a.name}</option>
                      ))
                    }
                  </Select>
                </FormControl>
              )}
            </SimpleGrid>
          </VStack>
        </CardBody>
      </Card>

      {/* Upload area */}
      <Card>
        <CardBody>
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
          >
            {isUploading ? (
              <VStack spacing={4}>
                <Spinner size="lg" color="blue.500" />
                <Text>Uploading... {uploadProgress}%</Text>
              </VStack>
            ) : (
              <VStack spacing={4}>
                <Text fontSize="4xl">📤</Text>
                <Text fontWeight="500">Drag & drop files here</Text>
                <Text fontSize="sm" color="gray.500">
                  or click to select files
                </Text>
                <Input
                  type="file"
                  multiple
                  accept="image/*,video/*,audio/*,.glb,.gltf,.obj"
                  onChange={(e) => handleFileUpload(e.target.files)}
                  position="absolute"
                  opacity={0}
                  cursor="pointer"
                  top={0}
                  left={0}
                  w="100%"
                  h="100%"
                />
                <Text fontSize="xs" color="gray.400">
                  Supports: Images, Videos, Audio, 3D Models (.glb, .gltf, .obj)
                </Text>
              </VStack>
            )}
          </Box>
        </CardBody>
      </Card>

      {/* Media grid for selected entity */}
      <Card>
        <CardBody>
          <HStack justify="space-between" mb={4}>
            <Text fontWeight="500">
              Media for: {getEntityLabel(selectedEntityType, selectedEntityId)}
            </Text>
            <Badge colorScheme="blue">{filteredMedia.length} item(s)</Badge>
          </HStack>

          {mediaLoading ? (
            <Center py={8}>
              <Spinner />
            </Center>
          ) : filteredMedia.length === 0 ? (
            <Text color="gray.500" textAlign="center" py={8}>
              No media for this {selectedEntityType}. Upload files above.
            </Text>
          ) : (
            <SimpleGrid columns={{ base: 2, md: 3, lg: 4 }} spacing={4}>
              {filteredMedia.map((item) => (
                <Card key={item.id} position="relative" overflow="hidden" variant="outline">
                  <CardBody p={0}>
                    <Box position="relative">
                      <MediaPreviewCard media={item} height="150px" />
                      {/* Star indicator overlay for starred items */}
                      {item.starred && (
                        <Box
                          position="absolute"
                          top={1}
                          left={1}
                          bg="yellow.400"
                          borderRadius="full"
                          p={1}
                          zIndex={1}
                        >
                          <FiStar size={14} color="white" fill="white" />
                        </Box>
                      )}
                    </Box>
                    <Box p={2}>
                      <Text fontSize="xs" noOfLines={1} title={item.file_name}>
                        {item.file_name}
                      </Text>
                      {/* Show caption preview if exists */}
                      {item.caption && (
                        <Text fontSize="xs" color="blue.500" noOfLines={1} title={item.caption}>
                          {item.caption}
                        </Text>
                      )}
                      {/* Show linked audio indicator */}
                      {item.linked_audio_id && (
                        <Badge size="xs" colorScheme="green" fontSize="xx-small">
                          🔊 Audio linked
                        </Badge>
                      )}
                      <HStack justify="space-between" mt={1}>
                        <Text fontSize="xs" color="gray.500">
                          {(item.file_size / 1024 / 1024).toFixed(2)} MB
                        </Text>
                        <HStack spacing={1}>
                          {/* Edit button for images - set caption and link audio */}
                          {item.type === 'image' && (
                            <IconButton
                              aria-label="Edit media"
                              icon={<FiEdit2 />}
                              size="xs"
                              colorScheme="blue"
                              variant="ghost"
                              onClick={() => setEditingMedia({
                                id: item.id,
                                caption: item.caption || '',
                                linkedAudioId: item.linked_audio_id || null,
                              })}
                            />
                          )}
                          {/* Allow starring images, videos, and audio files */}
                          {(item.type === 'image' || item.type === 'video' || item.type === 'video360' || item.type === 'audio') && (
                            <IconButton
                              aria-label={item.starred ? 'Remove star' : `Star ${item.type}`}
                              icon={<FiStar fill={item.starred ? 'currentColor' : 'none'} />}
                              size="xs"
                              colorScheme={item.starred ? 'yellow' : 'gray'}
                              variant={item.starred ? 'solid' : 'ghost'}
                              onClick={() => starMutation.mutate(item.id)}
                              isLoading={starMutation.isPending}
                            />
                          )}
                          <IconButton
                            aria-label="Delete media"
                            icon={<FiTrash2 />}
                            size="xs"
                            colorScheme="red"
                            variant="ghost"
                            onClick={() => deleteMutation.mutate(item.id)}
                            isLoading={deleteMutation.isPending}
                          />
                        </HStack>
                      </HStack>
                    </Box>
                  </CardBody>
                </Card>
              ))}
            </SimpleGrid>
          )}
        </CardBody>
      </Card>

      {/* All media summary */}
      {media.length > 0 && (
        <Card>
          <CardBody>
            <Text fontWeight="500" mb={2}>All Property Media ({media.length} total)</Text>
            <HStack spacing={4} flexWrap="wrap">
              <Badge>Property: {media.filter(m => m.entity_type === 'property').length}</Badge>
              <Badge>Structures: {media.filter(m => m.entity_type === 'structure').length}</Badge>
              <Badge>Rooms: {media.filter(m => m.entity_type === 'room').length}</Badge>
              <Badge>Areas: {media.filter(m => m.entity_type === 'area').length}</Badge>
            </HStack>
          </CardBody>
        </Card>
      )}

      {/* Edit Media Modal */}
      <Modal isOpen={!!editingMedia} onClose={() => setEditingMedia(null)} size="md">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Edit Image</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <FormControl>
                <FormLabel>Caption</FormLabel>
                <Textarea
                  value={editingMedia?.caption || ''}
                  onChange={(e) => setEditingMedia(prev => prev ? { ...prev, caption: e.target.value } : null)}
                  placeholder="Enter a caption for this image..."
                  rows={3}
                />
              </FormControl>
              <FormControl>
                <FormLabel>Linked Audio (for narration)</FormLabel>
                <Select
                  value={editingMedia?.linkedAudioId || ''}
                  onChange={(e) => setEditingMedia(prev => prev ? { ...prev, linkedAudioId: e.target.value || null } : null)}
                >
                  <option value="">No audio linked</option>
                  {audioFiles.map((audio) => (
                    <option key={audio.id} value={audio.id}>
                      {audio.file_name}
                    </option>
                  ))}
                </Select>
                <Text fontSize="xs" color="gray.500" mt={1}>
                  Link an audio file to play when this image is displayed
                </Text>
              </FormControl>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={() => setEditingMedia(null)}>
              Cancel
            </Button>
            <Button
              colorScheme="brand"
              onClick={() => {
                if (editingMedia) {
                  updateMediaMutation.mutate({
                    id: editingMedia.id,
                    data: {
                      caption: editingMedia.caption,
                      linked_audio_id: editingMedia.linkedAudioId,
                    },
                  })
                }
              }}
              isLoading={updateMediaMutation.isPending}
            >
              Save
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </VStack>
  )
}

// Modals
function StructureModal({
  isOpen,
  onClose,
  onSave,
  isLoading,
}: {
  isOpen: boolean
  onClose: () => void
  onSave: (data: Partial<Structure>) => void
  isLoading: boolean
}) {
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    description: '',
    size_sqm: 0,
    floor_count: 1,
    year_built: new Date().getFullYear(),
  })

  const handleClose = () => {
    setFormData({ name: '', type: '', description: '', size_sqm: 0, floor_count: 1, year_built: new Date().getFullYear() })
    onClose()
  }

  const handleSubmit = () => {
    if (!formData.name.trim()) return
    onSave(formData)
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Add Structure</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4}>
            <FormControl isRequired>
              <FormLabel>Name</FormLabel>
              <Input
                value={formData.name}
                onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                placeholder="e.g., Main House"
              />
            </FormControl>
            <FormControl>
              <FormLabel>Type</FormLabel>
              <Select
                value={formData.type}
                onChange={(e) => setFormData((p) => ({ ...p, type: e.target.value }))}
              >
                <option value="">Select type</option>
                <option value="house">House</option>
                <option value="apartment">Apartment</option>
                <option value="villa">Villa</option>
                <option value="cottage">Cottage</option>
                <option value="barn">Barn</option>
                <option value="garage">Garage</option>
                <option value="shed">Shed</option>
                <option value="other">Other</option>
              </Select>
            </FormControl>
            <SimpleGrid columns={2} spacing={4} w="full">
              <FormControl>
                <FormLabel>Size (m²)</FormLabel>
                <Input
                  type="number"
                  value={formData.size_sqm || ''}
                  onChange={(e) => setFormData((p) => ({ ...p, size_sqm: parseFloat(e.target.value) || 0 }))}
                />
              </FormControl>
              <FormControl>
                <FormLabel>Floors</FormLabel>
                <Input
                  type="number"
                  value={formData.floor_count}
                  onChange={(e) => setFormData((p) => ({ ...p, floor_count: parseInt(e.target.value) || 1 }))}
                />
              </FormControl>
            </SimpleGrid>
            <FormControl>
              <FormLabel>Year Built</FormLabel>
              <Input
                type="number"
                value={formData.year_built}
                onChange={(e) => setFormData((p) => ({ ...p, year_built: parseInt(e.target.value) || 0 }))}
              />
            </FormControl>
            <FormControl>
              <FormLabel>Description</FormLabel>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
              />
            </FormControl>
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={handleClose}>Cancel</Button>
          <Button colorScheme="blue" onClick={handleSubmit} isLoading={isLoading}>
            Add Structure
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}

function RoomModal({
  isOpen,
  onClose,
  onSave,
  isLoading,
}: {
  isOpen: boolean
  onClose: () => void
  onSave: (data: Partial<Room>) => void
  isLoading: boolean
}) {
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    description: '',
    size_sqm: 0,
    floor: 0,
  })

  const handleClose = () => {
    setFormData({ name: '', type: '', description: '', size_sqm: 0, floor: 0 })
    onClose()
  }

  const handleSubmit = () => {
    if (!formData.name.trim()) return
    onSave(formData)
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Add Room</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4}>
            <FormControl isRequired>
              <FormLabel>Name</FormLabel>
              <Input
                value={formData.name}
                onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                placeholder="e.g., Master Bedroom"
              />
            </FormControl>
            <FormControl>
              <FormLabel>Type</FormLabel>
              <Select
                value={formData.type}
                onChange={(e) => setFormData((p) => ({ ...p, type: e.target.value }))}
              >
                <option value="">Select type</option>
                <option value="bedroom">Bedroom</option>
                <option value="bathroom">Bathroom</option>
                <option value="kitchen">Kitchen</option>
                <option value="living_room">Living Room</option>
                <option value="dining_room">Dining Room</option>
                <option value="office">Office</option>
                <option value="storage">Storage</option>
                <option value="other">Other</option>
              </Select>
            </FormControl>
            <SimpleGrid columns={2} spacing={4} w="full">
              <FormControl>
                <FormLabel>Size (m²)</FormLabel>
                <Input
                  type="number"
                  value={formData.size_sqm || ''}
                  onChange={(e) => setFormData((p) => ({ ...p, size_sqm: parseFloat(e.target.value) || 0 }))}
                />
              </FormControl>
              <FormControl>
                <FormLabel>Floor</FormLabel>
                <Input
                  type="number"
                  value={formData.floor}
                  onChange={(e) => setFormData((p) => ({ ...p, floor: parseInt(e.target.value) || 0 }))}
                />
              </FormControl>
            </SimpleGrid>
            <FormControl>
              <FormLabel>Description</FormLabel>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
              />
            </FormControl>
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={handleClose}>Cancel</Button>
          <Button colorScheme="blue" onClick={handleSubmit} isLoading={isLoading}>
            Add Room
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}

function AreaModal({
  isOpen,
  onClose,
  onSave,
  isLoading,
}: {
  isOpen: boolean
  onClose: () => void
  onSave: (data: Partial<Area>) => void
  isLoading: boolean
}) {
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    description: '',
    size_sqm: 0,
  })

  // Reset form when modal closes
  const handleClose = () => {
    setFormData({ name: '', type: '', description: '', size_sqm: 0 })
    onClose()
  }

  const handleSubmit = () => {
    if (!formData.name.trim()) return
    onSave(formData)
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Add Outdoor Area</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack spacing={4}>
            <FormControl isRequired>
              <FormLabel>Name</FormLabel>
              <Input
                value={formData.name}
                onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                placeholder="e.g., Back Garden"
              />
            </FormControl>
            <FormControl>
              <FormLabel>Type</FormLabel>
              <Select
                value={formData.type}
                onChange={(e) => setFormData((p) => ({ ...p, type: e.target.value }))}
              >
                <option value="">Select type</option>
                <option value="garden">Garden</option>
                <option value="field">Field</option>
                <option value="forest">Forest</option>
                <option value="orchard">Orchard</option>
                <option value="vineyard">Vineyard</option>
                <option value="pool">Pool</option>
                <option value="patio">Patio</option>
                <option value="parking">Parking</option>
                <option value="other">Other</option>
              </Select>
            </FormControl>
            <FormControl>
              <FormLabel>Size (m²)</FormLabel>
              <Input
                type="number"
                value={formData.size_sqm || ''}
                onChange={(e) => setFormData((p) => ({ ...p, size_sqm: parseFloat(e.target.value) || 0 }))}
              />
            </FormControl>
            <FormControl>
              <FormLabel>Description</FormLabel>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
              />
            </FormControl>
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={handleClose}>Cancel</Button>
          <Button colorScheme="blue" onClick={handleSubmit} isLoading={isLoading}>
            Add Area
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}

// Quotes Tab
function QuotesTab({ property }: { property: Property }) {
  const queryClient = useQueryClient()
  const toast = useToast()
  const [newQuoteText, setNewQuoteText] = useState('')
  const [newQuoteMediaId, setNewQuoteMediaId] = useState<string>('')
  const [editingQuote, setEditingQuote] = useState<Quote | null>(null)
  const [editingMediaId, setEditingMediaId] = useState<string>('')

  const { data: quotesData, isLoading } = useQuery({
    queryKey: ['property-quotes', property.slug],
    queryFn: () => api.getPropertyQuotes(property.slug),
  })

  const { data: mediaData } = useQuery({
    queryKey: ['media', property.slug],
    queryFn: () => api.getPropertyMedia(property.slug),
  })

  const quotes = quotesData?.data || []
  // Filter to only show images for quote association
  const images = (mediaData?.data || []).filter((m: Media) => m.type === 'image')

  const createMutation = useMutation({
    mutationFn: ({ text, media_id }: { text: string; media_id?: string }) =>
      api.createQuote({
        property_id: property.id,
        text,
        media_id: media_id || undefined,
        sort_order: quotes.length,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['property-quotes', property.slug] })
      setNewQuoteText('')
      setNewQuoteMediaId('')
      toast({ title: 'Quote added', status: 'success', duration: 2000 })
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to add quote', description: error.message, status: 'error' })
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, text, media_id }: { id: string; text: string; media_id?: string }) =>
      api.updateQuote(id, { text, media_id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['property-quotes', property.slug] })
      setEditingQuote(null)
      setEditingMediaId('')
      toast({ title: 'Quote updated', status: 'success', duration: 2000 })
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to update quote', description: error.message, status: 'error' })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteQuote(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['property-quotes', property.slug] })
      toast({ title: 'Quote deleted', status: 'success', duration: 2000 })
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to delete quote', description: error.message, status: 'error' })
    },
  })

  const handleAddQuote = () => {
    if (newQuoteText.trim()) {
      createMutation.mutate({
        text: newQuoteText.trim(),
        media_id: newQuoteMediaId || undefined,
      })
    }
  }

  const handleUpdateQuote = () => {
    if (editingQuote && editingQuote.text.trim()) {
      updateMutation.mutate({
        id: editingQuote.id,
        text: editingQuote.text.trim(),
        media_id: editingMediaId || undefined,
      })
    }
  }

  const startEditing = (quote: Quote) => {
    setEditingQuote(quote)
    setEditingMediaId(quote.media_id || '')
  }

  const cancelEditing = () => {
    setEditingQuote(null)
    setEditingMediaId('')
  }

  // Helper to get image by ID
  const getImageById = (id: string | undefined): Media | undefined => {
    if (!id) return undefined
    return images.find((m: Media) => m.id === id)
  }

  return (
    <VStack spacing={6} align="stretch">
      <Card>
        <CardHeader>
          <Heading size="md">Property Quotes</Heading>
          <Text fontSize="sm" color="gray.500" mt={1}>
            Promotional taglines displayed over the property images (cycles every 15 seconds)
          </Text>
        </CardHeader>
        <CardBody>
          {/* Add new quote */}
          <VStack spacing={3} mb={6} align="stretch">
            <HStack>
              <Input
                placeholder='e.g., "Jewel of the Alentejo"'
                value={newQuoteText}
                onChange={(e) => setNewQuoteText(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddQuote()}
                flex={1}
              />
              <IconButton
                aria-label="Add quote"
                icon={<FiPlus />}
                colorScheme="blue"
                onClick={handleAddQuote}
                isLoading={createMutation.isPending}
                isDisabled={!newQuoteText.trim()}
              />
            </HStack>
            <HStack>
              <Select
                placeholder="Link to image (optional)"
                value={newQuoteMediaId}
                onChange={(e) => setNewQuoteMediaId(e.target.value)}
                size="sm"
                flex={1}
              >
                {images.map((img: Media) => (
                  <option key={img.id} value={img.id}>
                    {img.file_name || img.url.split('/').pop()}
                  </option>
                ))}
              </Select>
              {newQuoteMediaId && (
                <Image
                  src={getImageById(newQuoteMediaId)?.thumbnail_url || getImageById(newQuoteMediaId)?.url}
                  alt="Selected"
                  boxSize="40px"
                  objectFit="cover"
                  borderRadius="md"
                />
              )}
            </HStack>
          </VStack>

          {/* Existing quotes list */}
          {isLoading ? (
            <Center py={8}>
              <Spinner />
            </Center>
          ) : quotes.length === 0 ? (
            <Text color="gray.500" textAlign="center" py={8}>
              No quotes yet. Add some promotional taglines above.
            </Text>
          ) : (
            <VStack spacing={3} align="stretch">
              {quotes.map((quote, index) => (
                <Card key={quote.id} variant="outline">
                  <CardBody py={3}>
                    {editingQuote?.id === quote.id ? (
                      <VStack spacing={2} align="stretch">
                        <HStack>
                          <Input
                            value={editingQuote.text}
                            onChange={(e) => setEditingQuote({ ...editingQuote, text: e.target.value })}
                            onKeyPress={(e) => e.key === 'Enter' && handleUpdateQuote()}
                            autoFocus
                            flex={1}
                          />
                          <IconButton
                            aria-label="Save"
                            icon={<FiStar />}
                            colorScheme="green"
                            size="sm"
                            onClick={handleUpdateQuote}
                            isLoading={updateMutation.isPending}
                          />
                          <IconButton
                            aria-label="Cancel"
                            icon={<FiTrash2 />}
                            variant="ghost"
                            size="sm"
                            onClick={cancelEditing}
                          />
                        </HStack>
                        <HStack>
                          <Select
                            placeholder="Link to image (optional)"
                            value={editingMediaId}
                            onChange={(e) => setEditingMediaId(e.target.value)}
                            size="sm"
                            flex={1}
                          >
                            {images.map((img: Media) => (
                              <option key={img.id} value={img.id}>
                                {img.file_name || img.url.split('/').pop()}
                              </option>
                            ))}
                          </Select>
                          {editingMediaId && (
                            <Image
                              src={getImageById(editingMediaId)?.thumbnail_url || getImageById(editingMediaId)?.url}
                              alt="Selected"
                              boxSize="40px"
                              objectFit="cover"
                              borderRadius="md"
                            />
                          )}
                        </HStack>
                      </VStack>
                    ) : (
                      <HStack justify="space-between">
                        <HStack spacing={3}>
                          <Badge colorScheme="blue" fontSize="xs">{index + 1}</Badge>
                          {quote.media_id && (
                            <Image
                              src={getImageById(quote.media_id)?.thumbnail_url || getImageById(quote.media_id)?.url}
                              alt="Linked"
                              boxSize="40px"
                              objectFit="cover"
                              borderRadius="md"
                              border="2px solid"
                              borderColor="blue.200"
                            />
                          )}
                          <Text fontStyle="italic" fontSize="lg">"{quote.text}"</Text>
                        </HStack>
                        <HStack>
                          <IconButton
                            aria-label="Edit quote"
                            icon={<FiEdit2 />}
                            variant="ghost"
                            size="sm"
                            onClick={() => startEditing(quote)}
                          />
                          <IconButton
                            aria-label="Delete quote"
                            icon={<FiTrash2 />}
                            variant="ghost"
                            colorScheme="red"
                            size="sm"
                            onClick={() => deleteMutation.mutate(quote.id)}
                            isLoading={deleteMutation.isPending}
                          />
                        </HStack>
                      </HStack>
                    )}
                  </CardBody>
                </Card>
              ))}
            </VStack>
          )}
        </CardBody>
      </Card>
    </VStack>
  )
}
