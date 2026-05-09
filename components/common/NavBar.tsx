// apps/web/components/landing/common/NavBar.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
    Menu,
    X,
    Home,
    Puzzle,
    BookOpen,
    CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { FcGoogle } from "react-icons/fc";

export default function Navbar() {
    const [mobileOpen, setMobileOpen] = useState(false);

    const router = useRouter();

    const menuItems = [
        { name: "Home", href: "/", icon: <Home size={16} /> },
        { name: "Use Cases", href: "/use-cases", icon: <Puzzle size={16} /> },
        { name: "Features", href: "/features", icon: <BookOpen size={16} /> },
        { name: "Pricing", href: "/#pricing", icon: <Puzzle size={16} /> },
    ];



    const handleScrollToSection = (id: string) => {
        if (window.location.pathname !== "/") {
            router.push(`/#${id}`);
        } else {
            const element = document.getElementById(id);
            if (element) {
                element.scrollIntoView({ behavior: "smooth" });
            }
        }
    };

    return (
        <header className="sticky top-0 mb-0 z-50 w-full bg-black border-b border-zinc-800">
            <div className="mx-auto max-w-7xl px-6 h-16 flex items-center justify-between">
                {/* Logo */}
                <Link
                    href="/"
                    className="text-2xl font-extrabold tracking-tight text-white"
                >
                    Paxio
                </Link>

                {/* Desktop Nav */}
                <nav className="hidden md:flex items-center gap-8">
                    {menuItems.map((item) => (
                        <Link
                            key={item.name}
                            href={item.href}
                            className="text-sm font-medium text-zinc-400 hover:text-white transition"
                        >
                            {item.name}
                        </Link>
                    ))}
                </nav>

                {/* Desktop Actions */}
                <div className=" hidden md:flex items-center gap-3">
                    <Button
                        onClick={() => handleScrollToSection('waitlist')}
                        className="cursor-pointer bg-white text-black hover:bg-zinc-200 rounded-xl font-medium flex gap-2"
                    >
                        <CheckCircle2 size={16} />
                        Join Waitlist
                    </Button>

                    <Link
                        href="/signup"
                        className="cursor-pointer border border-zinc-700 px-4 py-2 rounded-xl text-sm font-medium text-zinc-200 hover:bg-zinc-900 transition flex items-center gap-2"
                    >
                        <FcGoogle className=" text-lg" />
                        Sign In
                    </Link>
                </div>

                {/* Mobile Toggle */}
                <button
                    onClick={() => setMobileOpen(!mobileOpen)}
                    className="cursor-pointer md:hidden text-zinc-300 hover:text-white"
                >
                    {mobileOpen ? <X size={22} /> : <Menu size={22} />}
                </button>
            </div>

            {/* Mobile Menu */}
            <AnimatePresence>
                {mobileOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="md:hidden bg-black border-t border-zinc-800 px-6 py-6"
                    >
                        <div className="flex flex-col gap-5">
                            {menuItems.map((item) => (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    onClick={() => setMobileOpen(false)}
                                    className="flex items-center gap-3 text-zinc-300 hover:text-white font-medium"
                                >
                                    {item.icon}
                                    {item.name}
                                </Link>
                            ))}

                            <Button
                                onClick={() => {
                                    handleScrollToSection('waitlist');
                                    setMobileOpen(false);
                                }}
                                className="mt-4 cursor-pointer bg-white text-black hover:bg-zinc-200 rounded-xl flex gap-2"
                            >
                                <CheckCircle2 size={16} />
                                Join Waitlist
                            </Button>


                            <Link
                                href="/signup"
                                className="border cursor-pointer border-zinc-700 px-4 py-3 rounded-xl text-sm font-medium text-zinc-200 hover:bg-zinc-900 transition flex items-center justify-center gap-2"
                            >
                                <FcGoogle className="text-lg" />
                                Sign In with Google
                            </Link>

                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </header>
    );
}
