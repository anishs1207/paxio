"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import SmallNeuralCore from "../SmallNeuralCore";
import EmailMessage from "./EmailMessage";
import CalendarPreview from "./Calendar";
import ConfirmEditableInput from "./ConfirmEditableInput";
import ConfirmMessagePill from "./ConfirmMessagePill";
import { NeuralCore } from "../NeuralCore";
import SubredditSentimentSummary from "./SubredditSummary";
import TodoPanel from "./TodoPanel";
import VoiceNotesOrganizer from "./VoiceNotes";
import NotionPersonPage from "./Notion";


const ChatResponse: React.FC<any> = ({
    setResponse,
}) => {
    const [name, setName] = useState("");

    const handleConfirm = () => {
        alert(`Confirmed value: ${name}`);
    };

    const [type, setType] = useState("reddit");
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

                <div className="mt-5 w-full max-w-5xl px-4">
                    <div className="space-y-6">

                        {type === "email" ? (
                            <>
                                <EmailMessage />
                                <EmailMessage />
                                <EmailMessage />
                                <EmailMessage />
                            </>
                        ) : type === "calendar" ? (
                            <>
                                <CalendarPreview />
                                <CalendarPreview />
                                <CalendarPreview />
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
                        ) : type === "notion" ? (
                            <>

                                <NotionPersonPage />
                                <NotionPersonPage />
                                <NotionPersonPage />
                            </>
                        ) : null}
                    </div>
                </div>

            </motion.div >

        </div >
    );
};

export default ChatResponse;
