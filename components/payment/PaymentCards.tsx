"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";
import Link from "next/link";
import axios from "axios";
import { toast } from "sonner";
import { useState } from "react";

const PaymentCards = () => {
    const [loading, setLoading] = useState<string | null>(null);

    const handlePayment = async (plan: string) => {
        try {
            setLoading(plan);
            const { data } = await axios.post("/api/payments/create-order", { plan });

            if (data.checkout_url) {
                window.location.assign(data.checkout_url);
            } else {
                toast.error("Failed to create checkout session");
                setLoading(null);
            }
        } catch (error) {
            console.error(error);
            toast.error("Unable to initiate payment");
            setLoading(null);
        }
    };

    const plans = [
        {
            id: "BASIC",
            name: "Basic",
            credits: 4000,
            price: "$5",
            features: [
                "4,000 Credits",
                "Access to all agents",
                "Standard support",
                "Community access",
            ],
            popular: false,
            buttonText: "Buy Now",
        },
        {
            id: "PRO",
            name: "Pro",
            credits: 10000,
            price: "$10",
            features: [
                "10,000 Credits",
                "Access to all agents",
                "Priority support",
                "Early access to new features",
            ],
            popular: true,
            savings: "Save 20%",
            buttonText: "Buy Now",
        },
        {
            id: "ENTERPRISE",
            name: "Enterprise",
            credits: "Custom",
            price: "Custom",
            features: [
                "Tailored credit capability",
                "Dedicated account manager",
                "Custom integrations",
                "SLA guarantee",
            ],
            popular: false,
            buttonText: "Book Demo",
            href: "mailto:paxioai@gmail.com",
            isExternal: true,
        },
    ];

    return (
        <section className="bg-black text-white w-full">
            <div className="max-w-6xl mx-auto px-6">
                {/* Pricing Cards */}
                <div className="flex flex-col md:flex-row justify-center gap-8 max-w-6xl mx-auto">
                    {plans.map((plan, idx) => (
                        <Card
                            key={idx}
                            className={`relative w-full md:w-1/3 p-8 rounded-2xl border border-zinc-800 bg-gradient-to-b from-zinc-900/60 to-black backdrop-blur-xl shadow-[0px_0px_30px_-15px_rgba(255,255,255,0.1)]
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
                                    <span className="text-4xl font-bold text-white">{plan.price}</span>
                                    {plan.price !== "Custom" && <span className="text-zinc-500 text-sm">/pack</span>}
                                </div>
                                <p className="text-sm text-zinc-400 mt-2">
                                    {typeof plan.credits === 'number' ? `${plan.credits.toLocaleString()} Credits` : `${plan.credits} Credits`}
                                </p>
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

                            {plan.href ? (
                                <Link href={plan.href} target={plan.isExternal ? "_blank" : undefined}>
                                    <Button
                                        className={`w-full py-6 font-semibold rounded-xl transition-all ${plan.popular
                                            ? "bg-white text-black hover:bg-zinc-200 shadow-lg hover:shadow-white/20"
                                            : "bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700"
                                            }`}
                                    >
                                        {plan.buttonText}
                                    </Button>
                                </Link>
                            ) : (
                                <Button
                                    onClick={() => handlePayment(plan.id)}
                                    disabled={loading === plan.id || loading !== null}
                                    className={`w-full py-6 font-semibold rounded-xl transition-all ${plan.popular
                                        ? "bg-white text-black hover:bg-zinc-200 shadow-lg hover:shadow-white/20"
                                        : "bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700"
                                        }`}
                                >
                                    {loading === plan.id ? "Processing..." : plan.buttonText}
                                </Button>
                            )}
                        </Card>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default PaymentCards;
