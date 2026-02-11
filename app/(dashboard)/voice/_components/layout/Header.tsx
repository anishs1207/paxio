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
import Link from "next/link";

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

    // Base button styles - premium glassmorphism
    const iconBtn =
        "cursor-pointer h-10 w-10 flex items-center justify-center rounded-full " +
        "bg-white/[0.06] backdrop-blur-md border border-white/[0.08] text-zinc-400 " +
        "hover:text-white hover:border-white/20 hover:bg-white/[0.1] hover:shadow-[0_0_15px_rgba(255,255,255,0.06)] " +
        "active:scale-95 transition-all duration-200";

    const desktopBtn =
        "cursor-pointer h-10 flex items-center gap-2 px-4 rounded-full " +
        "bg-white/[0.06] backdrop-blur-md border border-white/[0.08] text-zinc-400 " +
        "hover:text-white hover:border-white/20 hover:bg-white/[0.1] hover:shadow-[0_0_15px_rgba(255,255,255,0.06)] " +
        "active:scale-[0.97] transition-all duration-200 whitespace-nowrap";

    const mobileMenuItem =
        "flex items-center gap-3 px-4 py-3 text-zinc-300 hover:text-white " +
        "hover:bg-white/[0.06] transition-all duration-200 rounded-xl";

    // All menu items for desktop
    const allMenuItems = [
        { icon: <Workflow size={18} />, label: "Workflows", action: () => setIsWorkflowOpen(true) },
        // { icon: <Search size={18} />, label: "Sessions", action: () => setIsSessionsOpen(true) },
        { icon: showHistory ? <ChevronDown size={18} /> : <History size={18} />, label: "History", action: () => setShowHistory(!showHistory) },
        { icon: <LayoutGrid size={18} />, label: "Tools", action: () => setIsNexusOpen(true) },
        { icon: <Users size={18} />, label: "People", action: () => setShowPeople(true) },
    ];

    // Always visible on mobile (outside hamburger) - bigger icons (18px instead of 16px)
    const mobileVisibleItems = [
        { icon: <Workflow size={18} />, action: () => setIsWorkflowOpen(true) },
        // { icon: <Search size={18} />, action: () => setIsSessionsOpen(true) },
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
            <div className="relative flex items-center px-4 sm:px-10 py-4">
                {/* LEFT — Logo */}
                <Link
                    href="/"
                    className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity z-10"
                >
                    <span className="text-xl font-bold tracking-tight font-display">
                        Paxio
                    </span>

                    <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full
        bg-white/10 text-white/70 border border-white/20"
                    >
                        Beta
                    </span>
                </Link>

                {/* CENTER — Desktop Navigation */}
                <div
                    className="
        hidden sm:flex items-center gap-2
        absolute left-1/2 -translate-x-1/2
        max-w-[60vw] overflow-hidden
      "
                >
                    {allMenuItems.map((item, index) => (
                        <button
                            key={index}
                            onClick={item.action}
                            className={desktopBtn}
                        >
                            {item.icon}
                            {/* Hide labels until large screens */}
                            <span className="hidden lg:inline text-xs font-medium uppercase tracking-wide">
                                {item.label}
                            </span>
                        </button>
                    ))}
                </div>

                {/* RIGHT — Credits + Sign Out */}
                <div className="hidden sm:flex items-center gap-2 ml-auto z-10">
                    {/* Credits */}
                    <button
                        onClick={() => router.push("/payment")}
                        className="cursor-pointer flex h-10 items-center gap-2 px-4 rounded-full
          bg-white/[0.06] backdrop-blur-md border border-white/[0.08] text-xs font-semibold
          hover:border-emerald-500/30 hover:bg-emerald-500/[0.06]
          hover:shadow-[0_0_20px_rgba(52,211,153,0.08)]
          active:scale-[0.97] transition-all duration-200"
                    >
                        <PlanBadge />
                        <div className="w-px h-4 bg-white/10" />
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
                        className={`${iconBtn}
          hover:!text-red-400
          hover:!border-red-500/30
          hover:!bg-red-500/[0.08]
          hover:!shadow-[0_0_15px_rgba(239,68,68,0.08)]`}
                    >
                        {isSigningOut ? (
                            <Loader2 size={16} className="animate-spin" />
                        ) : (
                            <LogOut size={16} />
                        )}
                    </button>
                </div>

                {/* MOBILE — Right Side */}
                <div className="flex sm:hidden items-center gap-1.5 ml-auto">
                    {mobileVisibleItems.map((item, index) => (
                        <button
                            key={index}
                            onClick={item.action}
                            className={iconBtn}
                        >
                            {item.icon}
                        </button>
                    ))}

                    <button
                        onClick={() => router.push("/payment")}
                        className="cursor-pointer flex h-10 items-center gap-1.5 px-2.5 rounded-full
          bg-white/[0.06] backdrop-blur-md border border-white/[0.08] text-xs font-semibold
          hover:border-emerald-500/30 hover:bg-emerald-500/[0.06]
          active:scale-95 transition-all duration-200"
                    >
                        <PlanBadge compact />
                        <Sparkles size={12} className="text-emerald-400" />
                        {isLoadingCredits ? (
                            <div className="h-3 w-6 bg-zinc-700 rounded animate-pulse" />
                        ) : (
                            <span className="text-zinc-200">{credits}</span>
                        )}
                    </button>

                    <button
                        onClick={() => setMobileOpen(!mobileOpen)}
                        className={iconBtn}
                    >
                        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
                    </button>
                </div>
            </div>

            {/* MOBILE MENU */}
            <AnimatePresence>
                {mobileOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="sm:hidden absolute top-full left-0 right-0 z-50
          bg-black/95 backdrop-blur-lg border-b border-zinc-800 overflow-hidden"
                    >
                        <div className="px-4 py-3 space-y-1">
                            {mobileMenuItems.map((item, index) => (
                                <button
                                    key={index}
                                    onClick={item.action}
                                    className={`${mobileMenuItem} w-full`}
                                >
                                    {item.icon}
                                    <span className="font-medium">{item.label}</span>
                                </button>
                            ))}

                            <div className="border-t border-zinc-800 my-2" />

                            <button
                                onClick={handleSignOut}
                                disabled={isSigningOut}
                                className={`${mobileMenuItem}
              w-full text-red-400 hover:text-red-300 hover:bg-red-500/10`}
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


