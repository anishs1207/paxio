"use client"

import * as React from "react"
import {
    PolarAngleAxis,
    PolarGrid,
    Radar,
    RadarChart,
} from "recharts"

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart"

interface ChartConfigItem {
    label: string;
    color: string;
}

const renderRadars = (config: Record<string, ChartConfigItem>) => {
    return Object.entries(config).map(([key, configItem]) => (
        <Radar
            key={key}
            dataKey={key}
            fill={configItem.color}
            fillOpacity={0.6}
            dot={{ r: 4, fillOpacity: 1 }}
        />
    ));
};

interface ChartRadarProps {
    title: string;
    description: string;
    chartData: Record<string, string | number>[];
    chartConfig: Record<string, ChartConfigItem>;
}

export default function ChartRadarDots({ title, description, chartData, chartConfig }: ChartRadarProps) {
    return (
        <div className="w-full max-w-3xl">
            <div className="w-full space-y-4">
                <Card>
                    <CardHeader className="items-center">
                        <CardTitle>{title}</CardTitle>
                        <CardDescription>
                            {description}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pb-0">
                        <ChartContainer
                            config={chartConfig}
                            className="mx-auto aspect-square max-h-[250px]"
                        >
                            <RadarChart data={chartData}>
                                <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                                <PolarAngleAxis dataKey="month" />
                                <PolarGrid />
                                {/* <Radar
                                    dataKey="desktop"
                                    fill="var(--color-desktop)"
                                    fillOpacity={0.6}
                                    dot={{
                                        r: 4,
                                        fillOpacity: 1,
                                    }}
                                /> */}
                                {renderRadars(chartConfig)}
                            </RadarChart>
                        </ChartContainer>
                    </CardContent>
                    {/* <CardFooter className="flex-col gap-2 text-sm">
                        <div className="flex items-center gap-2 leading-none font-medium">
                            Trending up by 5.2% this month <TrendingUp className="h-4 w-4" />
                        </div>
                        <div className="text-muted-foreground flex items-center gap-2 leading-none">
                            January - June 2024
                        </div>
                    </CardFooter> */}
                </Card>
            </div>
        </div>
    )
}
