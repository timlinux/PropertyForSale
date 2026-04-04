// SPDX-FileCopyrightText: 2026 Tim Sutton <tim@kartoza.com>
// SPDX-License-Identifier: EUPL-1.2

import { Routes, Route, Link as RouterLink } from 'react-router-dom'
import {
  Box,
  Button,
  Container,
  Grid,
  GridItem,
  Heading,
  HStack,
  Stat,
  StatLabel,
  StatNumber,
  Text,
  VStack,
  Card,
  CardBody,
  CardHeader,
  SimpleGrid,
  Avatar,
  Badge,
} from '@chakra-ui/react'
import { FiHome, FiPlus, FiBarChart2, FiUsers } from 'react-icons/fi'
import { useAuthStore } from '../context/authStore'

// Dashboard overview
function DashboardOverview() {
  const user = useAuthStore((state) => state.user)

  return (
    <VStack spacing={8} align="stretch">
      {/* Welcome section */}
      <HStack justify="space-between" align="center">
        <VStack align="flex-start" spacing={1}>
          <Heading size="lg">Welcome back, {user?.name?.split(' ')[0] || 'User'}</Heading>
          <Text color="gray.600">Here's what's happening with your properties</Text>
        </VStack>
        <Button
          as={RouterLink}
          to="/dashboard/properties/new"
          leftIcon={<FiPlus />}
          colorScheme="blue"
        >
          Add Property
        </Button>
      </HStack>

      {/* Stats */}
      <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6}>
        <StatCard
          label="Total Properties"
          value="0"
          icon={FiHome}
          color="blue"
        />
        <StatCard
          label="Total Views"
          value="0"
          icon={FiBarChart2}
          color="green"
        />
        <StatCard
          label="Unique Visitors"
          value="0"
          icon={FiUsers}
          color="purple"
        />
        <StatCard
          label="Inquiries"
          value="0"
          icon={FiBarChart2}
          color="orange"
        />
      </SimpleGrid>

      {/* Recent activity */}
      <Grid templateColumns={{ base: '1fr', lg: '2fr 1fr' }} gap={6}>
        <GridItem>
          <Card>
            <CardHeader>
              <Heading size="md">Recent Properties</Heading>
            </CardHeader>
            <CardBody>
              <VStack align="stretch" spacing={4}>
                <Text color="gray.500" textAlign="center" py={8}>
                  No properties yet. Create your first property to get started.
                </Text>
                <Button
                  as={RouterLink}
                  to="/dashboard/properties/new"
                  variant="outline"
                  leftIcon={<FiPlus />}
                >
                  Create Property
                </Button>
              </VStack>
            </CardBody>
          </Card>
        </GridItem>

        <GridItem>
          <Card>
            <CardHeader>
              <Heading size="md">Quick Actions</Heading>
            </CardHeader>
            <CardBody>
              <VStack align="stretch" spacing={3}>
                <Button
                  as={RouterLink}
                  to="/dashboard/properties"
                  variant="ghost"
                  justifyContent="flex-start"
                  leftIcon={<FiHome />}
                >
                  Manage Properties
                </Button>
                <Button
                  as={RouterLink}
                  to="/dashboard/analytics"
                  variant="ghost"
                  justifyContent="flex-start"
                  leftIcon={<FiBarChart2 />}
                >
                  View Analytics
                </Button>
                <Button
                  as={RouterLink}
                  to="/dashboard/profile"
                  variant="ghost"
                  justifyContent="flex-start"
                  leftIcon={<FiUsers />}
                >
                  Edit Profile
                </Button>
              </VStack>
            </CardBody>
          </Card>
        </GridItem>
      </Grid>
    </VStack>
  )
}

// Profile page
function ProfilePage() {
  const user = useAuthStore((state) => state.user)

  return (
    <VStack spacing={6} align="stretch">
      <Heading size="lg">Profile</Heading>

      <Card>
        <CardBody>
          <HStack spacing={6}>
            <Avatar
              size="xl"
              name={user?.name}
              src={user?.avatar_url}
              bg="luxury.gold"
              color="white"
            />
            <VStack align="flex-start" spacing={2}>
              <Heading size="md">{user?.name}</Heading>
              <Text color="gray.600">{user?.email}</Text>
              <Badge colorScheme={user?.role === 'admin' ? 'purple' : 'blue'}>
                {user?.role}
              </Badge>
            </VStack>
          </HStack>
        </CardBody>
      </Card>
    </VStack>
  )
}

// Placeholder pages
function PropertiesPage() {
  return (
    <VStack spacing={6} align="stretch">
      <HStack justify="space-between">
        <Heading size="lg">My Properties</Heading>
        <Button leftIcon={<FiPlus />} colorScheme="blue">
          Add Property
        </Button>
      </HStack>
      <Card>
        <CardBody>
          <Text color="gray.500" textAlign="center" py={8}>
            No properties found. Create your first property to get started.
          </Text>
        </CardBody>
      </Card>
    </VStack>
  )
}

function AnalyticsPage() {
  return (
    <VStack spacing={6} align="stretch">
      <Heading size="lg">Analytics</Heading>
      <Card>
        <CardBody>
          <Text color="gray.500" textAlign="center" py={8}>
            Analytics will appear here once you have properties with traffic.
          </Text>
        </CardBody>
      </Card>
    </VStack>
  )
}

// Stat card component
interface StatCardProps {
  label: string
  value: string
  icon: React.ElementType
  color: string
}

function StatCard({ label, value, icon: Icon, color }: StatCardProps) {
  return (
    <Card>
      <CardBody>
        <HStack justify="space-between">
          <Stat>
            <StatLabel color="gray.500">{label}</StatLabel>
            <StatNumber>{value}</StatNumber>
          </Stat>
          <Box
            p={3}
            borderRadius="lg"
            bg={`${color}.100`}
            color={`${color}.600`}
          >
            <Icon size={24} />
          </Box>
        </HStack>
      </CardBody>
    </Card>
  )
}

// Main dashboard with routes
export default function DashboardPage() {
  return (
    <Container maxW="container.xl" py={8}>
      <Routes>
        <Route index element={<DashboardOverview />} />
        <Route path="properties" element={<PropertiesPage />} />
        <Route path="analytics" element={<AnalyticsPage />} />
        <Route path="profile" element={<ProfilePage />} />
      </Routes>
    </Container>
  )
}
