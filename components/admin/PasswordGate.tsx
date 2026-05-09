"use client";

import { useEffect, useRef, useState } from "react";
import {
    Loader2,
    ShieldAlert,
    Eye,
    EyeOff,
    Lock,
} from "lucide-react";

export function PasswordGate({ onUnlock }: { onUnlock: () => void }) {
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState(false);
    const [shaking, setShaking] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        inputRef.current?.focus();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const res = await fetch("/api/admin/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ password }),
            });
            if (res.ok) {
                onUnlock();
            } else {
                setError(true);
                setShaking(true);
                setPassword("");
                setTimeout(() => setShaking(false), 500);
            }
        } catch {
            setError(true);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-black text-zinc-100 flex items-center justify-center p-6">
            {/* Background glow */}
            <div className="pointer-events-none fixed inset-0 overflow-hidden">
                <div className="absolute left-1/2 top-1/3 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-900/20 blur-3xl" />
            </div>

            <div
                className={`relative w-full max-w-md transition-all ${shaking ? "animate-[shake_0.4s_ease-in-out]" : ""
                    }`}
                style={
                    shaking
                        ? {
                            animation: "shake 0.4s ease-in-out",
                        }
                        : {}
                }
            >
                {/* Lock icon */}
                <div className="mb-8 flex flex-col items-center gap-3">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900/80 ring-1 ring-inset ring-white/5 shadow-2xl">
                        <Lock className="h-8 w-8 text-zinc-300" />
                    </div>
                    <div className="text-center">
                        <h1 className="text-2xl font-bold tracking-tight text-white">
                            Admin Dashboard
                        </h1>
                        <p className="mt-1 text-sm text-zinc-500">
                            Enter the admin password to continue
                        </p>
                    </div>
                </div>

                {/* Form */}
                <form
                    onSubmit={handleSubmit}
                    className="rounded-2xl border border-zinc-800/60 bg-zinc-900/60 p-8 shadow-2xl backdrop-blur-xl"
                >
                    <div className="space-y-4">
                        <div>
                            <label
                                htmlFor="admin-password"
                                className="mb-2 block text-xs font-medium uppercase tracking-wider text-zinc-500"
                            >
                                Password
                            </label>
                            <div className="relative">
                                <input
                                    ref={inputRef}
                                    id="admin-password"
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => {
                                        setPassword(e.target.value);
                                        setError(false);
                                    }}
                                    placeholder="Enter admin password"
                                    autoComplete="current-password"
                                    className={`w-full rounded-xl border bg-zinc-950/80 px-4 py-3 pr-12 text-sm text-white placeholder:text-zinc-600 outline-none transition-all focus:ring-2 ${error
                                        ? "border-red-500/50 focus:ring-red-500/30"
                                        : "border-zinc-800 focus:border-zinc-600 focus:ring-zinc-700/30"
                                        }`}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword((v) => !v)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                                    tabIndex={-1}
                                >
                                    {showPassword ? (
                                        <EyeOff className="h-4 w-4" />
                                    ) : (
                                        <Eye className="h-4 w-4" />
                                    )}
                                </button>
                            </div>
                            {error && (
                                <p className="mt-2 flex items-center gap-1.5 text-xs text-red-400">
                                    <ShieldAlert className="h-3.5 w-3.5" />
                                    Incorrect password. Access denied.
                                </p>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={submitting}
                            className="w-full rounded-xl bg-white px-4 py-3 text-sm font-semibold text-black transition-all hover:bg-zinc-200 active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2"
                        >
                            {submitting ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Verifying…
                                </>
                            ) : (
                                "Unlock Dashboard"
                            )}
                        </button>
                    </div>
                </form>

                <p className="mt-6 text-center text-xs text-zinc-700">
                    Paxio · Internal Admin · Confidential
                </p>
            </div>

            <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-10px); }
          40% { transform: translateX(10px); }
          60% { transform: translateX(-8px); }
          80% { transform: translateX(8px); }
        }
      `}</style>
        </div>
    );
}



