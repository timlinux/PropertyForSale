// SPDX-FileCopyrightText: 2026 Tim Sutton <tim@kartoza.com>
// SPDX-License-Identifier: EUPL-1.2

import { extendTheme, type ThemeConfig } from '@chakra-ui/react'

const config: ThemeConfig = {
  initialColorMode: 'light',
  useSystemColorMode: true,
}

const colors = {
  brand: {
    50: '#e6f0ff',
    100: '#b3d1ff',
    200: '#80b3ff',
    300: '#4d94ff',
    400: '#1a75ff',
    500: '#0066ff',
    600: '#0052cc',
    700: '#003d99',
    800: '#002966',
    900: '#001433',
  },
  luxury: {
    navy: '#1a365d',
    gold: '#d4a574',
    cream: '#faf8f5',
    charcoal: '#2d3748',
    slate: '#4a5568',
  },
}

const fonts = {
  heading: '"Playfair Display", Georgia, serif',
  body: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
}

const styles = {
  global: {
    body: {
      bg: 'luxury.cream',
      color: 'luxury.charcoal',
    },
    '*::selection': {
      bg: 'luxury.gold',
      color: 'white',
    },
  },
}

const components = {
  Button: {
    baseStyle: {
      fontWeight: '500',
      borderRadius: 'md',
    },
    variants: {
      solid: {
        bg: 'luxury.navy',
        color: 'white',
        _hover: {
          bg: 'luxury.gold',
          color: 'luxury.navy',
        },
      },
      outline: {
        borderColor: 'luxury.navy',
        color: 'luxury.navy',
        _hover: {
          bg: 'luxury.navy',
          color: 'white',
        },
      },
      ghost: {
        color: 'luxury.navy',
        _hover: {
          bg: 'rgba(26, 54, 93, 0.1)',
        },
      },
      gold: {
        bg: 'luxury.gold',
        color: 'white',
        _hover: {
          bg: 'luxury.navy',
        },
      },
    },
    defaultProps: {
      variant: 'solid',
    },
  },
  Heading: {
    baseStyle: {
      color: 'luxury.navy',
      fontWeight: '600',
    },
  },
  Card: {
    baseStyle: {
      container: {
        bg: 'white',
        borderRadius: 'lg',
        boxShadow: 'sm',
        overflow: 'hidden',
      },
    },
  },
  Input: {
    variants: {
      outline: {
        field: {
          borderColor: 'gray.300',
          _focus: {
            borderColor: 'luxury.gold',
            boxShadow: '0 0 0 1px var(--chakra-colors-luxury-gold)',
          },
        },
      },
    },
  },
  Link: {
    baseStyle: {
      color: 'luxury.navy',
      _hover: {
        color: 'luxury.gold',
        textDecoration: 'none',
      },
    },
  },
}

const theme = extendTheme({
  config,
  colors,
  fonts,
  styles,
  components,
  shadows: {
    outline: '0 0 0 3px rgba(212, 165, 116, 0.6)',
  },
})

export default theme
