'use client';

import React, { useState } from 'react';
import { signIn } from "next-auth/react";
import { FcGoogle } from "react-icons/fc";
import { Loader2 } from "lucide-react";
import Link from 'next/link';

export default function SignupPage() {
    const [isSigningIn, setIsSigningIn] = useState(false);

    const handleGoogleSignIn = async () => {
        try {
            setIsSigningIn(true);
            await signIn("google", { callbackUrl: "/" });
        } finally {
            setIsSigningIn(false);
        }
    };

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-background-dark p-4">
            <div className="w-full max-w-md bg-zinc-900/50 border border-zinc-800 rounded-2xl p-8 shadow-2xl backdrop-blur-sm flex flex-col items-center gap-8">
                {/* Logo and Badge */}
                <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                    <span className="text-4xl font-extrabold tracking-tight text-white font-display">
                        Paxio
                    </span>
                    <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full 
                             bg-white/10 text-white/70 border border-white/20 translate-y-1">
                        Beta
                    </span>
                </Link>

                {/* Content */}
                <div className="text-center space-y-2">
                    <h1 className="text-xl font-medium text-zinc-200">Welcome Back</h1>
                    <p className="text-sm text-zinc-400">Sign in to continue to your workspace</p>
                </div>

                {/* Sign In Button */}
                <button
                    onClick={handleGoogleSignIn}
                    disabled={isSigningIn}
                    className="w-full cursor-pointer bg-white text-black hover:bg-zinc-200 transition-colors py-3 rounded-xl font-medium flex items-center justify-center gap-3 shadow-lg hover:shadow-xl disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    {isSigningIn ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                        <FcGoogle className="text-xl" />
                    )}
                    {isSigningIn ? "Connecting..." : "Continue with Google"}
                </button>

                <p className="text-xs text-zinc-500 text-center px-8">
                    By continuing, you agree to Paxio's Terms of Service and Privacy Policy.
                </p>

            </div>
        </div>
    );
}
