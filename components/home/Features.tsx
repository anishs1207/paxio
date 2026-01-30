"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export default function Features() {
    const demoBlocks = [
        {
            title: "1. Connect your tools",
            video: "https://www.youtube.com/embed/j0J-favyUeQ",
        },
        {
            title: "2. Automate workflows",
            video: "https://www.youtube.com/embed/j0J-favyUeQ",
        },
        {
            title: "3. Optimize & Scale",
            video: "https://www.youtube.com/embed/j0J-favyUeQ",
        },
    ];

    return (
        <section id="features" className="py-28 bg-black text-white">
            <div className="container mx-auto px-6 max-w-7xl">

                {/* ✅ Heading */}
                <div className="text-center mb-10 space-y-5">
                    <h2 className="text-5xl font-extrabold">Experience the Future of Work</h2>
                    <p className="text-lg text-gray-400 max-w-2xl mx-auto">
                        See how teams unlock superpowers with automation, AI, and seamless workflows.
                    </p>
                </div>

                <div className="flex justify-center mb-10 gap-2">
                    <Button
                        size="lg"
                        className="bg-white text-black hover:bg-zinc-200 rounded-full  cursor-pointer shadow-lg px-11 py-7 text-lg flex items-center gap-2"
                    >
                        Explore Usecases

                    </Button>
                    <Button
                        size="lg"
                        className="bg-white text-black hover:bg-zinc-200 rounded-full  cursor-pointer shadow-lg px-11 py-7 text-lg flex items-center gap-2"
                    >
                        Get Started for Free

                    </Button>
                </div>

                {/* ✅ Render YouTube demos */}
                <div className="space-y-20">
                    {demoBlocks.map((demo, i) => (
                        <div key={i} className="max-w-5xl mx-auto">
                            <h3 className="text-xl font-semibold mb-4">{demo.title}</h3>

                            <div className="relative rounded-2xl overflow-hidden border border-zinc-800 shadow-2xl bg-zinc-950/60 backdrop-blur-xl p-2">
                                <iframe
                                    className="w-full h-[340px] md:h-[460px] rounded-xl"
                                    src={demo.video}
                                    title="Product Experience Demo"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                ></iframe>

                                {/* Floating CTA */}
                                <button className="cursor-pointer absolute bottom-4 right-4 bg-white text-black font-semibold rounded-full px-6 py-3 flex items-center gap-2 shadow-lg hover:bg-zinc-200 transition">
                                    Try It Live
                                    <Play size={18} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
