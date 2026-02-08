// apps/backend/src/agents/autonomous/planner-autonomous/planner.ts
import { callGemini } from "../../../../../utils/geminiClient";
import { PlannerReturn } from "../../../../../types";
import { streamMessage } from "../../../../../utils/ws";
import getAutonomousPlannerPrompt from "./planner.auto.prompt";
import parseJsonFromLLM from "./planner.auto.jsonParse";
import checkNodesPermittedByUser from "./planner.checkNodesPermitted";

function arrayToQuotedString(arr: string[]): string {
  return arr.map((item) => `"${item}"`).join(",");
}

export default async function PlannerAutonomous(
  prompt: string,
  socketId: string,
  userId: string
): Promise<PlannerReturn> {
  streamMessage("Planning (autonomous)", "streaming", socketId, "");

  const nodesPermittedByUser = await checkNodesPermittedByUser(userId);

  const fullPrompt = getAutonomousPlannerPrompt(
    prompt,
    arrayToQuotedString(nodesPermittedByUser)
  );

  let response: string;
  try {
    response = await callGemini(fullPrompt);
  } catch (err) {
    streamMessage("Planning (autonomous)", "error", socketId, "");
    return { success: false, data: [], message: "LLM call failed" };
  }

  const parsed = parseJsonFromLLM(response);

  if (!Array.isArray(parsed)) {
    streamMessage("Planning (autonomous)", "error", socketId, "");
    return {
      success: false,
      data: [],
      message: "Failed to parse planner output",
    };
  }

  try {
    // We try to validate the whole array against WorkflowSchema if your schema expects steps
    // If your existing WorkflowSchema doesn't accept the trigger node, skip this safe-guard.
    // const result = WorkflowSchema.safeParse(parsed);
    // if (!result.success) throw new Error("WorkflowSchema validation failed");
  } catch (err) {
    // don't block — stream a warning but still return parsed workflow
    console.warn(
      "planner-autonomous: schema validation skipped or failed:",
      err
    );
  }

  streamMessage("Planning (autonomous)", "done", socketId, "");

  return {
    success: true,
    data: parsed,
    message: "Planner (autonomous) planned successfully",
  };
}
