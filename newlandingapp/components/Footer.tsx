import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="border-t border-[#1a1a1a] bg-black py-12">
      <div className="w-full max-w-7xl mx-auto px-4 md:px-8 flex flex-col md:flex-row justify-between items-center gap-6">
        {/* Brand */}
        <div className="flex items-center gap-2 text-white/50 hover:text-white transition-colors cursor-pointer">
          <span className="material-symbols-outlined text-[20px]">circle</span>
          <span className="text-sm font-medium">Paxio Inc.</span>
        </div>

        {/* Links */}
        <div className="flex gap-8">
          <a href="#" className="text-gray-500 hover:text-white text-sm transition-colors">Privacy Policy</a>
          <a href="#" className="text-gray-500 hover:text-white text-sm transition-colors">Terms of Service</a>
          <a href="#" className="text-gray-500 hover:text-white text-sm transition-colors">Contact</a>
        </div>

        {/* Copyright */}
        <div className="text-gray-600 text-sm">
          &copy; {new Date().getFullYear()} Paxio Inc. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;