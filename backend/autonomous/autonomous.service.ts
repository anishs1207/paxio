import cron, { ScheduledTask } from "node-cron";
import prisma from "@/lib/db";
import { runMainAgent } from "../agents/mainAgent";

/* ============================================================
   REGISTRIES
============================================================ */

const cronJobs = new Map<string, ScheduledTask>();
const pollIntervals = new Map<string, NodeJS.Timeout>();
const oneTimeTimeouts = new Map<string, NodeJS.Timeout>();
const lastPoll = new Map<string, Date>();

/* ============================================================
   EXECUTION — MAIN AGENT ONLY
============================================================ */

interface TaskRow {
  id: string;
  userId: string;
  workflow?: {
    compiledPrompt?: string;
  };
  triggerType: "time" | "event";
  schedule?: string;
  scheduleType?: "once" | "recurring";
  pollInterval?: string;
}

export async function executeTask(taskRow: TaskRow, eventPayload?: unknown) {
  try {
    const compiledPrompt = taskRow.workflow?.compiledPrompt;
    if (!compiledPrompt) return;

    let finalPrompt = compiledPrompt;
    if (eventPayload) {
      finalPrompt += `

TRIGGER PAYLOAD:
${JSON.stringify(eventPayload, null, 2)}
`;
    }

    const result = await runMainAgent({
      userId: taskRow.userId,
      socketId: `autonomous-${taskRow.id}`,
      conversationId: `auto-${taskRow.id}`,
      assistant: "paxio",
      prompt: finalPrompt,
    });

    // Extract summary from result - runMainAgent returns { response: "..." }
    const summary = (result as { response?: string }).response || "Task executed successfully.";

    await prisma.autonomousTaskRun.create({
      data: {
        autonomousTaskId: taskRow.id,
        success: true,
        summary,
        rawResults: result,
      },
    });

    await prisma.autonomousTask.update({
      where: { id: taskRow.id },
      data: {
        lastRunAt: new Date(),
        lastResultSummary: summary,
      },
    });

    return result;
  } catch (err: unknown) {
    await prisma.autonomousTaskRun.create({
      data: {
        autonomousTaskId: taskRow.id,
        success: false,
        summary: String((err as Error)?.message || err),
        rawResults: { error: String(err) },
      },
    });
  }
}

/* ============================================================
   REGISTRATION
============================================================ */

export async function registerTask(taskRow: TaskRow) {
  unregisterTask(taskRow.id);

  if (taskRow.triggerType === "time") {
    const rawSchedule = taskRow.schedule;
    if (!rawSchedule) return;

    const scheduleType = taskRow.scheduleType ?? "once";

    // Handle one-time schedules with setTimeout
    if (scheduleType === "once") {
      const delayMs = parseTimeToDelay(rawSchedule);
      if (delayMs === null || delayMs < 0) {
        console.warn(`[autonomous] Invalid or past schedule "${rawSchedule}" for one-time task ${taskRow.id}`);
        return;
      }

      const timeout = setTimeout(async () => {
        await executeTask(taskRow);
        // Mark task as completed after execution
        await prisma.autonomousTask.update({
          where: { id: taskRow.id },
          data: { status: "COMPLETED", active: false },
        });
        oneTimeTimeouts.delete(taskRow.id);
        console.log(`[autonomous] One-time task ${taskRow.id} completed and marked as done`);
      }, delayMs);

      oneTimeTimeouts.set(taskRow.id, timeout);
      console.log(`[autonomous] Registered one-time task ${taskRow.id} to run in ${Math.round(delayMs / 1000)}s`);
      return;
    }

    // Handle recurring schedules with cron
    const cronExpr = parseToCron(rawSchedule);
    if (!cronExpr) {
      console.warn(`[autonomous] Could not parse schedule "${rawSchedule}" for task ${taskRow.id}`);
      return;
    }

    const job = cron.schedule(cronExpr, async () => {
      await executeTask(taskRow);
    });

    cronJobs.set(taskRow.id, job);
    console.log(`[autonomous] Registered recurring task ${taskRow.id} with cron: ${cronExpr}`);
  }

  if (taskRow.triggerType === "event") {
    const intervalMs = parseInterval(taskRow.pollInterval ?? "1m");
    const handler = async () => {
      // const _since = lastPoll.get(taskRow.id) ?? new Date(0);
      //@ts-expect-error - events poller implementation pending in this environment
      const events: unknown[] = [];
      for (const ev of events) {
        await executeTask(taskRow, ev);
      }
      lastPoll.set(taskRow.id, new Date());
    };

    const timer = setInterval(handler, intervalMs);
    pollIntervals.set(taskRow.id, timer);
    await handler();
  }
}

/* ============================================================
   UNREGISTER
============================================================ */

export function unregisterTask(taskId: string) {
  cronJobs.get(taskId)?.stop();
  cronJobs.delete(taskId);

  const timer = pollIntervals.get(taskId);
  if (timer) clearInterval(timer);
  pollIntervals.delete(taskId);

  const oneTimeTimer = oneTimeTimeouts.get(taskId);
  if (oneTimeTimer) clearTimeout(oneTimeTimer);
  oneTimeTimeouts.delete(taskId);

  lastPoll.delete(taskId);
}

/* ============================================================
   UTILS
============================================================ */

function parseInterval(s: string): number {
  const m = s.match(/^(\d+)(s|m|h|d)?$/i);
  const val = Number(m?.[1] ?? 1);
  const unit = (m?.[2] ?? "m").toLowerCase();
  return (
    unit === "s" ? val * 1000 :
      unit === "h" ? val * 60 * 60 * 1000 :
        unit === "d" ? val * 24 * 60 * 60 * 1000 :
          val * 60 * 1000
  );
}

/**
 * Parse a time string (e.g., "22:33", "09:00") and return milliseconds until that time today.
 * Returns null if the format is invalid.
 * Returns negative value if the time has already passed today.
 */
function parseTimeToDelay(schedule: string): number | null {
  if (!schedule) return null;

  const s = schedule.trim().toLowerCase();

  // Match plain time format "HH:MM"
  const plainTimeMatch = s.match(/^(\d{1,2}):(\d{2})$/);
  if (plainTimeMatch) {
    const hour = parseInt(plainTimeMatch[1], 10);
    const minute = parseInt(plainTimeMatch[2], 10);

    if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
      return null;
    }

    const now = new Date();
    const target = new Date();
    target.setHours(hour, minute, 0, 0);

    let delayMs = target.getTime() - now.getTime();

    // If time already passed today, schedule for tomorrow
    if (delayMs < 0) {
      target.setDate(target.getDate() + 1);
      delayMs = target.getTime() - now.getTime();
    }

    return delayMs;
  }

  // Match "daily HH:MM" format - extract time part
  const dailyMatch = s.match(/^daily\s+(?:at\s+)?(\d{1,2}):(\d{2})$/);
  if (dailyMatch) {
    const hour = parseInt(dailyMatch[1], 10);
    const minute = parseInt(dailyMatch[2], 10);

    if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
      return null;
    }

    const now = new Date();
    const target = new Date();
    target.setHours(hour, minute, 0, 0);

    let delayMs = target.getTime() - now.getTime();

    // If time already passed today, schedule for tomorrow
    if (delayMs < 0) {
      target.setDate(target.getDate() + 1);
      delayMs = target.getTime() - now.getTime();
    }

    return delayMs;
  }

  return null;
}

/**
 * Convert semantic schedule strings to cron expressions
 * Examples:
 *   "daily 09:00" -> "0 9 * * *"
 *   "daily 18:30" -> "30 18 * * *"
 *   "hourly" -> "0 * * * *"
 *   "0 9 * * *" -> "0 9 * * *" (already cron, pass through)
 */
function parseToCron(schedule: string): string | null {
  if (!schedule) return null;

  const s = schedule.trim().toLowerCase();

  // Check if already a valid cron expression (5 space-separated parts)
  if (/^[\d*,/-]+\s+[\d*,/-]+\s+[\d*,/-]+\s+[\d*,/-]+\s+[\d*,/-]+$/.test(schedule.trim())) {
    return schedule.trim();
  }

  // Plain time format "HH:MM" - treat as daily at that time
  const plainTimeMatch = s.match(/^(\d{1,2}):(\d{2})$/);
  if (plainTimeMatch) {
    const hour = parseInt(plainTimeMatch[1], 10);
    const minute = parseInt(plainTimeMatch[2], 10);
    return `${minute} ${hour} * * *`;
  }

  // "daily HH:MM" or "daily at HH:MM"
  const dailyMatch = s.match(/^daily\s+(?:at\s+)?(\d{1,2}):(\d{2})$/);
  if (dailyMatch) {
    const hour = parseInt(dailyMatch[1], 10);
    const minute = parseInt(dailyMatch[2], 10);
    return `${minute} ${hour} * * *`;
  }

  // "hourly"
  if (s === "hourly") {
    return "0 * * * *";
  }

  // "every N minutes"
  const everyMinMatch = s.match(/^every\s+(\d+)\s*min(?:ute)?s?$/);
  if (everyMinMatch) {
    const mins = parseInt(everyMinMatch[1], 10);
    return `*/${mins} * * * *`;
  }

  // "every N hours"
  const everyHourMatch = s.match(/^every\s+(\d+)\s*hours?$/);
  if (everyHourMatch) {
    const hours = parseInt(everyHourMatch[1], 10);
    return `0 */${hours} * * *`;
  }

  console.warn(`[parseToCron] Unrecognized schedule format: "${schedule}"`);
  return null;
}
