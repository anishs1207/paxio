"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";

export default function Dropdown({ title, items }: { title: string; items: { label: string; href: string }[] }) {
    const [open, setOpen] = useState(false);

    return (
        <div className="flex flex-col">
            <button
                onClick={() => setOpen(!open)}
                className="flex justify-between items-center text-zinc-300 hover:text-white text-lg font-medium"
            >
                {title}
                <ChevronDown
                    className={`w-5 h-5 transition-transform ${open ? "rotate-180" : ""}`}
                />
            </button>

            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="ml-4 mt-2 flex flex-col space-y-2 border-l border-zinc-800 pl-4"
                    >
                        {items.map((sub) => (
                            <Link
                                key={sub.label}
                                href={sub.href}
                                className="text-zinc-400 hover:text-white text-sm"
                            >
                                {sub.label}
                            </Link>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}