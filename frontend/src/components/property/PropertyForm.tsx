// SPDX-FileCopyrightText: 2026 Tim Sutton <tim@kartoza.com>
// SPDX-License-Identifier: EUPL-1.2

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box,
  Button,
  Card,
  CardBody,
  CardHeader,
  FormControl,
  FormLabel,
  FormErrorMessage,
  Heading,
  HStack,
  Input,
  InputGroup,
  InputLeftAddon,
  Select,
  Textarea,
  VStack,
  useToast,
  SimpleGrid,
} from '@chakra-ui/react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthHeaders } from '../../context/authStore'

interface PropertyFormData {
  name: string
  slug: string
  description: string
  price_min: number
  price_max: number
  currency: string
  address_line1: string
  address_line2: string
  city: string
  state: string
  postal_code: string
  country: string
}

const initialFormData: PropertyFormData = {
  name: '',
  slug: '',
  description: '',
  price_min: 0,
  price_max: 0,
  currency: 'EUR',
  address_line1: '',
  address_line2: '',
  city: '',
  state: '',
  postal_code: '',
  country: '',
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export default function PropertyForm() {
  const navigate = useNavigate()
  const toast = useToast()
  const queryClient = useQueryClient()
  const authHeaders = useAuthHeaders()
  const [formData, setFormData] = useState<PropertyFormData>(initialFormData)
  const [errors, setErrors] = useState<Partial<Record<keyof PropertyFormData, string>>>({})

  const createMutation = useMutation({
    mutationFn: async (data: PropertyFormData) => {
      const response = await fetch('/api/v1/properties', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
        },
        body: JSON.stringify(data),
      })
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create property')
      }
      return response.json()
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['properties'] })
      toast({
        title: 'Property created',
        description: `"${data.name}" has been created successfully.`,
        status: 'success',
        duration: 5000,
      })
      navigate('/dashboard/properties')
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        status: 'error',
        duration: 5000,
      })
    },
  })

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => {
      const newData = { ...prev, [name]: value }
      // Auto-generate slug from name
      if (name === 'name') {
        newData.slug = generateSlug(value)
      }
      return newData
    })
    // Clear error when field changes
    if (errors[name as keyof PropertyFormData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }))
    }
  }

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value === '' ? 0 : parseFloat(value),
    }))
  }

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof PropertyFormData, string>> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required'
    }
    if (!formData.slug.trim()) {
      newErrors.slug = 'Slug is required'
    }
    if (formData.price_min < 0) {
      newErrors.price_min = 'Price cannot be negative'
    }
    if (formData.price_max < formData.price_min) {
      newErrors.price_max = 'Max price must be greater than min price'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validate()) {
      createMutation.mutate(formData)
    }
  }

  return (
    <Box as="form" onSubmit={handleSubmit}>
      <VStack spacing={6} align="stretch">
        <HStack justify="space-between">
          <Heading size="lg">Create Property</Heading>
          <HStack>
            <Button variant="ghost" onClick={() => navigate('/dashboard/properties')}>
              Cancel
            </Button>
            <Button
              type="submit"
              colorScheme="blue"
              isLoading={createMutation.isPending}
            >
              Create Property
            </Button>
          </HStack>
        </HStack>

        <Card>
          <CardHeader>
            <Heading size="md">Basic Information</Heading>
          </CardHeader>
          <CardBody>
            <VStack spacing={4}>
              <FormControl isRequired isInvalid={!!errors.name}>
                <FormLabel>Property Name</FormLabel>
                <Input
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g., Beautiful Villa in Tuscany"
                />
                <FormErrorMessage>{errors.name}</FormErrorMessage>
              </FormControl>

              <FormControl isRequired isInvalid={!!errors.slug}>
                <FormLabel>URL Slug</FormLabel>
                <InputGroup>
                  <InputLeftAddon>/property/</InputLeftAddon>
                  <Input
                    name="slug"
                    value={formData.slug}
                    onChange={handleChange}
                    placeholder="beautiful-villa-tuscany"
                  />
                </InputGroup>
                <FormErrorMessage>{errors.slug}</FormErrorMessage>
              </FormControl>

              <FormControl>
                <FormLabel>Description</FormLabel>
                <Textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Describe your property..."
                  rows={4}
                />
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
                  <option value="EUR">EUR (€)</option>
                  <option value="USD">USD ($)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="CHF">CHF</option>
                </Select>
              </FormControl>

              <FormControl isInvalid={!!errors.price_min}>
                <FormLabel>Minimum Price</FormLabel>
                <Input
                  name="price_min"
                  type="number"
                  value={formData.price_min || ''}
                  onChange={handleNumberChange}
                  placeholder="0"
                />
                <FormErrorMessage>{errors.price_min}</FormErrorMessage>
              </FormControl>

              <FormControl isInvalid={!!errors.price_max}>
                <FormLabel>Maximum Price</FormLabel>
                <Input
                  name="price_max"
                  type="number"
                  value={formData.price_max || ''}
                  onChange={handleNumberChange}
                  placeholder="0"
                />
                <FormErrorMessage>{errors.price_max}</FormErrorMessage>
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
                <Input
                  name="address_line1"
                  value={formData.address_line1}
                  onChange={handleChange}
                  placeholder="Street address"
                />
              </FormControl>

              <FormControl>
                <FormLabel>Address Line 2</FormLabel>
                <Input
                  name="address_line2"
                  value={formData.address_line2}
                  onChange={handleChange}
                  placeholder="Apt, suite, etc. (optional)"
                />
              </FormControl>

              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} w="full">
                <FormControl>
                  <FormLabel>City</FormLabel>
                  <Input
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    placeholder="City"
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>State / Province</FormLabel>
                  <Input
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    placeholder="State or province"
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Postal Code</FormLabel>
                  <Input
                    name="postal_code"
                    value={formData.postal_code}
                    onChange={handleChange}
                    placeholder="Postal code"
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Country</FormLabel>
                  <Input
                    name="country"
                    value={formData.country}
                    onChange={handleChange}
                    placeholder="Country"
                  />
                </FormControl>
              </SimpleGrid>
            </VStack>
          </CardBody>
        </Card>

        <HStack justify="flex-end">
          <Button variant="ghost" onClick={() => navigate('/dashboard/properties')}>
            Cancel
          </Button>
          <Button
            type="submit"
            colorScheme="blue"
            isLoading={createMutation.isPending}
          >
            Create Property
          </Button>
        </HStack>
      </VStack>
    </Box>
  )
}
