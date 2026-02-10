'use client';
import React from 'react';
import { signIn } from "next-auth/react";
import Link from 'next/link';

const Navbar: React.FC = () => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex justify-center pt-6 px-4">
      <nav className="flex items-center justify-between bg-white/5 backdrop-blur-md border border-white/10 rounded-full px-6 py-3 w-full max-w-5xl shadow-2xl">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity">
          <span className="material-symbols-outlined text-white text-[24px]">circle</span>
          <span className="text-xl font-bold tracking-tight font-display">Paxio</span>
        </Link>
        
        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-8">
          <Link href="#memory" className="text-sm font-medium text-gray-300 hover:text-white transition-colors font-display">Memory</Link>
          <Link href="#agents" className="text-sm font-medium text-gray-300 hover:text-white transition-colors font-display">Agents</Link>
          <Link href="#control" className="text-sm font-medium text-gray-300 hover:text-white transition-colors font-display">Control</Link>
        </div>
        
        {/* CTA */}
        <button 
          onClick={() => signIn("google")}
          className="bg-white hover:bg-gray-200 text-black text-sm font-bold px-6 py-2 rounded-full transition-colors duration-300 transform active:scale-95 font-display"
        >
          Get Started
        </button>
      </nav>
    </header>
  );
};

export default Navbar;
