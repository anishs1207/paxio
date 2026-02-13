"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import SmallNeuralCore from "../SmallNeuralCore";
import EmailMessage from "./EmailMessage";
import CalendarPreview from "./Calendar";
// import ConfirmEditableInput from "./ConfirmEditableInput";
// import ConfirmMessagePill from "./ConfirmMessagePill";
// import { NeuralCore } from "../NeuralCore";
import SubredditSentimentSummary from "./SubredditSummary";
import NotionPersonPage from "./Notion";
import Graph from "../graphs/Graph";

const IdleVisualizer: React.FC<any> = ({
    setResponse,
    responsePayload,
    setResponsePayload
}) => {
    const [name, setName] = useState("");

    const handleConfirm = () => {
        alert(`Confirmed value: ${name}`);
    };

    let data = responsePayload?.data;

    const [type, setType] = useState();

    // const dummyEmail = {
    //     summarisedEmail: "Quick greeting email sent to confirm communication.",
    //     to: "john.doe@example.com",
    //     cc: "team@example.com",
    //     from: "paxio@assistant.ai",
    //     subject: "Hello 👋",
    //     message: `
    //             Hi John,

    //             Just wanted to quickly say hello and check in with you.
    //             Hope you're having a great day!

    //             Best regards,
    //             Paxio
    //             `,
    //     title: "2 mins ago",
    // };
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
                <SmallNeuralCore state="idle" />
                {/*  state: "idle" | "listening" | "thinking" | "speaking"; */}


                <div className="mt-5 w-full max-w-5xl px-4">
                    <div className="max-h-[50vh] overflow-y-auto space-y-6 custom-scrollbar">
                        {/* <EmailMessage
                            summarisedEmail={dummyEmail.summarisedEmail}
                            to={dummyEmail.to}
                            cc={dummyEmail.cc}
                            from={dummyEmail.from}
                            subject={dummyEmail.subject}
                            message={dummyEmail.message}
                            time={dummyEmail.title}
                        />
                        <EmailMessage
                            summarisedEmail={dummyEmail.summarisedEmail}
                            to={dummyEmail.to}
                            cc={dummyEmail.cc}
                            from={dummyEmail.from}
                            subject={dummyEmail.subject}
                            message={dummyEmail.message}
                            time={dummyEmail.title}
                        />
                        <EmailMessage
                            summarisedEmail={dummyEmail.summarisedEmail}
                            to={dummyEmail.to}
                            cc={dummyEmail.cc}
                            from={dummyEmail.from}
                            subject={dummyEmail.subject}
                            message={dummyEmail.message}
                            time={dummyEmail.title}
                        /> */}

                        {data?.gmail?.emails?.map((email: any, index: any) => (
                            <EmailMessage
                                key={index}
                                summarizedEmail={email.summarizedEmail}
                                to={email.to}
                                cc={email?.cc || null}
                                from={email.from}
                                subject={email.subject}
                                message={email.message}
                                time={email.title}
                            />

                        ))}

                        {/*@@ fix in the prompts */}

                        {data?.calendar?.events?.map((calendarEvent: any, index: any) => (
                            <CalendarPreview
                                key={index}
                                date={calendarEvent.date}
                                time={calendarEvent.time}
                                title={calendarEvent.title}
                                description={calendarEvent.description}
                                summarized={calendarEvent.summarized}
                            />

                        ))}

                        {data?.reddit?.subreddits?.map((sr: any, index: any) => (
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

                        {data?.notion?.pages?.map((page: any, index: number) => (
                            <NotionPersonPage key={index} page={page} />
                        ))}

                        {/* Graphs */}
                        {data?.graphs?.graph?.map((graph: any, index: number) => (
                            <Graph
                                key={index}
                                type={graph.type}
                                title={graph.title}
                                description={graph.description}
                                chartData={graph.chartData}
                                chartConfig={graph.chartConfig}
                            />
                        ))}



                    </div>

                    {(data?.gmail || data?.calendar || data?.reddit || data?.notion || data?.graphs) && (
                        <div className="mt-6 flex justify-center w-full">
                            <button
                                onClick={() => {
                                    setResponse(false);
                                    setResponsePayload(null);
                                }}
                                className="
                                    w-full max-w-xl
                                    cursor-pointer
                                    mr-4 ml-4
                                    px-6 py-3
                                    rounded-xl
                                    font-semibold text-sm
                                    transition-all duration-200
                                    bg-zinc-900 text-zinc-100
                                    hover:bg-zinc-800
                                    active:scale-[0.98]
                                    focus:outline-none focus:ring-2 focus:ring-zinc-600
                                    dark:bg-zinc-900 dark:text-zinc-50
                                "
                            >
                                Done
                            </button>
                        </div>
                    )}
                </div>


            </motion.div >

        </div >
    );
};

export default IdleVisualizer;



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