// //apps\backend\src\agents\autonomous\autonomous-service-agent\autonomous-service-agent.ts
// apps/backend/src/agents/autonomous/autonomous-service-agent/autonomous-service-agent.ts
import prisma from "../../../../../../../web/lib/db";
import { callGemini } from "../../../../../utils/geminiClient";

function getSummaryPrompt(results: any[]) {
  return `
<role>
You are "Workflow Summarizer", an advanced AI that converts raw workflow execution data into a **clean, user-facing Markdown summary**.
</role>

<instructions>
1. Summarize workflow results in **readable Markdown** showing only **user-facing outcomes** (e.g., emails sent, files updated, summaries generated).
2. **Exclude** planner/system/debug info.
3. Present results as **2-column Markdown tables** with headers "Name" and "Content".
4. Separate records with horizontal rules (\`---\`) for clarity.
5. Include 2–3 **actionable next-step suggestions** in a "suggestions" array.
6. Output must be **valid JSON** with structure:
{
  "response": "Markdown string",
  "suggestions": ["next-step 1", "next-step 2"],
  "loggedText": "Short log summary",
  "loggedResults": "Compact technical representation"
}
</instructions>

<workflow-results>
${JSON.stringify(results, null, 2)}
</workflow-results>
`;
}

export async function generateRunSummary(
  taskId: string,
  userId: string,
  workflowResults: any[]
) {
  try {
    const prompt = getSummaryPrompt(workflowResults);
    const responseText: string = await callGemini(prompt);

    // 🧹 Clean output
    const cleaned = responseText
      .trim()
      .replace(/^```json/i, "")
      .replace(/^```/, "")
      .replace(/```$/, "");

    let parsed: any;

    // 🧩 Try parsing Gemini output
    try {
      parsed = JSON.parse(cleaned);
    } catch (err) {
      console.warn(
        "[autonomous-summary] Failed to parse Gemini output as JSON, using fallback."
      );
      parsed = {
        response: cleaned,
        suggestions: [],
        loggedText: "",
        loggedResults: "",
      };
    }

    // console.log(
    //   `[autonomous-summary] ✅ Generated summary for task ${taskId}:`,
    //   parsed.response?.slice(0, 200) || "(no response)"
    // );

    // 🧾 Save run in DB
    const run = await prisma.autonomousTaskRun.create({
      data: {
        autonomousTaskId: taskId,
        success: workflowResults.every((r) => r.success),
        summary: parsed.response || "",
        rawResults: workflowResults,
      },
    });

    // 🧭 Update parent task
    await prisma.autonomousTask.update({
      where: { id: taskId },
      data: {
        lastRunAt: run.runAt ?? new Date(),
        lastResultSummary: parsed.response || "",
      },
    });

    return run;
  } catch (err) {
    console.error(
      `[autonomous-summary] ❌ Failed to generate summary for task ${taskId}:`,
      err
    );
    return null;
  }
}
