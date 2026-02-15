"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { NeuralCore } from "./NeuralCore";
import { VibratingText } from "./VibratingText";
import { ActivityFeed } from "./ActivityFeed";

type AppState = "idle" | "listening" | "thinking" | "speaking";
type MessageRole = "user" | "assistant";

interface Message {
    id: string;
    role: MessageRole;
    content: string;
    timestamp: Date;
    isVoice?: boolean;
}

interface ActivityLog {
    id: string;
    type: "tool" | "system" | "sync";
    description: string;
    timestamp: Date;
}

interface VoiceContentProps {
    appState: AppState;
    activeResponse: string;
    showHistory: boolean;
    messages: Message[];
    activities: ActivityLog[];
    isLoadingMessages?: boolean;
    scrollRef: React.RefObject<HTMLDivElement>;
}

export default function VoiceContent({
    appState,
    activeResponse,
    showHistory,
    messages,
    activities,
    isLoadingMessages = false,
    scrollRef,
}: VoiceContentProps) {
    return (
        <main className="flex-1 relative z-20 overflow-hidden flex flex-col">
            <AnimatePresence mode="wait">
                {/* Immersive Visualizer (Listening / Thinking / Speaking) */}
                {appState !== "idle" && (
                    <motion.div
                        key="active-visualizer"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.05 }}
                        className="absolute inset-0 z-40 bg-black flex flex-col items-center justify-center text-center"
                    >
                        <NeuralCore state={appState} />

                        <div className="max-w-3xl">
                            <VibratingText
                                text={activeResponse}
                                size="lg"
                                isVibrating={false}
                            />
                        </div>
                    </motion.div>
                )}

                {/* Chat History */}
                {showHistory && appState === "idle" && (
                    <motion.div
                        key="chat-history"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="flex-1 overflow-y-auto px-3 sm:px-6 md:px-20 pt-10 pb-20 custom-scrollbar"
                        ref={scrollRef}
                    >
                        <div className="max-w-4xl mx-auto">
                            <div className="flex items-center justify-center gap-4 mb-16 opacity-30">
                                <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-zinc-800" />
                            </div>

                            <ActivityFeed
                                messages={messages}
                                activities={activities}
                                isLoading={isLoadingMessages}
                            />
                        </div>
                    </motion.div>
                )}

                {/* Idle Visualizer (when history is closed) */}
                {!showHistory && appState === "idle" && (
                    <motion.div
                        key="idle-visualizer"
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.02 }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                        className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
                    >
                        {/* Ambient glow */}
                        <div className="absolute w-[420px] h-[420px] rounded-full bg-white/5 blur-3xl" />

                        <NeuralCore state="idle" />

                        <motion.h2
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3, duration: 0.5 }}
                            className="mt-12 text-center text-3xl md:text-5xl font-light tracking-tight"
                        >
                            <span className="bg-gradient-to-r from-zinc-100 via-zinc-300 to-zinc-100 bg-clip-text text-transparent">
                                Awaiting input
                            </span>
                        </motion.h2>

                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.6 }}
                            className="mt-3 text-sm md:text-base text-zinc-500 tracking-wide"
                        >
                            Speak or type to begin
                        </motion.p>
                    </motion.div>
                )}
            </AnimatePresence>
        </main>
    );
}
