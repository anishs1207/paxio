export async function initWorker() {
  let started = false;

  if (started) return;
  started = true;
  
  const { startWorker } = await import(
    "../backend/autonomous/worker"
  );

  console.log("[Worker-Runner] Starting worker...");
  startWorker();
}
