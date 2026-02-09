// // apps/backend/src/nodes/gmail/gmail.ts
import { AgentExecutor, createToolCallingAgent } from "langchain/agents";
import { ChatPromptTemplate } from "@langchain/core/prompts";

import getGmailCredentialsAndTestConnection from "./credential";
import {
  readEmails,
  sendEmail,
  deleteEmail,
  draftEmail,
  listLabels,
  createLabel,
  modifyLabels,
  markReadUnread,
  listThreads,
  trashEmail,
  untrashEmail,
  starEmail,
  unstarEmail,
  callAgent,
} from "./tools";

import { getGeminiLLM } from "@/utils/GeminiChatModel";

// Helper to convert email objects to Markdown table format
export async function GmailNode({ input }: { input: Record<string, any> }) {
  console.log("Entered Gmail node");

  if (!input.userId) {
    return { output: "Missing userId in input." };
  }

  const creds = await getGmailCredentialsAndTestConnection(input.userId);
  if (!creds.success) {
    return { output: "Gmail credentials are invalid or missing." };
  }
  console.log("Gmail credentials validated");

  const llm = getGeminiLLM();

  const prompt = ChatPromptTemplate.fromMessages([
   [
  "system",
  `
You are a Gmail execution agent.

You do NOT decide what the user wants.
You ONLY execute the task provided in the input.

Rules:
- Perform ONLY Gmail-related operations
- Do NOT summarize emails unless explicitly asked
- Do NOT create documents
- Do NOT ask follow-up questions
- If required info is missing, infer it silently

Return results in a Markdown 2-column table with headers "Name" and "Content".
Include only user-visible fields (Recipient, Subject, Body/Snippet).
Do not include internal logs or explanations.
`,
],
    ["human", `{input}`],
    ["placeholder", "{agent_scratchpad}"],
  ]);

  const tools = [
    readEmails,
    sendEmail,
    deleteEmail,
    draftEmail,
    listLabels,
    createLabel,
    modifyLabels,
    markReadUnread,
    listThreads,
    trashEmail,
    untrashEmail,
    starEmail,
    unstarEmail,
    callAgent,
  ];

  const agent = createToolCallingAgent({
    llm,
    tools,
    prompt,
  });

  const executor = new AgentExecutor({
    agent,
    tools,
    returnIntermediateSteps: true,
    maxIterations: 5,
    verbose: true,
  });

  console.log("⚡ Running Gmail agent with input:", input);

  try {
    const result: any = await Promise.race([
      executor.invoke({ input }),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("⏰ Agent execution timeout")), 60000)
      ),
    ]);

    console.log("📨 Gmail Agent result:", result);

    // Example: parse emails from agent output

    return { output: result.output || "No emails found." };
  } catch (err: any) {
    console.error("❌ Gmail Agent error:", err);
    return { output: `Error: ${err.message}` };
  }
}
