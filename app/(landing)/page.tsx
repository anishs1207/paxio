import { Hero, Features, AgentsSection, LandingPricing } from "@/components/landing";

export default function Home() {
    return (
        <>
            <Hero />
            <div className="w-full max-w-7xl h-px bg-gradient-to-r from-transparent via-[#333] to-transparent mb-20 opacity-50"></div>
            <Features />
            <div className="w-full max-w-7xl h-px bg-gradient-to-r from-transparent via-[#333] to-transparent mb-12 opacity-50"></div>
            <AgentsSection />
            <LandingPricing />
        </>
    );
}
