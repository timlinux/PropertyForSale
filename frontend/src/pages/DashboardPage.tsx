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
  Spinner,
  Center,
  Select,
} from '@chakra-ui/react'
import { FiHome, FiPlus, FiBarChart2, FiUsers, FiClock, FiEye } from 'react-icons/fi'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useAuthStore } from '../context/authStore'
import { api } from '../api'
import {
  StatCard as AnalyticsStatCard,
  DeviceChart,
  VisitorMap,
} from '../components/analytics'

// Simple placeholder for PageViewsChart
const PageViewsChart = ({ data }: { data: Record<string, number> }) => (
  <Box bg="white" borderRadius="2xl" p={6} border="1px solid" borderColor="gray.100">
    <Text fontSize="sm" fontWeight="500" color="gray.400" mb={4}>Top Pages</Text>
    <Text color="gray.500">Page views: {Object.keys(data).length} pages tracked</Text>
  </Box>
)

import PropertyForm from '../components/property/PropertyForm'
import PropertyEdit from '../components/property/PropertyEdit'

// Dashboard overview
function DashboardOverview() {
  const user = useAuthStore((state) => state.user)

  // Fetch properties for count and recent list
  const { data: propertiesData, isLoading: propertiesLoading } = useQuery({
    queryKey: ['my-properties'],
    queryFn: () => api.getProperties(),
  })

  // Fetch analytics dashboard data (last 30 days)
  const { data: analyticsData, isLoading: analyticsLoading } = useQuery({
    queryKey: ['dashboard-analytics'],
    queryFn: () => {
      const end = new Date()
      const start = new Date()
      start.setDate(start.getDate() - 30)
      return api.getDashboard({
        start_date: start.toISOString().split('T')[0],
        end_date: end.toISOString().split('T')[0],
      })
    },
  })

  const properties = propertiesData?.data || []
  const recentProperties = properties.slice(0, 5)
  const isLoading = propertiesLoading || analyticsLoading

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
      {isLoading ? (
        <Center py={8}>
          <Spinner />
        </Center>
      ) : (
        <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6}>
          <StatCard
            label="Total Properties"
            value={String(propertiesData?.total || properties.length)}
            icon={FiHome}
            color="blue"
          />
          <StatCard
            label="Total Views"
            value={String(analyticsData?.total_views || 0)}
            icon={FiBarChart2}
            color="green"
          />
          <StatCard
            label="Unique Sessions"
            value={String(analyticsData?.unique_sessions || 0)}
            icon={FiUsers}
            color="purple"
          />
          <StatCard
            label="Pages Tracked"
            value={String(Object.keys(analyticsData?.page_view_counts || {}).length)}
            icon={FiEye}
            color="orange"
          />
        </SimpleGrid>
      )}

      {/* Recent activity */}
      <Grid templateColumns={{ base: '1fr', lg: '2fr 1fr' }} gap={6}>
        <GridItem>
          <Card>
            <CardHeader>
              <HStack justify="space-between">
                <Heading size="md">Recent Properties</Heading>
                {recentProperties.length > 0 && (
                  <Button as={RouterLink} to="/dashboard/properties" size="sm" variant="ghost">
                    View All
                  </Button>
                )}
              </HStack>
            </CardHeader>
            <CardBody>
              {recentProperties.length === 0 ? (
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
              ) : (
                <VStack align="stretch" spacing={3}>
                  {recentProperties.map((property) => (
                    <HStack
                      key={property.id}
                      p={3}
                      borderRadius="md"
                      bg="gray.50"
                      _hover={{ bg: 'gray.100' }}
                      justify="space-between"
                    >
                      <VStack align="flex-start" spacing={0}>
                        <Text fontWeight="600">{property.name}</Text>
                        <Text fontSize="sm" color="gray.500">
                          {property.city ? `${property.city}${property.country ? `, ${property.country}` : ''}` : 'No location'}
                        </Text>
                      </VStack>
                      <HStack>
                        <Badge colorScheme={property.status === 'published' ? 'green' : 'gray'}>
                          {property.status}
                        </Badge>
                        <Button
                          as={RouterLink}
                          to={`/dashboard/properties/${property.slug}/edit`}
                          size="sm"
                          variant="ghost"
                        >
                          Edit
                        </Button>
                      </HStack>
                    </HStack>
                  ))}
                </VStack>
              )}
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

// Properties list page with real data
function PropertiesPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['my-properties'],
    queryFn: () => api.getProperties(),
  })

  const properties = data?.data || []

  return (
    <VStack spacing={6} align="stretch">
      <HStack justify="space-between">
        <Heading size="lg">My Properties</Heading>
        <Button as={RouterLink} to="/dashboard/properties/new" leftIcon={<FiPlus />} colorScheme="blue">
          Add Property
        </Button>
      </HStack>

      {isLoading ? (
        <Center py={8}>
          <Spinner />
        </Center>
      ) : error ? (
        <Card>
          <CardBody>
            <Text color="red.500" textAlign="center">
              Error loading properties. Please try again.
            </Text>
          </CardBody>
        </Card>
      ) : properties.length === 0 ? (
        <Card>
          <CardBody>
            <Text color="gray.500" textAlign="center" py={8}>
              No properties found. Create your first property to get started.
            </Text>
          </CardBody>
        </Card>
      ) : (
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
          {properties.map((property) => (
            <Card key={property.id} _hover={{ shadow: 'lg' }} transition="shadow 0.2s">
              <CardBody>
                <VStack align="stretch" spacing={3}>
                  <HStack justify="space-between">
                    <Heading size="sm" noOfLines={1}>{property.name}</Heading>
                    <Badge colorScheme={property.status === 'published' ? 'green' : 'gray'}>
                      {property.status}
                    </Badge>
                  </HStack>
                  <Text fontSize="sm" color="gray.600" noOfLines={2}>
                    {property.description || 'No description'}
                  </Text>
                  {property.city && (
                    <Text fontSize="sm" color="gray.500">
                      {property.city}{property.country ? `, ${property.country}` : ''}
                    </Text>
                  )}
                  {(property.price_min > 0 || property.price_max > 0) && (
                    <Text fontWeight="600" color="blue.600">
                      {property.currency} {property.price_min.toLocaleString()}
                      {property.price_max > property.price_min && ` - ${property.price_max.toLocaleString()}`}
                    </Text>
                  )}
                  <HStack pt={2}>
                    <Button
                      as={RouterLink}
                      to={`/dashboard/properties/${property.slug}/edit`}
                      size="sm"
                      colorScheme="blue"
                      flex={1}
                    >
                      Edit
                    </Button>
                    <Button
                      as={RouterLink}
                      to={`/property/${property.slug}`}
                      size="sm"
                      variant="outline"
                      flex={1}
                    >
                      View
                    </Button>
                  </HStack>
                </VStack>
              </CardBody>
            </Card>
          ))}
        </SimpleGrid>
      )}
    </VStack>
  )
}

function AnalyticsPage() {
  const [dateRange, setDateRange] = useState<string>('7d')

  // Calculate date range
  const getDateParams = () => {
    const end = new Date()
    const start = new Date()
    switch (dateRange) {
      case '24h':
        start.setDate(start.getDate() - 1)
        break
      case '7d':
        start.setDate(start.getDate() - 7)
        break
      case '30d':
        start.setDate(start.getDate() - 30)
        break
      case '90d':
        start.setDate(start.getDate() - 90)
        break
    }
    return {
      start_date: start.toISOString().split('T')[0],
      end_date: end.toISOString().split('T')[0],
    }
  }

  const dateParams = getDateParams()

  const { data: dashboardData, isLoading: dashboardLoading } = useQuery({
    queryKey: ['analytics-dashboard', dateRange],
    queryFn: () => api.getDashboard(dateParams),
  })

  const { data: visitorData, isLoading: visitorLoading } = useQuery({
    queryKey: ['analytics-visitors', dateRange],
    queryFn: () => api.getVisitorMap(dateParams),
  })

  const formatDwellTime = (ms: number): string => {
    if (ms < 1000) return '0s'
    const seconds = Math.floor(ms / 1000)
    if (seconds < 60) return `${seconds}s`
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}m ${remainingSeconds}s`
  }

  const isLoading = dashboardLoading || visitorLoading

  return (
    <VStack spacing={8} align="stretch">
      {/* Header */}
      <HStack justify="space-between" align="center">
        <VStack align="flex-start" spacing={1}>
          <Text
            fontSize="12px"
            fontWeight="600"
            textTransform="uppercase"
            letterSpacing="0.08em"
            color="neutral.400"
          >
            Insights
          </Text>
          <Heading size="lg">Analytics</Heading>
        </VStack>
        <Select
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value)}
          w="160px"
          size="sm"
          borderRadius="full"
          borderColor="neutral.200"
          _focus={{ borderColor: 'neutral.400' }}
        >
          <option value="24h">Last 24 hours</option>
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
          <option value="90d">Last 90 days</option>
        </Select>
      </HStack>

      {isLoading ? (
        <Center py={16}>
          <Spinner size="lg" color="neutral.400" thickness="2px" />
        </Center>
      ) : (
        <>
          {/* Stats cards */}
          <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={4}>
            <AnalyticsStatCard
              label="Total Views"
              value={dashboardData?.total_views ?? 0}
              icon={<FiEye size={20} />}
            />
            <AnalyticsStatCard
              label="Unique Sessions"
              value={dashboardData?.unique_sessions ?? 0}
              icon={<FiUsers size={20} />}
            />
            <AnalyticsStatCard
              label="Avg. Dwell Time"
              value={formatDwellTime(dashboardData?.avg_dwell_time_ms ?? 0)}
              icon={<FiClock size={20} />}
            />
            <AnalyticsStatCard
              label="Pages Tracked"
              value={Object.keys(dashboardData?.page_view_counts ?? {}).length}
              icon={<FiHome size={20} />}
            />
          </SimpleGrid>

          {/* Charts row */}
          <Grid templateColumns={{ base: '1fr', lg: '1fr 1fr' }} gap={4}>
            <GridItem>
              <PageViewsChart data={dashboardData?.page_view_counts ?? {}} />
            </GridItem>
            <GridItem>
              <DeviceChart data={dashboardData?.device_breakdown ?? {}} />
            </GridItem>
          </Grid>

          {/* Visitor map */}
          <VisitorMap locations={visitorData?.data ?? []} />
        </>
      )}
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
        <Route path="properties/new" element={<PropertyForm />} />
        <Route path="properties/:slug/edit" element={<PropertyEdit />} />
        <Route path="analytics" element={<AnalyticsPage />} />
        <Route path="profile" element={<ProfilePage />} />
      </Routes>
    </Container>
  )
}
