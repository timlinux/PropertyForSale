// SPDX-FileCopyrightText: 2026 Tim Sutton <tim@kartoza.com>
// SPDX-License-Identifier: EUPL-1.2

import { Suspense, useRef, useState } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import {
  OrbitControls,
  PerspectiveCamera,
  Environment,
  useGLTF,
  Html,
  Grid,
} from '@react-three/drei'
import {
  Box,
  IconButton,
  HStack,
  VStack,
  Spinner,
  Center,
  Text,
  Tooltip,
  useColorModeValue,
} from '@chakra-ui/react'
import {
  FiZoomIn,
  FiZoomOut,
  FiMaximize,
  FiMinimize,
  FiHome,
} from 'react-icons/fi'
import * as THREE from 'three'

interface Model3DViewerProps {
  modelUrl: string
  height?: string
  backgroundColor?: string
  showGrid?: boolean
  showControls?: boolean
  autoRotate?: boolean
}

export default function Model3DViewer({
  modelUrl,
  height = '500px',
  backgroundColor,
  showGrid = true,
  showControls = true,
  autoRotate = false,
}: Model3DViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [_isLoading, setIsLoading] = useState(true)

  const bgColor = useColorModeValue('#f7fafc', '#1a202c')
  const controlsBg = useColorModeValue('white', 'gray.800')

  const toggleFullscreen = async () => {
    if (!containerRef.current) return

    if (!document.fullscreenElement) {
      await containerRef.current.requestFullscreen()
      setIsFullscreen(true)
    } else {
      await document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  return (
    <Box
      ref={containerRef}
      position="relative"
      h={height}
      borderRadius="lg"
      overflow="hidden"
      bg={backgroundColor || bgColor}
    >
      <Canvas shadows>
        <Suspense
          fallback={
            <Html center>
              <Center>
                <VStack>
                  <Spinner size="xl" color="yellow.500" />
                  <Text color="gray.500">Loading 3D Model...</Text>
                </VStack>
              </Center>
            </Html>
          }
        >
          <SceneSetup
            modelUrl={modelUrl}
            showGrid={showGrid}
            autoRotate={autoRotate}
            onLoaded={() => setIsLoading(false)}
          />
        </Suspense>
      </Canvas>

      {showControls && (
        <Box
          position="absolute"
          bottom={4}
          left="50%"
          transform="translateX(-50%)"
          bg={controlsBg}
          borderRadius="full"
          boxShadow="lg"
          px={4}
          py={2}
        >
          <HStack spacing={2}>
            <Tooltip label="Reset View" hasArrow>
              <IconButton
                aria-label="Reset view"
                icon={<FiHome />}
                variant="ghost"
                size="sm"
                onClick={() => {
                  // Reset is handled by the controls component
                  window.dispatchEvent(new CustomEvent('reset-camera'))
                }}
              />
            </Tooltip>
            <Tooltip label="Zoom In" hasArrow>
              <IconButton
                aria-label="Zoom in"
                icon={<FiZoomIn />}
                variant="ghost"
                size="sm"
                onClick={() => {
                  window.dispatchEvent(new CustomEvent('zoom-in'))
                }}
              />
            </Tooltip>
            <Tooltip label="Zoom Out" hasArrow>
              <IconButton
                aria-label="Zoom out"
                icon={<FiZoomOut />}
                variant="ghost"
                size="sm"
                onClick={() => {
                  window.dispatchEvent(new CustomEvent('zoom-out'))
                }}
              />
            </Tooltip>
            <Tooltip label={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'} hasArrow>
              <IconButton
                aria-label="Fullscreen"
                icon={isFullscreen ? <FiMinimize /> : <FiMaximize />}
                variant="ghost"
                size="sm"
                onClick={toggleFullscreen}
              />
            </Tooltip>
          </HStack>
        </Box>
      )}

      {/* Instructions */}
      <Text
        position="absolute"
        top={4}
        left={4}
        fontSize="xs"
        color="gray.500"
        bg={controlsBg}
        px={2}
        py={1}
        borderRadius="md"
      >
        Drag to rotate • Scroll to zoom • Right-click to pan
      </Text>
    </Box>
  )
}

interface SceneSetupProps {
  modelUrl: string
  showGrid: boolean
  autoRotate: boolean
  onLoaded: () => void
}

function SceneSetup({ modelUrl, showGrid, autoRotate, onLoaded }: SceneSetupProps) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const controlsRef = useRef<any>(null)
  const { camera } = useThree()

  // Handle custom events for zoom and reset
  useState(() => {
    const handleReset = () => {
      if (controlsRef.current) {
        controlsRef.current.reset()
      }
    }

    const handleZoomIn = () => {
      if (camera instanceof THREE.PerspectiveCamera) {
        camera.position.multiplyScalar(0.8)
      }
    }

    const handleZoomOut = () => {
      if (camera instanceof THREE.PerspectiveCamera) {
        camera.position.multiplyScalar(1.2)
      }
    }

    window.addEventListener('reset-camera', handleReset)
    window.addEventListener('zoom-in', handleZoomIn)
    window.addEventListener('zoom-out', handleZoomOut)

    return () => {
      window.removeEventListener('reset-camera', handleReset)
      window.removeEventListener('zoom-in', handleZoomIn)
      window.removeEventListener('zoom-out', handleZoomOut)
    }
  })

  return (
    <>
      <PerspectiveCamera makeDefault position={[5, 5, 5]} fov={50} />
      <OrbitControls
        ref={controlsRef}
        autoRotate={autoRotate}
        autoRotateSpeed={1}
        enableDamping
        dampingFactor={0.05}
        minDistance={1}
        maxDistance={50}
      />

      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight
        position={[10, 10, 5]}
        intensity={1}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <directionalLight position={[-10, 10, -5]} intensity={0.3} />

      {/* Environment for reflections */}
      <Environment preset="city" />

      {/* Grid */}
      {showGrid && (
        <Grid
          infiniteGrid
          cellSize={1}
          cellThickness={0.5}
          sectionSize={5}
          sectionThickness={1}
          fadeDistance={30}
          position={[0, -0.01, 0]}
        />
      )}

      {/* Model */}
      <Model url={modelUrl} onLoaded={onLoaded} />
    </>
  )
}

interface ModelProps {
  url: string
  onLoaded: () => void
}

function Model({ url, onLoaded }: ModelProps) {
  const { scene } = useGLTF(url)
  const groupRef = useRef<THREE.Group>(null)

  // Center and scale the model
  useState(() => {
    const box = new THREE.Box3().setFromObject(scene)
    const center = box.getCenter(new THREE.Vector3())
    const size = box.getSize(new THREE.Vector3())

    // Center the model
    scene.position.sub(center)

    // Scale to fit
    const maxDim = Math.max(size.x, size.y, size.z)
    if (maxDim > 5) {
      const scale = 5 / maxDim
      scene.scale.setScalar(scale)
    }

    // Enable shadows
    scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true
        child.receiveShadow = true
      }
    })

    onLoaded()
  })

  return <primitive ref={groupRef} object={scene} />
}

// Preload hook for GLTF files
export function preloadModel(url: string) {
  useGLTF.preload(url)
}
