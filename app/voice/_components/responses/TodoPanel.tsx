import React from "react";
import {
    Circle,
    Star,
    Sparkles,
    Clock,
    Calendar,
    CheckCircle
} from "lucide-react";

interface Todo {
    id: string;
    title: string;
    time?: string;
    priority?: "high" | "medium" | "low";
    completed?: boolean;
}

const TODOS: { section: string; items: Todo[] }[] = [
    {
        section: "Today",
        items: [
            {
                id: "1",
                title: "Review project roadmap",
                time: "4:30 – 5:00 PM",
                priority: "high",
            },
            {
                id: "2",
                title: "Reply to investor email",
                priority: "medium",
            },
        ],
    },
    {
        section: "Upcoming",
        items: [
            {
                id: "3",
                title: "Prepare demo for client",
                time: "Tomorrow",
                priority: "high",
            },
            {
                id: "4",
                title: "Organize design feedback",
                priority: "low",
            },
        ],
    },
];

const PriorityDot = ({ level }: { level?: Todo["priority"] }) => {
    if (!level) return null;

    const colors = {
        high: "bg-red-500",
        medium: "bg-yellow-500",
        low: "bg-emerald-500",
    };

    return (
        <span
            className={`w-2 h-2 rounded-full ${colors[level]}`}
        />
    );
};

const TodoPanel = () => {
    return (
        <div
            className="w-full max-w-3xl mx-auto
                       rounded-2xl
                       bg-zinc-900/80 backdrop-blur
                       border border-zinc-800
                       shadow-xl overflow-hidden"
        >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
                <div className="flex items-center gap-2">
                    <Sparkles size={18} className="text-emerald-400" />
                    <h2 className="text-sm font-medium text-zinc-100">
                        Your Tasks
                    </h2>
                </div>

                <span className="text-xs text-zinc-500">
                    Focus for today
                </span>
            </div>

            {/* Content */}
            <div className="px-5 py-4 space-y-6">
                {TODOS.map((group) => (
                    <div key={group.section}>
                        {/* Section Title */}
                        <div className="flex items-center gap-2 mb-3">
                            {group.section === "Today" ? (
                                <Clock size={14} className="text-zinc-400" />
                            ) : (
                                <Calendar size={14} className="text-zinc-400" />
                            )}
                            <h3 className="text-xs uppercase tracking-wide text-zinc-400">
                                {group.section}
                            </h3>
                        </div>

                        {/* Tasks */}
                        <div className="space-y-2">
                            {group.items.map((todo) => (
                                <div
                                    key={todo.id}
                                    className="flex items-start gap-3
                                               p-3 rounded-xl
                                               bg-zinc-800/60 hover:bg-zinc-800
                                               transition"
                                >
                                    {/* Checkbox */}
                                    <button className="mt-1">
                                        {todo.completed ? (
                                            <CheckCircle
                                                size={18}
                                                className="text-emerald-400"
                                            />
                                        ) : (
                                            <Circle
                                                size={18}
                                                className="text-zinc-500"
                                            />
                                        )}
                                    </button>

                                    {/* Content */}
                                    <div className="flex-1">
                                        <p className="text-sm text-zinc-100">
                                            {todo.title}
                                        </p>

                                        {todo.time && (
                                            <div className="flex items-center gap-2 mt-1 text-xs text-zinc-500">
                                                <Clock size={12} />
                                                {todo.time}
                                            </div>
                                        )}
                                    </div>

                                    {/* Priority */}
                                    <PriorityDot level={todo.priority} />
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-5 py-4 border-t border-zinc-800">
                <span className="text-xs text-zinc-500">
                    4 tasks remaining
                </span>

                <button
                    className="flex items-center gap-2
                               text-xs text-zinc-300
                               hover:text-white transition"
                >
                    <Star size={14} />
                    View all
                </button>
            </div>
        </div>
    );
};

export default TodoPanel;
