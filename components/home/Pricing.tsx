"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";

const Pricing = () => {
    const [isYearly, setIsYearly] = useState(false);

    const plans = [
        {
            name: "Starter",
            description: "Perfect for individuals & small teams",
            monthlyPrice: 29,
            yearlyPrice: 290,
            features: [
                "Up to 5 team members",
                "10 GB storage",
                "Basic analytics",
                "Email support",
                "Mobile access",
            ],
            popular: false,
        },
        {
            name: "Pro",
            description: "Best for growing teams",
            monthlyPrice: 79,
            yearlyPrice: 790,
            features: [
                "Up to 50 team members",
                "100 GB storage",
                "Advanced analytics",
                "Priority email support",
                "API access",
                "Custom integrations",
                "Automation tools",
            ],
            popular: true,
        },
        {
            name: "Enterprise",
            description: "For large organizations",
            monthlyPrice: 199,
            yearlyPrice: 1990,
            features: [
                "Unlimited users",
                "1 TB storage",
                "Advanced BI reporting",
                "24/7 priority support",
                "White-label features",
                "SLA guarantee",
                "On-premise deployment",
            ],
            popular: false,
        },
    ];

    return (
        <section id="pricing" className="py-20 bg-black text-white">
            <div className="max-w-6xl mx-auto px-6">
                {/* Header */}
                <div className="text-center mb-16">
                    <h2 className="text-4xl md:text-5xl font-bold mb-3">
                        Pricing
                    </h2>

                    <p className="text-lg text-zinc-400">
                        Flexible plans for every stage of your growth
                    </p>
                </div>

                {/* Billing Toggle */}
                <div className="flex items-center justify-center gap-4 mb-14">
                    <span className={`text-sm ${!isYearly ? "text-white" : "text-zinc-500"}`}>
                        Monthly
                    </span>

                    <button
                        onClick={() => setIsYearly(!isYearly)}
                        className="cursor-pointer relative w-16 h-8 rounded-full bg-zinc-800 border border-zinc-700"
                    >
                        <div
                            className={`absolute top-1 h-6 w-6 rounded-full bg-white shadow-md transition-all ${isYearly ? "left-9" : "left-1"
                                }`}
                        />
                    </button>

                    <span className={`text-sm ${isYearly ? "text-white" : "text-zinc-500"}`}>
                        Yearly
                        <Badge className="ml-2 bg-zinc-900 border border-zinc-600 text-zinc-300 text-[10px] px-2 py-0.5">
                            Save 20%
                        </Badge>
                    </span>
                </div>

                {/* Pricing Cards */}
                <div className="grid md:grid-cols-3 gap-10">
                    {plans.map((plan, idx) => (
                        <Card
                            key={idx}
                            className={`relative p-8 rounded-2xl border border-zinc-800 bg-gradient-to-b from-zinc-900/60 to-black backdrop-blur-xl shadow-[0px_0px_30px_-15px_rgba(255,255,255,0.1)]
                transition-all duration-300 hover:-translate-y-2 hover:shadow-[0px_0px_35px_-10px_rgba(255,255,255,0.25)]
                ${plan.popular && "border-zinc-600 shadow-[0px_0px_35px_-5px_rgba(255,255,255,0.4)]"}
              `}
                        >
                            {plan.popular && (
                                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white text-black font-semibold shadow-xl">
                                    Most Popular
                                </Badge>
                            )}

                            <h3 className="text-2xl font-bold mb-1">{plan.name}</h3>
                            <p className="text-sm text-zinc-400 mb-6">{plan.description}</p>

                            <div className="mb-6">
                                <span className="text-5xl font-extrabold">
                                    ${isYearly ? plan.yearlyPrice : plan.monthlyPrice}
                                </span>
                                <span className="text-zinc-500 ml-1 text-sm">
                                    /{isYearly ? "yr" : "mo"}
                                </span>
                            </div>

                            <ul className="space-y-3 mb-8">
                                {plan.features.map((f, i) => (
                                    <li key={i} className="flex gap-3 items-start">
                                        <Check className="h-5 w-5 text-zinc-200 mt-0.5" />
                                        <span className="text-sm text-zinc-300">{f}</span>
                                    </li>
                                ))}
                            </ul>

                            <Button
                                className={`cursor-pointer w-full py-5 font-semibold rounded-xl ${plan.popular
                                    ? "bg-white text-black hover:bg-zinc-200"
                                    : "bg-zinc-800 hover:bg-zinc-700 text-white"
                                    }`}
                            >
                                Get Started
                            </Button>
                        </Card>
                    ))}
                </div>

                <p className="text-center text-sm text-zinc-500 mt-10">
                    No credit card required — cancel anytime
                </p>
            </div>
        </section>
    );
};

export default Pricing;
