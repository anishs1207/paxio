// server component by default

import Hero from './_components/Hero';
import Features from './_components/Features';
import InterfacePreview from './_components/InterfacePreview';

export default function Home() {
    return (
        <>
            <Hero />
            
            {/* Divider */}
            <div className="w-full max-w-7xl h-px bg-gradient-to-r from-transparent via-[#333] to-transparent mb-24 opacity-50"></div>
            
            <Features />
            
            <InterfacePreview />
        </>
    );
}
