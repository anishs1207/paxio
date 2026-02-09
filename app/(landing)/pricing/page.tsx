"use client";

import { useState } from "react";
import Pricing from "@/components/home/Pricing";

const PricingPage = () => {
    const [billing, setBilling] = useState<"monthly" | "yearly">("monthly");

    const comparisonFeatures = [
        { feature: "Team Members", starter: "5", professional: "50", enterprise: "Unlimited" },
        { feature: "Storage", starter: "10 GB", professional: "100 GB", enterprise: "1 TB" },
        { feature: "Projects", starter: "10", professional: "100", enterprise: "Unlimited" },
        { feature: "API Access", starter: false, professional: true, enterprise: true },
        { feature: "Custom Integrations", starter: false, professional: true, enterprise: true },
        { feature: "Advanced Analytics", starter: false, professional: true, enterprise: true },
        { feature: "Priority Support", starter: false, professional: true, enterprise: true },
        { feature: "24/7 Dedicated Support", starter: false, professional: false, enterprise: true },
        { feature: "White-label Options", starter: false, professional: false, enterprise: true },
        { feature: "SLA Guarantee", starter: false, professional: false, enterprise: true },
        { feature: "Custom AI Training", starter: false, professional: false, enterprise: true },
        { feature: "On-premise Deployment", starter: false, professional: false, enterprise: true },
    ];

    return (
        <div className="min-h-screen bg-black text-white">
            {/* PRICING CARDS */}
            <div className="mt-0">
                <Pricing billing={billing} />
            </div>
        </div>
    );
};

export default PricingPage;
