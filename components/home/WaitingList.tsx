//apps\web\components\landing\home\WaitingList.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Mail, User, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import Confetti from "react-dom-confetti";
import axios, { AxiosError } from "axios";

const WaitingList = () => {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [confetti, setConfetti] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!name || !email) return toast.error("Please fill in all fields");
        if (!email.includes("@")) return toast.error("Invalid email");

        setIsSubmitting(true);

        try {
            const response = await axios.post("/api/waitlist-user", { name, email });

            if (response.data.success) {
                toast.success("🎉 You're in!");
                setName("");
                setEmail("");

                // Boom 💥
                setConfetti(true);
                setTimeout(() => setConfetti(false), 600);
            } else {
                toast.error(response.data.error || "Something went wrong!");
            }
        } catch (error: unknown) {
            const axiosError = error as AxiosError<{ error?: string }>;
            toast.error(axiosError.response?.data?.error || "Failed to join waitlist");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <section id="waitlist" className="relative py-0 bg-black overflow-hidden">

            {/* Confetti Burst near button */}
            <div className="absolute top-1/2 left-1/2 pointer-events-none z-[9999]">
                <Confetti
                    active={confetti}
                    config={{
                        angle: 90,
                        spread: 120,
                        startVelocity: 35,
                        elementCount: 90,
                        dragFriction: 0.1,
                        duration: 900,
                        stagger: 2,
                        width: "8px",
                        height: "8px",
                    }}
                />
            </div>

            <div className="container relative z-10 mx-auto px-4 max-w-5xl text-center">
                <h2 className="text-white text-5xl md:text-5xl font-bold leading-tight">Join Us</h2>
                <p className="mt-3 text-lg text-muted-foreground max-w-xl mx-auto">
                    Get early access with 100 free credits
                </p>

                <Card className="mt-10 mb-5 max-w-lg mx-auto p-8 bg-zinc-900/60 backdrop-blur-xl border border-zinc-800 shadow-xl rounded-2xl">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="text-sm font-medium">Full Name</label>
                            <div className="relative mt-2">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                <Input
                                    placeholder="John Doe"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="pl-10 bg-zinc-800/50 border-zinc-700 text-white"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-sm font-medium">Email</label>
                            <div className="relative mt-2">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                <Input
                                    type="email"
                                    placeholder="you@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="pl-10 bg-zinc-800/50 border-zinc-700 text-white"
                                />
                            </div>
                        </div>

                        <Button
                            type="submit"
                            size="lg"
                            disabled={isSubmitting}
                            className="cursor-pointer w-full bg-white text-black rounded-xl hover:opacity-90"
                        >
                            {isSubmitting ? "Joining..." : <><CheckCircle2 className="mr-2" /> Join Waitlist</>}
                        </Button>

                        <p className="text-xs text-muted-foreground text-center">No spam. Cancel anytime.</p>
                    </form>
                </Card>
            </div>
        </section>
    );
};

export default WaitingList;
