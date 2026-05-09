"use client";

import { useEffect, useState } from "react";
import {
    Zap,
    BarChart3,
    Loader2,
    ArrowLeft,
    CreditCard,
} from "lucide-react";
import { AdminChatBubble } from "@/components/admin/AdminChatBubble";

type UserListItem = {
    id: string;
    email: string | null;
    name: string | null;
    onboardingName: string | null;
    onboardingCountry: string | null;
    onboardingSource: string | null;
    plan: string;
    credits: number;
    createdAt: string;
    updatedAt: string;
};

type UserDetail = UserListItem & {
    isOnboardingCompleted: boolean;
    planStartedAt: string | null;
    planExpiresAt: string | null;
    tools?: Record<string, boolean>;
};

type ChatMessage = {
    id: string;
    conversationId: string;
    userId: string;
    role: string;
    message: string;
    payload: unknown;
    creditsUsed: number;
    createdAt: string;
};

export function UserDetailView({
    userId,
    onBack,
    user,
    loading: parentLoading,
}: {
    userId: string | undefined;
    onBack: () => void;
    user: UserDetail | null;
    loading: boolean;
}) {
    const [activeTab, setActiveTab] = useState<
        "chats" | "workflows" | "sessions" | "tools"
    >("chats");
    const [workflows, setWorkflows] = useState<unknown[]>([]);
    const [sessions, setSessions] = useState<unknown[]>([]);
    const [chats, setChats] = useState<ChatMessage[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!userId) return;
        setLoading(true);

        const fetchAll = async () => {
            try {
                const [chatsRes, workflowsRes, sessionsRes] = await Promise.all([
                    fetch(`/api/admin/users/${userId}/chats`),
                    fetch(`/api/admin/users/${userId}/workflows`),
                    fetch(`/api/admin/users/${userId}/sessions`),
                ]);

                const [chatsData, workflowsData, sessionsData] = await Promise.all([
                    chatsRes.ok ? chatsRes.json() : [],
                    workflowsRes.ok ? workflowsRes.json() : [],
                    sessionsRes.ok ? sessionsRes.json() : [],
                ]);

                setChats(chatsData);
                setWorkflows(workflowsData);
                setSessions(sessionsData);
            } catch (err) {
                console.error("Failed to fetch user details", err);
            } finally {
                setLoading(false);
            }
        };

        fetchAll();
    }, [userId]);

    return (
        <div className="min-h-screen bg-black text-zinc-100 flex flex-col font-sans selection:bg-zinc-800">
            <div className="border-b border-zinc-900 bg-black/50 backdrop-blur-xl shrink-0 sticky top-0 z-10">
                <div className="mx-auto max-w-6xl px-6 py-4">
                    <div className="flex items-center gap-4 mb-6">
                        <button
                            onClick={onBack}
                            className="group flex h-10 w-10 items-center justify-center rounded-full border border-zinc-800 bg-zinc-900/50 text-zinc-400 transition-all hover:bg-zinc-800 hover:text-white"
                        >
                            <ArrowLeft className="h-5 w-5 transition-transform group-hover:-translate-x-0.5" />
                        </button>
                        <div>
                            <h1 className="font-display text-xl font-bold tracking-tight text-white mb-0.5">
                                {user?.onboardingName || user?.name || "User Details"}
                            </h1>
                            <div className="flex items-center gap-2 text-xs text-zinc-500">
                                <span>{user?.email}</span>
                                <span>•</span>
                                <span className="font-mono">
                                    ID: {userId?.split("-")[0]}...
                                </span>
                            </div>
                        </div>
                    </div>

                    {parentLoading && !user ? (
                        <div className="flex items-center gap-2 text-zinc-500">
                            <Loader2 className="h-4 w-4 animate-spin" /> Loading details...
                        </div>
                    ) : user ? (
                        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 pb-2">
                            <div className="rounded-xl border border-zinc-900 bg-zinc-900/30 p-4">
                                <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1">
                                    Credits
                                </p>
                                <p className="font-mono text-xl text-white font-medium">
                                    {user.credits.toLocaleString()}
                                </p>
                            </div>
                            <div className="rounded-xl border border-zinc-900 bg-zinc-900/30 p-4">
                                <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1">
                                    Plan
                                </p>
                                <div className="flex items-center gap-2">
                                    <span
                                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${user.plan === "pro"
                                            ? "bg-emerald-500/10 text-emerald-500 ring-emerald-500/20"
                                            : "bg-zinc-800/50 text-zinc-400 ring-zinc-700/50"
                                            } capitalize`}
                                    >
                                        {user.plan}
                                    </span>
                                    {user.planExpiresAt && (
                                        <span className="text-xs text-zinc-600">
                                            Exp: {new Date(user.planExpiresAt).toLocaleDateString()}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="rounded-xl border border-zinc-900 bg-zinc-900/30 p-4">
                                <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1">
                                    Onboarding
                                </p>
                                <p className="text-sm text-zinc-300 truncate">
                                    {[user.onboardingCountry, user.onboardingSource]
                                        .filter(Boolean)
                                        .join(" • ") || "N/A"}
                                </p>
                            </div>
                            <div className="rounded-xl border border-zinc-900 bg-zinc-900/30 p-4">
                                <p className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-1">
                                    Joined
                                </p>
                                <p className="text-sm text-zinc-300">
                                    {new Date(user.createdAt).toLocaleDateString()}
                                </p>
                            </div>
                        </div>
                    ) : (
                        <p className="text-zinc-500">User not found.</p>
                    )}

                    {/* Tabs */}
                    <div className="flex gap-1 mt-6 border-b border-zinc-800">
                        {(["chats", "workflows", "sessions", "tools"] as const).map(
                            (tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === tab
                                        ? "border-emerald-500 text-emerald-500"
                                        : "border-transparent text-zinc-500 hover:text-zinc-300 hover:border-zinc-800"
                                        } capitalize`}
                                >
                                    {tab}
                                </button>
                            )
                        )}
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-hidden flex flex-col min-h-0 bg-zinc-950/30">
                <div className="flex-1 overflow-y-auto px-6 py-8">
                    <div className="max-w-6xl mx-auto">
                        {loading ? (
                            <div className="flex justify-center py-12">
                                <Loader2 className="h-8 w-8 animate-spin text-zinc-600" />
                            </div>
                        ) : (
                            <>
                                {activeTab === "chats" && (
                                    <div className="space-y-4 max-w-4xl mx-auto">
                                        {chats.length === 0 ? (
                                            <div className="text-center py-12">
                                                <div className="mx-auto mb-3 h-10 w-10 text-zinc-700">
                                                    <CreditCard className="h-full w-full" />
                                                </div>
                                                <p className="text-zinc-500">No chat history.</p>
                                            </div>
                                        ) : (
                                            chats.map((chat) => (
                                                <AdminChatBubble
                                                    key={chat.id}
                                                    role={chat.role}
                                                    message={chat.message}
                                                    payload={chat.payload}
                                                    createdAt={chat.createdAt}
                                                />
                                            ))
                                        )}
                                    </div>
                                )}

                                {activeTab === "workflows" && (
                                    <div className="space-y-3">
                                        {workflows.length === 0 ? (
                                            <div className="text-center py-12">
                                                <Zap className="mx-auto mb-3 h-10 w-10 text-zinc-700" />
                                                <p className="text-zinc-500">No active workflows.</p>
                                            </div>
                                        ) : (
                                            workflows.map((wf) => (
                                                <div
                                                    key={wf.id}
                                                    className="rounded-xl border border-zinc-900 bg-zinc-900/50 p-4 transition-all hover:border-zinc-800"
                                                >
                                                    <div className="flex items-start justify-between mb-2">
                                                        <div className="flex items-center gap-2">
                                                            <div
                                                                className={`h-2 w-2 rounded-full ${wf.active ? "bg-emerald-500" : "bg-zinc-500"
                                                                    }`}
                                                            />
                                                            <h3 className="font-medium text-white truncate max-w-lg">
                                                                {wf.description || wf.prompt}
                                                            </h3>
                                                        </div>
                                                        <span
                                                            className={`text-[10px] px-2 py-0.5 rounded-full border ${wf.status === "ACTIVE"
                                                                ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-500"
                                                                : "border-zinc-700 bg-zinc-800 text-zinc-400"
                                                                }`}
                                                        >
                                                            {wf.status}
                                                        </span>
                                                    </div>
                                                    <div className="grid grid-cols-3 gap-4 mt-4 text-xs">
                                                        <div>
                                                            <p className="text-zinc-500 mb-1">Schedule</p>
                                                            <p className="text-zinc-300 font-mono">
                                                                {wf.schedule || "Event based"}
                                                            </p>
                                                        </div>
                                                        <div>
                                                            <p className="text-zinc-500 mb-1">Last Run</p>
                                                            <p className="text-zinc-300">
                                                                {wf.lastRunAt
                                                                    ? new Date(wf.lastRunAt).toLocaleString()
                                                                    : "Never"}
                                                            </p>
                                                        </div>
                                                        <div className="col-span-3 mt-2 pt-2 border-t border-zinc-800/50">
                                                            <p className="text-zinc-500 mb-1">Last Result</p>
                                                            <p className="text-zinc-400 truncate font-mono">
                                                                {wf.lastResultSummary || "—"}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                )}

                                {activeTab === "sessions" && (
                                    <div className="space-y-3">
                                        {sessions.length === 0 ? (
                                            <div className="text-center py-12">
                                                <BarChart3 className="mx-auto mb-3 h-10 w-10 text-zinc-700" />
                                                <p className="text-zinc-500">No research sessions.</p>
                                            </div>
                                        ) : (
                                            sessions.map((session) => (
                                                <div
                                                    key={session.id}
                                                    className="rounded-xl border border-zinc-900 bg-zinc-900/50 p-4 transition-all hover:border-zinc-800"
                                                >
                                                    <div className="flex items-start justify-between mb-2">
                                                        <div>
                                                            <h3 className="font-medium text-white">
                                                                {session.topic || "Unknown Topic"}
                                                            </h3>
                                                            <p className="text-xs text-zinc-500 mt-0.5">
                                                                {session.prompt}
                                                            </p>
                                                        </div>
                                                        <span
                                                            className={`text-[10px] px-2 py-0.5 rounded-full border ${session.status === "DONE"
                                                                ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-500"
                                                                : session.status === "ERROR"
                                                                    ? "border-red-500/20 bg-red-500/10 text-red-500"
                                                                    : "border-blue-500/20 bg-blue-500/10 text-blue-500"
                                                                }`}
                                                        >
                                                            {session.status}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-4 mt-3 text-xs text-zinc-400">
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="text-zinc-600">Platforms:</span>
                                                            {session.platforms.join(", ")}
                                                        </div>
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="text-zinc-600">Duration:</span>
                                                            {session.duration || "—"}
                                                        </div>
                                                        <div className="flex items-center gap-1.5 ml-auto">
                                                            {new Date(session.createdAt).toLocaleString()}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                )}

                                {activeTab === "tools" && (
                                    <div>
                                        {!user?.tools ? (
                                            <div className="text-center py-12">
                                                <Loader2 className="mx-auto mb-3 h-10 w-10 animate-spin text-zinc-700" />
                                                <p className="text-zinc-500">Loading tools...</p>
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                                                {Object.entries(user.tools || {}).map(
                                                    ([tool, connected]) => (
                                                        <div
                                                            key={tool}
                                                            className={`rounded-xl border p-4 flex items-center justify-between ${connected
                                                                ? "border-emerald-500/20 bg-emerald-500/5"
                                                                : "border-zinc-900 bg-zinc-900/30 opacity-60"
                                                                }`}
                                                        >
                                                            <div className="flex items-center gap-3">
                                                                <span className="font-medium text-sm text-zinc-200 capitalize">
                                                                    {tool.replace(/([A-Z])/g, " $1").trim()}
                                                                </span>
                                                            </div>
                                                            <div
                                                                className={`h-2 w-2 rounded-full ${connected ? "bg-emerald-500" : "bg-zinc-800"
                                                                    }`}
                                                            />
                                                        </div>
                                                    )
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

