"use client"

import { BarChart, Bar, Cell, ResponsiveContainer, type BarChartProps, type BarProps } from "recharts"

interface StaggeredBarChartProps extends Omit<BarChartProps, "children"> {
  data: Array<Record<string, unknown>>
  dataKey: string
  colors?: string[]
  radius?: [number, number, number, number]
  staggerDelay?: number
  animationDuration?: number
  animationBegin?: number
  barProps?: Partial<BarProps>
}

export function StaggeredBarChart({
  data,
  dataKey,
  colors = ["#6366f1"],
  radius = [4, 4, 0, 0],
  staggerDelay = 100,
  animationDuration = 1200,
  animationBegin = 800,
  barProps,
  ...chartProps
}: StaggeredBarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={chartProps.height || 220}>
      <BarChart {...chartProps} data={data}>
        {chartProps.children}
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
