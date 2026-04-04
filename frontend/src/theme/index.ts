// SPDX-FileCopyrightText: 2026 Tim Sutton <tim@kartoza.com>
// SPDX-License-Identifier: EUPL-1.2

import { extendTheme, type ThemeConfig } from '@chakra-ui/react'

const config: ThemeConfig = {
  initialColorMode: 'light',
  useSystemColorMode: false,
}

// Apple-inspired minimal color palette
const colors = {
  // Primary blue accent (subtle, used sparingly)
  accent: {
    50: '#f0f5ff',
    100: '#e0ebff',
    200: '#c2d6ff',
    300: '#94b8ff',
    400: '#5c94ff',
    500: '#0071e3', // Apple blue
    600: '#0058b0',
    700: '#004085',
    800: '#002952',
    900: '#001429',
  },
  // Neutral grays - the backbone of Apple design
  neutral: {
    50: '#fafafa',
    100: '#f5f5f7', // Apple's signature light gray
    200: '#e8e8ed',
    300: '#d2d2d7',
    400: '#86868b', // Secondary text
    500: '#6e6e73',
    600: '#424245',
    700: '#333336',
    800: '#1d1d1f', // Primary text
    900: '#000000',
  },
}

const fonts = {
  heading: '"Inter", -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Helvetica, Arial, sans-serif',
  body: '"Inter", -apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", Helvetica, Arial, sans-serif',
}

const styles = {
  global: {
    'html, body': {
      bg: 'white',
      color: 'neutral.800',
      fontSize: '17px',
      lineHeight: '1.47059',
      fontWeight: '400',
      letterSpacing: '-0.022em',
      fontSmoothing: 'antialiased',
      WebkitFontSmoothing: 'antialiased',
      MozOsxFontSmoothing: 'grayscale',
    },
    '*::selection': {
      bg: 'accent.500',
      color: 'white',
    },
    // Smooth scrolling
    'html': {
      scrollBehavior: 'smooth',
    },
  },
}

const components = {
  Button: {
    baseStyle: {
      fontWeight: '400',
      borderRadius: '980px', // Apple's pill shape
      transition: 'all 0.3s cubic-bezier(0.25, 0.1, 0.25, 1)',
    },
    sizes: {
      sm: {
        fontSize: '12px',
        px: '16px',
        py: '8px',
        minH: '32px',
      },
      md: {
        fontSize: '14px',
        px: '22px',
        py: '12px',
        minH: '44px',
      },
      lg: {
        fontSize: '17px',
        px: '28px',
        py: '16px',
        minH: '52px',
      },
    },
    variants: {
      solid: {
        bg: 'accent.500',
        color: 'white',
        _hover: {
          bg: 'accent.600',
          transform: 'scale(1.02)',
        },
        _active: {
          bg: 'accent.700',
          transform: 'scale(0.98)',
        },
      },
      outline: {
        borderColor: 'accent.500',
        borderWidth: '1px',
        color: 'accent.500',
        bg: 'transparent',
        _hover: {
          bg: 'accent.50',
        },
      },
      ghost: {
        color: 'accent.500',
        _hover: {
          bg: 'neutral.100',
        },
      },
      dark: {
        bg: 'neutral.800',
        color: 'white',
        _hover: {
          bg: 'neutral.700',
          transform: 'scale(1.02)',
        },
      },
      light: {
        bg: 'neutral.100',
        color: 'neutral.800',
        _hover: {
          bg: 'neutral.200',
        },
      },
      link: {
        color: 'accent.500',
        fontWeight: '400',
        _hover: {
          textDecoration: 'underline',
        },
      },
    },
    defaultProps: {
      variant: 'solid',
      size: 'md',
    },
  },
  Heading: {
    baseStyle: {
      color: 'neutral.800',
      fontWeight: '600',
      letterSpacing: '-0.003em',
    },
    sizes: {
      '4xl': {
        fontSize: { base: '48px', md: '64px', lg: '80px' },
        lineHeight: '1.05',
        letterSpacing: '-0.015em',
        fontWeight: '700',
      },
      '3xl': {
        fontSize: { base: '40px', md: '48px', lg: '56px' },
        lineHeight: '1.07',
        letterSpacing: '-0.012em',
        fontWeight: '600',
      },
      '2xl': {
        fontSize: { base: '32px', md: '40px' },
        lineHeight: '1.1',
        letterSpacing: '-0.009em',
      },
      xl: {
        fontSize: { base: '24px', md: '32px' },
        lineHeight: '1.125',
      },
      lg: {
        fontSize: { base: '21px', md: '24px' },
        lineHeight: '1.167',
      },
      md: {
        fontSize: '19px',
        lineHeight: '1.21',
      },
    },
  },
  Text: {
    baseStyle: {
      color: 'neutral.800',
    },
    variants: {
      secondary: {
        color: 'neutral.400',
      },
      eyebrow: {
        color: 'neutral.400',
        fontSize: '12px',
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
      },
    },
  },
  Card: {
    baseStyle: {
      container: {
        bg: 'white',
        borderRadius: '18px',
        boxShadow: 'none',
        overflow: 'hidden',
        transition: 'all 0.3s cubic-bezier(0.25, 0.1, 0.25, 1)',
      },
    },
    variants: {
      elevated: {
        container: {
          boxShadow: '0 4px 24px rgba(0, 0, 0, 0.04)',
          _hover: {
            boxShadow: '0 8px 40px rgba(0, 0, 0, 0.08)',
            transform: 'translateY(-2px)',
          },
        },
      },
      outline: {
        container: {
          border: '1px solid',
          borderColor: 'neutral.200',
        },
      },
      filled: {
        container: {
          bg: 'neutral.100',
        },
      },
    },
  },
  Input: {
    baseStyle: {
      field: {
        borderRadius: '12px',
      },
    },
    variants: {
      outline: {
        field: {
          borderColor: 'neutral.300',
          bg: 'white',
          _hover: {
            borderColor: 'neutral.400',
          },
          _focus: {
            borderColor: 'accent.500',
            boxShadow: '0 0 0 3px rgba(0, 113, 227, 0.15)',
          },
        },
      },
      filled: {
        field: {
          bg: 'neutral.100',
          border: 'none',
          _hover: {
            bg: 'neutral.200',
          },
          _focus: {
            bg: 'white',
            boxShadow: '0 0 0 3px rgba(0, 113, 227, 0.15)',
          },
        },
      },
    },
    defaultProps: {
      variant: 'filled',
    },
  },
  Link: {
    baseStyle: {
      color: 'accent.500',
      fontWeight: '400',
      transition: 'opacity 0.2s ease',
      _hover: {
        textDecoration: 'underline',
        opacity: 0.8,
      },
    },
  },
  Container: {
    baseStyle: {
      maxW: '1200px',
      px: { base: '20px', md: '40px', lg: '80px' },
    },
  },
  Divider: {
    baseStyle: {
      borderColor: 'neutral.200',
      opacity: 1,
    },
  },
  Badge: {
    baseStyle: {
      borderRadius: '6px',
      fontWeight: '500',
      fontSize: '12px',
      px: '8px',
      py: '2px',
    },
    variants: {
      subtle: {
        bg: 'neutral.100',
        color: 'neutral.600',
      },
      solid: {
        bg: 'accent.500',
        color: 'white',
      },
    },
  },
  Tabs: {
    variants: {
      line: {
        tab: {
          color: 'neutral.400',
          fontWeight: '400',
          _selected: {
            color: 'neutral.800',
            borderColor: 'neutral.800',
          },
          _hover: {
            color: 'neutral.600',
          },
        },
      },
    },
  },
}

// Custom spacing scale - more generous
const space = {
  px: '1px',
  0.5: '2px',
  1: '4px',
  1.5: '6px',
  2: '8px',
  2.5: '10px',
  3: '12px',
  3.5: '14px',
  4: '16px',
  5: '20px',
  6: '24px',
  7: '28px',
  8: '32px',
  9: '36px',
  10: '40px',
  12: '48px',
  14: '56px',
  16: '64px',
  20: '80px',
  24: '96px',
  28: '112px',
  32: '128px',
  36: '144px',
  40: '160px',
  44: '176px',
  48: '192px',
  52: '208px',
  56: '224px',
  60: '240px',
  64: '256px',
  72: '288px',
  80: '320px',
  96: '384px',
}

const theme = extendTheme({
  config,
  colors,
  fonts,
  styles,
  components,
  space,
  shadows: {
    outline: '0 0 0 3px rgba(0, 113, 227, 0.25)',
    sm: '0 2px 8px rgba(0, 0, 0, 0.04)',
    md: '0 4px 16px rgba(0, 0, 0, 0.06)',
    lg: '0 8px 32px rgba(0, 0, 0, 0.08)',
    xl: '0 16px 48px rgba(0, 0, 0, 0.1)',
  },
  radii: {
    none: '0',
    sm: '8px',
    base: '12px',
    md: '12px',
    lg: '18px',
    xl: '24px',
    '2xl': '32px',
    '3xl': '48px',
    full: '9999px',
  },
  transition: {
    property: {
      common: 'background-color, border-color, color, fill, stroke, opacity, box-shadow, transform',
    },
    easing: {
      'ease-in-out': 'cubic-bezier(0.25, 0.1, 0.25, 1)',
    },
    duration: {
      normal: '0.3s',
    },
  },
})

export default theme
