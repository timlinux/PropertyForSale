// SPDX-FileCopyrightText: 2026 Tim Sutton <tim@kartoza.com>
// SPDX-License-Identifier: EUPL-1.2

import { Box, Text, Flex, VStack, HStack, Progress } from '@chakra-ui/react'

interface DeviceChartProps {
  data: Record<string, number>
}

const COLORS: Record<string, string> = {
  desktop: 'neutral.800',
  mobile: 'neutral.500',
  tablet: 'neutral.300',
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
    color: COLORS[name] || 'neutral.400',
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
      <VStack spacing={4} align="stretch">
        {chartData.map((item) => {
          const percentage = Math.round((item.value / total) * 100)
          return (
            <Box key={item.name}>
              <HStack justify="space-between" mb={1}>
                <HStack spacing={2}>
                  <Box w="10px" h="10px" borderRadius="full" bg={item.color} />
                  <Text fontSize="14px" color="neutral.600">
                    {item.name}
                  </Text>
                </HStack>
                <Text fontSize="14px" fontWeight="500" color="neutral.800">
                  {percentage}%
                </Text>
              </HStack>
              <Progress
                value={percentage}
                size="sm"
                borderRadius="full"
                bg="neutral.100"
                sx={{ '& > div': { bg: item.color } }}
              />
            </Box>
          )
        })}
      </VStack>
    </Box>
  )
}
