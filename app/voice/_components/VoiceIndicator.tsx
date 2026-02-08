
import React from 'react';
import { motion } from 'framer-motion';

interface VoiceIndicatorProps {
    state: 'idle' | 'listening' | 'thinking' | 'speaking';
}

export const VoiceIndicator: React.FC<VoiceIndicatorProps> = ({ state }) => {
    return (
        <div className="relative flex items-center justify-center h-32 w-full">
            {/* Outer Pulse Rings */}
            {state !== 'idle' && (
                <>
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: [0.8, 1.5], opacity: [0.3, 0] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
                        className="absolute w-24 h-24 rounded-full bg-zinc-800"
                    />
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: [0.8, 2], opacity: [0.2, 0] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeOut", delay: 1 }}
                        className="absolute w-24 h-24 rounded-full bg-zinc-800"
                    />
                </>
            )}

            {/* Main Visualizer Bars */}
            <div className="flex items-center gap-1.5 h-12">
                {[...Array(9)].map((_, i) => (
                    <motion.div
                        key={i}
                        animate={
                            state === 'listening' ? { height: [12, 40, 12] } :
                                state === 'thinking' ? { height: [20, 24, 20], opacity: [0.5, 1, 0.5] } :
                                    state === 'speaking' ? { height: [12, 48, 12] } :
                                        { height: 4 }
                        }
                        transition={{
                            duration: state === 'thinking' ? 0.8 : 0.5,
                            repeat: Infinity,
                            delay: i * 0.1,
                            ease: "easeInOut"
                        }}
                        className={`w-1 rounded-full ${state === 'idle' ? 'bg-zinc-700' : 'bg-zinc-200'}`}
                    />
                ))}
            </div>
        </div>
    );
};
