"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardHeader,
    CardContent,
    CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import axios from "axios";

interface OnboardingFormProps {
    userId: string;
    onComplete: () => void;
}

export default function OnboardingForm({ userId, onComplete }: OnboardingFormProps) {
    const [step, setStep] = useState(1);
    const [isAnimating, setIsAnimating] = useState(false);
    const [mounted, setMounted] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [form, setForm] = useState({
        name: "",
        country: "",
        source: "",
    });

    useEffect(() => {
        setMounted(true);
    }, []);

    const next = () => {
        setIsAnimating(true);
        setTimeout(() => {
            setStep(step + 1);
            setIsAnimating(false);
        }, 200);
    };

    const handleSelect = async (field: string, value: string) => {
        const updatedForm = { ...form, [field]: value };
        setForm(updatedForm);

        if (field === "source") {
            // Last step - save data and call onComplete
            setIsSubmitting(true);
            try {
                await axios.post(
                    "/api/onboarding-status",
                    {
                        name: updatedForm.name,
                        country: updatedForm.country,
                        source: value,
                    },
                    {
                        headers: { userId },
                    }
                );
                onComplete();
            } catch (error) {
                console.error("Failed to save onboarding data:", error);
                // Still call onComplete even if save fails
                onComplete();
            } finally {
                setIsSubmitting(false);
            }
            return;
        }

        next();
    };

    const steps = 3;

    const countries = [
        { name: "United States", flag: "🇺🇸" },
        { name: "India", flag: "🇮🇳" },
        { name: "United Kingdom", flag: "🇬🇧" },
        { name: "Canada", flag: "🇨🇦" },
        { name: "Australia", flag: "🇦🇺" },
        { name: "Germany", flag: "🇩🇪" },
        { name: "Others", flag: "🌍" },
    ];

    const sources = [
        { name: "LinkedIn", icon: "💼" },
        { name: "Twitter", icon: "🐦" },
        { name: "Friend Referral", icon: "👥" },
        { name: "Other", icon: "✨" },
    ];

    return (
        <section className="w-full min-h-screen relative overflow-hidden flex justify-center items-center px-4 py-6 sm:px-6 sm:py-8 md:px-8 lg:px-12">
            {/* Background */}
            <div className="absolute inset-0 bg-black">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-zinc-800/30 via-transparent to-transparent" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_var(--tw-gradient-stops))] from-zinc-800/20 via-transparent to-transparent" />
                {/* Subtle animated orbs */}
                <div className="absolute top-1/4 right-1/4 w-64 h-64 sm:w-96 sm:h-96 bg-zinc-700/10 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-1/4 left-1/4 w-64 h-64 sm:w-96 sm:h-96 bg-zinc-600/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
            </div>

            {/* Main card */}
            <Card
                className={`relative w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-xl bg-zinc-900/80 border border-zinc-800/60 shadow-2xl backdrop-blur-2xl rounded-2xl sm:rounded-3xl overflow-hidden transition-all duration-500 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
            >
                {/* Subtle top border */}
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-zinc-600/50 to-transparent" />

                <div className="flex flex-col h-full max-h-[85vh] sm:max-h-[90vh] overflow-y-auto p-5 sm:p-6 md:p-8 lg:p-10">
                    <CardHeader className="text-center space-y-4 sm:space-y-5 pb-6 sm:pb-8">
                        {/* Logo/Icon */}
                        <div className="mx-auto w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 rounded-2xl bg-white flex items-center justify-center shadow-lg shadow-white/10">

                        </div>

                        <div className="space-y-2">
                            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white tracking-tight">
                                Welcome
                            </h2>
                            <p className="text-zinc-500 text-sm sm:text-base md:text-lg">
                                Let&apos;s personalize your experience
                            </p>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full max-w-[200px] sm:max-w-[240px] mx-auto">
                            <div className="flex justify-between text-xs text-zinc-600 mb-2">
                                <span>Step {step} of {steps}</span>
                                <span>{Math.round((step / steps) * 100)}%</span>
                            </div>
                            <div className="h-1.5 sm:h-2 bg-zinc-800 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-white rounded-full transition-all duration-500 ease-out"
                                    style={{ width: `${(step / steps) * 100}%` }}
                                />
                            </div>
                        </div>
                    </CardHeader>

                    <CardContent className={`space-y-4 sm:space-y-5 md:space-y-6 flex-1 transition-all duration-200 ${isAnimating ? 'opacity-0 translate-x-4' : 'opacity-100 translate-x-0'}`}>
                        {/* Step 1: Name */}
                        {step === 1 && (
                            <div className="space-y-4 sm:space-y-5 md:space-y-6">
                                <div className="text-center space-y-1 sm:space-y-2">
                                    <p className="text-lg sm:text-xl md:text-2xl font-semibold text-white">
                                        What&apos;s your name?
                                    </p>
                                    <p className="text-zinc-500 text-xs sm:text-sm">
                                        We&apos;d love to know what to call you
                                    </p>
                                </div>
                                <Input
                                    type="text"
                                    placeholder="Enter your full name"
                                    value={form.name}
                                    onChange={(e) =>
                                        setForm({ ...form, name: e.target.value })
                                    }
                                    className="bg-zinc-800/50 border border-zinc-700/50 text-white placeholder-zinc-500 h-12 sm:h-14 text-base sm:text-lg rounded-xl focus:border-zinc-500 focus:ring-2 focus:ring-zinc-500/20 transition-all"
                                />
                                <Button
                                    onClick={next}
                                    disabled={!form.name}
                                    className="cursor-pointer w-full bg-white text-black h-12 sm:h-14 rounded-xl text-base sm:text-lg font-semibold hover:bg-zinc-200 transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-white/10 hover:shadow-white/20 hover:scale-[1.02] active:scale-[0.98]"
                                >
                                    Continue
                                    <span className="ml-2">→</span>
                                </Button>
                            </div>
                        )}

                        {/* Step 2: Country */}
                        {step === 2 && (
                            <div className="space-y-4 sm:space-y-5 md:space-y-6">
                                <div className="text-center space-y-1 sm:space-y-2">
                                    <p className="text-lg sm:text-xl md:text-2xl font-semibold text-white">
                                        Where are you from?
                                    </p>
                                    <p className="text-zinc-500 text-xs sm:text-sm">
                                        Select your country
                                    </p>
                                </div>
                                <div className="grid  grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                                    {countries.map((country) => (
                                        <Button
                                            key={country.name}
                                            onClick={() => handleSelect("country", country.name)}
                                            className="
        group relative overflow-hidden rounded-xl 
        bg-zinc-800 text-white 
        h-12 sm:h-14 text-sm sm:text-base font-medium 
        shadow-md 
        hover:bg-zinc-700 hover:shadow-lg hover:scale-[1.03] 
        active:bg-zinc-900 active:scale-[0.97] 
        transition-all duration-300
    "
                                        >
                                            {country.name}
                                        </Button>


                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Step 3: Source */}
                        {step === 3 && (
                            <div className="space-y-4 sm:space-y-5 md:space-y-6">
                                <div className="text-center space-y-1 sm:space-y-2">
                                    <p className="text-lg sm:text-xl md:text-2xl font-semibold text-white">
                                        How did you find us?
                                    </p>
                                    <p className="text-zinc-500 text-xs sm:text-sm">
                                        Help us know where you came from
                                    </p>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                                    {sources.map((source, index) => (
                                        <Button
                                            key={source.name}
                                            onClick={() => handleSelect("source", source.name)}
                                            disabled={isSubmitting}
                                            className="group relative overflow-hidden rounded-xl border-0 hover:opacity-90 transition-all duration-300 h-12 sm:h-14 text-sm sm:text-base font-medium hover:scale-[1.02] active:scale-[0.98] shadow-md disabled:opacity-50"
                                            style={{ backgroundColor: "white", color: "black", animationDelay: `${index * 50}ms` }}
                                        >

                                            {source.name}
                                        </Button>
                                    ))}
                                </div>
                                {isSubmitting && (
                                    <p className="text-center text-zinc-500 text-sm">Saving your preferences...</p>
                                )}
                            </div>
                        )}
                    </CardContent>

                    <CardFooter className="text-center pt-4 sm:pt-6">
                        <p className="text-zinc-600 text-xs sm:text-sm w-full">
                            {step > 1 && (
                                <button
                                    onClick={() => setStep(step - 1)}
                                    className="text-zinc-500 hover:text-white transition-colors underline-offset-4 hover:underline"
                                >
                                    ← Go back
                                </button>
                            )}
                        </p>
                    </CardFooter>
                </div>

                {/* Subtle bottom border */}
                <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-zinc-700/50 to-transparent" />
            </Card>
        </section>
    );
}
