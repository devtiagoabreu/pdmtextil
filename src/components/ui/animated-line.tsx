"use client"

import { useEffect, useState } from "react"
import { Line, type LineProps } from "recharts"

interface AnimatedLineProps extends Omit<LineProps, "strokeDasharray"> {
  drawDuration?: number
  drawDelay?: number
}

export function AnimatedLine({
  drawDuration = 2000,
  drawDelay = 800,
  ...props
}: AnimatedLineProps) {
  const [dashOffset, setDashOffset] = useState(1500)

  useEffect(() => {
    const timer = setTimeout(() => {
      const startTime = Date.now()

      const animate = () => {
        const elapsed = Date.now() - startTime
        const progress = Math.min(elapsed / drawDuration, 1)
        const eased = 1 - Math.pow(1 - progress, 3)
        const current = 1500 - 1500 * eased

        setDashOffset(current)

        if (progress < 1) {
          requestAnimationFrame(animate)
        }
      }

      requestAnimationFrame(animate)
    }, drawDelay)

    return () => clearTimeout(timer)
  }, [drawDuration, drawDelay])

  return (
    <Line
      {...props}
      strokeDasharray="1500"
      strokeDashoffset={dashOffset}
    />
  )
}
