"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bot, Database, Pencil, Brain, Search, Zap, Mail, Slack, Github } from "lucide-react";
import Image from "next/image";
import PersonalAssistant from "@/assets/assistant-icons/personal.png";
import LegalAssistant from "@/assets/assistant-icons/legal.png";
import FiananceAssistant from "@/assets/assistant-icons/finance.png";

const assistants = [
    {
        name: "Lyra",
        role: "AI Personal Assistant",
        description: "Manages your calendar, your email, and much much more",
        avatar: PersonalAssistant,
        integrations: [Search, Github, Slack]
    },
    {
        name: "Specter",
        role: "AI Legal Assistant",
        description: "Ask questions about the law, interact with it & get more aware. ",
        avatar: LegalAssistant,
        integrations: [Zap, Mail, Slack]
    },
    {
        name: "Rob",
        role: "AI Finance Assistant",
        description: "Helps you budget & track your expenses, analyse them and helps you in personal finance",
        avatar: FiananceAssistant,
        integrations: [Pencil, Mail, Github]
    },

];

export default function MeetTeam() {
    return (
        <section className="py-0 bg-black text-white" id="team">
            <div className="container mx-auto px-6 max-w-7xl">

                {/* Heading */}
                <div className="text-center mb-14 space-y-3">
                    <h2 className="text-5xl font-extrabold">
                        Meet Your <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">AI Team</span>
                    </h2>
                    <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                        Specialized AI teammates designed to automate, research, create, and help you grow
                    </p>
                </div>

                {/* Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-8">
                    {assistants.map((bot) => (
                        <Card
                            key={bot.name}
                            className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-2xl  transition"
                        >
                            <div className="flex flex-col items-center text-center space-y-3">

                                <div className="relative h-50 w-50">
                                    <Image
                                        src={bot.avatar}
                                        alt={bot.name}
                                        fill
                                        className="rounded-full object-cover border border-indigo-500/40"
                                    />
                                </div>

                                <h3 className="text-xl font-semibold">{bot.name}</h3>
                                <p className="text-indigo-400 text-sm">{bot.role}</p>
                                <p className="text-gray-400 text-sm mb-2">{bot.description}</p>


                            </div>
                        </Card>
                    ))}
                </div>
            </div>
        </section>
    );
}
