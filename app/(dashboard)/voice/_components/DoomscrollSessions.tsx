"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  ChevronDown,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import axios from "axios";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface DoomscrollResult {
  id: string;
  platform: string;
  rawOutput: string;
  preview: string | null;
  createdAt: string;
}

interface DoomscrollSession {
  id: string;
  prompt: string;
  topic: string;
  platforms: string[];
  status: "RUNNING" | "DONE" | "ERROR";
  shareUrl: string | null;
  duration: string | null;
  createdAt: string;
  results: DoomscrollResult[];
}

interface DoomscrollSessionsProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
}

const platformEmojis: Record<string, string> = {
  youtube: "▶️",
  google: "🔍",
  bbc: "📺",
  reuters: "📰",
  apnews: "📡",
  techcrunch: "💻",
  reddit: "🔴",
  linkedin: "💼",
  x: "𝕏",
};

export const DoomscrollSessions: React.FC<DoomscrollSessionsProps> = ({
  isOpen,
  onClose,
  userId,
}) => {
  const [sessions, setSessions] = useState<DoomscrollSession[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedSession, setExpandedSession] = useState<string | null>(null);
  const [expandedResult, setExpandedResult] = useState<string | null>(null);

  // Fetch sessions on mount and auto-refresh if any are running
  useEffect(() => {
    if (isOpen && userId) {
      fetchSessions();
    }
  }, [isOpen, userId]);

  // Auto-refresh while sessions are running
  useEffect(() => {
    const hasRunning = sessions.some((s) => s.status === "RUNNING");
    if (!hasRunning || !isOpen) return;

    const interval = setInterval(() => {
      fetchSessions();
    }, 3000); // Refresh every 3 seconds

    return () => clearInterval(interval);
  }, [sessions, isOpen]);

  async function fetchSessions() {
    if (!userId) return;

    setIsLoading(true);
    try {
      const res = await axios.get<DoomscrollSession[]>(
        `/api/doomscroll-sessions/${userId}`
      );
      setSessions(res.data);
    } catch (err) {
      console.error("Failed to fetch doomscroll sessions:", err);
      setSessions([]);
    } finally {
      setIsLoading(false);
    }
  }

  const runningCount = sessions.filter((s) => s.status === "RUNNING").length;
  const doneCount = sessions.filter((s) => s.status === "DONE").length;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Modal */}
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center px-4"
            initial={{ opacity: 0, scale: 0.96, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 20 }}
            transition={{ type: "spring", stiffness: 240, damping: 22 }}
          >
            <div className="w-full max-w-2xl max-h-[80vh] rounded-2xl bg-zinc-900 border border-zinc-800 shadow-2xl flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-zinc-800 flex items-center justify-center">
                    <Search size={16} className="text-zinc-200" />
                  </div>
                  <div>
                    <h2 className="text-sm font-medium text-zinc-100">
                      Doomscroll Sessions
                    </h2>
                    <p className="text-xs text-zinc-500">
                      {runningCount > 0 && (
                        <span className="text-amber-400">
                          {runningCount} running ·{" "}
                        </span>
                      )}
                      {doneCount} completed
                    </p>
                  </div>
                </div>
                <button
                  onClick={fetchSessions}
                  disabled={isLoading}
                  className="p-2 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200"
                >
                  <Loader2
                    size={16}
                    className={isLoading ? "animate-spin" : ""}
                  />
                </button>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3 custom-scrollbar">
                {isLoading && sessions.length === 0 ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 size={24} className="animate-spin text-zinc-500" />
                  </div>
                ) : sessions.length === 0 ? (
                  <div className="text-center py-8 text-zinc-500 text-sm">
                    No doomscroll sessions yet. Try "Research AI on Reddit"!
                  </div>
                ) : (
                  sessions.map((session) => (
                    <div
                      key={session.id}
                      className="rounded-xl bg-zinc-950 border border-zinc-800 overflow-hidden"
                    >
                      {/* Session Header */}
                      <button
                        onClick={() =>
                          setExpandedSession(
                            expandedSession === session.id ? null : session.id
                          )
                        }
                        className="w-full p-4 flex items-start justify-between gap-3 hover:bg-zinc-900/50"
                      >
                        <div className="flex-1 text-left space-y-1">
                          <div className="flex items-center gap-2">
                            {/* Status indicator */}
                            {session.status === "RUNNING" ? (
                              <Loader2
                                size={14}
                                className="animate-spin text-amber-400"
                              />
                            ) : session.status === "DONE" ? (
                              <CheckCircle
                                size={14}
                                className="text-emerald-500"
                              />
                            ) : (
                              <XCircle size={14} className="text-red-500" />
                            )}
                            <span className="text-sm font-medium text-zinc-100">
                              {session.topic}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-[11px] text-zinc-500">
                            <Clock size={11} />
                            {new Date(session.createdAt).toLocaleString()}
                            {session.duration && (
                              <span className="text-zinc-400">
                                · {session.duration}
                              </span>
                            )}
                          </div>

                          <div className="flex gap-1.5 mt-1">
                            {session.platforms.map((p) => (
                              <span
                                key={p}
                                className="text-[11px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400"
                              >
                                {platformEmojis[p] || "📌"} {p}
                              </span>
                            ))}
                            {session.status === "RUNNING" && (
                              <span className="text-[11px] px-1.5 py-0.5 rounded bg-amber-900/30 text-amber-400 animate-pulse">
                                Researching...
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {session.shareUrl && (
                            <a
                              href={session.shareUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="p-1.5 rounded hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300"
                            >
                              <ExternalLink size={14} />
                            </a>
                          )}
                          {expandedSession === session.id ? (
                            <ChevronDown size={16} className="text-zinc-500" />
                          ) : (
                            <ChevronRight size={16} className="text-zinc-500" />
                          )}
                        </div>
                      </button>

                      {/* Expanded Content */}
                      {expandedSession === session.id && (
                        <div className="border-t border-zinc-800 p-4 space-y-3">
                          {session.results.length === 0 ? (
                            <p className="text-xs text-zinc-500 text-center py-4">
                              {session.status === "RUNNING"
                                ? "Still researching... results will appear here."
                                : "No results found."}
                            </p>
                          ) : (
                            session.results.map((result) => (
                              <div
                                key={result.id}
                                className="rounded-lg bg-zinc-900 border border-zinc-800 overflow-hidden"
                              >
                                <button
                                  onClick={() =>
                                    setExpandedResult(
                                      expandedResult === result.id
                                        ? null
                                        : result.id
                                    )
                                  }
                                  className="w-full p-3 flex items-center justify-between hover:bg-zinc-800/50"
                                >
                                  <span className="text-sm text-zinc-200">
                                    {platformEmojis[result.platform] || "📌"}{" "}
                                    {result.platform.toUpperCase()}
                                  </span>
                                  {expandedResult === result.id ? (
                                    <ChevronDown
                                      size={14}
                                      className="text-zinc-500"
                                    />
                                  ) : (
                                    <ChevronRight
                                      size={14}
                                      className="text-zinc-500"
                                    />
                                  )}
                                </button>

                                {expandedResult === result.id && (
                                  <div className="p-3 pt-3 border-t border-zinc-800 max-h-96 overflow-y-auto custom-scrollbar">
                                    <div className="prose prose-invert prose-sm max-w-none
                                      prose-headings:text-zinc-100 prose-headings:font-semibold prose-headings:mt-4 prose-headings:mb-2
                                      prose-h1:text-lg prose-h2:text-base prose-h3:text-sm
                                      prose-p:text-zinc-300 prose-p:leading-relaxed prose-p:my-2
                                      prose-a:text-blue-400 prose-a:no-underline hover:prose-a:underline
                                      prose-strong:text-zinc-200 prose-strong:font-semibold
                                      prose-ul:text-zinc-300 prose-ul:my-2 prose-ul:pl-4
                                      prose-ol:text-zinc-300 prose-ol:my-2 prose-ol:pl-4
                                      prose-li:my-0.5 prose-li:marker:text-zinc-500
                                      prose-code:text-amber-400 prose-code:bg-zinc-800 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-xs
                                      prose-pre:bg-zinc-800 prose-pre:border prose-pre:border-zinc-700 prose-pre:rounded-lg prose-pre:p-3 prose-pre:overflow-x-auto
                                      prose-blockquote:border-l-2 prose-blockquote:border-zinc-600 prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-zinc-400
                                      prose-hr:border-zinc-700
                                    ">
                                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                        {result.rawOutput}
                                      </ReactMarkdown>
                                    </div>
                                  </div>
                                )}

                                {expandedResult !== result.id &&
                                  result.preview && (
                                    <p className="px-3 pb-3 text-xs text-zinc-500 line-clamp-2">
                                      {result.preview}
                                    </p>
                                  )}
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between px-5 py-4 border-t border-zinc-800">
                <span className="text-[10px] text-zinc-500">
                  Paxio · Doomscroll Sessions
                </span>

                <button
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl border border-zinc-800 text-xs text-zinc-400 hover:text-zinc-200"
                >
                  Close
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
