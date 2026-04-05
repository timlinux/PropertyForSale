// SPDX-FileCopyrightText: 2026 Tim Sutton <tim@kartoza.com>
// SPDX-License-Identifier: EUPL-1.2

import { Box, Flex, Text } from '@chakra-ui/react'

interface StatCardProps {
  label: string
  value: string | number
  subtitle?: string
  icon?: React.ReactNode
}

export function StatCard({ label, value, subtitle, icon }: StatCardProps) {
  return (
    <Box
      bg="white"
      borderRadius="2xl"
      p={6}
      border="1px solid"
      borderColor="neutral.100"
      transition="all 0.2s"
      _hover={{ borderColor: 'neutral.200' }}
    >
      <Flex justify="space-between" align="flex-start" mb={4}>
        <Text
          fontSize="13px"
          fontWeight="500"
          color="neutral.400"
          textTransform="uppercase"
          letterSpacing="0.04em"
        >
          {label}
        </Text>
        {icon && (
          <Box color="neutral.300">
            {icon}
          </Box>
        )}
      </Flex>
      <Text
        fontSize="36px"
        fontWeight="600"
        color="neutral.800"
        lineHeight="1"
        mb={1}
      >
        {value}
      </Text>
      {subtitle && (
        <Text fontSize="14px" color="neutral.400">
          {subtitle}
        </Text>
      )}
    </Box>
  )
}
