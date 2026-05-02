// SPDX-FileCopyrightText: 2026 Tim Sutton <tim@kartoza.com>
// SPDX-License-Identifier: EUPL-1.2

import { useState } from 'react'
import {
  Box,
  Container,
  Heading,
  Text,
  HStack,
  Button,
  useColorModeValue,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
} from '@chakra-ui/react'
import { FiChevronRight, FiArrowLeft } from 'react-icons/fi'
import { Link as RouterLink } from 'react-router-dom'
import { Page } from '../api'
import { PagesList, PageBuilder } from '../components/cms'

export function CMSPage() {
  const [editingPage, setEditingPage] = useState<Page | null>(null)
  const bgColor = useColorModeValue('white', 'gray.800')
  const borderColor = useColorModeValue('gray.200', 'gray.700')
  const pageBgColor = useColorModeValue('gray.50', 'gray.900')

  if (editingPage) {
    return (
      <Box h="calc(100vh - 60px)" bg={bgColor}>
        <Box
          px={4}
          py={2}
          borderBottom="1px solid"
          borderColor={borderColor}
        >
          <HStack>
            <Button
              variant="ghost"
              size="sm"
              leftIcon={<FiArrowLeft />}
              onClick={() => setEditingPage(null)}
            >
              Back to Pages
            </Button>
            <Breadcrumb separator={<FiChevronRight />} fontSize="sm">
              <BreadcrumbItem>
                <BreadcrumbLink onClick={() => setEditingPage(null)}>CMS</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbItem isCurrentPage>
                <BreadcrumbLink>{editingPage.title}</BreadcrumbLink>
              </BreadcrumbItem>
            </Breadcrumb>
          </HStack>
        </Box>
        <PageBuilder page={editingPage} onClose={() => setEditingPage(null)} />
      </Box>
    )
  }

  return (
    <Box minH="calc(100vh - 60px)" bg={pageBgColor} py={8}>
      <Container maxW="container.xl">
        <Box mb={6}>
          <Breadcrumb separator={<FiChevronRight />} fontSize="sm" color="gray.500">
            <BreadcrumbItem>
              <BreadcrumbLink as={RouterLink} to="/admin">Admin</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbItem isCurrentPage>
              <BreadcrumbLink>CMS</BreadcrumbLink>
            </BreadcrumbItem>
          </Breadcrumb>
          <Heading size="lg" mt={2}>Content Management</Heading>
          <Text color="gray.500" mt={1}>
            Create and manage pages with the visual page builder
          </Text>
        </Box>

        <Box bg={bgColor} borderRadius="lg" p={6} shadow="sm">
          <PagesList onEditPage={setEditingPage} />
        </Box>
      </Container>
    </Box>
  )
}
