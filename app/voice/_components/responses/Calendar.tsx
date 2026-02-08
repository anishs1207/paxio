import React from "react";
import { useState } from "react";
import {
    Calendar,
    Clock,
    CheckCircle,
    ListTodo,
    ChevronUp,
    ChevronDown
} from "lucide-react";


// {data?.calendar?.events?.map((calendarEvent: any, index: any) => (
//     <CalendarPreview
//         key={index}
//         date={calendarEvent.date}
//         time={calendarEvent.time}
//         title={calendarEvent.title}
//         description={calendarEvent.description}
//         summarized={calendarEvent.summarized}
//     />

// ))}

const CalendarPreview = ({
    date,
    time,
    title,
    description,
    summarized,
}) => {
    const [expanded, setExpanded] = useState(false);

    return (
        <div
            className="mb-5 w-full max-w-4xl mx-auto
                       rounded-2xl
                       bg-zinc-900/80 backdrop-blur
                       border border-zinc-800
                       shadow-xl overflow-hidden"
        >
            {/* Header */}
            <button
                onClick={() => setExpanded(!expanded)}
                className="w-full flex items-center justify-between
                           px-5 py-3 border-b border-zinc-800
                           hover:bg-zinc-800/40 transition"
            >
                <h2 className="text-sm font-medium text-zinc-200 flex items-center gap-2">
                    <ListTodo size={16} className="text-emerald-400" />
                    Google Calendar
                </h2>

                {expanded ? (
                    <ChevronUp size={18} className="text-zinc-400" />
                ) : (
                    <ChevronDown size={18} className="text-zinc-400" />
                )}
            </button>

            {/* SUMMARY VIEW */}
            {!expanded && (
                <div className="px-5 py-4  space-y-3">
                    {/* Date & Time */}
                    <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-400">
                        <span className="flex items-center gap-1 bg-zinc-800/60 px-2 py-1 rounded-full">
                            <Calendar size={12} className="text-emerald-400" />
                            {/* Jan 13, 2026 */}
                            {date}
                        </span>
                        <span className="flex items-center gap-1 bg-zinc-800/60 px-2 py-1 rounded-full">
                            <Clock size={12} className="text-emerald-400" />
                            {/* 4:30 – 5:00 PM */}
                            {time}
                        </span>
                        <span className="bg-emerald-600/20 text-emerald-400 px-2 py-1 rounded-full font-medium">
                            Today
                        </span>
                    </div>

                    {/* Event Description */}
                    <p className="text-sm text-zinc-200 leading-relaxed">
                        {description}
                    </p>
                </div>

            )}

            {/* FULL VIEW */}
            {expanded && (
                <>
                    {/* Title */}
                    <div className="px-5 py-4 border-b border-zinc-800">
                        <h3 className="text-lg font-medium text-zinc-100">
                            {title}
                        </h3>
                        <div className=" py-4 space-y-4 text-sm text-zinc-200">
                            <div className="flex items-center gap-3">
                                <Clock size={18} className="text-zinc-400" />
                                <span>
                                    {/* Today · 4:30 – 5:00 PM · 30 min · Jan 16 2026 */}
                                    Today {time} {date}
                                </span>
                            </div>
                        </div>
                        <p className="text-sm text-zinc-400">
                            {summarized}
                        </p>
                    </div>
                </>
            )}
        </div>
    );
};

export default CalendarPreview;