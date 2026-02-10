'use client';
import React from 'react';

const AgentsSection: React.FC = () => {
  const capabilities = [
    {
      category: "App Management",
      title: "Your Apps, Unified.",
      description: "Paxio integrates with Notion, Gmail, and Calendar to organize your life.",
      items: ["Draft emails via voice", "Update Notion pages", "Reschedule meetings"],
      color: "bg-red-500" // Representative color (Gmail-ish)
    },
    {
      category: "Research",
      title: "Deep Dive Agent",
      description: "Scours the web, including Reddit and niche forums, to find real answers.",
      items: ["Summarize threads", "Find product reviews", "Fact-check claims"],
      color: "bg-orange-500" // Representative color (Reddit-ish)
    },
    {
      category: "Shopping",
      title: "Smart Commerce",
      description: "Compares prices on Blinkit & Zepto. Orders your essentials automatically.",
      items: ["Compare prices", "Auto-reorder", "Find best deals"],
      color: "bg-yellow-500" // Representative color (Blinkit-ish)
    }
  ];

  return (
    <section id="agents" className="w-full max-w-7xl px-4 py-24 mb-24 relative">
       <div className="flex flex-col md:flex-row-reverse gap-16 items-start">
        
        {/* Visual Side (Abstract Interface) */}
        <div className="w-full md:w-1/2">
           <div className="relative rounded-3xl bg-[#0a0a0a] border border-[#1a1a1a] p-8 h-[500px] overflow-hidden shadow-2xl">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>
              
              {/* Mock Terminal / Agent Output */}
              <div className="font-mono text-sm space-y-4">
                 <div className="flex items-center gap-2 text-green-400">
                    <span className="material-symbols-outlined text-sm">terminal</span>
                    <span>agent_core initialized</span>
                 </div>
                 
                 <div className="pl-4 border-l border-white/10 space-y-2">
                    <p className="text-gray-400">{">"} Checking calendar for conflicts...</p>
                    <p className="text-white">Found clean slot: Tuesday 2 PM.</p>
                 </div>

                 <div className="pl-4 border-l border-white/10 space-y-2 pt-4">
                    <p className="text-gray-400">{">"} Searching Reddit for 'best mechanical keyboards under $100'...</p>
                    <p className="text-white">Top result: Keychron V1 (Mentioned 45 times)</p>
                 </div>

                 <div className="pl-4 border-l border-white/10 space-y-2 pt-4">
                    <p className="text-gray-400">{">"} Comparing milk prices (Blinkit vs Zepto)...</p>
                    <p className="text-green-400">Zepto is ₹2 cheaper. Order placed.</p>
                 </div>
              </div>

              {/* Gradient Overlay at bottom */}
              <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-[#0a0a0a] to-transparent"></div>
           </div>
        </div>

        {/* Content Side */}
        <div className="w-full md:w-1/2 flex flex-col gap-10">
          <div>
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4 font-display">Agents that actually<br/>do the work.</h2>
            <p className="text-gray-400 text-lg font-light font-display">From managing your schedule to buying groceries, Paxio's agents act on your behalf.</p>
          </div>

          <div className="space-y-8">
            {capabilities.map((cap, index) => (
              <div key={index} className="group cursor-default">
                 <div className="flex items-center gap-4 mb-2">
                    <div className={`w-2 h-8 rounded-full ${cap.color} opacity-50 group-hover:opacity-100 transition-opacity`}></div>
                    <h3 className="text-2xl font-bold text-white font-display group-hover:text-gray-200 transition-colors">{cap.title}</h3>
                 </div>
                 <p className="text-gray-400 mb-3 pl-6 font-display">{cap.description}</p>
                 <ul className="pl-6 flex gap-3 flex-wrap">
                    {cap.items.map((item, i) => (
                       <li key={i} className="text-xs font-mono bg-white/5 px-2 py-1 rounded text-gray-500 border border-white/5">{item}</li>
                    ))}
                 </ul>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
};

export default AgentsSection;
