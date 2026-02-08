// // src/nodes/designer/designer.auto.ts
// src/nodes/designer/designer.auto.ts
import { callGemini } from "../../../../../utils/geminiClient";
import { AutonomousStep } from "../../../../../types/autonomous";
import { z } from "zod";

export const DesignerAutoOutputSchema = z.object({
  response: z.string().min(1),
  suggestions: z.array(z.string().min(1)).nonempty(),
  loggedText: z.string().min(1),
  loggedResults: z.string().optional(),
});

export default async function DesignerAuto(planned: AutonomousStep[]) {
  console.log("Entered DesignerAuto");

  const prompt = `
<role>
You are "DesignerAuto", an advanced AI assistant that explains **autonomous workflow scheduling** to users.
Your goal is to give a confident, friendly, and visually structured **Markdown confirmation summary**.
</role>

<instructions>
1. The user has just **scheduled an autonomous workflow**.
2. Generate a **Markdown summary** that looks clean, structured, and user-facing — no system jargon or node names.
3. Clearly show:
   - ✅ Confirmation that the automation has been successfully scheduled.
   - 🕒 Trigger type & timing (time-based, event-based, etc.)
   - ⚙️ Key workflow actions (summarized in natural language or as a 2-column Markdown table).
   - ✨ Optional extra note: reassurance that the workflow runs automatically.
4. Use professional but friendly tone. Avoid technical language.
5. Always return **valid JSON** with the structure below.
6. Include **2–3 short, actionable suggestions** related to automations.
7. Ensure Markdown uses consistent style:
   - Use bold and emoji markers like ✅, 🕒, ⚙️ for clarity.
   - Use horizontal rules (\`---\`) to separate sections.
   - Use Markdown tables where appropriate (\`| Name | Content |\`).
</instructions>

<planned-workflow>
${JSON.stringify(planned, null, 2)}
</planned-workflow>

<output-format>
The output must be valid JSON:
{
  "response": "Markdown confirmation message.",
  "suggestions": ["suggestion 1", "suggestion 2", "suggestion 3"],
  "loggedText": "Short 1-line internal summary.",
  "loggedResults": "Optional compact technical summary."
}
</output-format>

<examples>

<example-1>
{
  "response": "# ✅ Autonomous Task Scheduled Successfully\\n\\nYour automation has been set up and will now run automatically.\\n\\n---\\n\\n**🕒 Trigger:** Every weekday at 9:00 AM\\n\\n| **Name** | **Action** |\\n|-----------|-------------|\\n| Step 1 | Fetch latest emails from Gmail |\\n| Step 2 | Generate daily summary report |\\n| Step 3 | Save it to Google Docs |\\n---\\n\\nYou can relax — this workflow will execute on schedule without further input.\\n",
  "suggestions": [
    "Add a Slack notification when the summary is generated",
    "Create a weekend-only version of this automation",
    "Enable daily backup of generated reports"
  ],
  "loggedText": "Autonomous workflow scheduled successfully with Gmail → Docs actions.",
  "loggedResults": "3 planned steps with weekday time-based trigger."
}
</example-1>

<example-2>
{
  "response": "# ⚙️ Event-Driven Automation Ready\\n\\nYour workflow has been configured to run automatically **whenever a new file is added to Google Drive**.\\n\\n---\\n\\n| **Name** | **Action** |\\n|-----------|-------------|\\n| Step 1 | Detect file upload in Drive |\\n| Step 2 | Summarize document contents |\\n| Step 3 | Post summary to Slack |\\n---\\n\\nEverything is ready — you’ll be notified whenever new documents are processed.\\n",
  "suggestions": [
    "Add sentiment analysis for uploaded documents",
    "Notify a team channel when summaries are posted",
    "Archive processed files automatically"
  ],
  "loggedText": "Event-based workflow scheduled for Google Drive uploads.",
  "loggedResults": "Trigger: Drive upload; 3 planned actions."
}
</example-2>

</examples>
`;

  try {
    const response = await callGemini(prompt);
    console.log("DESIGNER OUTPUT :",response)

    const cleaned = response
      .trim()
      .replace(/^```json/i, "")
      .replace(/^```/, "")
      .replace(/```$/, "");

    const parsed = JSON.parse(cleaned);
    console.log("designer output afte parsed",parsed)
    DesignerAutoOutputSchema.parse(parsed);
    console.log("desginer output after parsed x2 ",parsed)

    return parsed;
  } catch (err) {
    console.warn("DesignerAuto: schema validation failed or Gemini error:", err);
    return {
      response: "⚠️ Unable to generate a scheduling summary right now.",
      suggestions: ["Try again later", "Check automation settings"],
      loggedText: "Gemini summary generation failed.",
    };
  }
}

// import { callGemini } from "../../../utils/geminiClient";
// import { AutonomousStep } from "../../../types/autonomous";
// import { RunContext } from "../../../utils/context-store";
// import { z } from "zod";

// export const DesignerAutoOutputSchema = z.object({
//   response: z.string().min(1),
//   suggestions: z.array(z.string().min(1)).nonempty(),
//   loggedText: z.string().min(1),
// });

// export default async function DesignerAuto(
//   planned: AutonomousStep[]
// ) {
//   console.log("Entered DesignerAuto");

//   const prompt = `
// <role>
// You are "DesignerAuto", an autonomous workflow summarizer.
// </role>

// <instructions>
// 1. Generate a **Markdown summary** of the autonomous workflow that has been scheduled.withh colo
// 2. Use natural, user-friendly language. Make the user feel confident their task is set up.
// 3. Show:
//    - Trigger type & details (time-based or event-based).
//    - Key actions planned (list them in bullet points or Markdown table).
// 4. Do NOT describe system internals or node names.
// 5. Provide **2–3 useful suggestions** for related automations.
// </instructions>

// <planned-workflow>
// ${JSON.stringify(planned, null, 2)}
// </planned-workflow>

// <output-format>
// Return JSON with fields:
// - "response": Detailed Markdown summary (task scheduled + trigger + actions).
// - "suggestions": 2–3 related helpful automation ideas.
// - "loggedText": 2–3 sentence summary for logs (short).
// </output-format>

// <example>
// {
//   "response": "# ✅ Autonomous Task Scheduled\n\nYour workflow has been set up successfully!\n\n**Trigger:** Every Monday at 10:00 AM\n\n**Actions:**\n- Fetch your Gmail messages.\n- Generate a professional summary.\n- Save the summary in Google Docs.\n\nYou don’t need to do anything — this task will now run automatically whenever the trigger happens.\n",
//   "suggestions": [
//     "Set up a daily summary of unread emails.",
//     "Automatically post important updates to Slack.",
//     "Back up Gmail attachments to Google Drive."
//   ],
//   "loggedText": "Autonomous workflow scheduled: Gmail → summary → Google Docs, runs weekly on Mondays at 10 AM."
// }
// </example>
// `;

//   try {
//     let response = await callGemini(prompt);

//     let cleaned = response
//       .trim()
//       .replace(/^```json/i, "")
//       .replace(/^```/, "")
//       .replace(/```$/, "");

//     const parsed = JSON.parse(cleaned);

//     DesignerAutoOutputSchema.parse(parsed);

//     return parsed;
//   } catch (err) {
//     console.warn("planner-autonomous: schema validation skipped or failed:", err);
//     return;
//   }
// }
