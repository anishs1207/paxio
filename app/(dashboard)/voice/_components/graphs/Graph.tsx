import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import ChartLineInteractive from "./LineChart";
import ChartPieSimple from "./ChartPie";
import ChartBarInteractive from "./ChartBar";
import ChartRadarDots from "./ChartRadar";
import ChartAreaAxes from "./ChartAreaAxes";

export default function Graph({ type, title, description, chartData, chartConfig }: { type: string, title: string, description: string, chartData: any, chartConfig: any }) {
    console.log("graph object", type, title, description, chartData, chartConfig);
    switch (type) {
        case "line":
            return <ChartLineInteractive
                title={title}
                description={description}
                chartData={chartData}
                chartConfig={chartConfig}
            />
        case "pie":
            return <ChartPieSimple
                title={title}
                description={description}
                chartData={chartData}
                chartConfig={chartConfig}
            />
        case "bar":
            return <ChartBarInteractive
                title={title}
                description={description}
                chartData={chartData}
                chartConfig={chartConfig}
            />
        case "radar":
            return <ChartRadarDots
                title={title}
                description={description}
                chartData={chartData}
                chartConfig={chartConfig}
            />
        // case "radial":
        //     return <ChartRadialSimple
        //         title={title}
        //         description={description}
        //         chartData={chartData}
        //         chartConfig={chartConfig}
        //     />
        case "tooltip":
            return <ChartTooltipDefault
                title={title}
                description={description}
                chartData={chartData}
                chartConfig={chartConfig}
            />
        case "area":
            return <ChartAreaAxes
                title={title}
                description={description}
                chartData={chartData}
                chartConfig={chartConfig}
            />
        case "table":
             <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        rehypePlugins={[rehypeRaw]}
                        components={{
                            table: (props) => (
                                <div className="my-3 overflow-auto">
                                    <table
                                        {...props}
                                        className="min-w-full table-auto border-collapse border border-zinc-700 text-xs text-left"
                                    />
                                </div>
                            ),
                            th: (props) => (
                                <th
                                    {...props}
                                    className="px-4 py-2 font-medium bg-zinc-800 border-b border-zinc-700 text-white"
                                />
                            ),
                            td: (props) => (
                                <td
                                    {...props}
                                    className="px-4 py-2 border-b border-zinc-700 text-zinc-300"
                                />
                            ),
                           
                            hr: () => (
                                <hr className="my-3 border-zinc-700 opacity-70 border" />
                            ),

                            p: (props) => (
                                <p
                                    {...props}
                                    className="my-1 leading-relaxed whitespace-pre-line"
                                />
                            ),
                            strong: (props) => (
                                <strong
                                    {...props}
                                    className="font-semibold text-zinc-100"
                                />
                            ),
                        }}
                    >
                        {title}
                    </ReactMarkdown>
            
        default:
            return <p>Error</p>
    }
}


