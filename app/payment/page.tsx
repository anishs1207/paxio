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
import { Check } from "lucide-react";

// add more credits system also here

export default function PricingPage() {
    return (
        <div className="min-h-screen bg-black flex items-center justify-center px-4">
            <Card
                className="
          w-full max-w-sm
          bg-gradient-to-b from-zinc-900 to-zinc-950
          border border-white/10
          text-white
          shadow-[0_20px_60px_-20px_rgba(0,0,0,0.8)]
          transition-all
        "
            >
                <CardHeader className="text-center space-y-3">
                    {/* Badge */}
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
                        Monthly Plan
                    </CardTitle>

                    <CardDescription className="text-zinc-400">
                        Everything you need to get started
                    </CardDescription>
                </CardHeader>

                <CardContent className="space-y-8">
                    {/* Price */}
                    <div className="text-center">
                        <div className="flex items-end justify-center gap-1">
                            <span className="text-5xl font-bold tracking-tight">  ₹ 10</span>
                            <span className="pb-1 text-zinc-400 text-sm">/ per month</span>
                        </div>
                    </div>

                    {/* Divider */}
                    <div className="h-px w-full bg-white/10" />

                    {/* Features */}
                    <ul className="space-y-3 text-sm text-zinc-300">
                        {[
                            "1000 credits per month",
                            "Priority email support",
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

                    {/* Footer */}
                    <p className="text-xs text-center text-zinc-500">
                        No auto-debit · Manual renewal
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}
