// SPDX-FileCopyrightText: 2026 Tim Sutton <tim@kartoza.com>
// SPDX-License-Identifier: EUPL-1.2

import { Box, Text, Flex, VStack } from '@chakra-ui/react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'

interface DeviceChartProps {
  data: Record<string, number>
}

const COLORS: Record<string, string> = {
  desktop: '#1d1d1f',
  mobile: '#6e6e73',
  tablet: '#d2d2d7',
}

const LABELS: Record<string, string> = {
  desktop: 'Desktop',
  mobile: 'Mobile',
  tablet: 'Tablet',
}

export function DeviceChart({ data }: DeviceChartProps) {
  const chartData = Object.entries(data).map(([name, value]) => ({
    name: LABELS[name] || name,
    value,
    color: COLORS[name] || '#d2d2d7',
  }))

  const total = chartData.reduce((sum, item) => sum + item.value, 0)

  if (total === 0) {
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
          Devices
        </Text>
        <Flex h="200px" align="center" justify="center">
          <Text color="neutral.300" fontSize="14px">
            No device data yet
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
        Devices
      </Text>
      <Flex gap={6} align="center">
        <Box w="140px" h="140px">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={65}
                paddingAngle={2}
                dataKey="value"
                stroke="none"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  borderRadius: '8px',
                  border: 'none',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  fontSize: '13px',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </Box>
        <VStack align="stretch" spacing={3} flex={1}>
          {chartData.map((item) => (
            <Flex key={item.name} justify="space-between" align="center">
              <Flex align="center" gap={2}>
                <Box w="10px" h="10px" borderRadius="full" bg={item.color} />
                <Text fontSize="14px" color="neutral.600">
                  {item.name}
                </Text>
              </Flex>
              <Text fontSize="14px" fontWeight="500" color="neutral.800">
                {Math.round((item.value / total) * 100)}%
              </Text>
            </Flex>
          ))}
        </VStack>
      </Flex>
    </Box>
  )
}
