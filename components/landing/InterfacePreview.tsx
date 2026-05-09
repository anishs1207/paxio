'use client';
import React from 'react';
import { motion } from 'framer-motion';
import { scaleIn } from '@/app/lib/animations';

const InterfacePreview: React.FC = () => {
  return (
    <section className="w-full max-w-7xl px-4 mb-32">
      <div className="rounded-[2.5rem] bg-[#080808] border border-[#151515] p-2 md:p-4 overflow-hidden relative shadow-2xl">
        {/* Glow effect at top */}
        <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-brand-primary/5 to-transparent pointer-events-none"></div>

        {/* Inner container */}
        <div className="rounded-[2rem] bg-black border border-[#222] overflow-hidden relative h-[400px] md:h-[600px] flex items-center justify-center">

          {/* Background Abstract Image */}
          <div
            className="absolute inset-0 bg-cover bg-center opacity-30 mix-blend-screen"
            style={{
              backgroundImage: "url('https://images.unsplash.com/photo-1639322537228-f710d846310a?q=80&w=2532&auto=format&fit=crop')"
            }}
            aria-hidden="true"
          ></div>

          {/* Floating UI Element / Modal */}
          <motion.div
            variants={scaleIn}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="relative z-10 bg-black/60 backdrop-blur-xl border border-white/10 p-8 rounded-3xl max-w-md w-full mx-4 shadow-2xl animate-[float_8s_ease-in-out_infinite_1s]"
          >
            {/* Header of Modal */}
            <div className="flex items-center gap-4 mb-6">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-gray-200 to-gray-500 flex items-center justify-center text-black shadow-lg">
                <span className="material-symbols-outlined">smart_toy</span>
              </div>
              <div className="flex flex-col gap-1">
                <div className="h-2 w-24 bg-gray-700 rounded-full animate-pulse"></div>
                <div className="h-2 w-16 bg-gray-800 rounded-full"></div>
              </div>
            </div>

            {/* Content Lines */}
            <div className="space-y-3 mb-8">
              <div className="h-2 w-full bg-gray-800 rounded-full"></div>
              <div className="h-2 w-5/6 bg-gray-800 rounded-full"></div>
              <div className="h-2 w-4/6 bg-gray-800 rounded-full"></div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button className="flex-1 bg-white text-black text-xs font-bold py-3 rounded-xl hover:bg-gray-200 transition active:scale-95 duration-150 font-display">
                Execute
              </button>
              <button className="flex-1 bg-[#1a1a1a] text-white text-xs font-bold py-3 rounded-xl border border-white/5 hover:bg-[#2a2a2a] transition active:scale-95 duration-150 font-display">
                Refine
              </button>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
};

export default InterfacePreview;
