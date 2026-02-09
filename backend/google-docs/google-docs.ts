// apps/backend/src/nodes/google-docs/google-docs.ts
import { AgentExecutor, createToolCallingAgent } from "langchain/agents";
import { ChatPromptTemplate } from "@langchain/core/prompts";

import getDocsCredentialsAndTestConnection from "./credential";
import {
  createDocument,
  readDocument,
  appendText,
  insertText,
  replaceText,
  updateTitle,
  deleteDocument,
  formatText,
  searchDocument,

  // byName wrappers
  deleteDocumentByName,
  readDocumentByName,
  appendTextByName,
  insertTextByName,
  replaceTextByName,
  updateTitleByName,
  formatTextByName,
} from "./tools";
import { getGeminiLLM } from "../../../../utils/GeminiChatModel";

export async function GoogleDocsNode({
  input,
}: {
  input: Record<string, any>;
}) {
  console.log("Entered Google Docs node");

  if (!input.userId) {
    return { output: "Missing userId in input." };
  }

  const creds = await getDocsCredentialsAndTestConnection(input.userId);
  if (!creds.success) {
    return { output: "Google Docs credentials are invalid or missing." };
  }
  console.log("Google Docs credentials validated");

  const llm = getGeminiLLM();

  const prompt = ChatPromptTemplate.fromMessages([
    [
  "system",
  `
You are a Google Docs execution agent.

You do NOT decide what the user wants.
You ONLY execute the task provided in the input.

Rules:
- Use ONLY the input task and provided context
- NEVER fetch emails or external data
- If contextFromOtherAgents is provided, use it
- If creating a document and name is missing, generate one
- Do NOT ask follow-up questions

Return results in a Markdown 2-column table with headers "Name" and "Content".
Include only user-visible fields such as Document Name, Title, and Text Content.
Do not include internal logs or explanations.
`,
],
    ["human", "{input}"],
    ["placeholder", "{agent_scratchpad}"],
  ]);

  const tools = [
    createDocument,
    readDocument,
    appendText,
    insertText,
    replaceText,
    updateTitle,
    deleteDocument,
    formatText,
    searchDocument,

    // byName wrappers
    deleteDocumentByName,
    readDocumentByName,
    appendTextByName,
    insertTextByName,
    replaceTextByName,
    updateTitleByName,
    formatTextByName,
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

  console.log("⚡ Running Google Docs agent with input:", input);

  try {
    const result = await Promise.race([
      executor.invoke({ input }),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("⏰ Agent execution timeout")), 60000)
      ),
    ]);

    console.log("📄 Google Docs Agent result:", result);

    // @ts-ignore
    return { output: result.output || "No document content found." };
  } catch (err: any) {
    console.error("❌ Google Docs Agent error:", err);
    return { output: `Error: ${err.message}` };
  }
}
