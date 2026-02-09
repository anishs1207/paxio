"use client";

import Image from "next/image";

const features = [
    {
        title: "1. A Bootstraped Memory layer",
        desc: "Write, organize, and build ideas together — live editing, comments, and AI-powered suggestions.",
        img: "/feature1.png",
    },
    {
        title: "2. Scalable Architecture to ",
        desc: "Trigger custom automation with your tools — tasks, emails, files, and knowledge all connected.",
        img: "/feature2.png",
    },
    {
        title: "Your Knowledge, Indexed",
        desc: "Centralize notes, docs, tasks & content — your entire workspace searchable and AI-ready.",
        img: "/feature3.png",
    },
];

export default function FeatureShowcase() {
    return (
        <section className="py-28 bg-black text-white">
            <div className="container max-w-6xl mx-auto px-6">

                {/* Heading */}
                <div className="text-center mb-20">
                    <h2 className="text-5xl font-bold leading-tight">
                        Built To&nbsp;
                        <span className="bg-gradient-to-r from-zinc-200 to-zinc-500 bg-clip-text text-transparent">
                            Empower Productivity
                        </span>
                    </h2>
                    <p className="text-zinc-400 text-lg max-w-2xl mx-auto mt-3">
                        Powerful features, simple experience — optimized for speed and clarity.
                    </p>
                </div>

                {/* Feature blocks */}
                <div className="space-y-28">
                    {features.map((f, i) => (
                        <div
                            key={i}
                            className={`flex flex-col md:flex-row items-center gap-10 ${i % 2 !== 0 ? "md:flex-row-reverse" : ""
                                }`}
                        >
                            {/* Text */}
                            <div className="flex-1">
                                <h3 className="text-3xl font-semibold mb-4">{f.title}</h3>
                                <p className="text-zinc-400 text-lg leading-relaxed">
                                    {f.desc}
                                </p>
                            </div>

                            {/* Image */}
                            <div className="flex-1 rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-900/40 backdrop-blur-sm shadow-xl">
                                <Image
                                    src={f.img}
                                    alt={f.title}
                                    width={700}
                                    height={450}
                                    className="rounded-2xl object-cover"
                                />
                            </div>
                        </div>
                    ))}
                </div>

            </div>
        </section>
    );
}
