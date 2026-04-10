// SPDX-FileCopyrightText: 2026 Tim Sutton <tim@kartoza.com>
// SPDX-License-Identifier: EUPL-1.2

import { useEffect, useRef, memo } from 'react'
import { Box } from '@chakra-ui/react'

interface StreamParticle {
  y: number
  x: number
  speed: number
  size: number
}

interface ParticleHourglassProps {
  progress: number // Current progress 0-100
  size?: number // Size of the hourglass
  color?: string // Sand/glass color
}

export const ParticleHourglass = memo(function ParticleHourglass({
  progress,
  size = 60,
  color = '#3182ce',
}: ParticleHourglassProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particlesRef = useRef<StreamParticle[]>([])
  const animationRef = useRef<number>()

  const width = size
  const height = size * 1.6

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // High DPI setup
    const dpr = window.devicePixelRatio || 1
    canvas.width = width * dpr
    canvas.height = height * dpr
    ctx.scale(dpr, dpr)

    // Hourglass geometry
    const centerX = width / 2
    const centerY = height / 2
    const glassWidth = width * 0.42
    const chamberHeight = height * 0.38
    const neckWidth = width * 0.04
    const neckHeight = height * 0.08
    const capWidth = glassWidth + 4
    const capHeight = 3

    // Top and bottom of chambers
    const topChamberTop = centerY - neckHeight / 2 - chamberHeight
    const topChamberBottom = centerY - neckHeight / 2
    const bottomChamberTop = centerY + neckHeight / 2
    const bottomChamberBottom = centerY + neckHeight / 2 + chamberHeight

    // Initialize stream particles
    if (particlesRef.current.length === 0) {
      for (let i = 0; i < 12; i++) {
        particlesRef.current.push({
          y: topChamberBottom + (i / 12) * (bottomChamberTop - topChamberBottom + chamberHeight * 0.3),
          x: centerX + (Math.random() - 0.5) * neckWidth * 0.5,
          speed: 0.3 + Math.random() * 0.2,
          size: 1 + Math.random() * 0.5,
        })
      }
    }

    // Calculate sand levels based on progress
    const topSandHeight = chamberHeight * (1 - progress / 100) * 0.85
    const bottomSandHeight = chamberHeight * (progress / 100) * 0.85

    // Get width of hourglass at a given y position
    const getWidthAtY = (y: number): number => {
      if (y < topChamberBottom) {
        // Top chamber - wider at top, narrow at bottom
        const t = (topChamberBottom - y) / chamberHeight
        return neckWidth + (glassWidth - neckWidth) * Math.pow(t, 0.6)
      } else if (y > bottomChamberTop) {
        // Bottom chamber - narrow at top, wider at bottom
        const t = (y - bottomChamberTop) / chamberHeight
        return neckWidth + (glassWidth - neckWidth) * Math.pow(t, 0.6)
      }
      return neckWidth
    }

    const drawGlassOutline = () => {
      ctx.strokeStyle = color
      ctx.lineWidth = 1.5
      ctx.globalAlpha = 0.35
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'

      // Draw hourglass shape
      ctx.beginPath()

      // Top cap
      ctx.moveTo(centerX - capWidth, topChamberTop)
      ctx.lineTo(centerX + capWidth, topChamberTop)

      // Right side - top chamber
      ctx.moveTo(centerX + glassWidth, topChamberTop + capHeight)
      ctx.quadraticCurveTo(
        centerX + glassWidth, topChamberBottom - chamberHeight * 0.3,
        centerX + neckWidth, topChamberBottom
      )

      // Right side - neck
      ctx.lineTo(centerX + neckWidth, bottomChamberTop)

      // Right side - bottom chamber
      ctx.quadraticCurveTo(
        centerX + glassWidth, bottomChamberTop + chamberHeight * 0.3,
        centerX + glassWidth, bottomChamberBottom - capHeight
      )

      // Bottom cap
      ctx.moveTo(centerX - capWidth, bottomChamberBottom)
      ctx.lineTo(centerX + capWidth, bottomChamberBottom)

      // Left side - bottom chamber
      ctx.moveTo(centerX - glassWidth, bottomChamberBottom - capHeight)
      ctx.quadraticCurveTo(
        centerX - glassWidth, bottomChamberTop + chamberHeight * 0.3,
        centerX - neckWidth, bottomChamberTop
      )

      // Left side - neck
      ctx.lineTo(centerX - neckWidth, topChamberBottom)

      // Left side - top chamber
      ctx.quadraticCurveTo(
        centerX - glassWidth, topChamberBottom - chamberHeight * 0.3,
        centerX - glassWidth, topChamberTop + capHeight
      )

      ctx.stroke()
      ctx.globalAlpha = 1
    }

    const drawTopSand = () => {
      if (topSandHeight <= 0) return

      ctx.fillStyle = color
      ctx.globalAlpha = 0.55

      const sandTop = topChamberTop + capHeight + 2
      const sandBottom = sandTop + topSandHeight

      // Draw sand with sloped bottom (funnel toward center)
      ctx.beginPath()

      // Top edge (flat)
      const topWidth = getWidthAtY(sandTop) - 2
      ctx.moveTo(centerX - topWidth, sandTop)
      ctx.lineTo(centerX + topWidth, sandTop)

      // Right edge down to slope
      const rightBottomWidth = getWidthAtY(sandBottom) - 2
      ctx.lineTo(centerX + rightBottomWidth, sandBottom - 4)

      // Sloped bottom toward neck (funnel effect)
      const slopeDepth = Math.min(8, topSandHeight * 0.3)
      ctx.quadraticCurveTo(
        centerX + neckWidth * 2, sandBottom,
        centerX, sandBottom + slopeDepth
      )
      ctx.quadraticCurveTo(
        centerX - neckWidth * 2, sandBottom,
        centerX - rightBottomWidth, sandBottom - 4
      )

      // Left edge back up
      ctx.lineTo(centerX - topWidth, sandTop)

      ctx.fill()
      ctx.globalAlpha = 1
    }

    const drawBottomSand = () => {
      if (bottomSandHeight <= 0) return

      ctx.fillStyle = color
      ctx.globalAlpha = 0.55

      const sandBottom = bottomChamberBottom - capHeight - 2
      const sandTop = sandBottom - bottomSandHeight

      // Draw sand with peaked top (cone/mound)
      ctx.beginPath()

      // Bottom edge (flat)
      const bottomWidth = getWidthAtY(sandBottom) - 2
      ctx.moveTo(centerX - bottomWidth, sandBottom)
      ctx.lineTo(centerX + bottomWidth, sandBottom)

      // Right edge up to peak
      const rightTopWidth = getWidthAtY(sandTop) - 2
      ctx.lineTo(centerX + rightTopWidth, sandTop + 4)

      // Peaked top (mound effect)
      const peakHeight = Math.min(6, bottomSandHeight * 0.25)
      ctx.quadraticCurveTo(
        centerX + neckWidth * 2, sandTop,
        centerX, sandTop - peakHeight
      )
      ctx.quadraticCurveTo(
        centerX - neckWidth * 2, sandTop,
        centerX - rightTopWidth, sandTop + 4
      )

      // Left edge back down
      ctx.lineTo(centerX - bottomWidth, sandBottom)

      ctx.fill()
      ctx.globalAlpha = 1
    }

    const drawStream = () => {
      if (progress >= 99) return // No stream when almost done

      ctx.fillStyle = color
      ctx.globalAlpha = 0.7

      const streamTop = topChamberBottom
      const streamBottom = bottomChamberTop + (chamberHeight - bottomSandHeight) * 0.8

      particlesRef.current.forEach((p) => {
        // Only draw particles in the visible stream area
        if (p.y >= streamTop && p.y <= streamBottom) {
          ctx.beginPath()
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
          ctx.fill()
        }
      })

      ctx.globalAlpha = 1
    }

    const updateStream = () => {
      const streamTop = topChamberBottom - 2
      const streamBottom = bottomChamberTop + (chamberHeight - bottomSandHeight) * 0.7

      particlesRef.current.forEach((p) => {
        // Move particle down
        p.y += p.speed

        // Add slight wobble
        p.x += (Math.random() - 0.5) * 0.3
        p.x = Math.max(centerX - neckWidth * 0.4, Math.min(centerX + neckWidth * 0.4, p.x))

        // Respawn at top when reaching bottom
        if (p.y > streamBottom) {
          p.y = streamTop
          p.x = centerX + (Math.random() - 0.5) * neckWidth * 0.3
          p.speed = 0.3 + Math.random() * 0.2
        }
      })
    }

    const animate = () => {
      ctx.clearRect(0, 0, width, height)

      drawTopSand()
      drawBottomSand()
      drawStream()
      updateStream()
      drawGlassOutline()

      animationRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [width, height, progress, color])

  // Reset particles when progress resets
  useEffect(() => {
    if (progress < 5) {
      particlesRef.current = []
    }
  }, [progress])

  return (
    <Box display="inline-flex" alignItems="center" justifyContent="center">
      <canvas
        ref={canvasRef}
        style={{
          width: `${width}px`,
          height: `${height}px`,
        }}
      />
    </Box>
  )
})
