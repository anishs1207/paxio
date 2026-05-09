"use client";

import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
    ChevronDown,
    ChevronUp,
    Sparkles,
} from "lucide-react";

interface EmailMessageProps {
    summarizedEmail: string;
    from?: string;
    to?: string;
    cc?: string[] | null;
    subject: string;
    message: string;
}

const EmailMessage: React.FC<EmailMessageProps> = ({
    summarizedEmail,
    from,
    to,
    cc,
    subject,
    message,
}) => {
    const [expanded, setExpanded] = useState(false);

    return (
        <div
            className="
                mx-0 sm:mx-6 md:mx-10 max-w-4xl
                rounded-2xl
                bg-zinc-900/80 backdrop-blur
                border border-zinc-800
                shadow-xl mb-3
            "
        >
            {/* Header */}
            <button
                onClick={() => setExpanded((p) => !p)}
                className="
                    w-full flex items-center justify-between
                    px-5 py-3
                    border-b border-zinc-800
                    hover:bg-zinc-800/40
                    transition
                "
            >
                <h2 className="text-sm font-medium text-zinc-200 flex items-center gap-2">
                    <Sparkles size={16} className="text-emerald-400" />
                    {expanded ? "Email Preview" : "Email Summary"}
                </h2>

                {expanded ? (
                    <ChevronUp size={18} className="text-zinc-400" />
                ) : (
                    <ChevronDown size={18} className="text-zinc-400" />
                )}
            </button>

            {/* Animated Content */}
            <AnimatePresence initial={false}>
                {expanded ? (
                    <motion.div
                        key="expanded"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.35, ease: "easeInOut" }}
                        className="overflow-hidden"
                    >
                        {/* Meta */}
                        <div className="px-5 divide-y divide-zinc-800">

                            {from && (
                                <div className="flex items-center py-3 gap-3 text-sm">
                                    <span className="text-zinc-500 w-10">From</span>
                                    <span className="text-zinc-200 flex-1">
                                        {from}
                                    </span>
                                </div>
                            )}

                            {to && (
                                <div className="flex items-center py-3 gap-3 text-sm">
                                    <span className="text-zinc-500 w-10">To</span>
                                    <span className="text-zinc-200 flex-1">
                                        {to}
                                    </span>
                                </div>
                            )}

                                                            {Array.isArray(cc) && cc.length > 0 && (
                                <div className="flex items-center py-3 gap-3 text-sm">
                                    <span className="text-zinc-500 w-10">Cc</span>
                                    <span className="text-zinc-200">
                                    {cc.join(", ")}
                                    </span>
                                </div>
                                )}


                            <div className="flex items-center py-3 gap-3 text-sm">
                                <span className="text-zinc-500 w-16">Subject</span>
                                <span className="text-zinc-100 font-medium">
                                    {subject}
                                </span>
                            </div>
                        </div>

                        {/* Body */}
                        <div className="px-5 py-4 text-sm text-zinc-200 leading-relaxed whitespace-pre-line break-words">
                            {message}
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        key="summary"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="px-5 py-4 text-sm text-zinc-300 space-y-3"
                    >
                        <p>{summarizedEmail}</p>

                        <div className="text-xs text-zinc-500 flex gap-4 flex-wrap">
                            {from && <span>From: {from}</span>}
                            {to && <span>To: {to}</span>}
                            <span>Subject: {subject}</span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default EmailMessage;
