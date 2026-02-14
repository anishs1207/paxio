'use client';
import React from 'react';
import { motion } from 'framer-motion';
import { fadeInUp, scaleIn } from '@/app/lib/animations';
import { signIn } from "next-auth/react";
import Link from 'next/link';

const Hero: React.FC = () => {
  return (
    <section className="w-full max-w-6xl flex flex-col items-center text-center gap-8 relative mb-32">
      {/* Background Glow Effect */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-orb-glow pointer-events-none z-0"></div>

      {/* 3D Orb Representation */}
      <motion.div
        variants={scaleIn}
        initial="hidden"
        animate="visible"
        className="relative z-10 w-64 h-64 md:w-80 md:h-80 rounded-full animate-float mb-8"
      >
        <div
          aria-label="Hyper-realistic 3D metallic silver orb floating in darkness"
          className="w-full h-full rounded-full shadow-[0_0_50px_rgba(255,255,255,0.1)] bg-orb-surface relative overflow-hidden"
          role="img"
        >
          {/* Reflections */}
          <div className="absolute top-10 left-10 w-20 h-10 bg-white/20 blur-xl rounded-full transform -rotate-45"></div>
          <div className="absolute bottom-10 right-10 w-32 h-32 bg-brand-primary/10 blur-2xl rounded-full"></div>
        </div>
      </motion.div>

      {/* Hero Text */}
      <motion.div
        variants={fadeInUp}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.2 }}
        className="relative z-20 flex flex-col gap-6 max-w-3xl"
      >
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.1] bg-clip-text text-transparent bg-gradient-to-b from-white to-gray-500 font-display">
          AI that works<br />with you.
        </h1>
        <p className="text-lg md:text-xl text-gray-400 font-light max-w-xl mx-auto leading-relaxed font-display">
          Paxio. Your Voice First Assistant.
        </p>
      </motion.div>

      {/* Primary CTA */}
      <motion.div
        variants={fadeInUp}
        initial="hidden"
        animate="visible"
        transition={{ delay: 0.4 }}
        className="relative z-20 mt-4 flex flex-col items-center"
      >
        <Link
          href="/signup"
          className="cursor-pointer group relative flex items-center justify-center gap-3 bg-white text-black font-bold text-base md:text-lg px-8 py-4 rounded-full transition-all duration-500 shadow-[0_0_20px_rgba(255,255,255,0.3)] font-display"
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.05)';
            e.currentTarget.style.boxShadow = '0 0 40px rgba(255,255,255,0.6)';
            e.currentTarget.style.backgroundColor = 'rgb(243, 244, 246)'; // hover:bg-gray-100
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = '0 0 20px rgba(255,255,255,0.3)';
            e.currentTarget.style.backgroundColor = 'white';
          }}
        >
          <motion.span whileHover={{ x: 5 }} transition={{ type: "spring", stiffness: 400, damping: 10 }}>Try Paxio for Free</motion.span>
          <span className="material-symbols-outlined text-[20px] group-hover:translate-x-1 transition-transform duration-300">arrow_forward</span>
        </Link>


      </motion.div>
    </section>
  );
};

export default Hero;
