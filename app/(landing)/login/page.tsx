"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Mail, Lock, Sparkles, LogIn, UserPlus, ArrowRight, Loader2 } from "lucide-react";
import Image from "next/image";
import { FcGoogle } from "react-icons/fc";

export default function AuthPage() {
    const [mode, setMode] = useState<"login" | "signup">("login");
    const [loading, setLoading] = useState(false);

    const toggleMode = () => setMode(mode === "login" ? "signup" : "login");

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setTimeout(() => setLoading(false), 1500);
    };

    return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center px-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md"
            >
                <Card className="bg-zinc-900/60 border border-zinc-800 backdrop-blur-md p-8 rounded-2xl shadow-2xl">
                    {/* Logo + Heading */}
                    <div className="flex flex-col items-center text-center mb-8">
                        <div className="flex items-center gap-2 mb-2">
                            <Sparkles className="w-6 h-6 text-zinc-300" />
                            <h1 className="text-3xl font-bold bg-gradient-to-r from-zinc-200 to-zinc-400 bg-clip-text text-transparent">
                                {mode === "login" ? "Welcome Back" : "Create Account"}
                            </h1>
                        </div>
                        <p className="text-zinc-500 text-sm">
                            {mode === "login"
                                ? "Sign in to continue to your workspace"
                                : "Join us and start building effortlessly"}
                        </p>
                    </div>

                    {/* Google Sign-in */}
                    <Button
                        variant="outline"
                        className="w-full bg-zinc-950 hover:bg-zinc-800 border-zinc-700 text-white flex items-center justify-center gap-2 mb-6"
                    >
                        <FcGoogle />
                        Continue with Google
                    </Button>


                </Card>

                {/* Footer */}
                <p className="text-center text-xs text-zinc-600 mt-6">
                    By continuing, you agree to our{" "}
                    <a href="/terms" className="underline hover:text-zinc-400">Terms of Service</a> and{" "}
                    <a href="/privacy" className="underline hover:text-zinc-400">Privacy Policy</a>.
                </p>
            </motion.div>
        </div>
    );
}
