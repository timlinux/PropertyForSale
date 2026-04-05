// SPDX-FileCopyrightText: 2026 Tim Sutton <tim@kartoza.com>
// SPDX-License-Identifier: EUPL-1.2

import { Box, Text, Flex } from '@chakra-ui/react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

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
      <Box h="200px">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f5f5f7" />
            <XAxis type="number" axisLine={false} tickLine={false} fontSize={12} />
            <YAxis
              type="category"
              dataKey="path"
              width={100}
              axisLine={false}
              tickLine={false}
              fontSize={12}
              tick={{ fill: '#6e6e73' }}
            />
            <Tooltip
              contentStyle={{
                borderRadius: '8px',
                border: 'none',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                fontSize: '13px',
              }}
              labelFormatter={(_, payload) => payload[0]?.payload?.fullPath || ''}
            />
            <Bar
              dataKey="views"
              fill="#1d1d1f"
              radius={[0, 4, 4, 0]}
              maxBarSize={24}
            />
          </BarChart>
        </ResponsiveContainer>
      </Box>
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
