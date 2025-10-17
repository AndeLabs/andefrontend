
"use client"

import { useMemo, useState } from "react";
import { Bar, BarChart, XAxis, YAxis, CartesianGrid } from "recharts";
import { format, subDays } from "date-fns";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartConfig,
} from "@/components/ui/chart";
import { Button } from "@/components/ui/button";

const generateChartData = (days: number) => {
    const data = [];
    const today = new Date();
    for (let i = days - 1; i >= 0; i--) {
        data.push({
            date: format(subDays(today, i), "MMM d"),
            total: Math.floor(Math.random() * 2000) + 5000,
        });
    }
    return data;
};

const chartConfig = {
  total: {
    label: "Portfolio Value",
    color: "hsl(var(--chart-1))",
  },
} satisfies ChartConfig;

export function OverviewChart() {
  const [timeRange, setTimeRange] = useState<number>(30);

  const data = useMemo(() => generateChartData(timeRange), [timeRange]);

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
            <div>
                <CardTitle>Portfolio Value</CardTitle>
                <CardDescription>Your portfolio value over time.</CardDescription>
            </div>
            <div className="flex gap-2">
                <Button variant={timeRange === 7 ? 'default' : 'outline'} size="sm" onClick={() => setTimeRange(7)}>7D</Button>
                <Button variant={timeRange === 30 ? 'default' : 'outline'} size="sm" onClick={() => setTimeRange(30)}>30D</Button>
                <Button variant={timeRange === 365 ? 'default' : 'outline'} size="sm" onClick={() => setTimeRange(365)}>1Y</Button>
            </div>
        </div>
      </CardHeader>
      <CardContent className="pl-2">
        <ChartContainer config={chartConfig} className="h-[280px] w-full">
          <BarChart data={data}>
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value, index) => {
                  if (data.length > 30) {
                      return index % 30 === 0 ? value : "";
                  }
                   if (data.length > 7) {
                      return index % 3 === 0 ? value : "";
                  }
                  return value;
              }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              tickFormatter={(value) => `$${(value / 1000)}k`}
            />
            <ChartTooltip 
              content={
                <ChartTooltipContent 
                  formatter={(value) => `$${(value as number).toLocaleString()}`}
                />
              }
            />
            <Bar 
              dataKey="total" 
              fill="var(--color-total)" 
              radius={[4, 4, 0, 0]} 
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
