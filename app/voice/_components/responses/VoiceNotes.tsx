import React from "react";
import { Mic, Sparkles, Clock, ChevronUp, ChevronDown } from "lucide-react";
import { useState } from "react";

interface ChatFooterProps {
    appState: "idle" | string;

    isKeyboardVisible: boolean;
    setIsKeyboardVisible: (value: boolean) => void;

    inputText: string;
    setInputText: (value: string) => void;

    handleSendMessage: (e: React.FormEvent) => void;
    startVoice: () => void;
}

import {
    Tag,
} from "lucide-react";

interface VoiceNote {
    id: string;
    title: string;
    summary: string;
    transcript: string;
    tags: string[];
    time: string;
}

const DUMMY_NOTES: VoiceNote[] = [
    {
        id: "1",
        title: "Startup Idea – AI Voice Assistant",
        summary:
            "Idea about building a voice-first productivity assistant that captures thoughts and converts them into structured actions.",
        transcript:
            "So I was thinking, what if there was an app where you just speak your ideas out loud and it automatically organizes them into todos, notes, and reminders...",
        tags: ["startup", "ai", "ideas"],
        time: "Today · 3:42 PM",
    },
    {
        id: "2",
        title: "Meeting Reflection",
        summary:
            "Reflections from the team meeting focusing on improving onboarding flow and reducing drop-offs.",
        transcript:
            "The main takeaway from the meeting is that users are confused during onboarding, especially around permissions...",
        tags: ["meeting", "product", "ux"],
        time: "Yesterday · 6:10 PM",
    },
];

const VoiceNotesOrganizer = () => {
    const [expandedId, setExpandedId] = useState<string | null>(null);

    return (
        <div
            className="w-full max-w-4xl mx-auto
                       rounded-3xl
                       bg-zinc-900/80 backdrop-blur
                       border border-zinc-800
                       shadow-2xl overflow-hidden"
        >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-800">
                <div>
                    <h2 className="text-lg font-medium text-zinc-100 flex items-center gap-2">
                        <Sparkles className="text-emerald-400" size={18} />
                        Voice Notes
                    </h2>
                    <p className="text-sm text-zinc-500">
                        Speak freely. AI organizes it for you.
                    </p>
                </div>

                <button
                    className="flex items-center gap-2
                               bg-emerald-600 hover:bg-emerald-500
                               text-white text-sm font-medium
                               px-5 py-3 rounded-full transition"
                >
                    <Mic size={16} />
                    Record
                </button>
            </div>

            {/* Notes */}
            <div className="px-6 py-6 space-y-5">
                {DUMMY_NOTES.map((note) => {
                    const expanded = expandedId === note.id;

                    return (
                        <div
                            key={note.id}
                            className="rounded-2xl
                                       bg-zinc-800/60
                                       border border-zinc-700
                                       p-5 transition"
                        >
                            {/* Top Row */}
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <h3 className="text-base font-medium text-zinc-100">
                                        {note.title}
                                    </h3>
                                    <p className="text-sm text-zinc-400 mt-1">
                                        {note.summary}
                                    </p>
                                </div>

                                <button
                                    onClick={() =>
                                        setExpandedId(expanded ? null : note.id)
                                    }
                                    className="text-zinc-400 hover:text-white transition"
                                >
                                    {expanded ? (
                                        <ChevronUp size={18} />
                                    ) : (
                                        <ChevronDown size={18} />
                                    )}
                                </button>
                            </div>

                            {/* Meta */}
                            <div className="flex flex-wrap items-center gap-4 mt-4 text-xs text-zinc-500">
                                <span className="flex items-center gap-1">
                                    <Clock size={12} />
                                    {note.time}
                                </span>

                                <div className="flex items-center gap-2">
                                    <Tag size={12} />
                                    {note.tags.map((tag) => (
                                        <span
                                            key={tag}
                                            className="px-2 py-0.5 rounded-full
                                                       bg-zinc-700 text-zinc-300"
                                        >
                                            #{tag}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* Transcript */}
                            {expanded && (
                                <div
                                    className="mt-4 pt-4 border-t border-zinc-700
                                               text-sm text-zinc-300 leading-relaxed"
                                >
                                    <p className="mb-2 text-xs text-zinc-500">
                                        Raw transcript
                                    </p>
                                    {note.transcript}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default VoiceNotesOrganizer;