"use client";

import PaymentCards from "./_components/PaymentCards";
import { ArrowLeft, LayoutDashboard } from "lucide-react";
import Link from "next/link";

export default function PricingPage() {
    return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center px-4 py-8">
            {/* Navigation Buttons */}
            <div className="w-full max-w-6xl mb-8 flex items-center justify-between gap-4">
                <Link
                    href="/"
                    className="flex items-center gap-2 text-zinc-400 hover:text-white transition text-sm"
                >
                    <ArrowLeft size={16} />
                    <span>Back to Home</span>
                </Link>
                <Link
                    href="/voice"
                    className="flex items-center gap-2 px-4 py-2 rounded-full 
                        bg-zinc-900 border border-zinc-800 text-zinc-300 
                        hover:text-white hover:border-zinc-600 transition text-sm"
                >
                    <LayoutDashboard size={16} />
                    <span>Dashboard</span>
                </Link>
            </div>

            {/* Page Title */}
            <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-white mb-2">Get Credits</h1>
                <p className="text-zinc-400">Power your AI assistant</p>
            </div>

            <PaymentCards />

            {/* Bottom Help Text */}
            <p className="mt-8 text-sm text-zinc-500 text-center">
                Need help? Contact us at{" "}
                <a href="mailto:paxioai@gmail.com" className="text-zinc-400 hover:text-white underline">
                    paxioai@gmail.com
                </a>
            </p>
        </div>
    );
}


