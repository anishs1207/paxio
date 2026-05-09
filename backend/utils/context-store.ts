// src/utils/context-store.ts
export interface RunContext {
  runId: string;
  userId?: string;
  stepResults: Record<number, unknown>;
  memory: unknown[];
}

export function createContext(runId: string, userId?: string): RunContext {
  return {
    runId,
    userId,
    stepResults: {},
    memory: [],
  };
}

export function pushMemory(ctx: RunContext, note: unknown) {
  ctx.memory.push(note);
}

export function saveStepResult(
  ctx: RunContext,
  stepNumber: number,
  result: unknown
) {
  ctx.stepResults[stepNumber] = result;
}
