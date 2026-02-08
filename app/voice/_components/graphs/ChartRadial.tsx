"use client"

import * as React from "react"
import {
    RadialBar,
    RadialBarChart,
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

const renderRadialBars = (config: any) =>
    Object.entries(config).map(([key, { color }]: any) => (
        <RadialBar
            key={key}
            dataKey={key}
            fill={color}
            background
        />
    ));

//@@to check working
export default function ChartRadialSimple({ title, description, chartData, chartConfig }: { title: string, description: string, chartData: any, chartConfig: any }) {
    const keys = Object.keys(chartConfig);
    return (
        <div className="w-full max-w-3xl">
            <div className="w-full space-y-4">
                <Card className="flex flex-col">
                    <CardHeader className="items-center pb-0">
                        <CardTitle>{title}</CardTitle>
                        <CardDescription>{description}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 pb-0">
                        <ChartContainer
                            config={chartConfig}
                            className="mx-auto aspect-square max-h-[250px]"
                        >
                            <RadialBarChart data={chartData} innerRadius={30} outerRadius={110}>
                                <ChartTooltip
                                    cursor={false}
                                    content={<ChartTooltipContent hideLabel nameKey="browser" />}
                                />
                                {/* <RadialBar dataKey="visitors" background /> */}
                                {renderRadialBars(chartConfig)}
                            </RadialBarChart>
                        </ChartContainer>
                    </CardContent>
                    {/* <CardFooter className="flex-col gap-2 text-sm">
                        <div className="flex items-center gap-2 leading-none font-medium">
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
