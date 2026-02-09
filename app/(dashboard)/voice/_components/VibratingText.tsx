import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

interface VibratingTextProps {
    text: string;
    size?: "sm" | "lg";
    isVibrating?: boolean; // kept for compatibility
}

const WORDS_PER_CHUNK = 10;
const CHUNK_DELAY = 2000; // ms between chunks

export const VibratingText: React.FC<VibratingTextProps> = ({
    text,
    size = "lg",
}) => {
    const words = useMemo(() => text.trim().split(/\s+/), [text]);

    // split text into chunks of 10 words
    const chunks = useMemo(() => {
        const result: string[] = [];
        for (let i = 0; i < words.length; i += WORDS_PER_CHUNK) {
            result.push(words.slice(i, i + WORDS_PER_CHUNK).join(" "));
        }
        return result;
    }, [words]);

    const [index, setIndex] = useState(0);

    useEffect(() => {
        if (index >= chunks.length - 1) return;

        const timer = setTimeout(() => {
            setIndex((prev) => prev + 1);
        }, CHUNK_DELAY);

        return () => clearTimeout(timer);
    }, [index, chunks.length]);

    return (
        <div className="pl-10 pr-10 relative overflow-hidden h-[6.5rem] md:h-[8rem] flex items-center justify-center">
            <AnimatePresence mode="wait">
                <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 30, filter: "blur(6px)" }}
                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    exit={{ opacity: 0, y: -30, filter: "blur(6px)" }}
                    transition={{ duration: 0.6, ease: "easeInOut" }}
                    className={`text-center leading-tight text-zinc-100 ${size === "lg"
                        ? "text-3xl md:text-5xl font-light tracking-tight"
                        : "text-sm font-medium tracking-wide"
                        }`}
                >
                    {chunks[index]}
                </motion.div>
            </AnimatePresence>
        </div>
    );
};
