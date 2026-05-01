// SPDX-FileCopyrightText: 2026 Tim Sutton <tim@kartoza.com>
// SPDX-License-Identifier: EUPL-1.2

import { useState, useRef, useEffect } from 'react'
import {
  Box,
  IconButton,
  HStack,
  Text,
  Tooltip,
  useColorModeValue,
} from '@chakra-ui/react'
import { FiMaximize2, FiMinimize2, FiRefreshCw, FiExternalLink } from 'react-icons/fi'

interface QGISSceneViewerProps {
  sceneUrl: string    // URL to extracted scene directory (e.g., /api/v1/media/files/property/{id}/{sceneId})
  height?: string
  showControls?: boolean
  title?: string
}

export default function QGISSceneViewer({
  sceneUrl,
  height = '500px',
  showControls = true,
  title = '3D Property Map',
}: QGISSceneViewerProps) {
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const containerRef = useRef<HTMLDivElement>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  const bgColor = useColorModeValue('gray.100', 'gray.800')
  const controlsBg = useColorModeValue('whiteAlpha.900', 'blackAlpha.800')

  // Handle fullscreen toggle
  const toggleFullscreen = async () => {
    if (!containerRef.current) return

    if (!isFullscreen) {
      try {
        await containerRef.current.requestFullscreen()
      } catch {
        // Fullscreen not supported, use CSS fallback
        setIsFullscreen(true)
      }
    } else {
      if (document.fullscreenElement) {
        await document.exitFullscreen()
      }
      setIsFullscreen(false)
    }
  }

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
    }
  }, [])

  // Handle iframe load
  const handleIframeLoad = () => {
    setIsLoading(false)
  }

  // Refresh the iframe
  const handleRefresh = () => {
    if (iframeRef.current) {
      setIsLoading(true)
      iframeRef.current.src = `${sceneUrl}/index.html`
    }
  }

  // Open in new tab
  const handleOpenInNewTab = () => {
    window.open(`${sceneUrl}/index.html`, '_blank')
  }

  // Build the iframe URL
  const iframeSrc = `${sceneUrl}/index.html`

  return (
    <Box
      ref={containerRef}
      position={isFullscreen ? 'fixed' : 'relative'}
      top={isFullscreen ? 0 : 'auto'}
      left={isFullscreen ? 0 : 'auto'}
      right={isFullscreen ? 0 : 'auto'}
      bottom={isFullscreen ? 0 : 'auto'}
      zIndex={isFullscreen ? 9999 : 1}
      height={isFullscreen ? '100vh' : height}
      width="100%"
      bg={bgColor}
      borderRadius={isFullscreen ? 0 : 'lg'}
      overflow="hidden"
    >
      {/* Controls bar */}
      {showControls && (
        <HStack
          position="absolute"
          top={2}
          right={2}
          zIndex={10}
          bg={controlsBg}
          backdropFilter="blur(10px)"
          borderRadius="md"
          px={2}
          py={1}
          spacing={1}
          boxShadow="md"
        >
          <Text fontSize="sm" fontWeight="500" px={2}>
            {title}
          </Text>

          <Tooltip label="Refresh">
            <IconButton
              aria-label="Refresh scene"
              icon={<FiRefreshCw />}
              size="sm"
              variant="ghost"
              onClick={handleRefresh}
              isLoading={isLoading}
            />
          </Tooltip>

          <Tooltip label="Open in new tab">
            <IconButton
              aria-label="Open in new tab"
              icon={<FiExternalLink />}
              size="sm"
              variant="ghost"
              onClick={handleOpenInNewTab}
            />
          </Tooltip>

          <Tooltip label={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}>
            <IconButton
              aria-label={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
              icon={isFullscreen ? <FiMinimize2 /> : <FiMaximize2 />}
              size="sm"
              variant="ghost"
              onClick={toggleFullscreen}
            />
          </Tooltip>
        </HStack>
      )}

      {/* Loading indicator */}
      {isLoading && (
        <Box
          position="absolute"
          top="50%"
          left="50%"
          transform="translate(-50%, -50%)"
          zIndex={5}
          textAlign="center"
        >
          <Text fontSize="lg" color="gray.500">
            Loading 3D scene...
          </Text>
        </Box>
      )}

      {/* Scene iframe */}
      <iframe
        ref={iframeRef}
        src={iframeSrc}
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
          opacity: isLoading ? 0.3 : 1,
          transition: 'opacity 0.3s ease',
        }}
        title={title}
        onLoad={handleIframeLoad}
        allow="fullscreen"
        sandbox="allow-scripts allow-same-origin"
      />
    </Box>
  )
}
