"use client"

import * as React from "react"
import {
    CartesianGrid,
    XAxis,
    AreaChart,
    Area,
    YAxis
} from "recharts"

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    CardFooter,
} from "@/components/ui/card"
import {
    ChartConfig,
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart"
import { TrendingUp } from "lucide-react";

const renderAreas = (config: any) =>
    Object.entries(config).map(([key, { color }]: any) => (
        <Area
            key={key}
            dataKey={key}
            type="natural"
            fill={color}
            fillOpacity={0.4}
            stroke={color}
            stackId="a"
        />
    ));

export default function ChartAreaAxes({ title, description, chartData, chartConfig }: any) {
    return (
        <div className="w-full max-w-3xl">
            <Card>
                <CardHeader>
                    <CardTitle>{title}</CardTitle>
                    <CardDescription>{description}</CardDescription>
                </CardHeader>

                <CardContent>
                    <ChartContainer config={chartConfig}>
                        <AreaChart
                            accessibilityLayer
                            data={chartData}
                            margin={{ left: -20, right: 12 }}
                        >
                            <CartesianGrid vertical={false} />
                            <XAxis
                                dataKey="month"
                                tickLine={false}
                                axisLine={false}
                                tickMargin={8}
                                tickFormatter={(value) => value.slice(0, 3)}
                            />
                            <YAxis
                                tickLine={false}
                                axisLine={false}
                                tickMargin={8}
                                tickCount={3}
                            />
                            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />

                            {/* ✅ dynamic Area series */}
                            {renderAreas(chartConfig)}

                        </AreaChart>
                    </ChartContainer>
                </CardContent>

                <CardFooter>
                    <div className="flex w-full items-start gap-2 text-sm">
                        <div className="grid gap-2">
                            <div className="flex items-center gap-2 leading-none font-medium">
                                Trending up by 5.2% this month <TrendingUp className="h-4 w-4" />
                            </div>
                            <div className="text-muted-foreground flex items-center gap-2 leading-none">
                                January - June 2024
                            </div>
                        </div>
                    </div>
                </CardFooter>
            </Card>
        </div>
    );
}
