"use client";

import React, { useState } from "react";
import {
    LayoutGrid,
    Sparkles,
    ChevronDown,
    History,
    Users,
    Workflow,
    Search,
    Menu,
    X,
    LogOut,
    Loader2,
    Crown,
} from "lucide-react";
import { signOut } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";

interface HeaderProps {
    showBriefing: boolean;
    setShowBriefing: (value: boolean) => void;

    showHistory: boolean;
    setShowHistory: (value: boolean) => void;

    setIsNexusOpen: (value: boolean) => void;
    setIsWorkflowOpen: (value: boolean) => void;
    setIsSessionsOpen: (value: boolean) => void;

    credits?: number;
    plan?: string;
    isLoadingCredits?: boolean;

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
    plan = "FREE",
    isLoadingCredits = false,
    setShowPeople,
}) => {
    const [mobileOpen, setMobileOpen] = useState(false);
    const [isSigningOut, setIsSigningOut] = useState(false);
    const router = useRouter();

    const handleSignOut = async () => {
        try {
            setIsSigningOut(true);
            await signOut({ callbackUrl: "/" });
        } finally {
            setIsSigningOut(false);
        }
    };

    const isPro = plan === "PRO";

    // Base button styles - bigger on mobile (h-10 w-10)
    const iconBtn =
        "cursor-pointer h-10 w-10 flex items-center justify-center rounded-full " +
        "bg-zinc-900 border border-zinc-800 text-zinc-400 " +
        "hover:text-white hover:border-zinc-600 transition";

    const desktopBtn =
        "cursor-pointer h-10 flex items-center gap-2 px-4 rounded-full " +
        "bg-zinc-900 border border-zinc-800 text-zinc-400 " +
        "hover:text-white hover:border-zinc-600 transition whitespace-nowrap";

    const mobileMenuItem =
        "flex items-center gap-3 px-4 py-3 text-zinc-300 hover:text-white hover:bg-zinc-800/50 transition rounded-lg";

    // All menu items for desktop
    const allMenuItems = [
        { icon: <Workflow size={18} />, label: "Workflows", action: () => setIsWorkflowOpen(true) },
        { icon: <Search size={18} />, label: "Sessions", action: () => setIsSessionsOpen(true) },
        { icon: showHistory ? <ChevronDown size={18} /> : <History size={18} />, label: "History", action: () => setShowHistory(!showHistory) },
        { icon: <LayoutGrid size={18} />, label: "Tools", action: () => setIsNexusOpen(true) },
        { icon: <Users size={18} />, label: "People", action: () => setShowPeople(true) },
    ];

    // Always visible on mobile (outside hamburger) - bigger icons (18px instead of 16px)
    const mobileVisibleItems = [
        { icon: <Workflow size={18} />, action: () => setIsWorkflowOpen(true) },
        { icon: <Search size={18} />, action: () => setIsSessionsOpen(true) },
        { icon: showHistory ? <ChevronDown size={18} /> : <History size={18} />, action: () => setShowHistory(!showHistory) },
    ];

    // Items only in hamburger menu on mobile
    const mobileMenuItems = [
        { icon: <LayoutGrid size={18} />, label: "Tools", action: () => { setIsNexusOpen(true); setMobileOpen(false); } },
        { icon: <Users size={18} />, label: "People", action: () => { setShowPeople(true); setMobileOpen(false); } },
    ];

    // Plan badge component
    const PlanBadge = ({ compact = false }: { compact?: boolean }) => {
        if (isLoadingCredits) {
            return (
                <div className={`${compact ? 'h-5 w-10' : 'h-5 w-12'} bg-zinc-700 rounded-full animate-pulse`} />
            );
        }

        return (
            <span
                className={`
                    ${compact ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2 py-0.5'} 
                    font-bold uppercase rounded-full
                    ${isPro
                        ? 'bg-gradient-to-r from-amber-500/20 to-yellow-500/20 text-amber-400 border border-amber-500/30'
                        : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                    }
                `}
            >
                {isPro && <Crown size={compact ? 10 : 12} className="inline mr-0.5 -mt-0.5" />}
                {plan}
            </span>
        );
    };

    return (
        <header className="relative">
            <div className="flex items-center justify-between px-4 md:px-10 py-4">
                {/* Logo */}
                <h1 className="flex items-center gap-2">
                    <span className="text-xl font-bold tracking-tight text-zinc-100">Paxio</span>
                </h1>

                {/* Desktop Navigation */}
                <div className="hidden md:flex items-center gap-2">
                    {allMenuItems.map((item, index) => (
                        <button key={index} onClick={item.action} className={desktopBtn}>
                            {item.icon}
                            <span className="text-xs font-medium uppercase tracking-wide">{item.label}</span>
                        </button>
                    ))}

                    {/* Plan Badge + Credits - Clickable to /payment */}
                    <button
                        onClick={() => router.push("/payment")}
                        className="cursor-pointer flex h-10 items-center gap-2 px-4 rounded-full
                            bg-zinc-900 border border-zinc-800 text-xs font-semibold
                            hover:border-emerald-500/50 hover:bg-zinc-800 transition"
                    >
                        <PlanBadge />
                        <div className="w-px h-4 bg-zinc-700" />
                        <Sparkles size={14} className="text-emerald-400" />
                        {isLoadingCredits ? (
                            <div className="h-4 w-10 bg-zinc-700 rounded animate-pulse" />
                        ) : (
                            <span className="text-zinc-200">{credits}</span>
                        )}
                    </button>

                    {/* Sign Out */}
                    <button
                        onClick={handleSignOut}
                        disabled={isSigningOut}
                        className={`${iconBtn} hover:text-red-400 hover:border-red-500/50`}
                    >
                        {isSigningOut ? (
                            <Loader2 size={16} className="animate-spin" />
                        ) : (
                            <LogOut size={16} />
                        )}
                    </button>
                </div>

                {/* Mobile Navigation */}
                <div className="flex md:hidden items-center gap-1.5">
                    {/* Always visible action buttons */}
                    {mobileVisibleItems.map((item, index) => (
                        <button
                            key={index}
                            onClick={item.action}
                            className={iconBtn}
                        >
                            {item.icon}
                        </button>
                    ))}

                    {/* Plan Badge + Credits Badge (compact) - Clickable to /payment */}
                    <button
                        onClick={() => router.push("/payment")}
                        className="cursor-pointer flex h-10 items-center gap-1.5 px-2.5 rounded-full
                            bg-zinc-900 border border-zinc-800 text-xs font-semibold
                            hover:border-emerald-500/50 hover:bg-zinc-800 transition"
                    >
                        <PlanBadge compact />
                        <Sparkles size={12} className="text-emerald-400" />
                        {isLoadingCredits ? (
                            <div className="h-3 w-6 bg-zinc-700 rounded animate-pulse" />
                        ) : (
                            <span className="text-zinc-200">{credits}</span>
                        )}
                    </button>

                    {/* Hamburger Menu */}
                    <button
                        onClick={() => setMobileOpen(!mobileOpen)}
                        className={iconBtn}
                    >
                        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
                    </button>
                </div>
            </div>

            {/* Mobile Menu Dropdown */}
            <AnimatePresence>
                {mobileOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="md:hidden absolute top-full left-0 right-0 z-50 
                            bg-black/95 backdrop-blur-lg border-b border-zinc-800 overflow-hidden"
                    >
                        <div className="px-4 py-3 space-y-1">
                            {mobileMenuItems.map((item, index) => (
                                <button
                                    key={index}
                                    onClick={item.action}
                                    className={mobileMenuItem + " w-full"}
                                >
                                    {item.icon}
                                    <span className="font-medium">{item.label}</span>
                                </button>
                            ))}

                            {/* Divider */}
                            <div className="border-t border-zinc-800 my-2" />

                            {/* Sign Out */}
                            <button
                                onClick={handleSignOut}
                                disabled={isSigningOut}
                                className={`${mobileMenuItem} w-full text-red-400 hover:text-red-300 hover:bg-red-500/10`}
                            >
                                {isSigningOut ? (
                                    <Loader2 size={18} className="animate-spin" />
                                ) : (
                                    <LogOut size={18} />
                                )}
                                <span className="font-medium">
                                    {isSigningOut ? "Signing out..." : "Sign Out"}
                                </span>
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </header>
    );
};

export default Header;


