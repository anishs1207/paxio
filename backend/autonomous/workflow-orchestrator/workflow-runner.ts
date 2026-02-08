//apps\backend\src\agents\chat\4-workflow-orchestrator\workflow-runner.ts
import {
  PlannerWorkflow,
  PlannerStep,
  StepExecutionResult,
} from "../../../../../types/index";
import { nodeRegistry } from "../../../../nodes";
import {
  createContext,
  saveStepResult,
  pushMemory,
  RunContext,
} from "../../../../../utils/context-store";
import { streamMessage } from "../../../../../utils/ws";

export default async function WorkflowRunner(
  workflow: PlannerWorkflow,
  socketId: string,
  userId: string,
  opts?: { runId?: string }
): Promise<{ results: StepExecutionResult[]; context: RunContext }> {
  // streamMessage("Starting Workflow", "streaming", socketId,"");

  const runId = opts?.runId ?? `run-${Date.now()}`;
  const ctx = createContext(runId, userId);
  const results: StepExecutionResult[] = [];

  // streamMessage("Starting Workflow", "done", socketId,"");

  for (const step of workflow) {
    const nodeKey = (step.node || "").toLowerCase();

    streamMessage(`Running ${nodeKey}`, "streaming", socketId, "");

    const handler = nodeRegistry[nodeKey];

    if (!handler) {
      console.log("handler not found");
      streamMessage(`Running ${nodeKey}`, "error", socketId, "");
      const fail: StepExecutionResult = {
        step,
        raw: null,
        parsed: null,
        success: false,
        error: `Handler not found for node "${step.node}"`,
      };

      results.push(fail);
      pushMemory(ctx, { step: step.stepNumber, error: fail.error });
      continue;
    }

    const inputPayload = {
      task: step.task,
      params: step.extraClarifiedInfo,
      previousStepResults: ctx.stepResults,
      memory: ctx.memory,
      userId,
    };

    console.log("InputPayload", inputPayload);

    let raw: any = null;
    try {
      //@ts-ignore
      raw = await handler({ input: inputPayload });
    } catch (err: any) {
      streamMessage(`Running ${nodeKey}`, "error", socketId, "");
      const fail: StepExecutionResult = {
        step,
        raw: null,
        parsed: null,
        success: false,
        error: String(err?.message ?? err),
      };
      results.push(fail);
      pushMemory(ctx, { step: step.stepNumber, error: fail.error });
      continue;
    }

    let parsed: any;
    let success = true;
    let error: string | null = null;

    try {
      if (typeof raw === "string") {
        try {
          parsed = JSON.parse(raw);
        } catch {
          parsed = raw;
        }
      } else if (raw && typeof raw === "object") {
        parsed = "output" in raw ? raw.output : raw;
      } else {
        parsed = raw;
      }
    } catch (parseErr: any) {
      streamMessage(`Running ${nodeKey}`, "error", socketId, "");
      parsed = raw;
      success = false;
      error =
        "Failed to parse node output: " + String(parseErr?.message ?? parseErr);
    }

    // console.log("parsed", parsed);

    saveStepResult(ctx, step.stepNumber, parsed);
    pushMemory(ctx, {
      step: step.stepNumber,
      node: step.node,
      summary: summarizeForMemory(parsed),
    });

    results.push({ step, raw, parsed, success, error });

    streamMessage(`Running ${nodeKey}`, "done", socketId, "");
  }

  return { results, context: ctx };
}

function summarizeForMemory(parsed: any): any {
  if (!parsed) return null;
  if (Array.isArray(parsed)) return { type: "list", count: parsed.length };
  if (typeof parsed === "object") return Object.keys(parsed).slice(0, 5);
  if (typeof parsed === "string") return parsed.slice(0, 100);
  return parsed;
}
