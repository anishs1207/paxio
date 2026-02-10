'use client';
import React, { useState } from 'react';

const ControlSection: React.FC = () => {
    const [autonomyLevel, setAutonomyLevel] = useState(1);

    const levels = [
        { label: "Suggest", desc: "Paxio suggests actions. You confirm everything." },
        { label: "Ask", desc: "Paxio prepares actions. Asks before execution." },
        { label: "Act", desc: "Paxio runs autonomously. Reports back later." },
    ];

    return (
        <section id="control" className="w-full max-w-7xl px-4 py-24 relative">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-16">

                {/* Autonomy Column */}
                <div className="flex flex-col gap-8">
                    <div>
                        <h2 className="text-3xl md:text-5xl font-bold text-white mb-4 font-display">You are always<br />in control.</h2>
                        <p className="text-gray-400 text-lg font-light font-display">Set boundaries for every agent. Decide when Paxio should ask and when it should act.</p>
                    </div>

                    <div className="bg-[#0a0a0a] border border-[#1a1a1a] p-8 rounded-3xl">
                        <h3 className="text-xl font-bold text-white mb-6 font-display">Autonomy Level</h3>
                        
                        {/* Custom Slider UI */}
                        <div className="relative h-2 bg-[#333] rounded-full mb-8">
                            <div 
                                className="absolute top-0 left-0 h-full bg-brand-primary rounded-full transition-all duration-300"
                                style={{ width: `${(autonomyLevel / 2) * 100}%` }}
                            ></div>
                            
                            {/* Knobs */}
                            {[0, 1, 2].map((level) => (
                                <div 
                                    key={level}
                                    onClick={() => setAutonomyLevel(level)}
                                    className={`absolute top-1/2 -translate-y-1/2 w-6 h-6 rounded-full border-2 cursor-pointer transition-all duration-300 ${autonomyLevel >= level ? 'bg-white border-brand-primary' : 'bg-[#1a1a1a] border-[#333]'}`}
                                    style={{ left: `${(level / 2) * 100}%`, transform: `translate(-50%, -50%)` }}
                                ></div>
                            ))}
                        </div>

                        <div className="flex justify-between mb-8">
                            {levels.map((l, i) => (
                                <button 
                                    key={i} 
                                    onClick={() => setAutonomyLevel(i)}
                                    className={`text-sm font-bold uppercase transition-colors ${autonomyLevel === i ? 'text-white' : 'text-gray-600'}`}
                                >
                                    {l.label}
                                </button>
                            ))}
                        </div>

                        <div className="bg-white/5 p-4 rounded-xl border border-white/10 min-h-[80px] flex items-center justify-center text-center">
                            <p className="text-gray-300 italic font-display">"{levels[autonomyLevel].desc}"</p>
                        </div>
                    </div>
                </div>

                {/* Doomscroll Controller Column */}
                <div className="flex flex-col gap-8">
                    <div>
                        <h2 className="text-3xl md:text-5xl font-bold text-white mb-4 font-display">Kill the noise.<br />Keep the signal.</h2>
                        <p className="text-gray-400 text-lg font-light font-display">Paxio's Doomscroll Controller filters rage-bait and summarizes trends so you don't have to scroll.</p>
                    </div>

                    <div className="bg-[#0a0a0a] border border-[#1a1a1a] p-8 rounded-3xl relative overflow-hidden group">
                        
                        {/* Visual representation of filtering */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/5 blur-3xl rounded-full pointer-events-none group-hover:bg-red-500/10 transition-colors"></div>
                        
                        <div className="space-y-4 relative z-10">
                            <div className="flex items-center justify-between bg-white/5 border border-white/5 p-4 rounded-xl">
                                <div className="flex items-center gap-3">
                                    <span className="material-symbols-outlined text-gray-500">block</span>
                                    <span className="text-gray-300 line-through decoration-red-500/50 decoration-2">Politics & Rage Bait</span>
                                </div>
                                <span className="text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded">Filtered</span>
                            </div>

                            <div className="flex items-center justify-between bg-white/5 border border-white/5 p-4 rounded-xl">
                                <div className="flex items-center gap-3">
                                    <span className="material-symbols-outlined text-gray-500">block</span>
                                    <span className="text-gray-300 line-through decoration-red-500/50 decoration-2">Viral "Hacks"</span>
                                </div>
                                <span className="text-xs bg-red-500/20 text-red-400 px-2 py-1 rounded">Filtered</span>
                            </div>

                            <div className="flex items-center justify-between bg-brand-primary/10 border border-brand-primary/20 p-4 rounded-xl shadow-[0_0_15px_rgba(19,19,236,0.1)]">
                                <div className="flex items-center gap-3">
                                    <span className="material-symbols-outlined text-brand-primary">auto_awesome</span>
                                    <span className="text-white font-bold">Tech News Digest</span>
                                </div>
                                <span className="text-xs bg-brand-primary/20 text-brand-primary px-2 py-1 rounded">Delivered</span>
                            </div>
                        </div>

                        <div className="mt-8 pt-8 border-t border-white/5">
                             <p className="text-sm text-center text-gray-500">"Paxio, what happened on X today?"</p>
                        </div>
                    </div>
                </div>

            </div>
        </section>
    );
};

export default ControlSection;
