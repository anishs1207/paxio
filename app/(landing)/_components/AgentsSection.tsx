'use client';
import React from 'react';

const AgentsSection: React.FC = () => {
   const capabilities = [
      {
         category: "App Management",
         title: "Search on Reddit",
         description: "Search Reddit intelligently and understand what people really think. Paxio analyzes discussions across subreddits and summarizes overall sentiment.",
         items: [
            "Search & auto-discover relevant subreddits",
            "Analyze sentiment across multiple subreddits",
            "Search sentiment within a specific subreddit",
            "Get concise summaries of opinions, trends, and pain points"
         ],
         color: "bg-red-500"
      },
      {
         category: "Research",
         title: "Research & Doom Scrolling",
         description: "Searches across Google and Reddit today to surface real opinions, discussions, and insights — with sentiment analysis from LinkedIn, Twitter (X), YouTube Shorts, and Instagram coming soon...",
         items: [
            "Search Google and Reddit discussions",
            "Summarize long threads and debates",
            "Extract real user opinions and reviews",
            "Track sentiment across social platforms (coming soon)"
         ],
         color: "bg-orange-500" // Reddit-inspired
      }
      ,
      {
         category: "Shopping",
         title: "Smart Shopping",
         description: "Compares similar products on Zepto based on price, delivery time, quantity, and value to help you choose the best option before buying. More coming soon...",
         items: [
            "Compare prices across similar products",
            "Check delivery time and availability",
            "Analyze quantity vs price (best value)",
            "Recommend the smartest pick"
         ],
         color: "bg-yellow-500" // Zepto-inspired
      }

   ];

   return (
      <section id="agents" className="w-full max-w-7xl px-4 py-24 mb-0 pb-0  relative scroll-mt-28">
         <div className="flex flex-col md:flex-row-reverse gap-16 items-start">

            {/* Visual Side (Abstract Interface) */}
            <div className="w-full md:w-1/2">
               <div className="relative rounded-3xl bg-[#0a0a0a] border border-[#1a1a1a] p-8 h-[520px] overflow-hidden shadow-2xl">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-400 via-pink-500 to-purple-500" />

                  {/* Vision Terminal */}
                  <div className="font-mono text-sm space-y-5 text-white/90">

                     <div className="flex items-center gap-2 text-orange-400">
                        <span>VisionOfPaxio()</span>
                     </div>

                     <div className="pl-4 border-l border-white/10 space-y-3">
                        <p className="text-gray-400">{">"} What are people *actually* saying about oat milk on Reddit?</p>
                        <p className="text-white/80">
                           Not reviews. Not ads. Just patterns.
                        </p>
                     </div>

                     <div className="pl-4 border-l border-white/10 space-y-3">
                        <p className="text-gray-400">{">"} Why does everyone on Zepto buy Brand A at night but Brand B in the morning?</p>
                        <p className="text-white/80">
                           Price, delivery time, habit — or something deeper?
                        </p>
                     </div>

                     <div className="pl-4 border-l border-white/10 space-y-3">
                        <p className="text-gray-400">{">"} This product is trending on Instagram… but Reddit hates it.</p>
                        <p className="text-white/80">
                           Is hype diverging from trust?
                        </p>
                     </div>

                     <div className="pl-4 border-l border-white/10 space-y-3">
                        <p className="text-gray-400">{">"} Everyone says “best value” — but what does that mean *for me*?</p>
                        <p className="text-white/80">
                           Time saved, money saved, regret avoided.
                        </p>
                     </div>
                     <div className="pl-4 border-l border-white/10 space-y-3">
                        <p className="text-gray-400">
                           {">"} Paxio, doom-scroll YouTube Shorts and Instagram for me.
                        </p>
                        <p className="text-white/80">
                           Extract trends, recurring narratives, and early signals I can act on.
                        </p>
                        <p className="text-green-400">
                           Output: patterns, momentum shifts, and opportunities — not content.
                        </p>
                     </div>

                  </div>

                  {/* Bottom Gradient */}
                  {/* <div className="absolute bottom-0 left-0 w-full h-36 bg-gradient-to-t from-[#0a0a0a] to-transparent" /> */}
               </div>
            </div>


            {/* Content Side */}
            <div className="w-full md:w-1/2 flex flex-col gap-10">
               <div>
                  <h2 className="text-3xl md:text-5xl font-bold text-white mb-4 font-display">Agents that work<br />not just help you.</h2>
                  <p className="text-gray-400 text-lg font-light font-display">From managing your schedule to buying groceries, to seeing whats trending on social media</p>
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
