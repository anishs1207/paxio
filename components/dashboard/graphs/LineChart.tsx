"use client";

import * as React from "react";
import {
    CartesianGrid,
    Line,
    LineChart,
    XAxis
} from "recharts";

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
} from "@/components/ui/chart";

interface ChartConfigItem {
    color: string;
    label: string;
}

const renderLine = (activeKey: string, config: Record<string, ChartConfigItem>) => {
    const { color } = config[activeKey];

    return (
        <Line
            key={activeKey}
            dataKey={activeKey}
            type="monotone"
            stroke={color}
            strokeWidth={2}
            dot={false}
        />
    );
};

interface ChartLineInteractiveProps {
    title: string;
    description: string;
    chartData: Record<string, string | number>[];
    chartConfig: Record<string, ChartConfigItem>;
}

export default function ChartLineInteractive({
    title,
    description,
    chartData,
    chartConfig,
}: ChartLineInteractiveProps) {
    const keys = Object.keys(chartConfig);

    const [activeChart, setActiveChart] = React.useState(keys[0]);

    return (
        <div className="w-full max-w-3xl">
            <Card className="py-4 sm:py-0">
                <CardHeader className="flex flex-col sm:flex-row items-stretch border-b !p-0">
                    <div className="mt-4 mb-4 flex flex-1 flex-col justify-center gap-1 px-6 sm:pb-0">
                        <CardTitle>{title}</CardTitle>
                        <CardDescription>{description}</CardDescription>
                    </div>

                    {/* ✅ dynamic buttons */}
                    <div className="flex gap-2 px-6 pb-4 sm:pb-0">
                        {keys.map((key) => (
                            <button
                                key={key}
                                className={`px-3 py-1 rounded-md text-sm transition ${key === activeChart
                                    ? "bg-primary text-white"
                                    : "bg-muted text-muted-foreground"
                                    }`}
                                onClick={() => setActiveChart(key)}
                            >
                                {chartConfig[key].label}
                            </button>
                        ))}
                    </div>
                </CardHeader>

                <CardContent className="px-2 sm:p-6 border-0">
                    <ChartContainer config={chartConfig} className="h-[250px] w-full">
                        <LineChart
                            accessibilityLayer
                            data={chartData}
                            margin={{ left: 12, right: 12 }}
                        >
                            <CartesianGrid vertical={false} />
                            <XAxis
                                dataKey="date"
                                tickLine={false}
                                axisLine={false}
                                tickMargin={8}
                                minTickGap={32}
                                tickFormatter={(value) => {
                                    const date = new Date(value);
                                    return date.toLocaleDateString("en-US", {
                                        month: "short",
                                        day: "numeric",
                                    });
                                }}
                            />

                            <ChartTooltip
                                content={
                                    <ChartTooltipContent
                                        className="w-[150px]"
                                        nameKey="views"
                                        labelFormatter={(value) =>
                                            new Date(value).toLocaleDateString("en-US", {
                                                month: "short",
                                                day: "numeric",
                                                year: "numeric",
                                            })
                                        }
                                    />
                                }
                            />

                            {/* ✅ renders active dataset line */}
                            {renderLine(activeChart, chartConfig)}
                        </LineChart>
                    </ChartContainer>
                </CardContent>
            </Card>
        </div>
    );
}
