'use client';
import Link from 'next/link';
import { FcGoogle } from "react-icons/fc";
// import { FaTwitter } from "react-icons/fa";
import { FaXTwitter } from 'react-icons/fa6';

const Navbar: React.FC = () => {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex justify-center pt-6 px-4">
      <nav className="flex items-center justify-between bg-white/5 backdrop-blur-md border border-white/10 rounded-full px-6 py-3 w-full max-w-5xl shadow-2xl">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
        >
          <span className="text-xl font-bold tracking-tight font-display">
            Paxio
          </span>

          <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full 
                   bg-white/10 text-white/70 border border-white/20">
            Beta
          </span>
        </Link>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-2">
          {["Features", "Agents", "Pricing"].map((item) => (
            <Link
              key={item}
              href={`#${item.toLowerCase()}`}
              className="px-4 py-2 text-sm font-medium text-gray-300 transition-all duration-300 rounded-lg font-display"
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                e.currentTarget.style.color = 'white';
                e.currentTarget.style.borderRadius = '16px'; // rounded-2xl
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = 'rgb(209, 213, 219)'; // text-gray-300
                e.currentTarget.style.borderRadius = '8px'; // rounded-lg
              }}
            >
              {item}
            </Link>
          ))}
        </div>

        {/* CTA */}
        <div className='flex flex-row gap-2'>
          <Link
            href="/signup"
            className="cursor-pointer bg-white text-black px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 flex items-center gap-2"
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.05)';
              e.currentTarget.style.boxShadow = '0 0 20px rgba(255,255,255,0.3)';
              e.currentTarget.style.backgroundColor = 'rgb(243, 244, 246)'; // hover:bg-gray-100
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.backgroundColor = 'white';
            }}
          >
            {/* <FcGoogle className=" text-lg" /> */}
            Sign Up
          </Link>
        </div>

      </nav>
    </header>
  );
};

export default Navbar;
