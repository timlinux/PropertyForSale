// SPDX-FileCopyrightText: 2026 Tim Sutton <tim@kartoza.com>
// SPDX-License-Identifier: EUPL-1.2

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ChakraProvider } from '@chakra-ui/react'
import { FiHome } from 'react-icons/fi'

// Simple StatCard component for testing
function StatCard({ label, value, icon: Icon, color }: {
  label: string
  value: string
  icon: React.ElementType
  color: string
}) {
  return (
    <div data-testid="stat-card" style={{ borderColor: color }}>
      <div data-testid="stat-icon">
        <Icon />
      </div>
      <div data-testid="stat-label">{label}</div>
      <div data-testid="stat-value">{value}</div>
    </div>
  )
}

describe('StatCard', () => {
  const renderWithChakra = (ui: React.ReactElement) => {
    return render(<ChakraProvider>{ui}</ChakraProvider>)
  }

  it('renders label and value', () => {
    renderWithChakra(
      <StatCard
        label="Total Properties"
        value="42"
        icon={FiHome}
        color="blue"
      />
    )

    expect(screen.getByTestId('stat-label')).toHaveTextContent('Total Properties')
    expect(screen.getByTestId('stat-value')).toHaveTextContent('42')
  })

  it('renders the icon', () => {
    renderWithChakra(
      <StatCard
        label="Test Label"
        value="100"
        icon={FiHome}
        color="green"
      />
    )

    expect(screen.getByTestId('stat-icon')).toBeInTheDocument()
  })
})
