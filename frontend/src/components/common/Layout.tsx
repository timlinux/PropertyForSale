// SPDX-FileCopyrightText: 2026 Tim Sutton <tim@kartoza.com>
// SPDX-License-Identifier: EUPL-1.2

import { Outlet } from 'react-router-dom'
import { Box, Flex } from '@chakra-ui/react'
import Header from './Header'
import Footer from './Footer'

export default function Layout() {
  return (
    <Flex direction="column" minH="100vh">
      <Header />
      <Box as="main" flex="1">
        <Outlet />
      </Box>
      <Footer />
    </Flex>
  )
}
