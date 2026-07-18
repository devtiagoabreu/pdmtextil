"use client"

import { BarChart, Bar, Cell, ResponsiveContainer } from "recharts"

interface StaggeredBarChartProps {
  data: Array<Record<string, unknown>>
  dataKey: string
  colors?: string[]
  radius?: [number, number, number, number]
  staggerDelay?: number
  animationDuration?: number
  animationBegin?: number
  height?: number
  margin?: { top?: number; right?: number; bottom?: number; left?: number }
  children?: React.ReactNode
}

export function StaggeredBarChart({
  data,
  dataKey,
  colors = ["#6366f1"],
  radius = [4, 4, 0, 0],
  staggerDelay = 100,
  animationDuration = 1200,
  animationBegin = 800,
  height = 220,
  margin,
  children,
}: StaggeredBarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={margin}>
        {children}
        <Bar dataKey={dataKey} radius={radius} isAnimationActive={false}>
          {data.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={colors[index % colors.length]}
              isAnimationActive={true}
              animationDuration={animationDuration}
              animationEasing="ease-in-out"
              animationBegin={animationBegin + index * staggerDelay}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}
