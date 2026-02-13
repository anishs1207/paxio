"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";
import Link from "next/link";

const LandingPricing = () => {
    const plans = [
        {
            name: "Basic",
            credits: 4000,
            price: 5,
            features: [
                "4,000 Credits",
                "Access to all agents",
                "Standard support",
                "Community access",
            ],
            popular: false,
        },
        {
            name: "Pro",
            credits: 10000,
            price: 10,
            features: [
                "10,000 Credits",
                "Access to all agents",
                "Priority support",
                "Early access to new features",
            ],
            popular: true,
            savings: "Save 20%",
        },
    ];

    return (
        <section id="pricing" className="py-24 bg-black text-white">
            <div className="max-w-6xl mx-auto px-6">
                {/* Header */}
                <div className="text-center mb-16">
                    <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white via-zinc-400 to-zinc-600">
                        Simple Pricing
                    </h2>
                    <p className="text-lg text-zinc-400 max-w-2xl mx-auto">
                        High-quality credits at an affordable price. Choose the package that suits your needs.
                    </p>
                </div>

                {/* Pricing Cards */}
                <div className="flex flex-col md:flex-row justify-center gap-8 max-w-4xl mx-auto">
                    {plans.map((plan, idx) => (
                        <Card
                            key={idx}
                            className={`relative w-full md:w-1/2 p-8 rounded-2xl border border-zinc-800 bg-gradient-to-b from-zinc-900/60 to-black backdrop-blur-xl shadow-[0px_0px_30px_-15px_rgba(255,255,255,0.1)]
                transition-all duration-300 hover:-translate-y-2 hover:shadow-[0px_0px_35px_-10px_rgba(255,255,255,0.25)]
                ${plan.popular && "border-zinc-600 shadow-[0px_0px_35px_-5px_rgba(255,255,255,0.4)]"}
              `}
                        >
                            {plan.popular && plan.savings && (
                                <Badge className="absolute -top-3 -right-3 rotate-12 bg-white text-black font-bold shadow-xl px-3 py-1 text-xs">
                                    {plan.savings}
                                </Badge>
                            )}

                            <div className="mb-6">
                                <h3 className="text-xl font-medium text-zinc-300 mb-2">{plan.name}</h3>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-4xl font-bold text-white">${plan.price}</span>
                                    <span className="text-zinc-500 text-sm">/pack</span>
                                </div>
                                <p className="text-sm text-zinc-400 mt-2">{plan.credits.toLocaleString()} Credits</p>
                            </div>

                            <ul className="space-y-4 mb-8">
                                {plan.features.map((f, i) => (
                                    <li key={i} className="flex gap-3 items-center">
                                        <div className="h-5 w-5 rounded-full bg-zinc-800 flex items-center justify-center shrink-0">
                                            <Check className="h-3 w-3 text-white" />
                                        </div>
                                        <span className="text-sm text-zinc-300">{f}</span>
                                    </li>
                                ))}
                            </ul>

                            <Link href="/signup">
                                <Button
                                    className={`w-full py-6 font-semibold rounded-xl transition-all ${plan.popular
                                        ? "bg-white text-black hover:bg-zinc-200 shadow-lg hover:shadow-white/20"
                                        : "bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700"
                                        }`}
                                >
                                    Get Started
                                </Button>
                            </Link>
                        </Card>
                    ))}
                </div>

                <p className="text-center text-sm text-zinc-500 mt-12">
                    Start with a small pack and upgrade anytime. NO subscription required.
                </p>
            </div>
        </section>
    );
};

export default LandingPricing;
