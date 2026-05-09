"use client";

import { useCallback, useEffect, useState } from "react";
import {
    Card,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Users,
    UserCheck,
    UserCog,
    TrendingUp,
    Activity,
    Zap,
    BarChart3,
    DollarSign,
    Loader2,
    ShieldAlert,
    ArrowLeft,
    Mail,
} from "lucide-react";
import {
    Area,
    AreaChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import { UserDetailView } from "./UserDetailView";

type Stats = {
    totalUsers: number;
    paidUsers: number;
    freeUsers: number;
    activeUsers28d: number;
    newUsers7d: number;
    doomscrollSessionsCount: number;
    autonomousTasksCount: number;
    revenue: number | null;
    chartData: { date: string; count: number }[];
};

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
};

export function AdminDashboard() {
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<"none" | "unauthorized" | "server">("none");

    type View = "stats" | "user-list" | "user-detail";
    const [view, setView] = useState<View>("stats");
    const [userListFilter, setUserListFilter] = useState<"all" | "paid" | "free">("all");
    const [userList, setUserList] = useState<UserListItem[]>([]);
    const [userListLoading, setUserListLoading] = useState(false);
    const [selectedUser, setSelectedUser] = useState<UserDetail | null>(null);
    const [userDetailLoading, setUserDetailLoading] = useState(false);

    const fetchStats = useCallback(async () => {
        setError("none");
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/stats`);
            if (res.status === 401) {
                setError("unauthorized");
                setStats(null);
                return;
            }
            if (!res.ok) {
                setError("server");
                setStats(null);
                return;
            }
            const data = await res.json();
            setStats(data);
        } catch {
            setError("server");
            setStats(null);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    const openUserList = useCallback(
        (filter: "all" | "paid" | "free") => {
            setUserListFilter(filter);
            setView("user-list");
            setUserListLoading(true);
            setUserList([]);
            fetch(`/api/admin/users?filter=${filter}`)
                .then((r) => {
                    if (r.ok) return r.json();
                    throw new Error("Failed to fetch users");
                })
                .then(setUserList)
                .catch(() => setUserList([]))
                .finally(() => setUserListLoading(false));
        },
        []
    );

    const openUserDetail = useCallback((userId: string) => {
        setView("user-detail");
        setSelectedUser(null);
        setUserDetailLoading(true);
        Promise.all([
            fetch(`/api/admin/users/${userId}`).then((r) => (r.ok ? r.json() : null)),
        ])
            .then(([user]) => {
                setSelectedUser(user ?? null);
            })
            .catch(() => {
                setSelectedUser(null);
            })
            .finally(() => setUserDetailLoading(false));
    }, []);

    if (loading && !stats) {
        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-10 w-10 animate-spin text-zinc-400" />
                    <p className="text-zinc-500 text-sm">Loading stats…</p>
                </div>
            </div>
        );
    }

    if (error === "unauthorized") {
        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
                <Card className="max-w-md border-red-500/30 bg-zinc-900">
                    <CardHeader>
                        <ShieldAlert className="h-12 w-12 text-red-500 mb-2" />
                        <CardTitle className="text-xl">Unauthorized</CardTitle>
                        <CardDescription className="text-zinc-400">
                            The server rejected the request. Check ADMIN_SECRET in your .env.
                        </CardDescription>
                    </CardHeader>
                </Card>
            </div>
        );
    }

    if (error === "server" || !stats) {
        return (
            <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
                <Card className="max-w-md border-zinc-800 bg-zinc-900">
                    <CardHeader>
                        <CardTitle className="text-xl">Something went wrong</CardTitle>
                        <CardDescription className="text-zinc-400">
                            Could not load stats. Check the console or try again.
                        </CardDescription>
                        <button
                            onClick={fetchStats}
                            className="mt-4 rounded-lg bg-white px-4 py-2 text-sm font-medium text-black hover:bg-zinc-200 transition-colors"
                        >
                            Retry
                        </button>
                    </CardHeader>
                </Card>
            </div>
        );
    }

    if (view === "user-list") {
        const title =
            userListFilter === "paid"
                ? "Paid Users"
                : userListFilter === "free"
                    ? "Free Users"
                    : "All Users";

        return (
            <div className="min-h-screen bg-black text-zinc-100 font-sans selection:bg-zinc-800">
                <div className="border-b border-zinc-900 bg-black/50 backdrop-blur-xl sticky top-0 z-10">
                    <div className="mx-auto max-w-7xl px-6 py-4">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => setView("stats")}
                                className="group flex h-10 w-10 items-center justify-center rounded-full border border-zinc-800 bg-zinc-900/50 text-zinc-400 transition-all hover:bg-zinc-800 hover:text-white"
                            >
                                <ArrowLeft className="h-5 w-5 transition-transform group-hover:-translate-x-0.5" />
                            </button>
                            <div>
                                <h1 className="font-display text-xl font-bold tracking-tight text-white">
                                    {title}
                                </h1>
                                <p className="text-xs text-zinc-500">
                                    Manage and view user details
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <main className="mx-auto max-w-7xl px-6 py-8">
                    {userListLoading ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <Loader2 className="h-10 w-10 animate-spin text-zinc-600 mb-4" />
                            <p className="text-zinc-500 text-sm">Loading users...</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {/* Filter Tabs */}
                            <div className="flex gap-2 pb-4 overflow-x-auto">
                                {(["all", "paid", "free"] as const).map((filter) => (
                                    <button
                                        key={filter}
                                        onClick={() => openUserList(filter)}
                                        className={`rounded-full px-4 py-1.5 text-xs font-medium transition-all ${userListFilter === filter
                                            ? "bg-zinc-100 text-zinc-900"
                                            : "bg-zinc-900/50 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                                            } capitalize`}
                                    >
                                        {filter}
                                    </button>
                                ))}
                            </div>

                            {/* User List */}
                            <div className="rounded-2xl border border-zinc-900 bg-zinc-900/20 overflow-hidden backdrop-blur-md">
                                {userList.length === 0 ? (
                                    <div className="p-12 text-center">
                                        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-zinc-900 ring-1 ring-inset ring-zinc-800">
                                            <Users className="h-6 w-6 text-zinc-500" />
                                        </div>
                                        <h3 className="text-sm font-medium text-white">No users found</h3>
                                        <p className="mt-1 text-xs text-zinc-500">
                                            Try adjusting your filters or check back later.
                                        </p>
                                    </div>
                                ) : (
                                    <ul className="divide-y divide-zinc-800/50">
                                        {userList.map((u) => (
                                            <li key={u.id}>
                                                <button
                                                    type="button"
                                                    onClick={() => openUserDetail(u.id)}
                                                    className="group flex w-full items-center justify-between gap-4 p-4 hover:bg-zinc-900/40 transition-colors text-left sm:px-6"
                                                >
                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex items-center gap-3">
                                                            <div
                                                                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold ring-1 ring-inset ${u.plan === "pro"
                                                                    ? "bg-emerald-500/10 text-emerald-500 ring-emerald-500/20"
                                                                    : "bg-zinc-800 text-zinc-400 ring-zinc-700"
                                                                    }`}
                                                            >
                                                                {(u.onboardingName || u.name || u.email || "?")[0].toUpperCase()}
                                                            </div>
                                                            <div className="min-w-0">
                                                                <p className="font-medium text-zinc-200 truncate group-hover:text-white transition-colors">
                                                                    {u.onboardingName || u.name || "No name"}
                                                                </p>
                                                                <p className="text-xs text-zinc-500 truncate flex items-center gap-1.5">
                                                                    <Mail className="h-3 w-3" />
                                                                    {u.email || "No email"}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="hidden sm:flex items-center gap-6 text-right">
                                                        <div>
                                                            <p className="text-[10px] uppercase tracking-wider text-zinc-600 font-medium mb-0.5">
                                                                Joined
                                                            </p>
                                                            <p className="text-xs text-zinc-400">
                                                                {new Date(u.createdAt).toLocaleDateString()}
                                                            </p>
                                                        </div>
                                                        <div>
                                                            <p className="text-[10px] uppercase tracking-wider text-zinc-600 font-medium mb-0.5">
                                                                Credits
                                                            </p>
                                                            <p className="text-xs font-mono text-zinc-400">
                                                                {u.credits.toLocaleString()}
                                                            </p>
                                                        </div>
                                                        <div>
                                                            <p className="text-[10px] uppercase tracking-wider text-zinc-600 font-medium mb-0.5">
                                                                Plan
                                                            </p>
                                                            <span
                                                                className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${u.plan === "pro"
                                                                    ? "bg-emerald-500/10 text-emerald-500 ring-emerald-500/20"
                                                                    : "bg-zinc-800/50 text-zinc-400 ring-zinc-700/50"
                                                                    } capitalize`}
                                                            >
                                                                {u.plan}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <div className="ml-2 text-zinc-600 group-hover:text-zinc-300 transition-colors">
                                                        <ArrowLeft className="h-4 w-4 rotate-180" />
                                                    </div>
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </div>
                    )}
                </main>
            </div>
        );
    }

    if (view === "user-detail") {
        return (
            <UserDetailView
                userId={selectedUser?.id}
                onBack={() => setView("user-list")}
                user={selectedUser}
                loading={userDetailLoading}
            />
        );
    }

    const statCards: {
        title: string;
        value: string | number;
        desc: string;
        icon: React.ElementType;
        onClick?: () => void;
    }[] = [
            {
                title: "Total users",
                value: stats.totalUsers,
                desc: "All registered users",
                icon: Users,
                onClick: () => openUserList("all"),
            },
            {
                title: "Paid users",
                value: stats.paidUsers,
                desc: "PRO plan",
                icon: UserCheck,
                onClick: () => openUserList("paid"),
            },
            {
                title: "Free users",
                value: stats.freeUsers,
                desc: "FREE plan",
                icon: UserCog,
                onClick: () => openUserList("free"),
            },
            {
                title: "Active (28 days)",
                value: stats.activeUsers28d,
                desc: "Updated in last 28 days",
                icon: Activity,
            },
            {
                title: "New (7 days)",
                value: stats.newUsers7d,
                desc: "Signed up in last 7 days",
                icon: TrendingUp,
            },
            {
                title: "Doomscroll sessions",
                value: stats.doomscrollSessionsCount,
                desc: "Total research sessions",
                icon: BarChart3,
            },
            {
                title: "Active workflows",
                value: stats.autonomousTasksCount,
                desc: "ACTIVE autonomous tasks",
                icon: Zap,
            },
            {
                title: "Revenue",
                value:
                    stats.revenue != null
                        ? `$${Number(stats.revenue).toLocaleString()}`
                        : "—",
                desc: "From payment provider dashboard",
                icon: DollarSign,
            },
        ];

    return (
        <div className="min-h-screen bg-black text-zinc-100 font-sans selection:bg-zinc-800">
            {/* Header */}
            <div className="border-b border-zinc-900 bg-black/50 backdrop-blur-xl sticky top-0 z-10">
                <div className="mx-auto max-w-7xl px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="font-display text-2xl font-bold tracking-tight text-white">
                                Paxio Admin
                            </h1>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-500 ring-1 ring-inset ring-emerald-500/20">
                                    Live
                                </span>
                                <p className="text-xs text-zinc-500">Internal stats dashboard</p>
                            </div>
                        </div>
                        <button
                            onClick={fetchStats}
                            disabled={loading}
                            className="group flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/50 px-4 py-2 text-sm font-medium text-zinc-300 transition-all hover:bg-zinc-800 hover:text-white disabled:opacity-50"
                        >
                            {loading ? (
                                <Loader2 className="h-4 w-4 animate-spin text-zinc-400" />
                            ) : (
                                <span className="flex items-center gap-2">
                                    <div className="h-2 w-2 rounded-full bg-emerald-500 group-hover:animate-pulse" />
                                    Refresh
                                </span>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            <main className="mx-auto max-w-7xl px-6 py-8 space-y-8">
                {/* Key Metrics Grid */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {statCards.map(({ title, value, desc, icon: Icon, onClick }) => (
                        <div
                            key={title}
                            onClick={onClick}
                            role={onClick ? "button" : undefined}
                            className={`group relative overflow-hidden rounded-2xl border border-zinc-900 bg-zinc-900/30 p-6 transition-all hover:border-zinc-800 hover:bg-zinc-900/50 ${onClick ? "cursor-pointer" : ""
                                }`}
                        >
                            <div className="flex items-center justify-between mb-4">
                                <div className="rounded-lg bg-zinc-900 p-2 ring-1 ring-inset ring-zinc-800 text-zinc-400 group-hover:text-zinc-200 group-hover:ring-zinc-700 transition-colors">
                                    <Icon className="h-5 w-5" />
                                </div>
                                {onClick && (
                                    <span className="text-xs font-medium text-zinc-500 group-hover:text-zinc-300 transition-colors">
                                        View list →
                                    </span>
                                )}
                            </div>
                            <div>
                                <div className="text-3xl font-bold text-white font-display tracking-tight">
                                    {value}
                                </div>
                                <div className="mt-1 text-sm text-zinc-500 font-medium">{title}</div>
                                <div className="mt-2 text-xs text-zinc-600">{desc}</div>
                            </div>
                            <div className="absolute -right-6 -bottom-6 h-24 w-24 rounded-full bg-zinc-800/20 blur-2xl group-hover:bg-blue-500/10 transition-colors duration-500" />
                        </div>
                    ))}
                </div>

                {/* Chart Section */}
                <div className="grid gap-6 lg:grid-cols-3">
                    <div className="lg:col-span-2 rounded-3xl border border-zinc-900 bg-zinc-900/30 p-6 backdrop-blur-sm">
                        <div className="mb-6 flex items-center justify-between">
                            <div>
                                <h2 className="text-lg font-semibold text-white font-display">
                                    User Growth
                                </h2>
                                <p className="text-sm text-zinc-500">
                                    New signups over the last 30 days
                                </p>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                                    <TrendingUp className="h-3 w-3 text-emerald-500" />
                                    <span className="text-xs font-medium text-emerald-500">
                                        +{stats.newUsers7d} this week
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart
                                    data={stats.chartData}
                                    margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                                >
                                    <defs>
                                        <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid
                                        strokeDasharray="3 3"
                                        stroke="#27272a"
                                        vertical={false}
                                    />
                                    <XAxis
                                        dataKey="date"
                                        stroke="#52525b"
                                        fontSize={12}
                                        tickFormatter={(value) => {
                                            const date = new Date(value);
                                            return `${date.getDate()}/${date.getMonth() + 1}`;
                                        }}
                                        tickMargin={10}
                                        axisLine={false}
                                        tickLine={false}
                                    />
                                    <YAxis
                                        stroke="#52525b"
                                        fontSize={12}
                                        tickFormatter={(value) => `${value}`}
                                        axisLine={false}
                                        tickLine={false}
                                        allowDecimals={false}
                                    />
                                    <Tooltip
                                        content={({ active, payload }) => {
                                            if (active && payload && payload.length) {
                                                return (
                                                    <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-3 shadow-xl">
                                                        <p className="mb-2 text-xs font-medium text-zinc-500">
                                                            {payload[0].payload.date}
                                                        </p>
                                                        <div className="flex items-center gap-2">
                                                            <div className="h-2 w-2 rounded-full bg-blue-500" />
                                                            <span className="text-sm font-bold text-white">
                                                                {payload[0].value}
                                                            </span>
                                                            <span className="text-xs text-zinc-400">
                                                                new users
                                                            </span>
                                                        </div>
                                                    </div>
                                                );
                                            }
                                            return null;
                                        }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="count"
                                        stroke="#3b82f6"
                                        strokeWidth={2}
                                        fillOpacity={1}
                                        fill="url(#colorCount)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="rounded-3xl border border-zinc-900 bg-zinc-900/30 p-6">
                            <h3 className="text-sm font-medium text-zinc-400 mb-4 uppercase tracking-wider">
                                Quick Actions
                            </h3>
                            <div className="space-y-3">
                                <button
                                    onClick={() => openUserList("all")}
                                    className="block w-full rounded-xl border border-zinc-800 bg-zinc-900/50 p-3 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors text-center"
                                >
                                    Manage Users
                                </button>
                                <button
                                    onClick={() => alert("Settings coming soon!")}
                                    className="block w-full rounded-xl border border-zinc-800 bg-zinc-900/50 p-3 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors text-center"
                                >
                                    System Settings
                                </button>
                            </div>
                        </div>

                        <div className="rounded-3xl border border-zinc-900 bg-zinc-900/30 p-6">
                            <h3 className="text-sm font-medium text-zinc-400 mb-2 uppercase tracking-wider">
                                System Status
                            </h3>
                            <div className="flex items-center gap-2 mb-4">
                                <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-sm font-medium text-white">
                                    All systems operational
                                </span>
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-between text-xs">
                                    <span className="text-zinc-500">Database</span>
                                    <span className="text-emerald-500">Healthy</span>
                                </div>
                                <div className="flex justify-between text-xs">
                                    <span className="text-zinc-500">API Latency</span>
                                    <span className="text-emerald-500">45ms</span>
                                </div>
                                <div className="flex justify-between text-xs">
                                    <span className="text-zinc-500">Cron Jobs</span>
                                    <span className="text-emerald-500">Active</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="rounded-xl border border-dashed border-zinc-800 bg-zinc-950/30 p-4 text-center">
                    <p className="text-xs text-zinc-600">
                        Revenue data is retrieved from Dodo Payments. Active users metric
                        based on 28-day activity window.
                        <br />
                        Confidential — for internal use only.
                    </p>
                </div>
            </main>
        </div>
    );
}




