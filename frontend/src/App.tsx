// SPDX-FileCopyrightText: 2026 Tim Sutton <tim@kartoza.com>
// SPDX-License-Identifier: EUPL-1.2

import { Routes, Route } from 'react-router-dom'
import { Box } from '@chakra-ui/react'
import Layout from './components/common/Layout'
import HomePage from './pages/HomePage'
import PropertyPage from './pages/PropertyPage'
import PropertiesPage from './pages/PropertiesPage'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'

function App() {
  return (
    <Box minH="100vh">
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="properties" element={<PropertiesPage />} />
          <Route path="property/:slug" element={<PropertyPage />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="dashboard/*" element={<DashboardPage />} />
        </Route>
      </Routes>
    </Box>
  )
}

export default App
