// SPDX-FileCopyrightText: 2026 Tim Sutton <tim@kartoza.com>
// SPDX-License-Identifier: EUPL-1.2

import { useRef, useState, useCallback } from 'react'
import {
  Box,
  IconButton,
  HStack,
  Text,
  Tooltip,
  useColorModeValue,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  Select,
} from '@chakra-ui/react'
import {
  FiZoomIn,
  FiZoomOut,
  FiMaximize,
  FiMinimize,
  FiRotateCw,
  FiMove,
} from 'react-icons/fi'

interface Room {
  id: string
  name: string
  type: string
  x: number
  y: number
  width: number
  height: number
  floor: number
}

interface FloorPlanViewerProps {
  imageUrl?: string
  rooms?: Room[]
  floors?: number[]
  height?: string
  onRoomClick?: (room: Room) => void
  selectedRoomId?: string
}

export default function FloorPlanViewer({
  imageUrl,
  rooms = [],
  floors = [0],
  height = '500px',
  onRoomClick,
  selectedRoomId,
}: FloorPlanViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [zoom, setZoom] = useState(100)
  const [rotation, setRotation] = useState(0)
  const [currentFloor, setCurrentFloor] = useState(floors[0] || 0)
  const [isPanning, setIsPanning] = useState(false)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })

  const bgColor = useColorModeValue('gray.100', 'gray.800')
  const controlsBg = useColorModeValue('white', 'gray.700')
  const roomFill = useColorModeValue('rgba(201, 162, 39, 0.2)', 'rgba(201, 162, 39, 0.3)')
  const roomStroke = useColorModeValue('#c9a227', '#d4af37')
  const selectedFill = useColorModeValue('rgba(201, 162, 39, 0.5)', 'rgba(201, 162, 39, 0.6)')

  const visibleRooms = rooms.filter((r) => r.floor === currentFloor)

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? -10 : 10
    setZoom((prev) => Math.min(300, Math.max(50, prev + delta)))
  }, [])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && e.shiftKey)) {
      setIsPanning(true)
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y })
    }
  }, [pan])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isPanning) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      })
    }
  }, [isPanning, dragStart])

  const handleMouseUp = useCallback(() => {
    setIsPanning(false)
  }, [])

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

  const resetView = () => {
    setZoom(100)
    setRotation(0)
    setPan({ x: 0, y: 0 })
  }

  return (
    <Box
      ref={containerRef}
      position="relative"
      h={height}
      bg={bgColor}
      borderRadius="lg"
      overflow="hidden"
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      cursor={isPanning ? 'grabbing' : 'grab'}
    >
      {/* Floor Plan Content */}
      <Box
        position="absolute"
        inset={0}
        display="flex"
        alignItems="center"
        justifyContent="center"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom / 100}) rotate(${rotation}deg)`,
          transition: isPanning ? 'none' : 'transform 0.2s ease-out',
        }}
      >
        {imageUrl ? (
          <Box position="relative">
            <img
              src={imageUrl}
              alt="Floor Plan"
              style={{ maxWidth: '100%', maxHeight: '100%', userSelect: 'none' }}
              draggable={false}
            />
            {/* Room overlays */}
            <svg
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
              }}
            >
              {visibleRooms.map((room) => (
                <g key={room.id} style={{ pointerEvents: 'auto' }}>
                  <rect
                    x={room.x}
                    y={room.y}
                    width={room.width}
                    height={room.height}
                    fill={selectedRoomId === room.id ? selectedFill : roomFill}
                    stroke={roomStroke}
                    strokeWidth={2}
                    cursor="pointer"
                    onClick={() => onRoomClick?.(room)}
                  />
                  <text
                    x={room.x + room.width / 2}
                    y={room.y + room.height / 2}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontSize={12}
                    fill={roomStroke}
                    fontWeight="bold"
                    style={{ pointerEvents: 'none' }}
                  >
                    {room.name}
                  </text>
                </g>
              ))}
            </svg>
          </Box>
        ) : (
          <Box
            w="400px"
            h="300px"
            border="2px dashed"
            borderColor="gray.400"
            borderRadius="lg"
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            <Text color="gray.500">No floor plan available</Text>
          </Box>
        )}
      </Box>

      {/* Controls */}
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
        <HStack spacing={3}>
          {floors.length > 1 && (
            <Select
              size="sm"
              w="100px"
              value={currentFloor}
              onChange={(e) => setCurrentFloor(Number(e.target.value))}
            >
              {floors.map((floor) => (
                <option key={floor} value={floor}>
                  Floor {floor}
                </option>
              ))}
            </Select>
          )}

          <Tooltip label="Zoom Out" hasArrow>
            <IconButton
              aria-label="Zoom out"
              icon={<FiZoomOut />}
              variant="ghost"
              size="sm"
              onClick={() => setZoom((prev) => Math.max(50, prev - 20))}
            />
          </Tooltip>

          <Box w="100px">
            <Slider
              aria-label="Zoom"
              value={zoom}
              onChange={setZoom}
              min={50}
              max={300}
              step={10}
            >
              <SliderTrack>
                <SliderFilledTrack bg="luxury.gold" />
              </SliderTrack>
              <SliderThumb />
            </Slider>
          </Box>

          <Tooltip label="Zoom In" hasArrow>
            <IconButton
              aria-label="Zoom in"
              icon={<FiZoomIn />}
              variant="ghost"
              size="sm"
              onClick={() => setZoom((prev) => Math.min(300, prev + 20))}
            />
          </Tooltip>

          <Tooltip label="Rotate 90°" hasArrow>
            <IconButton
              aria-label="Rotate"
              icon={<FiRotateCw />}
              variant="ghost"
              size="sm"
              onClick={() => setRotation((prev) => (prev + 90) % 360)}
            />
          </Tooltip>

          <Tooltip label="Reset View" hasArrow>
            <IconButton
              aria-label="Reset"
              icon={<FiMove />}
              variant="ghost"
              size="sm"
              onClick={resetView}
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
        Scroll to zoom • Shift+Drag to pan • Click rooms for details
      </Text>

      {/* Zoom indicator */}
      <Text
        position="absolute"
        top={4}
        right={4}
        fontSize="sm"
        color="gray.600"
        bg={controlsBg}
        px={2}
        py={1}
        borderRadius="md"
      >
        {zoom}%
      </Text>
    </Box>
  )
}
