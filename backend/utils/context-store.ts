// src/utils/context-store.ts
export interface RunContext {
  runId: string;
  userId?: string;
  stepResults: Record<number, any>;
  memory: any[];
}

export function createContext(runId: string, userId?: string): RunContext {
  return {
    runId,
    userId,
    stepResults: {},
    memory: [],
  };
}

export function pushMemory(ctx: RunContext, note: any) {
  ctx.memory.push(note);
}

export function saveStepResult(
  ctx: RunContext,
  stepNumber: number,
  result: any
) {
  ctx.stepResults[stepNumber] = result;
}
