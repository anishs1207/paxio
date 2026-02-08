"use client"

import * as React from "react"
import {
    CartesianGrid,
    Line, LineChart,
    XAxis,
    Pie,
    PieChart,
    BarChart,
    Bar,
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


const renderBars = (config: any) => {
    return Object.entries(config).map(([key, { color }]: any) => (
        <Bar key={key} dataKey={key} fill={color} radius={4} />
    ));
};

//@@works
export default function ChartBarInteractive({ title, description, chartData, chartConfig }: { title: string, description: string, chartData: any, chartConfig: any }) {

    return (
        <div className="w-full max-w-3xl">
            <div className="w-full space-y-4">
                <Card>
                    <CardHeader>
                        <CardTitle>{title} bar</CardTitle>
                        <CardDescription>{description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ChartContainer config={chartConfig}>
                            <BarChart accessibilityLayer data={chartData}>
                                <CartesianGrid vertical={false} />
                                <XAxis
                                    dataKey="month"
                                    tickLine={false}
                                    tickMargin={10}
                                    axisLine={false}
                                    tickFormatter={(value) => value.slice(0, 3)}
                                />
                                <ChartTooltip
                                    cursor={false}
                                    content={<ChartTooltipContent indicator="dashed" />}
                                />
                                {/* amount
: 
{color: 'var(--chart-1)', label: 'Amount (₹)'}
[[Prototype]]
: 
Object
 */}
                                {/* {chartConfig.}
                                <Bar dataKey="desktop" fill="var(--color-desktop)" radius={4} />
                                <Bar dataKey="mobile" fill="var(--color-mobile)" radius={4} /> */}

                                {renderBars(chartConfig)}
                            </BarChart>
                        </ChartContainer>
                    </CardContent>
                    {/* <CardFooter className="flex-col items-start gap-2 text-sm">
                        <div className="flex gap-2 leading-none font-medium">
                            Trending up by 5.2% this month <TrendingUp className="h-4 w-4" />
                        </div>
                        <div className="text-muted-foreground leading-none">
                            Showing total visitors for the last 6 months
                        </div>
                    </CardFooter> */}
                </Card>
            </div>
        </div>
    )
}