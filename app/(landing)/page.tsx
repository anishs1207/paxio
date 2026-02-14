// server component by default

import Hero from './_components/Hero';
import Features from './_components/Features';
import MemorySection from './_components/MemorySection';
import AgentsSection from './_components/AgentsSection';
import InterfacePreview from './_components/InterfacePreview';

import LandingPricing from './_components/LandingPricing';

export default function Home() {
    return (
        <>
            <Hero />

            {/* Divider */}
            <div className="w-full max-w-7xl h-px bg-gradient-to-r from-transparent via-[#333] to-transparent mb-20 opacity-50"></div>

            <Features />

            {/* Divider */}
            <div className="w-full max-w-7xl h-px bg-gradient-to-r from-transparent via-[#333] to-transparent mb-12 opacity-50"></div>
            <AgentsSection />

            <LandingPricing />

        </>
    );
}
