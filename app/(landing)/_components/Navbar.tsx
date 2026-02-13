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
        <div className="hidden md:flex items-center gap-8">
          <Link href="#features" className="text-sm font-medium text-gray-300 hover:text-white transition-colors font-display">Features</Link>
          <Link href="#agents" className="text-sm font-medium text-gray-300 hover:text-white transition-colors font-display">Agents</Link>
          <Link href="#pricing" className="text-sm font-medium text-gray-300 hover:text-white transition-colors font-display">Pricing</Link>
        </div>

        {/* CTA */}
        <div className='flex flex-row gap-2'>

          {/* <button
            onClick={() => {
              const text = "I want paxio.tech to have <feedback> @codewithrobu @anishs1207";
              const encodedText = encodeURIComponent(text);
              window.open(`https://twitter.com/intent/tweet?text=${encodedText}`, "_blank")
            }}
            className="cursor-pointer border border-zinc-700 px-4 py-2 rounded-xl text-sm font-medium text-zinc-200 hover:bg-zinc-900 transition flex items-center gap-2"
          >
            <FaXTwitter className="text-lg" />
            Share on X
          </button> */}
          <Link
            href="/signup"
            className="cursor-pointer bg-white text-black px-4 py-2 rounded-xl text-sm font-medium hover:bg-zinc-200 transition flex items-center gap-2"
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
