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
import { FiPlus, FiTrash2, FiHome, FiLayers, FiMapPin, FiStar, FiEdit2, FiImage, FiChevronDown, FiChevronUp } from 'react-icons/fi'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api, Property, Structure, Room, Area, Quote, Media } from '../../api'
import { useAuthHeaders } from '../../context/authStore'
import { MediaPreviewCard, MediaAssociationPanel } from '../media'
import Map3DTab from './Map3DTab'

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
          <Tab>3D Map</Tab>
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
          <TabPanel px={0}>
            <Map3DTab property={property} />
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
              property={property}
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

function StructureItem({ structure, property, onDelete }: { structure: Structure; property: Property; onDelete: () => void }) {
  const authHeaders = useAuthHeaders()
  const queryClient = useQueryClient()
  const toast = useToast()
  const { isOpen, onOpen, onClose } = useDisclosure()
  const [showStructureMedia, setShowStructureMedia] = useState(false)
  const [expandedRoomId, setExpandedRoomId] = useState<string | null>(null)

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
                  <Box key={room.id}>
                    <HStack p={2} bg="gray.50" borderRadius="md" justify="space-between">
                      <HStack>
                        <FiLayers />
                        <Text>{room.name}</Text>
                        {room.type && <Text color="gray.500">({room.type})</Text>}
                        {room.size_sqm && <Text color="gray.500">{room.size_sqm} m²</Text>}
                      </HStack>
                      <HStack spacing={1}>
                        <IconButton
                          aria-label="Toggle media"
                          icon={expandedRoomId === room.id ? <FiChevronUp /> : <FiImage />}
                          size="xs"
                          variant="ghost"
                          colorScheme={expandedRoomId === room.id ? 'blue' : 'gray'}
                          onClick={() => setExpandedRoomId(expandedRoomId === room.id ? null : room.id)}
                        />
                        <IconButton
                          aria-label="Delete"
                          icon={<FiTrash2 />}
                          size="xs"
                          variant="ghost"
                          colorScheme="red"
                          onClick={() => deleteRoomMutation.mutate(room.id)}
                        />
                      </HStack>
                    </HStack>
                    {expandedRoomId === room.id && (
                      <Box mt={2} ml={4} p={3} bg="gray.25" borderRadius="md" borderWidth="1px" borderColor="gray.100">
                        <MediaAssociationPanel
                          propertySlug={property.slug}
                          propertyId={property.id}
                          entityType="room"
                          entityId={room.id}
                          entityName={room.name}
                        />
                      </Box>
                    )}
                  </Box>
                ))}
              </VStack>
            )}
          </Box>

          {/* Structure Media Section */}
          <Box mt={4} pt={4} borderTopWidth="1px">
            <HStack justify="space-between" mb={2}>
              <HStack>
                <FiImage />
                <Text fontWeight="600">Structure Media</Text>
              </HStack>
              <IconButton
                aria-label="Toggle media panel"
                icon={showStructureMedia ? <FiChevronUp /> : <FiChevronDown />}
                size="xs"
                variant="ghost"
                onClick={() => setShowStructureMedia(!showStructureMedia)}
              />
            </HStack>
            {showStructureMedia && (
              <MediaAssociationPanel
                propertySlug={property.slug}
                propertyId={property.id}
                entityType="structure"
                entityId={structure.id}
                entityName={structure.name}
              />
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
  const [expandedAreaId, setExpandedAreaId] = useState<string | null>(null)

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
                  <HStack spacing={1}>
                    <IconButton
                      aria-label="Toggle media"
                      icon={expandedAreaId === area.id ? <FiChevronUp /> : <FiImage />}
                      size="sm"
                      variant="ghost"
                      colorScheme={expandedAreaId === area.id ? 'blue' : 'gray'}
                      onClick={() => setExpandedAreaId(expandedAreaId === area.id ? null : area.id)}
                    />
                    <IconButton
                      aria-label="Delete"
                      icon={<FiTrash2 />}
                      size="sm"
                      variant="ghost"
                      colorScheme="red"
                      onClick={() => deleteAreaMutation.mutate(area.id)}
                    />
                  </HStack>
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
                {expandedAreaId === area.id && (
                  <Box mt={3} pt={3} borderTopWidth="1px">
                    <MediaAssociationPanel
                      propertySlug={property.slug}
                      propertyId={property.id}
                      entityType="area"
                      entityId={area.id}
                      entityName={area.name}
                    />
                  </Box>
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

// Media Tab - Split View Design (no modals)
function MediaTab({ property }: { property: Property }) {
  const queryClient = useQueryClient()
  const toast = useToast()
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isDragOver, setIsDragOver] = useState(false)
  const [selectedEntityType, setSelectedEntityType] = useState<'property' | 'structure' | 'room' | 'area'>('property')
  const [selectedEntityId, setSelectedEntityId] = useState<string>(property.id)

  // Selected media for detail panel (replaces modal)
  const [selectedMediaId, setSelectedMediaId] = useState<string | null>(null)

  // Editing state for the detail panel
  const [editForm, setEditForm] = useState<{
    caption: string
    linkedAudioId: string | null
    entityType: 'property' | 'structure' | 'room' | 'area'
    entityId: string
    tag: string
    creatingNew: boolean
    newEntityName: string
    newEntityType: string
    newEntityStructureId: string
  } | null>(null)

  // Track if form has unsaved changes
  const [hasChanges, setHasChanges] = useState(false)

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
    mutationFn: ({ id, data }: { id: string; data: { caption?: string; linked_audio_id?: string | null; entity_type?: string; entity_id?: string; tag?: string } }) =>
      api.updateMedia(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media', property.slug] })
      toast({ title: 'Media updated', status: 'success', duration: 2000 })
      setHasChanges(false)
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
        // Skip ZIP files - they should be uploaded via the 3D Map tab
        if (file.name.toLowerCase().endsWith('.zip')) {
          toast({
            title: 'ZIP files should be uploaded in the 3D Map tab',
            description: 'Use the "3D Map" tab to upload Qgis2threejs exports.',
            status: 'info',
            duration: 5000,
          })
          continue
        }

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
    if (uploaded > 0) {
      toast({
        title: `Uploaded ${uploaded} file(s)`,
        status: 'success',
        duration: 3000,
      })
    }
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

  // Handler to select a media item and populate the edit form
  const handleSelectMedia = (item: Media) => {
    setSelectedMediaId(item.id)
    setEditForm({
      caption: item.caption || '',
      linkedAudioId: item.linked_audio_id || null,
      entityType: item.entity_type as 'property' | 'structure' | 'room' | 'area',
      entityId: item.entity_id,
      tag: item.tag || '',
      creatingNew: false,
      newEntityName: '',
      newEntityType: '',
      newEntityStructureId: structures.length > 0 ? structures[0].id : '',
    })
    setHasChanges(false)
  }

  // Handler to close detail panel
  const handleCloseDetail = () => {
    setSelectedMediaId(null)
    setEditForm(null)
    setHasChanges(false)
  }

  // Handler to save media changes
  const handleSaveMedia = async () => {
    if (!selectedMediaId || !editForm) return

    let entityId = editForm.entityId
    const newEntityType = editForm.entityType
    let createdNewEntity = false

    // If creating a new entity, create it first
    if (editForm.creatingNew && editForm.newEntityName.trim()) {
      try {
        if (editForm.entityType === 'structure') {
          const result = await api.createStructure({
            property_id: property.id,
            name: editForm.newEntityName,
            type: editForm.newEntityType,
          })
          console.log('Created structure:', result)
          entityId = result.id
          createdNewEntity = true
          await queryClient.invalidateQueries({ queryKey: ['structures', property.slug] })
        } else if (editForm.entityType === 'room') {
          if (!editForm.newEntityStructureId) {
            toast({ title: 'Please select a structure for the room', status: 'warning', duration: 3000 })
            return
          }
          const result = await api.createRoom({
            structure_id: editForm.newEntityStructureId,
            name: editForm.newEntityName,
            type: editForm.newEntityType,
          })
          console.log('Created room:', result)
          entityId = result.id
          createdNewEntity = true
          await queryClient.invalidateQueries({ queryKey: ['structures', property.slug] })
        } else if (editForm.entityType === 'area') {
          const result = await api.createArea({
            property_id: property.id,
            name: editForm.newEntityName,
            type: editForm.newEntityType,
          })
          console.log('Created area:', result)
          entityId = result.id
          createdNewEntity = true
          await queryClient.invalidateQueries({ queryKey: ['areas', property.slug] })
        }
        toast({
          title: `${editForm.entityType.charAt(0).toUpperCase() + editForm.entityType.slice(1)} "${editForm.newEntityName}" created`,
          status: 'success',
          duration: 2000
        })
      } catch (error) {
        console.error('Failed to create entity:', error)
        toast({ title: `Failed to create ${editForm.entityType}`, status: 'error', duration: 3000 })
        return
      }
    }

    // Now update the media
    console.log('Updating media:', selectedMediaId, 'to entity:', newEntityType, entityId)
    updateMediaMutation.mutate({
      id: selectedMediaId,
      data: {
        caption: editForm.caption,
        linked_audio_id: editForm.linkedAudioId,
        entity_type: editForm.entityType,
        entity_id: entityId,
        tag: editForm.tag,
      },
    }, {
      onSuccess: () => {
        // If we created a new entity, switch the view to show that entity's media
        if (createdNewEntity && entityId) {
          console.log('Switching view to:', newEntityType, entityId)
          setSelectedEntityType(newEntityType)
          setSelectedEntityId(entityId)
        }
        // Close the detail panel
        handleCloseDetail()
      }
    })
  }

  // Get selected media item
  const selectedMedia = selectedMediaId ? media.find(m => m.id === selectedMediaId) : null

  return (
    <HStack spacing={0} align="flex-start" position="relative">
      {/* Left Panel - Media Grid (natural scrolling) */}
      <Box
        flex="1"
        pr={selectedMediaId ? '400px' : 0}
        transition="padding 0.3s ease"
      >
        <VStack spacing={4} align="stretch">
          {/* Entity selector - compact */}
          <Card size="sm">
            <CardBody py={3}>
              <HStack spacing={4} flexWrap="wrap">
                <Text fontWeight="500" fontSize="sm">Upload to:</Text>
                <Select
                  size="sm"
                  w="auto"
                  minW="150px"
                  value={selectedEntityType}
                  onChange={(e) => handleEntityTypeChange(e.target.value as typeof selectedEntityType)}
                >
                  <option value="property">Whole Property</option>
                  <option value="structure" disabled={structures.length === 0}>
                    Structure {structures.length === 0 && '(none)'}
                  </option>
                  <option value="room" disabled={allRooms.length === 0}>
                    Room {allRooms.length === 0 && '(none)'}
                  </option>
                  <option value="area" disabled={areas.length === 0}>
                    Area {areas.length === 0 && '(none)'}
                  </option>
                </Select>
                {selectedEntityType !== 'property' && (
                  <Select
                    size="sm"
                    w="auto"
                    minW="150px"
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
                )}
              </HStack>
            </CardBody>
          </Card>

          {/* Upload area - compact */}
          <Box
            p={4}
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
              <HStack justify="center" spacing={3}>
                <Spinner size="sm" color="blue.500" />
                <Text fontSize="sm">Uploading... {uploadProgress}%</Text>
              </HStack>
            ) : (
              <HStack justify="center" spacing={4}>
                <Text>📤</Text>
                <Text fontWeight="500" fontSize="sm">Drag & drop files here</Text>
                <Text fontSize="xs" color="gray.500">or click to browse</Text>
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
              </HStack>
            )}
          </Box>

          {/* Media grid header */}
          <HStack justify="space-between" mb={2}>
            <Text fontWeight="500" fontSize="sm">
              {getEntityLabel(selectedEntityType, selectedEntityId)}
            </Text>
            <Badge colorScheme="blue" fontSize="xs">{filteredMedia.length} items</Badge>
          </HStack>

          {/* Media grid */}
          {mediaLoading ? (
            <Center py={8}>
              <Spinner />
            </Center>
          ) : filteredMedia.length === 0 ? (
            <Text color="gray.500" textAlign="center" py={8} fontSize="sm">
              No media for this {selectedEntityType}. Upload files above.
            </Text>
          ) : (
            <SimpleGrid columns={{ base: 2, md: selectedMediaId ? 2 : 3, lg: selectedMediaId ? 3 : 4 }} spacing={3}>
              {filteredMedia.map((item) => (
                <Box
                  key={item.id}
                  position="relative"
                  borderRadius="lg"
                  overflow="hidden"
                  borderWidth="2px"
                  borderColor={selectedMediaId === item.id ? 'blue.500' : 'transparent'}
                  bg={selectedMediaId === item.id ? 'blue.50' : 'white'}
                  cursor="pointer"
                  transition="all 0.2s ease"
                  _hover={{
                    borderColor: selectedMediaId === item.id ? 'blue.500' : 'gray.300',
                    transform: 'scale(1.02)',
                  }}
                  onClick={() => handleSelectMedia(item)}
                  boxShadow={selectedMediaId === item.id ? 'md' : 'sm'}
                >
                  <Box position="relative">
                    <MediaPreviewCard media={item} height="120px" />
                    {/* Star indicator */}
                    {item.starred && (
                      <Box
                        position="absolute"
                        top={1}
                        left={1}
                        bg="yellow.400"
                        borderRadius="full"
                        p={1}
                      >
                        <FiStar size={12} color="white" fill="white" />
                      </Box>
                    )}
                    {/* Selection indicator */}
                    {selectedMediaId === item.id && (
                      <Box
                        position="absolute"
                        top={1}
                        right={1}
                        bg="blue.500"
                        borderRadius="full"
                        p={1}
                      >
                        <FiEdit2 size={12} color="white" />
                      </Box>
                    )}
                  </Box>
                  <Box p={2}>
                    <Text fontSize="xs" noOfLines={1} fontWeight={selectedMediaId === item.id ? '500' : '400'}>
                      {item.file_name}
                    </Text>
                    {item.tag && (
                      <Badge size="xs" colorScheme={item.tag === 'house_plan' ? 'purple' : 'orange'} fontSize="xx-small">
                        {item.tag === 'house_plan' ? '📐 Plan' : '🗺️ Map'}
                      </Badge>
                    )}
                  </Box>
                </Box>
              ))}
            </SimpleGrid>
          )}

          {/* All media summary */}
          {media.length > 0 && (
            <HStack spacing={2} mt={4} flexWrap="wrap" fontSize="xs" color="gray.500">
              <Text>Total: {media.length}</Text>
              <Text>|</Text>
              <Text>Property: {media.filter(m => m.entity_type === 'property').length}</Text>
              <Text>Structures: {media.filter(m => m.entity_type === 'structure').length}</Text>
              <Text>Rooms: {media.filter(m => m.entity_type === 'room').length}</Text>
              <Text>Areas: {media.filter(m => m.entity_type === 'area').length}</Text>
            </HStack>
          )}
        </VStack>
      </Box>

      {/* Right Panel - Detail Editor (fixed position when shown) */}
      <Box
        position="fixed"
        right={0}
        top="140px"
        bottom={0}
        w={selectedMediaId ? '380px' : '0px'}
        overflow="hidden"
        transition="width 0.3s ease"
        borderLeftWidth={selectedMediaId ? '1px' : '0'}
        borderColor="gray.200"
        bg="white"
        zIndex={10}
        boxShadow={selectedMediaId ? 'lg' : 'none'}
      >
        {selectedMedia && editForm && (
          <Box h="100%" overflowY="auto" pl={4} pr={4} pb={4}>
            <VStack spacing={4} align="stretch">
              {/* Header with close button */}
              <HStack justify="space-between" position="sticky" top={0} bg="white" py={2} zIndex={1}>
                <Text fontWeight="600" fontSize="lg">Edit Media</Text>
                <IconButton
                  aria-label="Close panel"
                  icon={<Text fontSize="lg">×</Text>}
                  size="sm"
                  variant="ghost"
                  onClick={handleCloseDetail}
                />
              </HStack>

              {/* Large preview */}
              <Box borderRadius="lg" overflow="hidden" bg="gray.100">
                <Image
                  src={selectedMedia.thumbnail_url || selectedMedia.url}
                  alt={selectedMedia.file_name}
                  w="full"
                  maxH="220px"
                  objectFit="cover"
                />
              </Box>

              {/* File info */}
              <Box fontSize="xs" color="gray.500">
                <Text fontWeight="500">{selectedMedia.file_name}</Text>
                <Text>{(selectedMedia.file_size / 1024 / 1024).toFixed(2)} MB • {selectedMedia.width}×{selectedMedia.height}</Text>
              </Box>

              {/* Quick actions */}
              <HStack spacing={2}>
                <IconButton
                  aria-label={selectedMedia.starred ? 'Remove star' : 'Star'}
                  icon={<FiStar fill={selectedMedia.starred ? 'currentColor' : 'none'} />}
                  size="sm"
                  colorScheme={selectedMedia.starred ? 'yellow' : 'gray'}
                  variant={selectedMedia.starred ? 'solid' : 'outline'}
                  onClick={(e) => {
                    e.stopPropagation()
                    starMutation.mutate(selectedMedia.id)
                  }}
                />
                <IconButton
                  aria-label="Delete"
                  icon={<FiTrash2 />}
                  size="sm"
                  colorScheme="red"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation()
                    deleteMutation.mutate(selectedMedia.id)
                    handleCloseDetail()
                  }}
                />
              </HStack>

              {/* Caption */}
              <FormControl>
                <FormLabel fontSize="sm">Caption</FormLabel>
                <Textarea
                  value={editForm.caption}
                  onChange={(e) => {
                    setEditForm(prev => prev ? { ...prev, caption: e.target.value } : null)
                    setHasChanges(true)
                  }}
                  placeholder="Enter a caption..."
                  rows={2}
                  size="sm"
                />
              </FormControl>

              {/* Linked Audio */}
              <FormControl>
                <FormLabel fontSize="sm">Linked Audio</FormLabel>
                <Select
                  size="sm"
                  value={editForm.linkedAudioId || ''}
                  onChange={(e) => {
                    setEditForm(prev => prev ? { ...prev, linkedAudioId: e.target.value || null } : null)
                    setHasChanges(true)
                  }}
                >
                  <option value="">No audio</option>
                  {audioFiles.map((audio) => (
                    <option key={audio.id} value={audio.id}>{audio.file_name}</option>
                  ))}
                </Select>
              </FormControl>

              {/* Special Tag */}
              <FormControl>
                <FormLabel fontSize="sm">Special Tag</FormLabel>
                <Select
                  size="sm"
                  value={editForm.tag}
                  onChange={(e) => {
                    setEditForm(prev => prev ? { ...prev, tag: e.target.value } : null)
                    setHasChanges(true)
                  }}
                >
                  <option value="">None</option>
                  <option value="house_plan">House Plan</option>
                  <option value="property_map">Property Map</option>
                </Select>
              </FormControl>

              {/* Entity Assignment */}
              <FormControl>
                <FormLabel fontSize="sm">Assign To</FormLabel>
                <VStack spacing={2} align="stretch">
                  <Select
                    size="sm"
                    value={editForm.entityType}
                    onChange={(e) => {
                      const newType = e.target.value as 'property' | 'structure' | 'room' | 'area'
                      let newId = property.id
                      let shouldCreateNew = false

                      if (newType === 'structure') {
                        if (structures.length > 0) {
                          newId = structures[0].id
                        } else {
                          // No structures exist, auto-enable create new
                          shouldCreateNew = true
                        }
                      } else if (newType === 'room') {
                        if (allRooms.length > 0) {
                          newId = allRooms[0].id
                        } else {
                          shouldCreateNew = true
                        }
                      } else if (newType === 'area') {
                        if (areas.length > 0) {
                          newId = areas[0].id
                        } else {
                          shouldCreateNew = true
                        }
                      }

                      setEditForm(prev => prev ? {
                        ...prev,
                        entityType: newType,
                        entityId: newId,
                        creatingNew: shouldCreateNew,
                        newEntityName: '',
                        newEntityType: '',
                        newEntityStructureId: structures.length > 0 ? structures[0].id : ''
                      } : null)
                      setHasChanges(true)
                    }}
                  >
                    <option value="property">Property</option>
                    <option value="structure">Structure</option>
                    <option value="room">Room</option>
                    <option value="area">Area</option>
                  </Select>

                  {editForm.entityType === 'structure' && (
                    <Select
                      size="sm"
                      value={editForm.creatingNew ? '__new__' : editForm.entityId}
                      onChange={(e) => {
                        if (e.target.value === '__new__') {
                          setEditForm(prev => prev ? { ...prev, creatingNew: true, newEntityName: '', newEntityType: '' } : null)
                        } else {
                          setEditForm(prev => prev ? { ...prev, entityId: e.target.value, creatingNew: false } : null)
                        }
                        setHasChanges(true)
                      }}
                    >
                      {structures.map((s: Structure) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                      <option value="__new__">+ Create new...</option>
                    </Select>
                  )}

                  {editForm.entityType === 'room' && (
                    <Select
                      size="sm"
                      value={editForm.creatingNew ? '__new__' : editForm.entityId}
                      onChange={(e) => {
                        if (e.target.value === '__new__') {
                          setEditForm(prev => prev ? { ...prev, creatingNew: true, newEntityName: '', newEntityType: '' } : null)
                        } else {
                          setEditForm(prev => prev ? { ...prev, entityId: e.target.value, creatingNew: false } : null)
                        }
                        setHasChanges(true)
                      }}
                    >
                      {allRooms.map((r) => (
                        <option key={r.id} value={r.id}>{r.structureName} - {r.name}</option>
                      ))}
                      <option value="__new__">+ Create new...</option>
                    </Select>
                  )}

                  {editForm.entityType === 'area' && (
                    <Select
                      size="sm"
                      value={editForm.creatingNew ? '__new__' : editForm.entityId}
                      onChange={(e) => {
                        if (e.target.value === '__new__') {
                          setEditForm(prev => prev ? { ...prev, creatingNew: true, newEntityName: '', newEntityType: '' } : null)
                        } else {
                          setEditForm(prev => prev ? { ...prev, entityId: e.target.value, creatingNew: false } : null)
                        }
                        setHasChanges(true)
                      }}
                    >
                      {areas.map((a: Area) => (
                        <option key={a.id} value={a.id}>{a.name}</option>
                      ))}
                      <option value="__new__">+ Create new...</option>
                    </Select>
                  )}
                </VStack>
              </FormControl>

              {/* Inline new entity form */}
              {editForm.creatingNew && (
                <Box p={3} bg="blue.50" borderRadius="md" borderWidth="1px" borderColor="blue.200">
                  <Text fontSize="sm" fontWeight="500" mb={2} color="blue.700">
                    New {editForm.entityType.charAt(0).toUpperCase() + editForm.entityType.slice(1)}
                  </Text>
                  <VStack spacing={2}>
                    {editForm.entityType === 'room' && (
                      <Select
                        size="sm"
                        value={editForm.newEntityStructureId}
                        onChange={(e) => {
                          setEditForm(prev => prev ? { ...prev, newEntityStructureId: e.target.value } : null)
                          setHasChanges(true)
                        }}
                        placeholder="Select structure..."
                      >
                        {structures.map((s: Structure) => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                      </Select>
                    )}
                    <Input
                      size="sm"
                      placeholder={`Name (e.g., ${editForm.entityType === 'structure' ? 'Barn' : editForm.entityType === 'room' ? 'Kitchen' : 'Garden'})`}
                      value={editForm.newEntityName}
                      onChange={(e) => {
                        setEditForm(prev => prev ? { ...prev, newEntityName: e.target.value } : null)
                        setHasChanges(true)
                      }}
                    />
                    <Select
                      size="sm"
                      value={editForm.newEntityType}
                      onChange={(e) => {
                        setEditForm(prev => prev ? { ...prev, newEntityType: e.target.value } : null)
                        setHasChanges(true)
                      }}
                      placeholder="Select type..."
                    >
                      {editForm.entityType === 'structure' && (
                        <>
                          <option value="house">House</option>
                          <option value="barn">Barn</option>
                          <option value="garage">Garage</option>
                          <option value="shed">Shed</option>
                          <option value="cottage">Cottage</option>
                          <option value="other">Other</option>
                        </>
                      )}
                      {editForm.entityType === 'room' && (
                        <>
                          <option value="bedroom">Bedroom</option>
                          <option value="bathroom">Bathroom</option>
                          <option value="kitchen">Kitchen</option>
                          <option value="living_room">Living Room</option>
                          <option value="dining_room">Dining Room</option>
                          <option value="office">Office</option>
                          <option value="storage">Storage</option>
                          <option value="other">Other</option>
                        </>
                      )}
                      {editForm.entityType === 'area' && (
                        <>
                          <option value="garden">Garden</option>
                          <option value="field">Field</option>
                          <option value="orchard">Orchard</option>
                          <option value="vineyard">Vineyard</option>
                          <option value="pool">Pool</option>
                          <option value="patio">Patio</option>
                          <option value="parking">Parking</option>
                          <option value="other">Other</option>
                        </>
                      )}
                    </Select>
                  </VStack>
                </Box>
              )}

              {/* Save button */}
              <Button
                colorScheme="blue"
                onClick={handleSaveMedia}
                isLoading={updateMediaMutation.isPending}
                isDisabled={!hasChanges && !editForm.creatingNew}
                size="sm"
              >
                {editForm.creatingNew ? 'Create & Save' : 'Save Changes'}
              </Button>
            </VStack>
          </Box>
        )}
      </Box>
    </HStack>
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
            {/* Image gallery picker with physics-like selection effect */}
            <Box>
              <Text fontSize="sm" color="gray.600" mb={2}>Link to image (optional):</Text>
              <HStack spacing={2} flexWrap="wrap" align="flex-end">
                {/* No image option */}
                <Box
                  w={!newQuoteMediaId ? '200px' : '50px'}
                  h={!newQuoteMediaId ? '200px' : '50px'}
                  borderRadius="lg"
                  border="3px solid"
                  borderColor={!newQuoteMediaId ? 'blue.500' : 'gray.200'}
                  bg={!newQuoteMediaId ? 'blue.50' : 'gray.100'}
                  cursor="pointer"
                  onClick={() => setNewQuoteMediaId('')}
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  transition="all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)"
                  _hover={{ borderColor: 'blue.300', transform: !newQuoteMediaId ? 'none' : 'scale(1.1)' }}
                  boxShadow={!newQuoteMediaId ? 'lg' : 'sm'}
                  flexShrink={0}
                >
                  <Text fontSize={!newQuoteMediaId ? 'md' : 'xs'} color="gray.500" transition="all 0.3s">None</Text>
                </Box>
                {images.map((img: Media) => {
                  const isSelected = newQuoteMediaId === img.id
                  return (
                    <Box
                      key={img.id}
                      w={isSelected ? '200px' : '50px'}
                      h={isSelected ? '200px' : '50px'}
                      borderRadius="lg"
                      overflow="hidden"
                      border="3px solid"
                      borderColor={isSelected ? 'blue.500' : 'transparent'}
                      cursor="pointer"
                      onClick={() => setNewQuoteMediaId(img.id)}
                      transition="all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)"
                      _hover={{ transform: isSelected ? 'none' : 'scale(1.1)', borderColor: 'blue.300' }}
                      boxShadow={isSelected ? 'lg' : 'sm'}
                      flexShrink={0}
                    >
                      <Image
                        src={img.thumbnail_url || img.url}
                        alt={img.file_name}
                        w="100%"
                        h="100%"
                        objectFit="cover"
                      />
                    </Box>
                  )
                })}
              </HStack>
            </Box>
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
                        {/* Image gallery picker for editing with physics effect */}
                        <Box>
                          <Text fontSize="xs" color="gray.600" mb={1}>Link to image:</Text>
                          <HStack spacing={1} flexWrap="wrap" align="flex-end">
                            {/* No image option */}
                            <Box
                              w={!editingMediaId ? '140px' : '36px'}
                              h={!editingMediaId ? '140px' : '36px'}
                              borderRadius="md"
                              border="2px solid"
                              borderColor={!editingMediaId ? 'blue.500' : 'gray.200'}
                              bg={!editingMediaId ? 'blue.50' : 'gray.100'}
                              cursor="pointer"
                              onClick={() => setEditingMediaId('')}
                              display="flex"
                              alignItems="center"
                              justifyContent="center"
                              transition="all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)"
                              _hover={{ borderColor: 'blue.300', transform: !editingMediaId ? 'none' : 'scale(1.1)' }}
                              boxShadow={!editingMediaId ? 'md' : 'sm'}
                              flexShrink={0}
                            >
                              <Text fontSize="xx-small" color="gray.500">None</Text>
                            </Box>
                            {images.map((img: Media) => {
                              const isSelected = editingMediaId === img.id
                              return (
                                <Box
                                  key={img.id}
                                  w={isSelected ? '140px' : '36px'}
                                  h={isSelected ? '140px' : '36px'}
                                  borderRadius="md"
                                  overflow="hidden"
                                  border="2px solid"
                                  borderColor={isSelected ? 'blue.500' : 'transparent'}
                                  cursor="pointer"
                                  onClick={() => setEditingMediaId(img.id)}
                                  transition="all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)"
                                  _hover={{ transform: isSelected ? 'none' : 'scale(1.1)', borderColor: 'blue.300' }}
                                  boxShadow={isSelected ? 'md' : 'sm'}
                                  flexShrink={0}
                                >
                                  <Image
                                    src={img.thumbnail_url || img.url}
                                    alt={img.file_name}
                                    w="100%"
                                    h="100%"
                                    objectFit="cover"
                                  />
                                </Box>
                              )
                            })}
                          </HStack>
                        </Box>
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
