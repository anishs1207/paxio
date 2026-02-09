
import React from 'react';
import { motion } from 'framer-motion';

interface NeuralCoreProps {
    state: 'idle' | 'listening' | 'thinking' | 'speaking';
}

export const NeuralCore: React.FC<NeuralCoreProps> = ({ state }) => {
    const getGlowColor = () => {
        switch (state) {
            case 'listening': return 'rgba(255, 255, 255, 0.5)';
            case 'thinking': return 'rgba(120, 120, 120, 0.4)';
            case 'speaking': return 'rgba(255, 255, 255, 0.7)';
            default: return 'rgba(63, 63, 70, 0.15)';
        }
    };

    return (
        <div className="relative w-64 h-64 flex items-center justify-center">
            {/* Dynamic Background Aura */}
            <motion.div
                animate={{
                    scale: state !== 'idle' ? [1, 1.3, 1] : 1,
                    opacity: state !== 'idle' ? [0.4, 0.6, 0.4] : 0.1,
                }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute inset-0 rounded-full blur-[80px]"
                style={{ backgroundColor: getGlowColor() }}
            />

            {/* Orbiting Ring */}
            <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 border border-zinc-900 rounded-full"
            />

            {/* Main Core Body */}
            <motion.div
                animate={
                    state === 'listening' ? {
                        scale: [1, 1.05, 1],
                        boxShadow: ["0 0 20px rgba(255,255,255,0.1)", "0 0 40px rgba(255,255,255,0.3)", "0 0 20px rgba(255,255,255,0.1)"]
                    } :
                        state === 'thinking' ? {
                            scale: [1, 0.95, 1],
                            opacity: [1, 0.7, 1]
                        } :
                            state === 'speaking' ? {
                                scale: [1, 1.15, 1],
                                borderRadius: ["50%", "48%", "52%", "50%"]
                            } :
                                { scale: 1 }
                }
                transition={{
                    duration: state === 'thinking' ? 1 : 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
                className="relative w-36 h-36 bg-gradient-to-tr from-zinc-200 via-zinc-400 to-zinc-500 rounded-full shadow-[0_0_60px_rgba(255,255,255,0.15)] overflow-hidden"
            >
                {/* Animated Inner Shine */}
                <motion.div
                    animate={{
                        x: ["-100%", "100%"],
                        opacity: [0, 0.5, 0]
                    }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-12"
                />

                {/* Pulsing Core Center */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <motion.div
                        animate={{ scale: state !== 'idle' ? [1, 1.2, 1] : 1 }}
                        transition={{ duration: 0.5, repeat: Infinity }}
                        className="w-16 h-16 rounded-full bg-white/10 blur-xl"
                    />
                </div>
            </motion.div>

            {/* Elegant Orbital Particles */}
            {[...Array(2)].map((_, i) => (
                <motion.div
                    key={i}
                    animate={{ rotate: i === 0 ? 360 : -360 }}
                    transition={{ duration: 15 + i * 5, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 flex items-center justify-center"
                >
                    <div className="w-[180px] h-[180px] border border-zinc-800/30 rounded-full" />
                    <motion.div
                        className="absolute top-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-zinc-500 shadow-[0_0_10px_white]"
                        animate={state !== 'idle' ? { scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] } : {}}
                        transition={{ duration: 1, repeat: Infinity }}
                    />
                </motion.div>
            ))}
        </div>
    );
};
