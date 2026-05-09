"use client";

import Image from "next/image";

import {
    Calendar,
    Doc,
    Drive,
    Gmail,
    Sheets,
    Outlook,
    Notion,
    GoogleForms,
    Calendly,
    Linear,
    Reddit,
    Airtable,
} from "@/assets/images";

export default function IntegrationsGrid() {
    const visibleApps = ["Gmail", "Google Docs", "Google Calendar"]; // apps to show

    const allIntegrations = [
        { name: "Gmail", logo: Gmail },
        { name: "Google Calendar", logo: Calendar },
        { name: "Google Drive", logo: Drive },
        { name: "Google Sheets", logo: Sheets },
        { name: "Google Docs", logo: Doc },
        { name: "Outlook", logo: Outlook },
        { name: "Google Forms", logo: GoogleForms },
        { name: "Calendly", logo: Calendly },
        { name: "Notion", logo: Notion },
        { name: "Linear", logo: Linear },
        { name: "Reddit", logo: Reddit },
        { name: "Airtable", logo: Airtable },
        // { name: "Typeform", logo: Typeform },
    ];

    return (
        <section className="py-28 bg-black text-white">
            <div className="container mx-auto px-6 max-w-7xl">
                {/* Header */}
                <div className="text-center mb-14">
                    <h3 className="text-5xl font-bold">Integrate with Your Tools</h3>
                    <p className="text-gray-400 max-w-xl mx-auto mt-3">
                        Connect your AI teammates to your daily work apps in seconds.
                    </p>
                </div>

                {/* Grid */}
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-7 gap-6">
                    {allIntegrations.map((app) => {
                        const isVisible = visibleApps.includes(app.name);

                        return (
                            <div
                                key={app.name}
                                className={`bg-zinc-900/40 border border-zinc-800 p-4 rounded-xl flex flex-col items-center justify-center gap-2 
                                hover:border-indigo-500 hover:bg-zinc-900/70 transition cursor-pointer shadow-sm`}
                            >
                                {isVisible ? (
                                    <>
                                        <Image
                                            src={app.logo}
                                            alt={app.name}
                                            width={42}
                                            height={42}
                                            className="object-contain"
                                        />
                                        <p className="text-xs text-gray-400">{app.name}</p>
                                    </>
                                ) : (
                                    // Secret placeholder for hidden apps
                                    <>
                                        <div className="w-10 h-10 flex items-center justify-center bg-gray-700 rounded-full text-white font-bold text-xl animate-pulse">
                                            ?
                                        </div>
                                        <p className="text-xs text-gray-400 text-center">
                                            Secret App
                                        </p>
                                    </>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
