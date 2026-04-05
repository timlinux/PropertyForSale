// SPDX-FileCopyrightText: 2026 Tim Sutton <tim@kartoza.com>
// SPDX-License-Identifier: EUPL-1.2

import { Box, Text, Flex, VStack, HStack, Progress } from '@chakra-ui/react'

interface PageViewsChartProps {
  data: Record<string, number>
}

export function PageViewsChart({ data }: PageViewsChartProps) {
  const chartData = Object.entries(data)
    .map(([path, views]) => ({
      path: formatPath(path),
      fullPath: path,
      views,
    }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 8)

  const maxViews = chartData.length > 0 ? Math.max(...chartData.map(d => d.views)) : 1

  if (chartData.length === 0) {
    return (
      <Box
        bg="white"
        borderRadius="2xl"
        p={6}
        border="1px solid"
        borderColor="neutral.100"
        h="300px"
      >
        <Text
          fontSize="13px"
          fontWeight="500"
          color="neutral.400"
          textTransform="uppercase"
          letterSpacing="0.04em"
          mb={4}
        >
          Top Pages
        </Text>
        <Flex h="200px" align="center" justify="center">
          <Text color="neutral.300" fontSize="14px">
            No page view data yet
          </Text>
        </Flex>
      </Box>
    )
  }

  return (
    <Box
      bg="white"
      borderRadius="2xl"
      p={6}
      border="1px solid"
      borderColor="neutral.100"
    >
      <Text
        fontSize="13px"
        fontWeight="500"
        color="neutral.400"
        textTransform="uppercase"
        letterSpacing="0.04em"
        mb={4}
      >
        Top Pages
      </Text>
      <VStack spacing={3} align="stretch">
        {chartData.map((item) => (
          <HStack key={item.fullPath} spacing={3}>
            <Text fontSize="13px" color="neutral.600" w="100px" noOfLines={1}>
              {item.path}
            </Text>
            <Box flex={1}>
              <Progress
                value={(item.views / maxViews) * 100}
                size="sm"
                borderRadius="full"
                bg="neutral.100"
                sx={{ '& > div': { bg: 'neutral.800' } }}
              />
            </Box>
            <Text fontSize="13px" fontWeight="500" color="neutral.800" w="40px" textAlign="right">
              {item.views}
            </Text>
          </HStack>
        ))}
      </VStack>
    </Box>
  )
}

function formatPath(path: string): string {
  if (path === '/') return 'Home'
  const segments = path.split('/').filter(Boolean)
  const last = segments[segments.length - 1]
  if (last.length > 12) {
    return last.slice(0, 10) + '...'
  }
  return last.charAt(0).toUpperCase() + last.slice(1)
}
