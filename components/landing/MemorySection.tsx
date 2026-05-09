'use client';
import { NeuralCore } from '@/app/(dashboard)/voice/_components/NeuralCore';
import React from 'react';
import { motion } from 'framer-motion';
import { fadeInUp, staggerContainer, scaleIn } from '@/app/lib/animations';

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
    <section id="memory" className="w-full max-w-7xl px-4 py-24 relative overflow-hidden scroll-mt-28">
      {/* Background Decor */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-gradient-to-b from-transparent via-brand-primary/5 to-transparent pointer-events-none"></div>

      <div className="flex flex-col md:flex-row gap-16 items-center relative z-10">

        {/* Visual Side */}
        <div className="w-full md:w-1/2 flex justify-center">
          <motion.div
            variants={scaleIn}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="relative w-80 h-80 md:w-96 md:h-96"
          >
            <NeuralCore state="thinking" />
          </motion.div>
        </div>

        {/* Content Side */}
        <div className="w-full md:w-1/2 flex flex-col gap-8">
          <motion.div
            variants={fadeInUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4 font-display">Structured Memory,<br />Not Just Logs.</h2>
            <p className="text-gray-400 text-lg font-light font-display">Paxio doesn&apos;t just read history. It understands context, builds a profile, and grows with you.</p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 sm:grid-cols-2 gap-4"
          >
            {memoryTypes.map((item, index) => (
              <motion.div
                key={index}
                variants={fadeInUp}
                className="bg-white/5 border border-white/10 p-6 rounded-2xl hover:bg-white/10 transition-colors duration-300"
              >
                <div className="flex items-center gap-3 mb-2">
                  <span className="material-symbols-outlined text-gray-300">{item.icon}</span>
                  <h3 className="font-bold text-white font-display">{item.title}</h3>
                </div>
                <p className="text-sm text-gray-400 font-display">{item.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>

      </div>
    </section >
  );
};

export default MemorySection;
