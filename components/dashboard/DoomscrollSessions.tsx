"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Loader2,
  CheckCircle,
  XCircle,
  ChevronDown,
  Youtube,
  Linkedin,
  Twitter,
  Facebook,
  Instagram,
  Github,
  Globe,
  Newspaper,
  Tv,
  Monitor,
  MessageCircle
} from "lucide-react";
import axios from "axios";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useCallback } from "react";

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

const getPlatformIcon = (platform: string) => {
  const p = platform.toLowerCase();
  if (p.includes("youtube")) return <Youtube size={14} />;
  if (p.includes("linkedin")) return <Linkedin size={14} />;
  if (p.includes("twitter") || p.includes("x.com")) return <Twitter size={14} />;
  if (p.includes("facebook")) return <Facebook size={14} />;
  if (p.includes("instagram")) return <Instagram size={14} />;
  if (p.includes("github")) return <Github size={14} />;
  if (p.includes("reddit")) return <MessageCircle size={14} />; // Reddit often uses a face/circle, closest generic is MessageCircle
  if (p.includes("btc") || p.includes("bbc")) return <Tv size={14} />;
  if (p.includes("reuters") || p.includes("apnews")) return <Newspaper size={14} />;
  if (p.includes("techcrunch")) return <Monitor size={14} />;
  
  return <Globe size={14} />;
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

  const fetchSessions = useCallback(async () => {
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
  }, [userId]);

  // Fetch sessions on mount and auto-refresh if any are running
  useEffect(() => {
    if (isOpen && userId) {
      fetchSessions();
    }
  }, [isOpen, userId, fetchSessions]);

  // Auto-refresh while sessions are running
  useEffect(() => {
    const hasRunning = sessions.some((s) => s.status === "RUNNING");
    if (!hasRunning || !isOpen) return;

    const interval = setInterval(() => {
      fetchSessions();
    }, 3000); // Refresh every 3 seconds

    return () => clearInterval(interval);
  }, [sessions, isOpen, fetchSessions]);

  const runningCount = sessions.filter((s) => s.status === "RUNNING").length;
  const doneCount = sessions.filter((s) => s.status === "DONE").length;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Modal */}
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center px-4 pointer-events-none"
            initial={{ opacity: 0, scale: 0.96, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 20 }}
            transition={{ type: "spring", stiffness: 240, damping: 22 }}
          >
            {/* WIDER MODAL: max-w-5xl, max-h-[90vh] */}
            <div className="pointer-events-auto w-full max-w-5xl max-h-[90vh] rounded-2xl flex flex-col
              bg-[#0A0A0A]/95 backdrop-blur-2xl border border-white/[0.08] shadow-[0_0_80px_-20px_rgba(0,0,0,0.8)]"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-white/[0.06]">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white/[0.06] border border-white/[0.08] flex items-center justify-center">
                    <Search size={18} className="text-zinc-200" />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-zinc-100 tracking-tight">
                      Doomscroll Sessions
                    </h2>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      {runningCount > 0 && (
                        <span className="text-amber-400 font-medium animate-pulse">
                          {runningCount} active ·{" "}
                        </span>
                      )}
                      {doneCount} completed
                    </p>
                  </div>
                </div>
                <button
                  onClick={fetchSessions}
                  disabled={isLoading}
                  className="p-2.5 rounded-xl hover:bg-white/[0.06] text-zinc-400 hover:text-white transition-colors border border-transparent hover:border-white/[0.08]"
                >
                  <Loader2
                    size={18}
                    className={isLoading ? "animate-spin" : ""}
                  />
                </button>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto px-6 py-5 space-y-3 custom-scrollbar">
                {isLoading && sessions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 gap-3">
                    <Loader2 size={28} className="animate-spin text-zinc-600" />
                    <p className="text-sm text-zinc-500">Loading sessions...</p>
                  </div>
                ) : sessions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center space-y-4">
                    <div className="w-16 h-16 rounded-full bg-white/[0.03] border border-white/[0.05] flex items-center justify-center">
                       <Search size={24} className="text-zinc-600" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-zinc-300 font-medium">No sessions found</p>
                      <p className="text-sm text-zinc-500 max-w-xs mx-auto">
                        Start a new research session by asking the agent to &quot;Research [topic] on [platform]&quot;
                      </p>
                    </div>
                  </div>
                ) : (
                  sessions.map((session) => (
                    <div
                      key={session.id}
                      className={`
                        rounded-xl border transition-all duration-300 overflow-hidden
                        ${expandedSession === session.id 
                          ? 'bg-white/[0.04] border-white/[0.08] shadow-lg shadow-black/20' 
                          : 'bg-white/[0.02] border-white/[0.04] hover:bg-white/[0.04] hover:border-white/[0.08]'
                        }
                      `}
                    >
                      {/* Session Header */}
                      <button
                        onClick={() =>
                          setExpandedSession(
                            expandedSession === session.id ? null : session.id
                          )
                        }
                        className="w-full p-4 flex items-start justify-between gap-4 text-left"
                      >
                        <div className="flex-1 space-y-1.5">
                          <div className="flex items-center gap-2.5">
                            {/* Status indicator */}
                            {session.status === "RUNNING" ? (
                              <div className="relative flex items-center justify-center w-3.5 h-3.5">
                                <span className="absolute w-full h-full rounded-full bg-amber-500/20 animate-ping" />
                                <div className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
                              </div>
                            ) : session.status === "DONE" ? (
                              <CheckCircle
                                size={15}
                                className="text-emerald-500/90"
                              />
                            ) : (
                              <XCircle size={15} className="text-red-500/90" />
                            )}
                            <span className={`text-sm font-medium ${expandedSession === session.id ? 'text-zinc-100' : 'text-zinc-200'}`}>
                              {session.topic}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-[11px] text-zinc-500 pl-6">
                            <span>{new Date(session.createdAt).toLocaleDateString()}</span>
                            <span>•</span>
                            <span>{new Date(session.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                            {session.duration && (
                              <>
                                <span>•</span>
                                <span className="text-zinc-400">
                                  {session.duration}
                                </span>
                              </>
                            )}
                          </div>

                          <div className="flex flex-wrap gap-1.5 mt-2 pl-6">
                            {session.platforms.map((p) => (
                              <span
                                key={p}
                                className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded-md bg-white/[0.06] border border-white/[0.06] text-zinc-400"
                              >
                                {/** Icon instead of emoji */}
                                <span className="text-zinc-500">{getPlatformIcon(p)}</span>
                                {p}
                              </span>
                            ))}
                            {session.status === "RUNNING" && (
                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-400 animate-pulse">
                                RESEARCHING
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 pt-1">
                          {/** User requested removal of link button */}
                          <div className={`p-1 transition-transform duration-300 ${expandedSession === session.id ? 'rotate-180' : ''}`}>
                            <ChevronDown size={16} className="text-zinc-500" />
                          </div>
                        </div>
                      </button>

                      {/* Expanded Content */}
                      <AnimatePresence>
                        {expandedSession === session.id && (
                          <motion.div 
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="border-t border-white/[0.06]"
                          >
                            <div className="p-4 space-y-3 bg-black/20">
                              {session.results.length === 0 ? (
                                <div className="text-center py-6 px-4 rounded-lg border border-dashed border-zinc-800">
                                  <p className="text-xs text-zinc-500 italic">
                                    {session.status === "RUNNING"
                                      ? "Research in progress..."
                                      : "No results checked yet."}
                                  </p>
                                </div>
                              ) : (
                                session.results.map((result) => (
                                  <div
                                    key={result.id}
                                    className="rounded-lg bg-[#111] border border-zinc-800/60 overflow-hidden group"
                                  >
                                    <button
                                      onClick={() =>
                                        setExpandedResult(
                                          expandedResult === result.id
                                            ? null
                                            : result.id
                                        )
                                      }
                                      className="w-full p-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors"
                                    >
                                      <div className="flex items-center gap-3">
                                        <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/[0.04] text-zinc-400">
                                          {getPlatformIcon(result.platform)}
                                        </span>
                                        <span className="text-sm font-semibold text-zinc-200 tracking-wide">
                                          {result.platform.toUpperCase()}
                                        </span>
                                      </div>
                                      
                                      <div className={`transition-transform duration-200 ${expandedResult === result.id ? 'rotate-180' : ''}`}>
                                        <ChevronDown size={16} className="text-zinc-600 group-hover:text-zinc-400" />
                                      </div>
                                    </button>

                                    {expandedResult === result.id && (
                                      <motion.div 
                                        initial={{ opacity: 0 }} 
                                        animate={{ opacity: 1 }}
                                        // Removed max-h constraint to allow full reading, 
                                        // Removed black bg to fit seamless with card
                                        className="p-6 border-t border-zinc-800/60 bg-transparent"
                                      >
                                        <div className="prose prose-invert prose-lg max-w-none
                                          prose-headings:text-zinc-100 prose-headings:font-bold prose-headings:tracking-tight
                                          prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg
                                          prose-p:text-zinc-300 prose-p:leading-8 prose-p:text-base
                                          prose-a:text-indigo-400 prose-a:no-underline hover:prose-a:underline
                                          prose-strong:text-zinc-100 prose-strong:font-bold
                                          prose-ul:text-zinc-300 prose-ul:pl-6 prose-ul:list-disc
                                          prose-ol:text-zinc-300 prose-ol:pl-6
                                          prose-li:marker:text-zinc-500 prose-li:my-2
                                          prose-code:text-amber-500 prose-code:bg-amber-500/10 prose-code:px-2 prose-code:py-0.5 prose-code:rounded-md prose-code:text-sm prose-code:font-mono
                                          prose-pre:bg-zinc-950 prose-pre:border prose-pre:border-zinc-800 prose-pre:rounded-xl prose-pre:p-4
                                          prose-blockquote:border-l-4 prose-blockquote:border-white/20 prose-blockquote:pl-6 prose-blockquote:italic prose-blockquote:text-zinc-400
                                          prose-hr:border-zinc-800"
                                        >
                                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                            {result.rawOutput}
                                          </ReactMarkdown>
                                        </div>
                                      </motion.div>
                                    )}

                                    {expandedResult !== result.id &&
                                      result.preview && (
                                        <div className="px-4 pb-4 pl-[3.25rem]">
                                            <p className="text-xs text-zinc-500 line-clamp-2 leading-relaxed">
                                            {result.preview}
                                            </p>
                                        </div>
                                      )}
                                  </div>
                                ))
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))
                )}
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between px-6 py-5 border-t border-white/[0.06] bg-black/20">
                <span className="text-[10px] font-medium text-zinc-500 uppercase tracking-widest pl-1">
                  Paxio Research · Beta
                </span>

                <button
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] text-xs font-semibold text-zinc-300 hover:text-white transition-all hover:shadow-[0_0_15px_rgba(255,255,255,0.05)] active:scale-95"
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
