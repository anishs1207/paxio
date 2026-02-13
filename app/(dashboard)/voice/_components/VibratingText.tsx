import React from "react";
import { motion, AnimatePresence } from "framer-motion";

interface VibratingTextProps {
    text: string;
    size?: "sm" | "lg";
    isVibrating?: boolean;
}

export const VibratingText: React.FC<VibratingTextProps> = ({
    text,
    size = "lg",
}) => {
    // Split text into characters
    const characters = Array.from(text);

    return (
        <div className="pl-10 pr-10 relative overflow-hidden h-[6.5rem] md:h-[8rem] flex items-center justify-center">
             {/* Key triggers re-render on text change, ensuring immediate replacement */}
            <AnimatePresence mode="popLayout"> 
                <motion.div
                    key={text} 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, filter: "blur(10px)", transition: { duration: 0.2 } }}
                    className={`text-center leading-tight text-zinc-100 ${
                        size === "lg"
                            ? "text-3xl md:text-5xl font-light tracking-tight"
                            : "text-sm font-medium tracking-wide"
                    }`}
                >
                    {characters.map((char, index) => (
                        <motion.span
                            key={index}
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{
                                duration: 0.05,
                                delay: index * 0.02, // 20ms delay per distinct character
                                ease: "easeOut",
                            }}
                        >
                            {char}
                        </motion.span>
                    ))}
                </motion.div>
            </AnimatePresence>
        </div>
    );
};
