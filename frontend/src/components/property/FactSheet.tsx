// SPDX-FileCopyrightText: 2026 Tim Sutton <tim@kartoza.com>
// SPDX-License-Identifier: EUPL-1.2

import { useRef, useEffect } from 'react'
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  Image,
  SimpleGrid,
  Divider,
  Button,
  Icon,
  Flex,
} from '@chakra-ui/react'
import { FiPrinter, FiX, FiMapPin, FiHome, FiGrid, FiSun } from 'react-icons/fi'
import type { Property, Media, Dwelling, Area, Quote } from '../../api'

interface FactSheetProps {
  property: Property
  media: Media[]
  dwellings: Dwelling[]
  areas: Area[]
  quotes: Quote[]
  onClose: () => void
}

export default function FactSheet({
  property,
  media,
  dwellings,
  areas,
  quotes,
  onClose,
}: FactSheetProps) {
  const printRef = useRef<HTMLDivElement>(null)

  // Get starred images, or all images if none starred
  const images = media.filter(m => m.type === 'image')
  const starredImages = images.filter(m => m.starred)
  const heroImages = starredImages.length > 0 ? starredImages : images.slice(0, 6)

  // Get images by entity
  const getEntityImages = (entityType: string, entityId: string) =>
    images.filter(m => m.entity_type === entityType && m.entity_id === entityId).slice(0, 2)

  // Inject print styles on mount
  useEffect(() => {
    const styleId = 'fact-sheet-print-styles'
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style')
      style.id = styleId
      style.textContent = `
        @media print {
          html, body {
            height: auto !important;
            overflow: visible !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body * {
            visibility: hidden;
          }
          #fact-sheet-root, #fact-sheet-root * {
            visibility: visible;
          }
          #fact-sheet-root {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `
      document.head.appendChild(style)
    }
    return () => {
      const style = document.getElementById(styleId)
      if (style) style.remove()
    }
  }, [])

  const handlePrint = () => {
    window.print()
  }

  // Distribute quotes throughout the document
  const getQuote = (index: number) => {
    if (quotes.length === 0) return null
    return quotes[index % quotes.length]
  }

  return (
    <Box
      id="fact-sheet-root"
      position="fixed"
      inset={0}
      bg="white"
      zIndex={100}
      overflowY="auto"
      sx={{
        '@media print': {
          position: 'absolute',
          inset: 'auto',
          width: '100%',
          height: 'auto',
          overflow: 'visible',
          overflowY: 'visible',
        },
      }}
    >
      {/* Print/Close toolbar - hidden when printing */}
      <Box
        position="fixed"
        top={0}
        left={0}
        right={0}
        bg="white"
        borderBottom="1px solid"
        borderColor="neutral.200"
        py={3}
        px={6}
        zIndex={101}
        sx={{
          '@media print': {
            display: 'none',
          },
        }}
      >
        <Flex justify="space-between" align="center" maxW="1200px" mx="auto">
          <Text fontWeight="600" color="neutral.700">
            Property Fact Sheet
          </Text>
          <HStack spacing={3}>
            <Button
              leftIcon={<FiPrinter />}
              colorScheme="blue"
              size="sm"
              onClick={handlePrint}
            >
              Print / Save PDF
            </Button>
            <Button
              leftIcon={<FiX />}
              variant="ghost"
              size="sm"
              onClick={onClose}
            >
              Close
            </Button>
          </HStack>
        </Flex>
      </Box>

      {/* Fact sheet content */}
      <Box
        ref={printRef}
        pt="80px"
        sx={{
          '@media print': {
            pt: 0,
            fontSize: '11pt',
            lineHeight: '1.4',
            position: 'relative',
            display: 'block',
            height: 'auto',
            overflow: 'visible',
          },
        }}
      >
        {/* Hero Section */}
        <Box
          position="relative"
          h={{ base: '500px', print: '400px' }}
          overflow="hidden"
          sx={{
            '@media print': {
              pageBreakAfter: 'avoid',
            },
          }}
        >
          {heroImages[0] && (
            <Image
              src={heroImages[0].url}
              alt={property.name}
              w="100%"
              h="100%"
              objectFit="cover"
            />
          )}
          <Box
            position="absolute"
            inset={0}
            bgGradient="linear(to-t, blackAlpha.800 0%, blackAlpha.400 40%, transparent 100%)"
          />
          <Box
            position="absolute"
            bottom={0}
            left={0}
            right={0}
            p={{ base: 8, md: 12 }}
            color="white"
          >
            <Container maxW="1200px">
              <VStack align="start" spacing={3}>
                <HStack spacing={2} color="whiteAlpha.800">
                  <Icon as={FiMapPin} />
                  <Text fontSize="lg" fontWeight="500">
                    {property.city}{property.city && property.country ? ', ' : ''}{property.country}
                  </Text>
                </HStack>
                <Heading
                  as="h1"
                  size="3xl"
                  fontWeight="300"
                  letterSpacing="tight"
                >
                  {property.name}
                </Heading>
                <Text fontSize="2xl" fontWeight="600" color="whiteAlpha.900">
                  {property.currency || 'EUR'} {property.price_min?.toLocaleString()}
                  {property.price_max && property.price_max !== property.price_min && (
                    <Text as="span" fontWeight="400" color="whiteAlpha.700">
                      {' '}- {property.price_max.toLocaleString()}
                    </Text>
                  )}
                </Text>
              </VStack>
            </Container>
          </Box>
        </Box>

        <Container maxW="1200px" py={12}>
          {/* Opening Quote */}
          {getQuote(0) && (
            <Box textAlign="center" py={8} px={4}>
              <Text
                fontSize={{ base: '2xl', md: '3xl' }}
                fontStyle="italic"
                fontWeight="300"
                color="accent.600"
                fontFamily="'Georgia', serif"
                lineHeight="1.4"
              >
                "{getQuote(0)?.text}"
              </Text>
            </Box>
          )}

          <Divider my={8} />

          {/* Property Description */}
          {property.description && (
            <Box mb={12}>
              <Heading as="h2" size="lg" mb={6} fontWeight="500" color="neutral.800">
                About This Property
              </Heading>
              <Text
                fontSize="lg"
                color="neutral.600"
                lineHeight="1.8"
                whiteSpace="pre-wrap"
              >
                {property.description}
              </Text>
            </Box>
          )}

          {/* Image Gallery Strip */}
          {heroImages.length > 1 && (
            <SimpleGrid columns={{ base: 2, md: 3 }} spacing={4} mb={12}>
              {heroImages.slice(1, 4).map((img) => (
                <Box
                  key={img.id}
                  h="200px"
                  borderRadius="xl"
                  overflow="hidden"
                >
                  <Image
                    src={img.url}
                    alt=""
                    w="100%"
                    h="100%"
                    objectFit="cover"
                  />
                </Box>
              ))}
            </SimpleGrid>
          )}

          {/* Second Quote */}
          {getQuote(1) && quotes.length > 1 && (
            <Box
              textAlign="center"
              py={8}
              px={4}
              bg="neutral.50"
              borderRadius="2xl"
              mb={12}
            >
              <Text
                fontSize={{ base: 'xl', md: '2xl' }}
                fontStyle="italic"
                fontWeight="300"
                color="accent.600"
                fontFamily="'Georgia', serif"
              >
                "{getQuote(1)?.text}"
              </Text>
            </Box>
          )}

          {/* Dwellings Section */}
          {dwellings.length > 0 && (
            <Box
              mb={12}
              sx={{
                '@media print': {
                  pageBreakBefore: 'auto',
                },
              }}
            >
              <HStack spacing={3} mb={6}>
                <Icon as={FiHome} boxSize={6} color="accent.500" />
                <Heading as="h2" size="lg" fontWeight="500" color="neutral.800">
                  Dwellings & Buildings
                </Heading>
              </HStack>

              <VStack spacing={8} align="stretch">
                {dwellings.map((dwelling, idx) => {
                  const dwellingImages = getEntityImages('dwelling', dwelling.id)
                  return (
                    <Box
                      key={dwelling.id}
                      p={6}
                      bg="neutral.50"
                      borderRadius="xl"
                      border="1px solid"
                      borderColor="neutral.100"
                    >
                      <Flex
                        direction={{ base: 'column', md: 'row' }}
                        gap={6}
                      >
                        {dwellingImages[0] && (
                          <Box
                            flexShrink={0}
                            w={{ base: '100%', md: '300px' }}
                            h="200px"
                            borderRadius="lg"
                            overflow="hidden"
                          >
                            <Image
                              src={dwellingImages[0].url}
                              alt={dwelling.name}
                              w="100%"
                              h="100%"
                              objectFit="cover"
                            />
                          </Box>
                        )}
                        <Box flex={1}>
                          <Heading as="h3" size="md" mb={2} color="neutral.800">
                            {dwelling.name}
                          </Heading>
                          <Text
                            fontSize="sm"
                            color="accent.500"
                            fontWeight="500"
                            textTransform="capitalize"
                            mb={3}
                          >
                            {dwelling.type?.replace('_', ' ')}
                          </Text>
                          {dwelling.description && (
                            <Text color="neutral.600" mb={4} lineHeight="1.7">
                              {dwelling.description}
                            </Text>
                          )}

                          {/* Rooms */}
                          {dwelling.rooms && dwelling.rooms.length > 0 && (
                            <Box>
                              <Text fontWeight="600" color="neutral.700" mb={2} fontSize="sm">
                                Rooms:
                              </Text>
                              <SimpleGrid columns={{ base: 1, sm: 2 }} spacing={2}>
                                {dwelling.rooms.map((room) => (
                                  <HStack
                                    key={room.id}
                                    spacing={2}
                                    p={2}
                                    bg="white"
                                    borderRadius="md"
                                  >
                                    <Icon as={FiGrid} color="neutral.400" boxSize={4} />
                                    <Text fontSize="sm" color="neutral.700">
                                      {room.name}
                                      {room.floor !== undefined && room.floor !== 0 && (
                                        <Text as="span" color="neutral.400">
                                          {' '}(Floor {room.floor})
                                        </Text>
                                      )}
                                    </Text>
                                  </HStack>
                                ))}
                              </SimpleGrid>
                            </Box>
                          )}
                        </Box>
                      </Flex>

                      {/* Quote after dwelling */}
                      {getQuote(idx + 2) && quotes.length > idx + 2 && idx === 0 && (
                        <Box textAlign="center" pt={6} mt={6} borderTop="1px solid" borderColor="neutral.200">
                          <Text
                            fontSize="lg"
                            fontStyle="italic"
                            fontWeight="300"
                            color="accent.500"
                            fontFamily="'Georgia', serif"
                          >
                            "{getQuote(idx + 2)?.text}"
                          </Text>
                        </Box>
                      )}
                    </Box>
                  )
                })}
              </VStack>
            </Box>
          )}

          {/* Areas Section */}
          {areas.length > 0 && (
            <Box
              mb={12}
              sx={{
                '@media print': {
                  pageBreakBefore: 'auto',
                },
              }}
            >
              <HStack spacing={3} mb={6}>
                <Icon as={FiSun} boxSize={6} color="accent.500" />
                <Heading as="h2" size="lg" fontWeight="500" color="neutral.800">
                  Outdoor Areas & Grounds
                </Heading>
              </HStack>

              <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                {areas.map((area) => {
                  const areaImages = getEntityImages('area', area.id)
                  return (
                    <Box
                      key={area.id}
                      p={5}
                      bg="neutral.50"
                      borderRadius="xl"
                      border="1px solid"
                      borderColor="neutral.100"
                    >
                      {areaImages[0] && (
                        <Box
                          h="180px"
                          borderRadius="lg"
                          overflow="hidden"
                          mb={4}
                        >
                          <Image
                            src={areaImages[0].url}
                            alt={area.name}
                            w="100%"
                            h="100%"
                            objectFit="cover"
                          />
                        </Box>
                      )}
                      <Heading as="h3" size="sm" mb={2} color="neutral.800">
                        {area.name}
                      </Heading>
                      <Text
                        fontSize="sm"
                        color="accent.500"
                        fontWeight="500"
                        textTransform="capitalize"
                        mb={2}
                      >
                        {area.type?.replace('_', ' ')}
                      </Text>
                      {area.description && (
                        <Text fontSize="sm" color="neutral.600" lineHeight="1.6">
                          {area.description}
                        </Text>
                      )}
                    </Box>
                  )
                })}
              </SimpleGrid>
            </Box>
          )}

          {/* More Images */}
          {heroImages.length > 4 && (
            <SimpleGrid columns={{ base: 2, md: 4 }} spacing={3} mb={12}>
              {heroImages.slice(4, 8).map((img) => (
                <Box
                  key={img.id}
                  h="150px"
                  borderRadius="lg"
                  overflow="hidden"
                >
                  <Image
                    src={img.url}
                    alt=""
                    w="100%"
                    h="100%"
                    objectFit="cover"
                  />
                </Box>
              ))}
            </SimpleGrid>
          )}

          {/* Closing Quote */}
          {quotes.length > 0 && (
            <Box
              textAlign="center"
              py={10}
              px={6}
              bg="accent.50"
              borderRadius="2xl"
              mb={8}
            >
              <Text
                fontSize={{ base: '2xl', md: '3xl' }}
                fontStyle="italic"
                fontWeight="300"
                color="accent.700"
                fontFamily="'Georgia', serif"
                lineHeight="1.4"
              >
                "{quotes[quotes.length > 1 ? quotes.length - 1 : 0].text}"
              </Text>
            </Box>
          )}

          {/* Footer / Contact */}
          <Box
            textAlign="center"
            py={8}
            borderTop="1px solid"
            borderColor="neutral.200"
          >
            <Text fontSize="lg" fontWeight="600" color="neutral.800" mb={2}>
              Interested in this property?
            </Text>
            <Text color="neutral.500" mb={4}>
              Contact us for viewings and more information
            </Text>
            <HStack justify="center" spacing={6} color="neutral.600" fontSize="sm">
              {property.city && (
                <HStack>
                  <Icon as={FiMapPin} />
                  <Text>{property.city}, {property.country}</Text>
                </HStack>
              )}
            </HStack>
          </Box>

          {/* Kartoza Footer */}
          <Box textAlign="center" py={4} color="neutral.400" fontSize="xs">
            <Text>
              Made with love by{' '}
              <Text as="a" href="https://kartoza.com" color="accent.500" sx={{ '@media print': { color: 'neutral.600' } }}>
                Kartoza
              </Text>
            </Text>
          </Box>
        </Container>
      </Box>
    </Box>
  )
}
