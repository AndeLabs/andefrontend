"use client"

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ChartTooltipContent } from "@/components/ui/chart"

const data = [
  { date: "Jan", total: Math.floor(Math.random() * 5000) + 1000 },
  { date: "Feb", total: Math.floor(Math.random() * 5000) + 1000 },
  { date: "Mar", total: Math.floor(Math.random() * 5000) + 1000 },
  { date: "Apr", total: Math.floor(Math.random() * 5000) + 1000 },
  { date: "May", total: Math.floor(Math.random() * 5000) + 1000 },
  { date: "Jun", total: Math.floor(Math.random() * 5000) + 1000 },
  { date: "Jul", total: Math.floor(Math.random() * 5000) + 1000 },
  { date: "Aug", total: Math.floor(Math.random() * 5000) + 1000 },
  { date: "Sep", total: Math.floor(Math.random() * 5000) + 1000 },
  { date: "Oct", total: Math.floor(Math.random() * 5000) + 1000 },
  { date: "Nov", total: Math.floor(Math.random() * 5000) + 1000 },
  { date: "Dec", total: Math.floor(Math.random() * 5000) + 1000 },
]

export function OverviewChart() {
  return (
    <Card className="col-span-1 lg:col-span-2">
      <CardHeader>
        <CardTitle>Portfolio Overview</CardTitle>
        <CardDescription>Your portfolio value over the last 12 months.</CardDescription>
      </CardHeader>
      <CardContent className="pl-2">
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={data}>
            <XAxis
              dataKey="date"
              stroke="#888888"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="#888888"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => `$${value}`}
            />
            <Tooltip
                cursor={{ fill: 'hsl(var(--accent))', radius: 8 }}
                content={<ChartTooltipContent />}
             />
            <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
