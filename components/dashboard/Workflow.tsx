"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Send,
  Loader2,
  Clock,
  CheckCircle,
  XCircle,
} from "lucide-react";
import axios from "axios";

interface WorkflowRun {
  id: string;
  runAt: string;
  success: boolean;
  summary?: string;
}

interface Workflow {
  id: string;
  prompt: string;
  description: string;
  schedule: string | null;
  status: "ACTIVE" | "INACTIVE";
  triggerType: string;
  createdAt: string;
  lastRunAt?: string;
  runs?: WorkflowRun[];
}

interface WorkflowFormBubbleProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
}

export const WorkflowFormBubble: React.FC<
  WorkflowFormBubbleProps
> = ({ isOpen, onClose, userId }) => {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const fetchWorkflows = useCallback(async () => {
    if (!userId) return;

    setIsLoading(true);
    try {
      const res = await axios.get<Workflow[]>(`/api/auto-workflow/${userId}`);
      setWorkflows(res.data);
    } catch (err) {
      console.error("Failed to fetch workflows:", err);
      setWorkflows([]);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // Fetch workflows on mount
  useEffect(() => {
    if (isOpen && userId) {
      fetchWorkflows();
    }
  }, [isOpen, userId, fetchWorkflows]);

  async function createWorkflow() {
    if (!prompt.trim() || isCreating) return;

    setIsCreating(true);
    try {
      const formData = new FormData();
      formData.append("prompt", prompt.trim());

      await axios.post("/api/voice-personal-agent", formData, {
        responseType: "json",
      });

      // Refresh workflows list
      await fetchWorkflows();
      setPrompt("");
    } catch (err) {
      console.error("Failed to create workflow:", err);
    } finally {
      setIsCreating(false);
    }
  }

  async function toggleWorkflowStatus(workflowId: string, currentStatus: string) {
    if (togglingId) return;

    setTogglingId(workflowId);
    const newStatus = currentStatus === "ACTIVE" ? "INACTIVE" : "ACTIVE";

    try {
      await axios.patch(`/api/auto-workflow/${userId}/${workflowId}`, {
        status: newStatus,
      });

      // Update local state
      setWorkflows((prev) =>
        prev.map((wf) =>
          wf.id === workflowId ? { ...wf, status: newStatus } : wf
        )
      );
    } catch (err) {
      console.error("Failed to toggle workflow status:", err);
    } finally {
      setTogglingId(null);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    createWorkflow();
  }

  const activeCount = workflows.filter((wf) => wf.status === "ACTIVE").length;

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
            <div className="w-full max-w-xl rounded-2xl bg-zinc-900 border border-zinc-800 shadow-2xl">

              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-zinc-800 flex items-center justify-center">
                    <Sparkles size={16} className="text-zinc-200" />
                  </div>
                  <div>
                    <h2 className="text-sm font-medium text-zinc-100">
                      Your workflows
                    </h2>
                    <p className="text-xs text-zinc-500">
                      {activeCount} active workflow{activeCount !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
              </div>

              {/* Body */}
              <div className="px-5 py-4 space-y-4">
                {/* Prompt Input */}
                <form onSubmit={handleSubmit} className="space-y-2">
                  <label className="text-xs text-zinc-400">
                    Create a new workflow
                  </label>
                  <div className="flex gap-2">
                    <input
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder="e.g., Every day at 9am send me unread emails"
                      className="flex-1 rounded-xl bg-zinc-950 border border-zinc-800 px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-700"
                      disabled={isCreating}
                    />
                    <button
                      type="submit"
                      disabled={!prompt.trim() || isCreating}
                      className="flex items-center justify-center w-10 h-10 rounded-xl bg-zinc-100 text-zinc-900 hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isCreating ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <Send size={16} />
                      )}
                    </button>
                  </div>
                </form>

                {/* Workflows List */}
                <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar">
                  {isLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 size={24} className="animate-spin text-zinc-500" />
                    </div>
                  ) : workflows.length === 0 ? (
                    <div className="text-center py-8 text-zinc-500 text-sm">
                      No workflows yet. Create one above!
                    </div>
                  ) : (
                    workflows.map((wf) => (
                      <div
                        key={wf.id}
                        className="rounded-xl bg-zinc-950 border border-zinc-800 p-4 space-y-2"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 space-y-1">
                            <p className="text-sm text-zinc-100">
                              {wf.prompt}
                            </p>
                            {wf.description && (
                              <p className="text-xs text-zinc-400">
                                {wf.description}
                              </p>
                            )}
                            <div className="flex items-center gap-2">
                              {wf.schedule && (
                                <span className="text-[11px] text-zinc-500">
                                  {wf.schedule}
                                </span>
                              )}
                              {wf.triggerType && (
                                <span className="text-[11px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">
                                  {wf.triggerType}
                                </span>
                              )}
                            </div>
                            {/* Last Run Info */}
                            <div className="flex items-center gap-1.5 mt-1">
                              <Clock size={11} className="text-zinc-500" />
                              <span className="text-[11px] text-zinc-500">
                                {wf.lastRunAt
                                  ? `Last run: ${new Date(wf.lastRunAt).toLocaleString()}`
                                  : "Never run"
                                }
                              </span>
                              {wf.runs?.[0]?.success !== undefined && (
                                wf.runs[0].success ? (
                                  <CheckCircle size={11} className="text-emerald-500" />
                                ) : (
                                  <XCircle size={11} className="text-red-500" />
                                )
                              )}
                            </div>
                            {/* Run Summary - What was done */}
                            {wf.runs?.[0]?.summary && (
                              <div className="mt-2 p-2 rounded-lg bg-zinc-900 border border-zinc-800">
                                <p className="text-[11px] text-zinc-400 mb-1">Last run result:</p>
                                <p className="text-xs text-zinc-300">{wf.runs[0].summary}</p>
                              </div>
                            )}
                          </div>

                          {/* Toggle Switch */}
                          <button
                            onClick={() => toggleWorkflowStatus(wf.id, wf.status)}
                            disabled={togglingId === wf.id}
                            className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${wf.status === "ACTIVE"
                              ? "bg-emerald-600"
                              : "bg-zinc-700"
                              } ${togglingId === wf.id ? "opacity-50" : ""}`}
                          >
                            <span
                              className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform duration-200 ${wf.status === "ACTIVE" ? "translate-x-5" : "translate-x-0"
                                }`}
                            />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between px-5 py-4 border-t border-zinc-800">
                <span className="text-[10px] text-zinc-500">
                  Paxio · Workflows
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
