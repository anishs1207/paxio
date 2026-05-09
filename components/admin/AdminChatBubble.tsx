"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { User, Sparkles, ChevronDown, ChevronUp } from "lucide-react";

type AdminChatBubbleProps = {
  role: string;
  message: string;
  payload?: unknown;
  createdAt?: string;
};

export function AdminChatBubble({ role, message, payload, createdAt }: AdminChatBubbleProps) {
  const isUser = role === "user";
  const [showPayload, setShowPayload] = useState(false);
  const hasPayload = Boolean(payload && typeof payload === "object" && Object.keys(payload as object).length > 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex w-full ${isUser ? "justify-end" : "justify-start"}`}
    >
      <div
        className={`flex max-w-[calc(100%-1rem)] sm:max-w-[85%] md:max-w-[70%] gap-2 sm:gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}
      >
        <div
          className={`flex-shrink-0 w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center border ${isUser ? "bg-zinc-100 border-zinc-200 text-zinc-900" : "bg-zinc-900 border-zinc-800 text-zinc-400"}`}
        >
          {isUser ? (
            <User size={14} className="sm:w-4 sm:h-4" />
          ) : (
            <Sparkles size={14} className="sm:w-4 sm:h-4" />
          )}
        </div>
        <div className="flex flex-col gap-1 min-w-0">
          <div
            className={`px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm ${isUser ? "bg-zinc-100 text-zinc-900 rounded-tr-none" : "bg-zinc-900 border border-zinc-800 text-zinc-300 rounded-tl-none"}`}
          >
            <p className="whitespace-pre-wrap break-words">{message}</p>
            {
              !isUser && hasPayload && (
                <div className="mt-2 pt-2 border-t border-zinc-700">
                  <button
                    type="button"
                    onClick={() => setShowPayload((p) => !p)}
                    className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-400"
                  >
                    {showPayload ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                    {showPayload ? "Hide" : "Show"} payload
                  </button>
                  {showPayload && (
                    <pre className="mt-1 text-[10px] overflow-auto max-h-48 p-2 rounded bg-zinc-950 text-zinc-400">
                      {JSON.stringify(payload as object, null, 2)}
                    </pre>
                  )}
                </div>
              )}
          </div>
          <span
            className={`text-[10px] text-zinc-600 px-1 ${isUser ? "text-right" : "text-left"}`}
          >
            {isUser ? "User" : "Paxio"}
            {createdAt && ` · ${new Date(createdAt).toLocaleString()}`}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
