'use client';
import React from 'react';
import { motion } from 'framer-motion';
import { fadeInUp, staggerContainer, fadeIn } from '@/app/lib/animations';

const TypewriterText = ({ text, delay }: { text: string; delay: number }) => {
   const letters = Array.from(text);
 
   const container = {
     hidden: { opacity: 0 },
      visible: (i = 1) => ({
        opacity: 1,
        transition: { staggerChildren: 0.01, delayChildren: delay } // Direct delay in seconds
      })
    };
 
   const child = {
     visible: {
       opacity: 1,
       transition: {
        duration: 0
       }
     },
     hidden: {
       opacity: 0,
       transition: {
        duration: 0
       }
     }
   };
 
   return (
     <motion.span
       style={{ display: "inline-block" }} // Allows wrapping but keeps inline flow
       variants={container}
       initial="hidden"
       whileInView="visible"
       viewport={{ once: true }}
     >
       {letters.map((letter, index) => (
         <motion.span variants={child} key={index}>
           {letter === " " ? "\u00A0" : letter}
         </motion.span>
       ))}
     </motion.span>
   );
 };
 
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

                  <div className="font-mono text-xs md:text-sm space-y-3 text-white/90 font-light overflow-y-auto no-scrollbar pb-4">
                     {/* Data-driven Terminal Content */}
                     {[
                        { text: "Initializing Paxio Cortex v2.4.0 ...", delay: 0.2, color: "text-gray-500" },
                        { text: "Loading generic agent modules ... [OK]", delay: 0.8, color: "text-gray-500" },
                        { text: "Connecting to Neural Fabric ... [ESTABLISHED]", delay: 1.4, color: "text-emerald-500/80" },
                        
                        { spacer: true },
                        { text: "VisionOfPaxio() > SYSTEM_READY", delay: 2.2, color: "text-orange-400 font-bold" },
                        
                        { spacer: true },
                        { text: "> QUERY: 'Analyze recent discussions on Oat Milk'", delay: 3.5, color: "text-white" },
                        { text: "  ⠶ Scanning r/coffee, r/vegan, r/barista (842 threads)...", delay: 4.8, color: "text-gray-400" },
                        { text: "  ✓ Sentiment Analysis: Positive (Oatly: 45%, Califia: 30%)", delay: 6.0, color: "text-blue-300" },
                        { text: "  ⚠ Insight: 'Barista edition worth extra cost for texture'", delay: 7.2, color: "text-yellow-200/80" },
                        
                        { spacer: true },
                        { text: "> QUERY: 'Find best price for Otaly Barista Edition'", delay: 9.0, color: "text-white" },
                        { text: "  ⠶ Querying Zepto, Blinkit, Instamart real-time APIs...", delay: 10.2, color: "text-gray-400" },
                        { text: "  ✓ Found Deal: Zepto (₹285) vs Blinkit (₹310). Saving 8%.", delay: 11.5, color: "text-emerald-400" },
                        { text: "  ➜ Action: Added to cart. Awaiting confirmation.", delay: 12.8, color: "text-white/60" },

                        { spacer: true },
                        { text: "> QUERY: 'Catch me up on Tech Twitter today'", delay: 14.5, color: "text-white" },
                        { text: "  oslash Filtered 142 'rage-bait' & political posts.", delay: 15.8, color: "text-red-400/80" },
                        { text: "  ✓ Extracted Signal: 3 major launches in AI Agents space.", delay: 17.0, color: "text-purple-300" },
                        { text: "  ✓ Summary prepared. Reading time: 45 seconds.", delay: 18.2, color: "text-white/80" },

                        { spacer: true },
                        { text: "System awaiting next command ...", delay: 20.0, color: "text-gray-600 animate-pulse" },
                     ].map((line, i) => (
                        line.spacer ? <div key={i} className="h-2" /> :
                        <div key={i} className={`${line.color} flex items-start gap-2`}>
                           <TypewriterText text={line.text || ""} delay={line.delay || 0} />
                        </div>
                     ))}
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
