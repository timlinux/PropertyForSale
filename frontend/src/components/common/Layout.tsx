// SPDX-FileCopyrightText: 2026 Tim Sutton <tim@kartoza.com>
// SPDX-License-Identifier: EUPL-1.2

import { Outlet, useLocation } from 'react-router-dom'
import { Box, Flex } from '@chakra-ui/react'
import { AnimatePresence } from 'framer-motion'
import Header from './Header'
import Footer from './Footer'
import PageTransition from './PageTransition'
import { usePageTracking } from '../../hooks/usePageTracking'

export default function Layout() {
  const location = useLocation()

  // Track page views for analytics
  usePageTracking()

  return (
    <Flex direction="column" minH="100vh">
      <Header />
      <Box as="main" flex="1">
        <AnimatePresence mode="wait">
          <PageTransition key={location.pathname}>
            <Outlet />
          </PageTransition>
        </AnimatePresence>
      </Box>
      <Footer />
    </Flex>
  )
}
