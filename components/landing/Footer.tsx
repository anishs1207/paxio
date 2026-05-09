'use client';
import React from 'react';
import Link from 'next/link';

const Footer: React.FC = () => {
  return (
    <footer className="mt-0 border-t border-[#1a1a1a] bg-black py-12">
      <div className="w-full max-w-7xl mx-auto px-4 md:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2 text-white/50 hover:text-white transition-colors cursor-pointer">
          {/* <span className="material-symbols-outlined text-[20px]">circle</span> */}
          <span className="text-sm font-medium font-display">Paxio</span>
        </Link>

        {/* Links */}
        <div className="flex flex-col md:flex-row items-center gap-8">
          <div className="flex gap-8">
            <Link href="/public-privacy-policy" className="text-gray-500 hover:text-white text-sm transition-colors font-display">Privacy Policy</Link>
            <Link href="/terms-of-service" className="text-gray-500 hover:text-white text-sm transition-colors font-display">Terms of Service</Link>
          </div>
          <div className="flex gap-4">
            <a href="https://x.com/codewithrobu" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-white text-sm transition-colors font-display">@codewithrobu</a>
            <a href="https://x.com/anishs1207" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-white text-sm transition-colors font-display">@anishs1207</a>
          </div>
        </div>

        {/* Copyright */}
        <div className="text-gray-600 text-sm font-display">
          &copy; {new Date().getFullYear()} Paxio. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
