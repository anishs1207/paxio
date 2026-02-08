"use client";

import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
    ChevronDown,
    ChevronUp,
    Calendar,
    Tag,
    Sparkles,
    FileText,
    CheckCircle2,
} from "lucide-react";

const NotionPersonPage = ({ page }: { page: any }) => {
    const [expanded, setExpanded] = useState(false);

    return (
        <div className="mx-6 md:mx-10 max-w-4xl rounded-2xl bg-zinc-900/80 backdrop-blur border border-zinc-800 shadow-xl">
            {/* Header */}
            <button
                onClick={() => setExpanded((p) => !p)}
                className="w-full flex items-center justify-between px-6 py-4 hover:bg-zinc-800/40 transition rounded-t-2xl"
            >
                <div className="flex items-center gap-3">
                    <FileText className="text-indigo-400" size={18} />
                    <div className="text-left">
                        <h2 className="text-sm font-medium text-zinc-200">
                            {page.title}
                        </h2>
                        <p className="text-xs text-zinc-500">
                            Notion-style document
                        </p>
                    </div>
                </div>

                {expanded ? (
                    <ChevronUp size={18} className="text-zinc-400" />
                ) : (
                    <ChevronDown size={18} className="text-zinc-400" />
                )}
            </button>

            <AnimatePresence initial={false}>
                {/* COLLAPSED SUMMARY */}
                {!expanded && (
                    <motion.div
                        key="summary"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="px-6 py-5 space-y-4"
                    >
                        {/* Title */}
                        <div className="flex items-center gap-3">
                            <Sparkles className="text-emerald-400" size={18} />
                            <h3 className="text-lg font-medium text-zinc-100">
                                {page.title}
                            </h3>
                        </div>

                        {/* Meta Row */}
                        <div className="flex flex-wrap gap-3 text-xs">
                            <Badge
                                icon={<CheckCircle2 size={12} />}
                                text={page.properties.status}
                                color="emerald"
                            />
                            <Badge
                                icon={<Tag size={12} />}
                                text={page.properties.tags.join(", ")}
                            />
                            <Badge
                                icon={<Calendar size={12} />}
                                text={`Updated · ${page.properties.updatedAt}`}
                            />
                        </div>

                        {/* Summary */}
                        <p className="text-sm text-zinc-300 leading-relaxed">
                            {page.summary}
                        </p>
                    </motion.div>
                )}

                {/* EXPANDED CONTENT */}
                {expanded && (
                    <motion.div
                        key="content"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.35, ease: "easeInOut" }}
                        className="overflow-hidden"
                    >
                        {/* Page Title */}
                        <div className="px-6 pt-6 pb-4">
                            <h1 className="text-2xl font-semibold text-zinc-100 flex items-center gap-3">
                                <Sparkles className="text-emerald-400" size={22} />
                                {page.title}
                            </h1>
                            <p className="text-sm text-zinc-400 mt-1">
                                {page.subtitle}
                            </p>
                        </div>

                        {/* Properties */}
                        <div className="px-6 py-4 grid grid-cols-2 md:grid-cols-4 gap-4 border-y border-zinc-800 text-sm">
                            <Property
                                icon={<CheckCircle2 size={14} />}
                                label="Status"
                                value={page.properties.status}
                                valueColor="text-emerald-400"
                            />
                            <Property
                                icon={<Tag size={14} />}
                                label="Tags"
                                value={page.properties.tags.join(", ")}
                            />
                            <Property
                                icon={<Calendar size={14} />}
                                label="Created"
                                value={page.properties.createdAt}
                            />
                            <Property
                                icon={<Calendar size={14} />}
                                label="Updated"
                                value={page.properties.updatedAt}
                            />
                        </div>

                        {/* Body */}
                        <div className="px-6 py-6 space-y-6 text-sm text-zinc-200 leading-relaxed">
                            {page.content.map((block: any, index: number) => {
                                if (block.type === "paragraph") {
                                    return <p key={index}>{block.text}</p>;
                                }

                                if (block.type === "list") {
                                    return (
                                        <ul
                                            key={index}
                                            className="list-disc list-inside space-y-2 text-zinc-300"
                                        >
                                            {block.items.map(
                                                (item: string, i: number) => (
                                                    <li key={i}>{item}</li>
                                                )
                                            )}
                                        </ul>
                                    );
                                }

                                if (block.type === "callout") {
                                    return (
                                        <div
                                            key={index}
                                            className="rounded-xl border border-indigo-500/20 bg-indigo-500/10 px-4 py-3"
                                        >
                                            <p className="text-indigo-300 text-sm">
                                                💡 Insight: {block.text}
                                            </p>
                                        </div>
                                    );
                                }

                                return null;
                            })}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

/* ---------- Helpers ---------- */

const Property = ({
    icon,
    label,
    value,
    valueColor = "text-zinc-200",
}: {
    icon: React.ReactNode;
    label: string;
    value: string;
    valueColor?: string;
}) => (
    <div className="flex items-start gap-2">
        <span className="text-zinc-500 mt-0.5">{icon}</span>
        <div>
            <p className="text-xs text-zinc-500">{label}</p>
            <p className={`text-sm ${valueColor}`}>{value}</p>
        </div>
    </div>
);

const Badge = ({
    icon,
    text,
    color = "zinc",
}: {
    icon: React.ReactNode;
    text: string;
    color?: "zinc" | "emerald" | "indigo";
}) => {
    const colors: Record<string, string> = {
        zinc: "bg-zinc-800 text-zinc-300",
        emerald: "bg-emerald-500/10 text-emerald-400",
        indigo: "bg-indigo-500/10 text-indigo-400",
    };

    return (
        <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs ${colors[color]}`}
        >
            {icon}
            {text}
        </span>
    );
};

export default NotionPersonPage;
