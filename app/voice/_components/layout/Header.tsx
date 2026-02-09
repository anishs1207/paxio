"use client";

import React from "react";
import {
    LayoutGrid,
    Sparkles,
    ChevronDown,
    History,
    Users,
    Workflow,
    Search
} from "lucide-react";
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"

interface HeaderProps {
    showBriefing: boolean;
    setShowBriefing: (value: boolean) => void;

    showHistory: boolean;
    setShowHistory: (value: boolean) => void;

    setIsNexusOpen: (value: boolean) => void;
    setIsWorkflowOpen: (value: boolean) => void;
    setIsSessionsOpen: (value: boolean) => void;

    credits?: number;

    showPeople: boolean;
    setShowPeople: (value: boolean) => void;
}

const Header: React.FC<HeaderProps> = ({
    showHistory,
    setShowHistory,
    setIsNexusOpen,
    setIsWorkflowOpen,
    setIsSessionsOpen,
    credits = 100,
    setShowPeople,
}) => {
    const baseBtn =
        "cursor-pointer h-11 flex items-center gap-2 px-3 sm:px-4 rounded-full " +
        "bg-zinc-900 border border-zinc-800 text-zinc-400 " +
        "hover:text-white transition whitespace-nowrap";

    const label =
        "hidden sm:inline text-xs font-bold uppercase tracking-wide";

    return (
        <header className="flex items-center justify-between px-6 md:px-10 py-6">
            {/* Left */}
            <h1 className=" flex flex-col ">
                <p className="text-xl font-bold tracking-tight text-zinc-100">Paxio</p>
                {/* <p className="mt-3 flex items-center gap-2 text-sm">
                    <span className="text-zinc-500 uppercase tracking-wide">
                        Voices
                    </span>
                    <span className="text-zinc-600">{">"}</span>
                    <span className="text-zinc-200 font-medium">
                        Default
                    </span>
                </p> */}
            </h1>

            {/* Right */}
            <div className="flex items-center gap-2 sm:gap-3">
                {/* History */}
                {/* <div className="flex flex-col items-center space-x-2">
                    {/* change location  */}
                {/* <Switch className="mb-3" id="airplane-mode" />
                    <Label htmlFor="airplane-mode">Safe Mode</Label>
                </div> */}
                <button
                    onClick={() => setIsWorkflowOpen(true)}
                    className={baseBtn}
                >
                    <Workflow size={16} />
                    <span className={label}>Workflows</span>
                </button>
                <button
                    onClick={() => setIsSessionsOpen(true)}
                    className={baseBtn}
                >
                    <Search size={16} />
                    <span className={label}>Sessions</span>
                </button>
                <button
                    onClick={() => setShowHistory(!showHistory)}
                    className={baseBtn}
                >
                    {showHistory ? <ChevronDown size={16} /> : <History size={16} />}
                    <span className={label}>History</span>
                </button>

                {/* Tools */}
                <button
                    onClick={() => setIsNexusOpen(true)}
                    className={baseBtn}
                >
                    <LayoutGrid size={16} />
                    <span className={label}>Tools</span>
                </button>

                {/* People */}
                <button
                    onClick={() => setShowPeople(true)}
                    className={baseBtn}
                >
                    <Users size={16} />
                    <span className={label}>People</span>
                </button>

                {/* Credits */}
                <div className="flex h-11 items-center gap-2 px-4 rounded-full
                        bg-zinc-900 border border-zinc-800 text-xs font-semibold">
                    <Sparkles size={14} className="text-emerald-400" />
                    {credits} Credits
                </div>
            </div>
        </header>
    );
};

export default Header;
