"use client";

import PayButton from "@/components/home/PayButton";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, ArrowLeft, LayoutDashboard } from "lucide-react";
import Link from "next/link";

export default function PricingPage() {
    return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center px-4 py-8">
            {/* Navigation Buttons */}
            <div className="w-full max-w-sm mb-8 flex items-center justify-between gap-4">
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

            {/* Single Card - Centered */}
            <Card
                className="
                    w-full max-w-sm
                    bg-gradient-to-b from-zinc-900 to-zinc-950
                    border border-white/10
                    text-white
                    shadow-[0_20px_60px_-20px_rgba(0,0,0,0.8)]
                "
            >
                <CardHeader className="text-center space-y-3">
                    <Badge
                        variant="outline"
                        className="
                            mx-auto w-fit
                            border-zinc-700
                            bg-zinc-800/60
                            text-zinc-300
                        "
                    >
                        Paxio Beta
                    </Badge>

                    <CardTitle className="text-2xl font-semibold tracking-tight">
                        Credits Booster
                    </CardTitle>

                    <CardDescription className="text-zinc-400">
                        Everything you need to get started
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-8">
                    {/* Price */}
                    <div className="text-center">
                        <div className="flex items-end justify-center gap-1">
                            <span className="text-5xl font-bold tracking-tight">₹10</span>
                            <span className="pb-1 text-zinc-400 text-sm">one-time</span>
                        </div>
                    </div>

                    {/* Divider */}
                    <div className="h-px w-full bg-white/10" />

                    {/* Features */}
                    <ul className="space-y-3 text-sm text-zinc-300">
                        {[
                            "1000 credits",
                            "Priority email support",
                            "One time payment",
                        ].map((feature) => (
                            <li key={feature} className="flex items-center gap-3">
                                <Check className="h-4 w-4 text-zinc-400" />
                                <span>{feature}</span>
                            </li>
                        ))}
                    </ul>

                    {/* CTA */}
                    <div className="pt-2">
                        <PayButton />
                    </div>
                </CardContent>
            </Card>

            {/* Bottom Help Text */}
            <p className="mt-8 text-sm text-zinc-500 text-center">
                Need help? Contact us at{" "}
                <a href="mailto:anishs1207@gmail.com" className="text-zinc-400 hover:text-white underline">
                    anishs1207@gmail.com
                </a>
            </p>
        </div>
    );
}


