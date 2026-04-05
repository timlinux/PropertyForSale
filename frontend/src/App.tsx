// SPDX-FileCopyrightText: 2026 Tim Sutton <tim@kartoza.com>
// SPDX-License-Identifier: EUPL-1.2

import { Routes, Route, Navigate } from 'react-router-dom'
import { Box } from '@chakra-ui/react'
import Layout from './components/common/Layout'
import HomePage from './pages/HomePage'
import PropertyPage from './pages/PropertyPage'
import PropertiesPage from './pages/PropertiesPage'
import LoginPage from './pages/LoginPage'
import DevLoginPage from './pages/DevLoginPage'
import AuthCallbackPage from './pages/AuthCallbackPage'
import DashboardPage from './pages/DashboardPage'
import { CMSPage } from './pages/CMSPage'
import { useAuthStore } from './context/authStore'

// Protected route wrapper
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

// Admin route wrapper (requires admin role)
function AdminRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const user = useAuthStore((state) => state.user)

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (user?.role !== 'admin') {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}

function App() {
  return (
    <Box minH="100vh">
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="properties" element={<PropertiesPage />} />
          <Route path="property/:slug" element={<PropertyPage />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="dev-login" element={<DevLoginPage />} />
          <Route path="auth/callback" element={<AuthCallbackPage />} />
          <Route
            path="dashboard/*"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="admin/cms"
            element={
              <AdminRoute>
                <CMSPage />
              </AdminRoute>
            }
          />
        </Route>
      </Routes>
    </Box>
  )
}

export default App
