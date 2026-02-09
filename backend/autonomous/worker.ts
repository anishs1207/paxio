import prisma from "@/lib/db";
import { registerTask, unregisterTask } from "./autonomous.service";

const POLL_INTERVAL_MS = 5000;
const registeredWorkflows = new Set<string>();

interface RegisterTaskInput {
  id: string;
  userId: string;
  workflow: any;
  triggerType: string;
  prompt: string;
  schedule?: string | null;
  eventName?: string | null;
  pollInterval?: string | null;
}

/**
 * startWorker()
 * Periodically polls DB for ACTIVE autonomous tasks
 * and registers new ones for execution.
 * Also unregisters tasks that are no longer active or deleted.
 */
export async function startWorker() {
  // console.log("[Worker] 🚀 Starting workflow worker...");

  async function pollWorkflows() {
    try {
      // Fetch all ACTIVE workflows
      const tasks = await prisma.autonomousTask.findMany({
        where: { status: "ACTIVE", active: true },
      });

      console.log(`[Worker] 📦 Found ${tasks.length} active workflows`);

      const activeTaskIds = new Set(tasks.map((t) => t.id));

      // 1️⃣ Unregister workflows that are no longer active or deleted
      for (const taskId of registeredWorkflows) {
        if (!activeTaskIds.has(taskId)) {
          // console.log(`[Worker] ❌ Unregistering inactive/deleted task ${taskId}`);
          unregisterTask(taskId);
          registeredWorkflows.delete(taskId);
        }
      }

      // 2️⃣ Register new ACTIVE workflows
      for (const task of tasks) {
        // Skip already registered workflows
        if (registeredWorkflows.has(task.id)) continue;

        try {
          const data: RegisterTaskInput = {
            id: task.id,
            userId: task.userId,
            workflow: task.workflow,
            triggerType: task.triggerType,
            prompt: task.prompt,
            schedule: task.schedule,
            eventName: task.eventName,
            pollInterval: task.pollInterval,
          };

          await registerTask(data);
          registeredWorkflows.add(task.id);

          // Update lastPollAt
          try {
            await prisma.autonomousTask.update({
              where: { id: task.id },
              data: { lastPollAt: new Date() },
            });
          } catch (updateErr) {
            console.error(
              `[Worker] ⚠️ Failed to update lastPollAt for ${task.id}:`,
              updateErr
            );
          }

          console.log(`[Worker] ✅ Registered workflow ${task.id}`);
        } catch (err) {
          console.error(`[Worker] ❌ Failed to register workflow ${task.id}:`, err);
        }
      }
    } catch (err) {
      console.error("[Worker] 🧨 Error polling workflows:", err);
    } finally {
      setTimeout(pollWorkflows, POLL_INTERVAL_MS);
    }
  }

  // Start initial poll
  pollWorkflows();
}
// import prisma from "../../../../../web/lib/db";
// import { registerTask } from "./autonomous.service";
// import { unregisterTask } from "./autonomous.service";

// const POLL_INTERVAL_MS = 5000;
// const registeredWorkflows = new Set<string>();

// interface RegisterTaskInput {
//   id: string;
//   userId: string;
//   workflow: any;
//   triggerType: string;
//   prompt: string;
//   schedule?: string | null;
//   eventName?: string | null;
//   pollInterval?: string | null;
// }

// /**
//  * startWorker()
//  * Periodically polls DB for ACTIVE autonomous tasks
//  * and registers new ones for execution.
//  */
// export async function startWorker() {
//   console.log("[Worker] 🚀 Starting workflow worker...");

//   async function pollWorkflows() {
//     try {
//       // console.log(`[Worker] 🔁 Polling workflows at ${new Date().toISOString()}`);

//       // Fetch all ACTIVE workflows
//       const tasks = await prisma.autonomousTask.findMany({
//         where: { status: "ACTIVE", active: true },
//       });

//       console.log(`[Worker] 📦 Found ${tasks.length} active workflows`);

//       for (const task of tasks) {
//         // Skip already registered workflows
//         if (registeredWorkflows.has(task.id)) continue;

//         try {
//           const data: RegisterTaskInput = {
//             id: task.id,
//             userId: task.userId,
//             workflow: task.workflow,
//             triggerType: task.triggerType,
//             prompt: task.prompt,
//             schedule: task.schedule,
//             eventName: task.eventName,
//             pollInterval: task.pollInterval,
//           };

//           await registerTask(data);

//           registeredWorkflows.add(task.id);

//           // Update lastPollAt
//           try {
//             await prisma.autonomousTask.update({
//               where: { id: task.id },
//               data: { lastPollAt: new Date() },
//             });
//           } catch (updateErr) {
//             console.error(
//               `[Worker] ⚠️ Failed to update lastPollAt for ${task.id}:`,
//               updateErr
//             );
//           }

//           // console.log(`[Worker] ✅ Registered workflow ${task.id}`);
//         } catch (err) {
//           console.error(
//             `[Worker] ❌ Failed to register workflow ${task.id}:`,
//             err
//           );
//         }
//       }
//     } catch (err) {
//       console.error("[Worker] 🧨 Error polling workflows:", err);
//     } finally {
//       setTimeout(pollWorkflows, POLL_INTERVAL_MS);
//     }
//   }

//   // Start initial poll
//   pollWorkflows();
// }
// // apps/backend/src/worker.ts
// //@ts-ignore
// import prisma from "../../../../web/lib/db";
// import { registerTask } from "./autonomous.service";

// // Poll interval in ms
// const POLL_INTERVAL_MS = 5000;

// // In-memory registry of already registered workflows
// const registeredWorkflows = new Set<string>();

// export async function startWorker() {
//   console.log("[Worker] Starting workflow worker...");

//   async function pollWorkflows() {
//     try {
//       console.log(`[Worker] Polling workflows at ${new Date().toISOString()}`);

//       // Fetch all ACTIVE workflows from DB
//       const tasks = await prisma.autonomousTask.findMany({
//         where: { status: "ACTIVE" },
//       });

//       console.log(`[Worker] Found ${tasks.length} active workflows`);

//       for (const task of tasks) {
//         try {
//           // Only register if not already registered (or re-register on server restart)
//           if (!registeredWorkflows.has(task.id)) {
//             await registerTask({
//               id: task.id,
//               userId: task.userId,
//               workflow: task.workflow,
//               triggerType: task.triggerType,
//             });

//             registeredWorkflows.add(task.id);

//             // Update lastPollAt in DB
//             await prisma.autonomousTask.update({
//               where: { id: task.id },
//               data: { lastPollAt: new Date() },
//             });

//             console.log(`[Worker] Registered workflow ${task.id}`);
//           }
//         } catch (err) {
//           console.error(`[Worker] Failed to register workflow ${task.id}:`, err);
//         }
//       }
//     } catch (err) {
//       console.error("[Worker] Error polling workflows:", err);
//     } finally {
//       // Schedule next poll
//       setTimeout(pollWorkflows, POLL_INTERVAL_MS);
//     }
//   }

//   // Start polling
//   pollWorkflows();
// }
