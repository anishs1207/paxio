"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    X,
    CheckCircle2,
    Loader2,
    Plug,
    Settings,
} from "lucide-react";
import axios from "axios";
import ZeptoFormModal from "./ZeptoFormModal";

export type ToolStatus = "connected" | "disconnected" | "loading";

export interface Tool {
    name: string;
    label: string;
    icon: React.ReactNode;
    status: ToolStatus;
    isCustom?: boolean; // For tools with custom handling like Zepto
}

interface ToolsOverlayProps {
    isOpen: boolean;
    onClose: () => void;
    tools: Tool[];
    setTools: React.Dispatch<React.SetStateAction<Tool[]>>;
    userId: string;
}

const ToolsOverlay: React.FC<ToolsOverlayProps> = ({
    isOpen,
    onClose,
    tools,
    setTools,
    userId,
}) => {
    const [isZeptoModalOpen, setIsZeptoModalOpen] = useState(false);

    /* ---------------- CONNECT ---------------- */
    const handleConnect = (toolName: string) => {
        window.location.href = `/api/connect/${toolName}`;
    };

    /* ---------------- DISCONNECT ---------------- */
    const handleDisconnect = async (toolName: string) => {
        try {
            setTools((prev) =>
                prev.map((t) =>
                    t.name === toolName ? { ...t, status: "loading" } : t
                )
            );

            await axios.post(`/api/disconnect/${toolName}`, null, {
                headers: { userId },
            });

            setTools((prev) =>
                prev.map((t) =>
                    t.name === toolName ? { ...t, status: "disconnected" } : t
                )
            );
        } catch (err) {
            console.error("Disconnect failed", err);

            setTools((prev) =>
                prev.map((t) =>
                    t.name === toolName ? { ...t, status: "connected" } : t
                )
            );
        }
    };

    /* ---------------- HANDLE ZEPTO ---------------- */
    const handleZeptoClick = () => {
        setIsZeptoModalOpen(true);
    };

    return (
        <>
            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* BACKDROP */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={onClose}
                            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-md"
                        />

                        {/* MODAL */}
                        <motion.div
                            initial={{ y: "100%", opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: "100%", opacity: 0 }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="
                                fixed z-50 inset-x-0 bottom-0
                                sm:inset-0 sm:flex sm:items-center sm:justify-center
                            "
                        >
                            <div
                                className="
                                    w-full sm:max-w-2xl
                                    bg-zinc-950 border border-zinc-800
                                    rounded-t-3xl sm:rounded-3xl
                                    shadow-2xl
                                    p-6 sm:p-8
                                    max-h-[90vh] overflow-y-auto
                                    custom-scrollbar
                                "
                            >
                                {/* HEADER */}
                                <div className="flex items-start justify-between mb-8">
                                    <div>
                                        <h2 className="text-xl sm:text-2xl font-semibold text-zinc-100">
                                            Tools
                                        </h2>
                                        <p className="text-sm text-zinc-500 mt-1">
                                            Connect your tools securely
                                        </p>
                                    </div>

                                    <button
                                        onClick={onClose}
                                        className="
                                            w-10 h-10 rounded-full
                                            bg-zinc-900 border border-zinc-800
                                            flex items-center justify-center
                                            text-zinc-400 hover:text-zinc-100
                                            transition
                                        "
                                    >
                                        <X size={20} />
                                    </button>
                                </div>

                                {/* TOOLS LIST */}
                                <div className="grid gap-4">
                                    {tools.map((tool) => (
                                        <div
                                            key={tool.name}
                                            className="
                                                flex flex-col sm:flex-row
                                                sm:items-center sm:justify-between
                                                gap-4
                                                p-5 rounded-2xl
                                                bg-zinc-900/60
                                                border border-zinc-800
                                                hover:border-zinc-700
                                                transition
                                            "
                                        >
                                            {/* LEFT */}
                                            <div className="flex items-center gap-4">
                                                <div
                                                    className={`w-11 h-11 rounded-xl flex items-center justify-center ${tool.status === "connected"
                                                        ? "bg-zinc-100 text-zinc-950"
                                                        : tool.status === "loading"
                                                            ? "bg-zinc-800 text-zinc-300"
                                                            : "bg-zinc-800 text-zinc-500"
                                                        }`}
                                                >
                                                    {tool.status === "loading" ? (
                                                        <Loader2 className="animate-spin" size={20} />
                                                    ) : (
                                                        tool.icon
                                                    )}
                                                </div>

                                                <div>
                                                    <h3 className="text-sm font-medium text-zinc-200">
                                                        {tool.label}
                                                    </h3>
                                                    <p className="text-xs text-zinc-500">
                                                        {tool.name === "zepto"
                                                            ? "Quick delivery service"
                                                            : tool.status === "connected"
                                                                ? "Connected and syncing"
                                                                : tool.status === "loading"
                                                                    ? "Updating status…"
                                                                    : "Disconnected"}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* ACTION */}
                                            {tool.name === "zepto" ? (
                                                // Special handling for Zepto - always show Configure
                                                <button
                                                    onClick={handleZeptoClick}
                                                    className="
                                                        flex items-center justify-center gap-2
                                                        px-5 py-2.5 rounded-xl
                                                        text-xs font-semibold uppercase tracking-wider
                                                        bg-purple-600 text-white
                                                        hover:bg-purple-500
                                                        transition
                                                    "
                                                >
                                                    <Settings size={14} />
                                                    Configure
                                                </button>
                                            ) : tool.status === "connected" ? (
                                                <button
                                                    onClick={() => handleDisconnect(tool.name)}
                                                    className="
                                                        flex items-center justify-center gap-2
                                                        px-5 py-2.5 rounded-xl
                                                        text-xs font-semibold uppercase tracking-wider
                                                        bg-zinc-800/70 text-zinc-300
                                                        border border-zinc-700
                                                        hover:bg-zinc-800
                                                    "
                                                >
                                                    <CheckCircle2 size={14} />
                                                    Disconnect
                                                </button>
                                            ) : tool.status === "loading" ? (
                                                <button
                                                    disabled
                                                    className="
                                                        flex items-center justify-center gap-2
                                                        px-5 py-2.5 rounded-xl
                                                        text-xs font-semibold uppercase tracking-wider
                                                        bg-zinc-800 text-zinc-500
                                                        border border-zinc-700
                                                        cursor-not-allowed
                                                    "
                                                >
                                                    <Loader2 size={14} className="animate-spin" />
                                                    Loading
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => handleConnect(tool.name)}
                                                    className="
                                                        flex items-center justify-center gap-2
                                                        px-5 py-2.5 rounded-xl
                                                        text-xs font-semibold uppercase tracking-wider
                                                        bg-zinc-100 text-zinc-950
                                                        hover:bg-zinc-200
                                                    "
                                                >
                                                    <Plug size={14} />
                                                    Connect
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* ZEPTO FORM MODAL */}
            <ZeptoFormModal
                isOpen={isZeptoModalOpen}
                onClose={() => setIsZeptoModalOpen(false)}
                userId={userId}
            />
        </>
    );
};

export default ToolsOverlay;

