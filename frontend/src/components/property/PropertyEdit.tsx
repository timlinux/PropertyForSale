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
import { FiPlus, FiTrash2, FiHome, FiLayers, FiMapPin, FiStar } from 'react-icons/fi'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api, Property, Dwelling, Room, Area } from '../../api'
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
          <Tab>Dwellings & Rooms</Tab>
          <Tab>Outdoor Areas</Tab>
          <Tab>Media</Tab>
        </TabList>

        <TabPanels>
          <TabPanel px={0}>
            <BasicInfoTab property={property} />
          </TabPanel>
          <TabPanel px={0}>
            <DwellingsTab property={property} />
          </TabPanel>
          <TabPanel px={0}>
            <AreasTab property={property} />
          </TabPanel>
          <TabPanel px={0}>
            <MediaTab property={property} />
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

// Dwellings Tab
function DwellingsTab({ property }: { property: Property }) {
  const toast = useToast()
  const queryClient = useQueryClient()
  const authHeaders = useAuthHeaders()
  const { isOpen, onOpen, onClose } = useDisclosure()

  const { data: dwellingsData } = useQuery({
    queryKey: ['dwellings', property.slug],
    queryFn: () => api.getPropertyDwellings(property.slug),
  })

  const dwellings = dwellingsData?.data || []

  const createDwellingMutation = useMutation({
    mutationFn: async (data: Partial<Dwelling>) => {
      const response = await fetch('/api/v1/dwellings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({ ...data, property_id: property.id }),
      })
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to create dwelling')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dwellings', property.slug] })
      toast({ title: 'Dwelling created', status: 'success', duration: 3000 })
      onClose()
    },
    onError: (error: Error) => {
      toast({ title: 'Error', description: error.message, status: 'error', duration: 5000 })
    },
  })

  const deleteDwellingMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/v1/dwellings/${id}`, {
        method: 'DELETE',
        headers: authHeaders,
      })
      if (!response.ok) throw new Error('Failed to delete')
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dwellings', property.slug] })
      toast({ title: 'Dwelling deleted', status: 'success', duration: 3000 })
    },
  })

  return (
    <VStack spacing={4} align="stretch">
      <HStack justify="space-between">
        <Text color="gray.600">Manage dwellings (buildings) on this property</Text>
        <Button leftIcon={<FiPlus />} colorScheme="blue" size="sm" onClick={onOpen}>
          Add Dwelling
        </Button>
      </HStack>

      {dwellings.length === 0 ? (
        <Card>
          <CardBody>
            <VStack py={8} spacing={4}>
              <FiHome size={48} color="gray" />
              <Text color="gray.500">No dwellings yet</Text>
              <Button leftIcon={<FiPlus />} onClick={onOpen}>Add First Dwelling</Button>
            </VStack>
          </CardBody>
        </Card>
      ) : (
        <Accordion allowMultiple>
          {dwellings.map((dwelling) => (
            <DwellingItem
              key={dwelling.id}
              dwelling={dwelling}
              onDelete={() => deleteDwellingMutation.mutate(dwelling.id)}
            />
          ))}
        </Accordion>
      )}

      <DwellingModal
        isOpen={isOpen}
        onClose={onClose}
        onSave={(data) => createDwellingMutation.mutate(data)}
        isLoading={createDwellingMutation.isPending}
      />
    </VStack>
  )
}

function DwellingItem({ dwelling, onDelete }: { dwelling: Dwelling; onDelete: () => void }) {
  const authHeaders = useAuthHeaders()
  const queryClient = useQueryClient()
  const toast = useToast()
  const { isOpen, onOpen, onClose } = useDisclosure()

  const { data: roomsData } = useQuery({
    queryKey: ['rooms', dwelling.id],
    queryFn: () => api.getDwellingRooms(dwelling.id),
  })

  const rooms = roomsData?.data || []

  const createRoomMutation = useMutation({
    mutationFn: async (data: Partial<Room>) => {
      const response = await fetch('/api/v1/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({ ...data, dwelling_id: dwelling.id }),
      })
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to create room')
      }
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rooms', dwelling.id] })
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
      queryClient.invalidateQueries({ queryKey: ['rooms', dwelling.id] })
      toast({ title: 'Room deleted', status: 'success', duration: 3000 })
    },
  })

  return (
    <AccordionItem>
      <AccordionButton>
        <HStack flex={1}>
          <FiHome />
          <Text fontWeight="600">{dwelling.name}</Text>
          {dwelling.type && <Text color="gray.500">({dwelling.type})</Text>}
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
              <Text>{dwelling.type || '-'}</Text>
            </Box>
            <Box>
              <Text fontSize="sm" color="gray.500">Size</Text>
              <Text>{dwelling.size_sqm ? `${dwelling.size_sqm} m²` : '-'}</Text>
            </Box>
            <Box>
              <Text fontSize="sm" color="gray.500">Year Built</Text>
              <Text>{dwelling.year_built || '-'}</Text>
            </Box>
          </SimpleGrid>

          {dwelling.description && (
            <Box>
              <Text fontSize="sm" color="gray.500">Description</Text>
              <Text>{dwelling.description}</Text>
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
  const [selectedEntityType, setSelectedEntityType] = useState<'property' | 'dwelling' | 'room' | 'area'>('property')
  const [selectedEntityId, setSelectedEntityId] = useState<string>(property.id)

  // Fetch dwellings
  const { data: dwellingsData } = useQuery({
    queryKey: ['dwellings', property.slug],
    queryFn: () => api.getPropertyDwellings(property.slug),
  })
  const dwellings = dwellingsData?.data || []

  // Fetch areas
  const { data: areasData } = useQuery({
    queryKey: ['areas', property.slug],
    queryFn: () => api.getPropertyAreas(property.slug),
  })
  const areas = areasData?.data || []

  // Build rooms list from all dwellings
  const allRooms: Array<Room & { dwellingName: string }> = []
  dwellings.forEach((dwelling: Dwelling) => {
    if (dwelling.rooms) {
      dwelling.rooms.forEach((room: Room) => {
        allRooms.push({ ...room, dwellingName: dwelling.name })
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
        title: data.starred ? 'Image starred' : 'Star removed',
        status: 'success',
        duration: 2000,
      })
    },
    onError: () => {
      toast({ title: 'Failed to toggle star', status: 'error', duration: 3000 })
    },
  })

  // Update selected entity ID when type changes
  const handleEntityTypeChange = (type: 'property' | 'dwelling' | 'room' | 'area') => {
    setSelectedEntityType(type)
    if (type === 'property') {
      setSelectedEntityId(property.id)
    } else if (type === 'dwelling' && dwellings.length > 0) {
      setSelectedEntityId(dwellings[0].id)
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
    if (entityType === 'dwelling') {
      const d = dwellings.find((d: Dwelling) => d.id === entityId)
      return d ? `Dwelling: ${d.name}` : 'Dwelling'
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
                  <option value="dwelling" disabled={dwellings.length === 0}>
                    Dwelling {dwellings.length === 0 && '(none added)'}
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
                    {selectedEntityType === 'dwelling' && 'Select Dwelling'}
                    {selectedEntityType === 'room' && 'Select Room'}
                    {selectedEntityType === 'area' && 'Select Area'}
                  </FormLabel>
                  <Select
                    value={selectedEntityId}
                    onChange={(e) => setSelectedEntityId(e.target.value)}
                  >
                    {selectedEntityType === 'dwelling' &&
                      dwellings.map((d: Dwelling) => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))
                    }
                    {selectedEntityType === 'room' &&
                      allRooms.map((r) => (
                        <option key={r.id} value={r.id}>{r.dwellingName} → {r.name}</option>
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
                      <HStack justify="space-between" mt={1}>
                        <Text fontSize="xs" color="gray.500">
                          {(item.file_size / 1024 / 1024).toFixed(2)} MB
                        </Text>
                        <HStack spacing={1}>
                          {/* Allow starring images and audio files */}
                          {(item.type === 'image' || item.type === 'audio') && (
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
              <Badge>Dwellings: {media.filter(m => m.entity_type === 'dwelling').length}</Badge>
              <Badge>Rooms: {media.filter(m => m.entity_type === 'room').length}</Badge>
              <Badge>Areas: {media.filter(m => m.entity_type === 'area').length}</Badge>
            </HStack>
          </CardBody>
        </Card>
      )}
    </VStack>
  )
}

// Modals
function DwellingModal({
  isOpen,
  onClose,
  onSave,
  isLoading,
}: {
  isOpen: boolean
  onClose: () => void
  onSave: (data: Partial<Dwelling>) => void
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
        <ModalHeader>Add Dwelling</ModalHeader>
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
            Add Dwelling
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
