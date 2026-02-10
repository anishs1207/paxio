'use client';
import React from 'react';

const MemorySection: React.FC = () => {
  const memoryTypes = [
    {
      title: "User Profile",
      description: "Learns your preferences, habits, and tone over time.",
      icon: "person"
    },
    {
      title: "Long-term Facts",
      description: "Stores critical information like \"user is a developer\" or \"prefers dark mode\".",
      icon: "history"
    },
    {
      title: "Contextual Memory",
      description: "Keeps track of ongoing projects and goals for seamless continuity.",
      icon: "bookmark"
    },
    {
      title: "Ephemeral Memory",
      description: "Manages short-term session data for fluid conversation.",
      icon: "bolt"
    }
  ];

  return (
    <section id="memory" className="w-full max-w-7xl px-4 py-24 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-gradient-to-b from-transparent via-brand-primary/5 to-transparent pointer-events-none"></div>

      <div className="flex flex-col md:flex-row gap-16 items-center relative z-10">
        
        {/* Visual Side */}
        <div className="w-full md:w-1/2 flex justify-center">
          <div className="relative w-80 h-80 md:w-96 md:h-96">
             {/* Central Core */}
            <div className="absolute inset-0 m-auto w-48 h-48 bg-black border border-[#333] rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(19,19,236,0.3)] z-20">
               <span className="material-symbols-outlined text-6xl text-white">psychology</span>
            </div>
            
            {/* Orbiting Nodes (Static for now, could be animated) */}
             <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full border border-white/5 rounded-full animate-[spin_20s_linear_infinite]"></div>
             <div className="absolute top-12 left-12 w-4 h-4 bg-white/20 rounded-full shadow-[0_0_10px_rgba(255,255,255,0.5)]"></div>
             <div className="absolute bottom-12 right-12 w-6 h-6 bg-brand-primary/40 rounded-full shadow-[0_0_15px_rgba(19,19,236,0.5)]"></div>
             
             <div className="absolute inset-4 border border-white/5 rounded-full animate-[spin_15s_linear_infinite_reverse]"></div>
          </div>
        </div>

        {/* Content Side */}
        <div className="w-full md:w-1/2 flex flex-col gap-8">
          <div>
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4 font-display">Structured Memory,<br/>Not Just Logs.</h2>
            <p className="text-gray-400 text-lg font-light font-display">Paxio doesn't just read history. It understands context, builds a profile, and grows with you.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {memoryTypes.map((item, index) => (
              <div key={index} className="bg-white/5 border border-white/10 p-6 rounded-2xl hover:bg-white/10 transition-colors duration-300">
                <div className="flex items-center gap-3 mb-2">
                  <span className="material-symbols-outlined text-gray-300">{item.icon}</span>
                  <h3 className="font-bold text-white font-display">{item.title}</h3>
                </div>
                <p className="text-sm text-gray-400 font-display">{item.description}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
};

export default MemorySection;
