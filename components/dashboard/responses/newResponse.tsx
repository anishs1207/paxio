"use client";

import React from "react";
import { motion } from "framer-motion";
// import SmallNeuralCore from "../SmallNeuralCore";
import EmailMessage from "./EmailMessage";
import CalendarPreview from "./Calendar";
// import ConfirmEditableInput from "./ConfirmEditableInput";
// import ConfirmMessagePill from "./ConfirmMessagePill";
// import { NeuralCore } from "../NeuralCore";
import SubredditSentimentSummary from "./SubredditSummary";
// import TodoPanel from "./TodoPanel";
// import VoiceNotesOrganizer from "./VoiceNotes";
import NotionPersonPage from "./Notion";
import Graph from "../graphs/Graph";
import ConnectServiceCard from "./ConnectServiceCard";

interface Email {
    summarisedEmail: string;
    to: string;
    cc?: string | null;
    from: string;
    subject: string;
    message: string;
    title: string;
}

interface CalendarEvent {
    date: string;
    time: string;
    title: string;
    description?: string;
    summarized: string;
}

interface RedditSubreddit {
    subredditName: string;
    summary: string;
    positiveSent: number;
    negativeSent: number;
    neutralSent: number;
    postsAnalyed: number;
    keyInsights: string[];
}

interface GraphData {
    type: "area" | "bar" | "line" | "pie" | "radar" | "radial";
    title: string;
    description: string;
    chartData: unknown[];
    chartConfig: unknown;
}

interface NewResponseProps {
    data: {
        gmail?: { emails?: Email[] };
        calendar?: { events?: CalendarEvent[] };
        reddit?: { subreddits?: RedditSubreddit[] };
        notion?: { pages?: unknown[] };
        graphs?: { graph?: GraphData[] };
        auth?: { service: string; url: string };
    };
    state: "idle" | string;
}

const NewResponse: React.FC<NewResponseProps> = ({
    data
}) => {
    console.log("data", data);

    return (
        <div className="flex-1 relative z-20 overflow-hidden flex flex-col ">
            <motion.div
                key="idle-visualizer"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.02 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="flex flex-col items-center justify-start"
            >
                {/* Ambient Glow */}
                {/* <div className="absolute w-[420px] h-[420px] rounded-full bg-white/5 blur-3xl" /> */}
                {/* Core Visual */}
                {/* <SmallNeuralCore state="idle" /> */}
                {/*  state: "idle" | "listening" | "thinking" | "speaking"; */}

                <div className="mt-0 w-full max-w-5xl px-4">
                    <div className="max-h-[70vh] overflow-y-auto space-y-6  scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
                        {data?.gmail?.emails?.map((email: Email, index: number) => (
                            <EmailMessage
                                key={index}
                                summarisedEmail={email.summarisedEmail}
                                to={email.to}
                                cc={email?.cc || null}
                                from={email.from}
                                subject={email.subject}
                                message={email.message}
                                time={email.title}
                            />

                        ))}

                        {/*@@ fix in the prompts */}

                        {data?.calendar?.events?.map((calendarEvent: CalendarEvent, index: number) => (
                            <CalendarPreview
                                key={index}
                                date={calendarEvent.date}
                                time={calendarEvent.time}
                                title={calendarEvent.title}
                                description={calendarEvent.description}
                                summarized={calendarEvent.summarized}
                            />

                        ))}

                        {data?.reddit?.subreddits?.map((sr: RedditSubreddit, index: number) => (
                            <SubredditSentimentSummary
                                key={index}
                                subredditName={sr.subredditName}
                                summary={sr.summary}
                                positiveSent={sr.positiveSent}
                                negativeSent={sr.negativeSent}
                                neutralSent={sr.neutralSent}
                                postsAnalyed={sr.postsAnalyed}
                                keyInsights={sr.keyInsights}
                            />
                        ))}

                        {data?.notion?.pages?.map((page: unknown, index: number) => (
                            <NotionPersonPage key={index} page={page} />
                        ))}

                        {/* Graphs */}
                        {data?.graphs?.graph?.map((graph: GraphData, index: number) => (
                            <Graph
                                key={index}
                                type={graph.type}
                                title={graph.title}
                                description={graph.description}
                                chartData={graph.chartData}
                                chartConfig={graph.chartConfig}
                            />
                        ))}

                        {/* {data?.reddit?.subreddits?.map((sr: any, index: any) => (
                            <SubredditSentimentSummary
                                key={index}
                                subredditName={sr.subredditName}
                                summary={sr.summary}
                                positiveSent={sr.positiveSent}
                                negativeSent={sr.negativeSent}
                                neutralSent={sr.neutralSent}
                                postsAnalyed={sr.postsAnalyed}
                                keyInsights={sr.keyInsights}
                            />
                        ))} */}


                        {data?.notion?.pages?.map((page: unknown, index: number) => (
                            <NotionPersonPage key={index} page={page} />
                        ))}

                        {data?.connect?.service && (
                            <ConnectServiceCard service={data.connect.service} />
                        )}


                        {/* 
                        ) : type === "confirm-edit" ? (
                        <div className="flex-1 relative z-20 overflow-hidden flex flex-col">
                            <NeuralCore state="idle" />

                            <ConfirmEditableInput
                                label="Enter your name"
                                value={name}
                                onChange={setName}
                                onConfirm={handleConfirm}
                            />
                        </div>
                        ) : type === "confirm-message" ? (
                        <>
                            <NeuralCore state="idle" />
                            <ConfirmMessagePill
                                label="Reminder"
                                message="This is a scheduled task for Jan 13 at 4:30 PM. Confirm to mark it done."
                                onConfirm={handleConfirm}
                            />
                        </>
                        ) : type === "reddit" ? (
                        <>
                            <SubredditSentimentSummary />
                            <SubredditSentimentSummary />
                            <SubredditSentimentSummary />
                        </>
                        ) : type === "todo" ? (
                        <>

                            <TodoPanel />
                        </>
                        ) : type === "notes" ? (
                        <>

                            <VoiceNotesOrganizer />
                        </>
                        ) : null} */}
                    </div>
                </div>




            </motion.div >
        </div >
    );
};

export default NewResponse;
