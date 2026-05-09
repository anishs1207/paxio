"use client";

import { ReactCompareSlider, ReactCompareSliderImage } from "react-compare-slider";
import NewGmail from "@/assets/landing/gmail.png";
import OldGmail from "@/assets/landing/old-gmail.png";
import OldCalendar from "@/assets/landing/old-calendar.png";
import NewCalendar from "@/assets/landing/newcal.png"
import OldLegal from "@/assets/landing/old-legal.png";
import NewLegal from "@/assets/landing/legal2.png";

export default function Features() {
    const demoBlocks = [
        {
            title: "1. Future of Outreach",
            image1: OldGmail.src,
            image2: NewGmail.src
        },
        {
            title: "2. Automate Scheduling",
            image1: OldCalendar.src,
            image2: NewCalendar.src,
        },
        {
            title: "3. Interact with the Law",
            image1: OldLegal.src,
            image2: NewLegal.src,
        },
    ];

    return (
        <section
            id="features"
            className="py-20 bg-black text-white  border-zinc-900"
        >
            <div className="container mx-auto px-6 max-w-7xl">
                {/* ✅ Heading */}
                <div className="text-center mb-10 space-y-5">
                    <h2 className="text-5xl font-extrabold">
                        Welcome to the Future
                    </h2>
                    <p className="text-lg text-gray-400 max-w-2xl mx-auto">
                        See some glimpses of the future
                    </p>
                </div>

                {/* ✅ 3 BEFORE / AFTER IMAGE SLIDERS */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                    {demoBlocks.map((demo, i) => (
                        <div key={i} className="space-y-4">
                            <h3 className="text-lg font-semibold">{demo.title}</h3>
                            <div className="relative border border-zinc-800 rounded-2xl p-2 bg-zinc-950/60 shadow-xl backdrop-blur-xl">
                                <ReactCompareSlider
                                    className="rounded-xl w-full h-full"
                                    itemOne={<ReactCompareSliderImage src={demo.image1} alt="Before" />}
                                    itemTwo={<ReactCompareSliderImage src={demo.image2} alt="After" />}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>

    );
}
