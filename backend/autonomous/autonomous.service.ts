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

export async function executeTask(taskRow: any, eventPayload?: any) {
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

    // Extract summary from result - runMainAgent returns { parsed: { response: "..." } }
    const summary = (result as any)?.parsed?.response || (result as any)?.response || "Task executed successfully.";

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
  } catch (err: any) {
    await prisma.autonomousTaskRun.create({
      data: {
        autonomousTaskId: taskRow.id,
        success: false,
        summary: String(err?.message || err),
        rawResults: { error: String(err) },
      },
    });
  }
}

/* ============================================================
   REGISTRATION
============================================================ */

export async function registerTask(taskRow: any) {
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
      const since = lastPoll.get(taskRow.id) ?? new Date(0);
      const events = []; // ← your existing pollers plug here
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

// // apps/backend/src/agents/autonomous/autonomous.service.ts
// import cron, { ScheduledTask } from "node-cron";
// import prisma from "../../../../../../web/lib/db";
// import WorkflowRunner from "./workflow-orchestrator/workflow-runner";
// import { PlannerWorkflow } from "../../../../types";
// import { google } from "googleapis";
// import { getValidGmailAccessToken } from "../../../nodes/global.credentials";
// import { generateRunSummary } from "./autonomous-service-agent/autonomous-service-agent";
// import {
//   runGmailAutoReplyAgent,
//   runMorningCalendarSummaryAgent,
// } from "./prebundled.service";

// // In-memory registries
// const cronJobs: Map<string, ScheduledTask> = new Map();
// const pollIntervals: Map<string, NodeJS.Timeout> = new Map();
// const lastPollTimestamps: Map<string, Date> = new Map();

// /**
//  * Execute a workflow task
//  */
// export async function executeTask(taskRow: any, eventPayload?: any) {
//   try {
//     console.log(`[autonomous] executeTask called for task ${taskRow.id}`);
//     const workflow: PlannerWorkflow = taskRow.workflow;
//     if (!Array.isArray(workflow) || workflow.length < 2) {
//       console.warn(
//         `[autonomous] executeTask: invalid workflow for task ${taskRow.id}`
//       );
//       return;
//     }

//     const actionableWorkflow = workflow.slice(1).map((s: any) => ({ ...s }));

//     if (eventPayload && actionableWorkflow.length > 0) {
//       actionableWorkflow[0].extraClarifiedInfo = [
//         ...(actionableWorkflow[0].extraClarifiedInfo || []),
//         `__trigger_payload__:${JSON.stringify(eventPayload)}`,
//       ].join("\n");
//     }

//     const socketId = `autonomous-${taskRow.id}`;
//     const userId = taskRow.userId;
//     const runId = `aut-${taskRow.id}-${Date.now()}`;

//     console.log(`[autonomous] Running WorkflowRunner for task ${taskRow.id}`);
//     const { results } = await WorkflowRunner(
//       actionableWorkflow,
//       socketId,
//       userId,
//       { runId }
//     );
//     console.log(`[autonomous] WorkflowRunner completed for task ${taskRow.id}`);

//     // ---------------- NEW ----------------
//     await generateRunSummary(taskRow.id, userId, results);
//     // ---------------- END NEW ----------------

//     return { success: true, results };
//   } catch (err: any) {
//     console.error(
//       `[autonomous] executeTask error for task ${taskRow.id}:`,
//       err
//     );
//     return { success: false, error: String(err?.message || err) };
//   }
// }

// /**
//  * Convert semantic trigger to cron string automatically
//  */
// export function triggerDetailsToCron(details: any): string {
//   switch (details.schedule) {
//     case "everyMinute":
//       return "* * * * *";
//     case "everyHour":
//       return "0 * * * *";
//     case "daily":
//       if (!details.time) throw new Error("Missing time for daily trigger");
//       const [hourD, minuteD] = details.time.split(":");
//       return `${minuteD} ${hourD} * * *`;
//     case "weekly":
//       if (!details.time || details.dayOfWeek == null)
//         throw new Error("Missing day/time for weekly trigger");
//       const [hourW, minuteW] = details.time.split(":");
//       return `${minuteW} ${hourW} * * ${details.dayOfWeek}`;
//     case "monthly":
//       if (!details.time || details.dayOfMonth == null)
//         throw new Error("Missing day/time for monthly trigger");
//       const [hourM, minuteM] = details.time.split(":");
//       return `${minuteM} ${hourM} ${details.dayOfMonth} * *`;
//     case "once":
//       return "* * * * *"; // handle manually
//     default:
//       throw new Error("Unknown schedule type: " + details.schedule);
//   }
// }

// /**
//  * Register a workflow task (time/event)
//  */
// export async function registerTask(taskRow: any) {
//   unregisterTask(taskRow.id);
//   const checker = taskRow.workflow?.handler;

//   // 🆕 Gmail Auto-Reply Agent
//   if (checker === "gmailAutoReply") {
//     setInterval(
//       () => runGmailAutoReplyAgent(taskRow.userId, taskRow.id),
//       1 * 60 * 1000
//     );
//     console.log(
//       `[autonomous] Registered Gmail auto-reply for ${taskRow.userId}`
//     );
//     return;
//   }

//   // 🆕 Calendar Daily Summary Agent
//   else if (checker === "calendarDailySummary") {
//     const job = cron.schedule("46 15 * * *", async () => {
//       await runMorningCalendarSummaryAgent(taskRow.userId, taskRow.id);
//     });
//     cronJobs.set(taskRow.id, job);
//     console.log(
//       `[autonomous] Registered Morning Calendar Summary for ${taskRow.userId}`
//     );
//     return;
//   } else {
//     const triggerType = taskRow.triggerType as string;

//     if (triggerType === "time") {
//       const trigger = taskRow.workflow?.[0]?.trigger;
//       console.log(
//         `[autonomous] Time-based trigger for task ${taskRow.id}:`,
//         trigger
//       );
//       if (!trigger || !trigger.details || !trigger.details.schedule) {
//         console.warn(
//           `[autonomous] invalid trigger details for task ${taskRow.id}`
//         );
//         return;
//       }

//       const schedule = triggerDetailsToCron(trigger.details);
//       try {
//         const job = cron.schedule(schedule, async () => {
//           console.log(`[autonomous] time trigger fired for task ${taskRow.id}`);
//           await executeTask(taskRow);
//         });
//         cronJobs.set(taskRow.id, job);
//         console.log(
//           `[autonomous] scheduled time task ${taskRow.id} -> ${schedule}`
//         );
//       } catch (err) {
//         console.error(
//           `[autonomous] Failed to schedule cron job for task ${taskRow.id}:`,
//           err
//         );
//       }
//     } else if (triggerType === "event") {
//       const intervalStr = taskRow.pollInterval || "1m";
//       const intervalMs = parseIntervalToMs(intervalStr) || 1 * 60 * 1000;

//       const handler = async () => {
//         try {
//           const lastPollAt = lastPollTimestamps.get(taskRow.id) || new Date(0);
//           console.log(
//             `[autonomous] Polling task ${taskRow.id} since ${lastPollAt.toISOString()}`
//           );

//           const triggerDetails = taskRow.workflow?.[0]?.trigger?.details;
//           if (!triggerDetails || !triggerDetails.type) return;

//           let newEvents: any[] = [];

//           switch (triggerDetails.type) {
//             case "onNewEmail":
//               newEvents = await pollGmail(taskRow, lastPollAt);
//               break;
//             case "onCalendarEventStart":
//               newEvents = await pollCalendarEvents(taskRow, lastPollAt);
//               break;
//             case "onFormSubmission":
//               newEvents = await pollFormSubmissions(taskRow, lastPollAt);
//               break;
//             case "onNewFileUploaded":
//               newEvents = await pollFileUploads(taskRow, lastPollAt);
//               break;
//             case "onTweetByUser":
//               newEvents = await pollTweets(taskRow, lastPollAt);
//               break;
//             default:
//               console.warn(
//                 `[autonomous] Unsupported event type ${triggerDetails.type} for task ${taskRow.id}`
//               );
//               return;
//           }

//           console.log(
//             `[autonomous] ${newEvents.length} new events found for task ${taskRow.id}`
//           );
//           for (const ev of newEvents) {
//             console.log(
//               `[autonomous] Event trigger firing executeTask for task ${taskRow.id}`
//             );
//             await executeTask(taskRow, ev);
//           }

//           lastPollTimestamps.set(taskRow.id, new Date());
//         } catch (err) {
//           console.error(
//             `[autonomous] Error in polling handler for task ${taskRow.id}:`,
//             err
//           );
//         }
//       };

//       const timer = setInterval(handler, intervalMs);
//       pollIntervals.set(taskRow.id, timer);
//       await handler(); // Run immediately
//       console.log(
//         `[autonomous] registered poll task ${taskRow.id} interval ${intervalMs}ms`
//       );
//     } else {
//       console.warn(
//         `[autonomous] registerTask: unknown triggerType ${triggerType}`
//       );
//     }
//   }
// }

// /**
//  * Unregister a task
//  */

// export function unregisterTask(taskId: string) {
//   const job = cronJobs.get(taskId);
//   if (job) {
//     job.stop();
//     cronJobs.delete(taskId);
//   }

//   const timer = pollIntervals.get(taskId);
//   if (timer) {
//     clearInterval(timer);
//     pollIntervals.delete(taskId);
//   }

//   lastPollTimestamps.delete(taskId);

//   console.log(`[autonomous] task unregistered ${taskId}`);
// }

// function parseIntervalToMs(s: string): number | null {
//   if (!s) return null;
//   const m = s.match(/^(\d+)(s|m|h|d)?$/i);
//   if (!m) return null;
//   const val = Number(m[1]);
//   const unit = (m[2] || "m").toLowerCase();
//   switch (unit) {
//     case "s":
//       return val * 1000;
//     case "m":
//       return val * 60 * 1000;
//     case "h":
//       return val * 60 * 60 * 1000;
//     case "d":
//       return val * 24 * 60 * 60 * 1000;
//     default:
//       return null;
//   }
// }

// /** ---------------- Gmail Polling ---------------- **/
// async function pollGmail(taskRow: any, since: Date): Promise<any[]> {
//   const triggerDetails = taskRow.workflow?.[0]?.trigger?.details;
//   if (!triggerDetails?.emailProvider) return [];
//   const userId = taskRow.userId;
//   console.log(
//     `[autonomous] Polling Gmail for task ${taskRow.id} since ${since.toISOString()}`
//   );

//   try {
//     const accessToken = await getValidGmailAccessToken(userId);
//     if (!accessToken) return [];
//     const oauth2Client = new google.auth.OAuth2();
//     oauth2Client.setCredentials({ access_token: accessToken });
//     const gmail = google.gmail({ version: "v1", auth: oauth2Client });

//     const res = await gmail.users.messages.list({
//       userId: "me",
//       q: `after:${Math.floor(since.getTime() / 1000)} label:inbox is:unread`,
//     });

//     const messages = res.data.messages || [];
//     console.log(
//       `[autonomous] Gmail found ${messages.length} messages for task ${taskRow.id}`
//     );

//     const events = [];
//     for (const msg of messages) {
//       const fullMsg = await gmail.users.messages.get({
//         userId: "me",
//         id: msg.id!,
//       });
//       events.push(fullMsg.data);
//     }
//     return events;
//   } catch (err) {
//     console.error(
//       `[autonomous] Gmail polling error for task ${taskRow.id}:`,
//       err
//     );
//     return [];
//   }
// }

// /** ---------------- Calendar Polling ---------------- **/
// async function pollCalendarEvents(taskRow: any, since: Date): Promise<any[]> {
//   const triggerDetails = taskRow.workflow?.[0]?.trigger?.details;
//   if (!triggerDetails?.eventTitle) return [];
//   const userId = taskRow.userId;
//   console.log(
//     `[autonomous] Polling calendar events for task ${taskRow.id} since ${since.toISOString()}`
//   );

//   try {
//     const accessToken = await getValidGmailAccessToken(userId);
//     if (!accessToken) return [];
//     const oauth2Client = new google.auth.OAuth2();
//     oauth2Client.setCredentials({ access_token: accessToken });
//     const calendar = google.calendar({ version: "v3", auth: oauth2Client });

//     const res = await calendar.events.list({
//       calendarId: "primary",
//       timeMin: since.toISOString(),
//       singleEvents: true,
//       orderBy: "startTime",
//       q: triggerDetails.eventTitle,
//     });

//     const events = res.data.items || [];
//     console.log(
//       `[autonomous] Found ${events.length} calendar events for task ${taskRow.id}`
//     );
//     return events;
//   } catch (err) {
//     console.error(
//       `[autonomous] Calendar polling error for task ${taskRow.id}:`,
//       err
//     );
//     return [];
//   }
// }

// /** ---------------- Form Submission Polling ---------------- **/
// async function pollFormSubmissions(taskRow: any, since: Date): Promise<any[]> {
//   const triggerDetails = taskRow.workflow?.[0]?.trigger?.details;
//   if (!triggerDetails?.formName) return [];
//   console.log(
//     `[autonomous] Polling form submissions for task ${taskRow.id} since ${since.toISOString()}`
//   );

//   try {
//     const accessToken = await getValidGmailAccessToken(taskRow.userId);
//     if (!accessToken) return [];
//     const oauth2Client = new google.auth.OAuth2();
//     oauth2Client.setCredentials({ access_token: accessToken });
//     const sheets = google.sheets({ version: "v4", auth: oauth2Client });

//     const sheetId = triggerDetails.formName;
//     const res = await sheets.spreadsheets.values.get({
//       spreadsheetId: sheetId,
//       range: "Form Responses 1",
//     });
//     const rows = res.data.values || [];
//     const newRows = rows.filter((row) => new Date(row[0]) > since);

//     console.log(
//       `[autonomous] Found ${newRows.length} new form submissions for task ${taskRow.id}`
//     );
//     return newRows.map((row) => ({ timestamp: row[0], data: row.slice(1) }));
//   } catch (err) {
//     console.error(
//       `[autonomous] Form submission polling error for task ${taskRow.id}:`,
//       err
//     );
//     return [];
//   }
// }

// /** ---------------- File Upload Polling ---------------- **/
// async function pollFileUploads(taskRow: any, since: Date): Promise<any[]> {
//   const triggerDetails = taskRow.workflow?.[0]?.trigger?.details;
//   if (!triggerDetails?.folderName) return [];
//   console.log(
//     `[autonomous] Polling new file uploads for task ${taskRow.id} since ${since.toISOString()}`
//   );

//   try {
//     const accessToken = await getValidGmailAccessToken(taskRow.userId);
//     if (!accessToken) return [];
//     const oauth2Client = new google.auth.OAuth2();
//     oauth2Client.setCredentials({ access_token: accessToken });
//     const drive = google.drive({ version: "v3", auth: oauth2Client });

//     const res = await drive.files.list({
//       q: `'${triggerDetails.folderName}' in parents and modifiedTime > '${since.toISOString()}'`,
//       fields: "files(id, name, mimeType, modifiedTime)",
//     });

//     const files = res.data.files || [];
//     console.log(
//       `[autonomous] Found ${files.length} new files for task ${taskRow.id}`
//     );
//     return files;
//   } catch (err) {
//     console.error(
//       `[autonomous] File upload polling error for task ${taskRow.id}:`,
//       err
//     );
//     return [];
//   }
// }

// /** ---------------- Tweet Polling ---------------- **/
// async function pollTweets(taskRow: any, since: Date): Promise<any[]> {
//   const triggerDetails = taskRow.workflow?.[0]?.trigger?.details;
//   if (!triggerDetails?.username) return [];
//   console.log(
//     `[autonomous] Polling tweets by user ${triggerDetails.username} for task ${taskRow.id} since ${since.toISOString()}`
//   );

//   try {
//     const BEARER_TOKEN = process.env.TWITTER_BEARER_TOKEN;
//     if (!BEARER_TOKEN) return [];

//     const userRes = await fetch(
//       `https://api.twitter.com/2/users/by/username/${triggerDetails.username}`,
//       {
//         headers: { Authorization: `Bearer ${BEARER_TOKEN}` },
//       }
//     );
//     const userData = await userRes.json();
//     if (!userData.data?.id) return [];

//     const userId = userData.data.id;
//     const tweetsRes = await fetch(
//       `https://api.twitter.com/2/users/${userId}/tweets?start_time=${since.toISOString()}`,
//       {
//         headers: { Authorization: `Bearer ${BEARER_TOKEN}` },
//       }
//     );
//     const tweetsData = await tweetsRes.json();
//     const tweets = tweetsData.data || [];
//     console.log(
//       `[autonomous] Found ${tweets.length} new tweets for task ${taskRow.id}`
//     );
//     return tweets;
//   } catch (err) {
//     console.error(
//       `[autonomous] Tweet polling error for task ${taskRow.id}:`,
//       err
//     );
//     return [];
//   }
// }
