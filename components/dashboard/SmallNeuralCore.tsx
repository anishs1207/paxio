"use client";

import React from "react";
import { motion } from "framer-motion";

interface NeuralCoreProps {
    state: "idle" | "listening" | "thinking" | "speaking";
}

const SmallNeuralCore: React.FC<NeuralCoreProps> = ({ state }) => {
    const getGlowColor = () => {
        switch (state) {
            case "listening":
                return "rgba(255, 255, 255, 0.35)";
            case "thinking":
                return "rgba(120, 120, 120, 0.25)";
            case "speaking":
                return "rgba(255, 255, 255, 0.45)";
            default:
                return "rgba(63, 63, 70, 0.08)";
        }
    };

    return (
        <div className="relative w-28 h-28 flex items-center justify-center">
            {/* Soft Aura */}
            <motion.div
                animate={{
                    scale: state !== "idle" ? [1, 1.1, 1] : 1,
                    opacity: state !== "idle" ? [0.2, 0.32, 0.2] : 0.06,
                }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute inset-0 rounded-full blur-[36px]"
                style={{ backgroundColor: getGlowColor() }}
            />

            {/* Rotating Ring */}
            <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 32, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 rounded-full border border-zinc-800/40"
            />

            {/* Core Sphere */}
            <motion.div
                animate={
                    state === "listening"
                        ? { scale: [1, 1.03, 1] }
                        : state === "thinking"
                            ? { scale: [1, 0.97, 1], opacity: [1, 0.8, 1] }
                            : state === "speaking"
                                ? { scale: [1, 1.08, 1] }
                                : { scale: 1 }
                }
                transition={{
                    duration: state === "thinking" ? 1 : 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                }}
                className="
                    relative
                    w-16 h-16
                    rounded-full
                    bg-gradient-to-tr
                    from-zinc-200 via-zinc-400 to-zinc-500
                    shadow-[0_0_18px_rgba(255,255,255,0.12)]
                    overflow-hidden
                "
            >
                {/* Inner Shine */}
                <motion.div
                    animate={{ x: ["-100%", "100%"], opacity: [0, 0.25, 0] }}
                    transition={{ duration: 3.5, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12"
                />

                {/* Core Pulse */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <motion.div
                        animate={{ scale: state !== "idle" ? [1, 1.12, 1] : 1 }}
                        transition={{ duration: 0.8, repeat: Infinity }}
                        className="w-6 h-6 rounded-full bg-white/10 blur-md"
                    />
                </div>
            </motion.div>

            {/* Orbiting Particles */}
            {[0, 1].map((i) => (
                <motion.div
                    key={i}
                    animate={{ rotate: i === 0 ? 360 : -360 }}
                    transition={{
                        duration: 22 + i * 6,
                        repeat: Infinity,
                        ease: "linear",
                    }}
                    className="absolute inset-0 flex items-center justify-center"
                >
                    <div className="w-[90px] h-[90px] rounded-full border border-zinc-800/25" />
                    <motion.div
                        className="
                            absolute top-0 left-1/2 -translate-x-1/2
                            w-[3px] h-[3px] rounded-full
                            bg-zinc-400
                        "
                        animate={
                            state !== "idle"
                                ? { opacity: [0.3, 0.8, 0.3] }
                                : {}
                        }
                        transition={{ duration: 1.4, repeat: Infinity }}
                    />
                </motion.div>
            ))}
        </div>
    );
};

export default SmallNeuralCore;
