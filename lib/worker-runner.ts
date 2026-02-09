//apps/web/lib/worker-runner.ts
let started = false;

export async function initWorker() {
  if (started) return;
  started = true;

  // console.log("[Worker-Runner] Clearing all existing workflows for testing...");

  //   import("./db").then(async ({ default: prisma }) => {
  //     try {
  //       await prisma.autonomousTaskRun.deleteMany({});
  //       await prisma.autonomousTask.deleteMany({});
  //       console.log("[Worker-Runner] All workflows deleted successfully");
  //     } catch (err) {
  //       console.error("[Worker-Runner] Error deleting workflows:", err);
  //     }

  //     // Start the worker
  //     const { startWorker } = await import("../../backend/src/app/assistants/personal/autonomous/worker");
  //     console.log("[Worker-Runner] Starting worker...");
  //     startWorker();
  //     const { startMemoryScheduler } = await import(
  //   "../../backend/src/app/memory/memory-management/index"
  // );

  // startMemoryScheduler();
  //   });
  // }

//Start the worker
  const { startWorker } = await import(
    "../../backend/src/app/assistants/personal/autonomous/worker"
  );
  const { startMemoryScheduler } = await import(
    "../../backend/src/app/memory/memory-management/index"
  );

  startMemoryScheduler();

  console.log("[Worker-Runner] Starting worker...");
  startWorker();
}
