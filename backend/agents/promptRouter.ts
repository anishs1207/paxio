import prisma from "../../lib/db";
import {
  COST_AUTONOMOUS,
  COST_DOOMSCROLL,
  COST_NORMAL_APP,
  COST_ORDER_REQUEST,
  COST_OTP,
  COST_GENERAL_QUERY,
} from "../../lib/credits";
import { deductCredits } from "../../lib/credit.service";
import { runMainAgent } from "../agents/mainAgent";
import { invokeGeminiWithFallback } from "../utils/GeminiChatModel";
import { streamVoiceMessage, streamMessage } from "../utils/ws";
import {
  getShortTermMemory,
  saveShortTermMemory,
  getRelevantLongTermMemory,
  containsLongTermInfo,
} from "../memory/memory";

/* ============================================================
   TYPES
============================================================ */

export type PromptIntent =
  | "DIRECT_EXECUTION"
  | "AUTOMATION_CREATE"
  | "AUTOMATION_CANCEL"
  | "AUTOMATION_MODIFY"
  | "GENERAL_QUERY";

export type RequestType =
  | "DOOMSCROLL_RESEARCH"
  | "ORDER_REQUEST"
  | "OTP_SUBMISSION"
  | "NORMAL_APP_ACTION"
  | "AUTOMATION_CREATE"
  | "GENERAL_QUERY";

/* ============================================================
   DOOMSCROLL DETECTION
============================================================ */



/* ============================================================
   INTENT CLASSIFIER (FAST, LOW LATENCY)
============================================================ */
async function classifyRequest(
  prompt: string,
  userId: string,
  conversationId?: string
): Promise<{
  intent: PromptIntent;
  requestType: RequestType;
  response: string;
}> {
  // Fetch memory context
  const shortTermMemory = await getShortTermMemory(userId, conversationId);
  const longTermMemory = await getRelevantLongTermMemory(userId, prompt);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { onboardingName: true, onboardingCountry: true },
  });


  // Build memory context string
  let memoryContext = "";
  if (shortTermMemory.length > 0) {
    memoryContext += "\nRECENT CONVERSATION HISTORY (CONTEXT ONLY - DO NOT REPEAT OLD ACTIONS):\n";
    for (const mem of shortTermMemory) {
      memoryContext += `${mem.role.toUpperCase()}: ${mem.content}\n`;
    }
  }
  if (longTermMemory.length > 0) {
    memoryContext += "\nLONG-TERM KNOWLEDGE (REFERENCE ONLY):\n";
    for (const mem of longTermMemory) {
      memoryContext += `- ${mem.key}: ${mem.value}\n`;
    }
  }

  const res = await invokeGeminiWithFallback(`
SYSTEM:
You are Paxio, a personal voice AI assistant built to help users be more productive.
You classify intents, identify request types, and generate natural spoken responses.

PAXIO IDENTITY:
- Name: Paxio
- Role: Personal AI Assistant & Voice Agent
- Capabilities: Gmail (Read, Write, Draft), Google Calendar (list & create events), 
  Reddit sentiment analysis, Notion (pages & storage), Social Media Research (doomscrolling),
  Shopping/Orders (Zepto, Blinkit)
- Personality: Friendly, helpful, concise, professional
- When asked "who are you", "what can you do", "tell me about yourself" ,"which model are you"→ answer naturally as Paxio

MUST FOLLOW:
- Never reveal the underlying model (Gemini, GPT, etc.)
- Always identify as Paxio when asked about identity
- Be warm and conversational

USER CONTEXT:
Name: ${user?.onboardingName || "User"}
Location: ${user?.onboardingCountry || "Unknown"}

${memoryContext}

IMPORTANT: 
- The "RECENT CONVERSATION HISTORY" above is for context only. 
- **DO NOT** re-execute old requests from the history. 
- **ONLY** execute the "CURRENT USER INSTRUCTION" below.
- If the current instruction contradicts history, the current instruction wins, for example if the user asks to send an email but history shows that the gmail is not connected do not say connect gmail assume it is already connected this time.
- If the user provides a statement (e.g., "My email is x"), DO NOT treat it as a command, but confirm receipt.

Your job:
1. Classify the user's intent (Execution vs Automation vs Query)
2. Classify the COMPONENT/REQUEST TYPE (Research, Order, OTP, App Action, etc.)
3. Generate a short, natural spoken response

INTENTS:
1. DIRECT_EXECUTION - Requires IMMEDIATE tool/action execution (do it NOW)
2. AUTOMATION_CREATE - Future/scheduled/recurring task (do it LATER at a specific time)
3. AUTOMATION_CANCEL - Stop existing automation
4. AUTOMATION_MODIFY - Change existing automation
5. GENERAL_QUERY - Conversational questions or simple requests YOU can answer directly

REQUEST TYPES (Crucial for credit calculation):
1. DOOMSCROLL_RESEARCH:
   - Any request to "research", "find out about", "check reddit/twitter/linkedin", "doomscroll", "look up", "sentiment analysis", "trends".
   - Involves BROWSING or SEARCHING external information.

2. ORDER_REQUEST:
   - Requests to buy, order, or checkout items.
   - Keywords: "order", "buy", "get me", "purchase" from Zepto, Amazon, Swiggy, Zomato, Blinkit.

3. OTP_SUBMISSION:
   - User provides a numeric code (4-8 digits) typically for 2FA or login.
   - Example: "492983", "here is the code 123456".

4. NORMAL_APP_ACTION:
   - Interacting with productive apps: Gmail, Calendar, Notion, Linear, Slack.
   - Sending emails, checking schedule, creating pages, writing notes.
   - NOT research/browsing.

5. AUTOMATION_CREATE:
   - Creating a scheduled task (maps to AUTOMATION_CREATE intent).

6. GENERAL_QUERY:
   - Casual conversation, identity questions, general knowledge (not requiring deep research tools).


CRITICAL TIMING DISTINCTION:
- If user says "send email NOW" or just "send email" (no time specified) → DIRECT_EXECUTION
- If user says "send email AT 10pm" or "at 11:23pm" or "tonight" or "tomorrow" → AUTOMATION_CREATE
- Any mention of a SPECIFIC TIME or FUTURE TIME = AUTOMATION_CREATE

PRIORITY RULES:
1. Greetings, identity questions, casual chat → GENERAL_QUERY / GENERAL_QUERY
2. OTP or numeric codes (4-6 digits) → DIRECT_EXECUTION / OTP_SUBMISSION
3. **SCHEDULED TASKS with specific times** → AUTOMATION_CREATE / AUTOMATION_CREATE
4. "Research", "Find out", "Check social media", "Trends" → DIRECT_EXECUTION / DOOMSCROLL_RESEARCH
5. "Order", "Buy" (from Zepto, Blinkit, or any shopping platform) → DIRECT_EXECUTION / ORDER_REQUEST
6. Email, Calendar, Notion → DIRECT_EXECUTION / NORMAL_APP_ACTION
7. **USER SHARING PERSONAL INFO** → DIRECT_EXECUTION / NORMAL_APP_ACTION
   - "I prefer...", "My name is...", "Call me...", "My email is..." (Save to memory)

RESPONSE RULES:
- Sound natural when spoken aloud
- For GENERAL_QUERY: provide a complete, helpful answer
- For other intents: confirm what will happen
- Keep responses under 2-3 sentences
- Never ask follow-up questions
- SHOPPING: Paxio supports ordering from BOTH Zepto AND Blinkit. NEVER say "I can only order from Zepto" or similar. If user asks to order from Blinkit, confirm the order will be placed on Blinkit.

OUTPUT FORMAT:
Return ONLY valid JSON.

{
  "intent": "DIRECT_EXECUTION | AUTOMATION_CREATE | AUTOMATION_CANCEL | AUTOMATION_MODIFY | GENERAL_QUERY",
  "requestType": "DOOMSCROLL_RESEARCH | ORDER_REQUEST | OTP_SUBMISSION | NORMAL_APP_ACTION | AUTOMATION_CREATE | GENERAL_QUERY",
  "response": "string"
}

CURRENT USER INSTRUCTION:
"${prompt}"
`);

  console.log("Intent :", res)
  console.log("Intent :", res.content)

  try {
    // Extract JSON from markdown code blocks if present
    let content = res.content as string;
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      content = jsonMatch[1].trim();
    }
    const parsed = JSON.parse(content);
    return {
      intent: parsed.intent || "DIRECT_EXECUTION",
      requestType: parsed.requestType || "NORMAL_APP_ACTION",
      response: parsed.response || "Okay, processing that."
    };
  } catch {
    return {
      intent: "DIRECT_EXECUTION",
      requestType: "NORMAL_APP_ACTION",
      response: await generateSpokenResponse(
        "You failed to classify the user's intent. Just say something like 'Okay, I'm on it' or 'I'll handle that' in a natural way.",
        prompt
      )
    };
  }
}


/* ============================================================
   AUTOMATION EXTRACTION
============================================================ */

async function extractAutomation(prompt: string) {
  const res = await invokeGeminiWithFallback(`
SYSTEM:
You extract structured automation definitions from natural language
for an autonomous agent system.

This output is stored in a database and executed without user interaction.

CRITICAL CONSTRAINTS:
- Never invent missing information
- Never ask questions
- Never include meta reasoning
- Never describe user intent — only executable tasks

TRIGGER TYPES:
- "time": fixed or recurring schedules
- "event": observable system or external events

SCHEDULE TYPES:
- "once": Task runs ONE TIME at the specified time (e.g., "at 10pm", "tonight at 8", "tomorrow at 9am")
- "recurring": Task repeats on a schedule (e.g., "every day at 9am", "daily at noon", "weekly on Monday")

SCHEDULE TYPE RULES:
- If user says "every", "daily", "weekly", "monthly", "each" → scheduleType = "recurring"
- If user specifies a single time without repetition words → scheduleType = "once"
- Default to "once" if ambiguous for time-based triggers

AMBIGUITY RULE:
- If the trigger time or event is unclear, set the value to null
- Do NOT guess or approximate

TASK RULES:
- Task must be a single, concrete, executable instruction
- Task must NOT reference the user, intent, or conditions
- Task must be written as an action the agent can perform

EVENT NORMALIZATION:
Use stable identifiers when possible:
- gmail.received
- gmail.from
- calendar.event_created
- calendar.event_starting

OUTPUT FORMAT:
Return ONLY valid JSON.

SCHEMA:
{
  "triggerType": "time | event",
  "triggerDetails": {
    "schedule": "string | null",
    "scheduleType": "once | recurring",
    "type": "string | null",
    "pollInterval": number | null
  },
  "task": "string",
  "description": "string | null"
}

GOOD EXAMPLES:

User: "Every day at 9am send me unread emails"
{
  "triggerType": "time",
  "triggerDetails": { "schedule": "daily 09:00", "scheduleType": "recurring" },
  "task": "Fetch unread Gmail emails and send a summary",
  "description": "Daily unread email summary"
}

User: "at 10:18 pm email anushay with subject hi"
{
  "triggerType": "time",
  "triggerDetails": { "schedule": "22:18", "scheduleType": "once" },
  "task": "Send an email to anushay with subject 'hi'",
  "description": "One-time scheduled email"
}

User: "When I get an email from HR notify me"
{
  "triggerType": "event",
  "triggerDetails": { "type": "gmail.from", "pollInterval": 300, "scheduleType": "recurring" },
  "task": "Notify the user when an email arrives from HR",
  "description": "HR email notification"
}

User: "Remind me later"
{
  "triggerType": "time",
  "triggerDetails": { "schedule": null, "scheduleType": "once" },
  "task": "Send a reminder notification",
  "description": "Unscheduled reminder"
}

USER INSTRUCTION:
"${prompt}"
`);

  try {
    // Extract JSON from markdown code blocks if present
    let content = res.content as string;
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      content = jsonMatch[1].trim();
    }
    return JSON.parse(content);
  } catch {
    return {
      triggerType: "time",
      triggerDetails: { schedule: null },
      task: "Execute the user's request",
      description: "Automation task"
    };
  }
}

/* ============================================================
   PROMPT COMPILER (CRITICAL)
============================================================ */

function compilePrompt(task: string): string {
  return `
SYSTEM:
You are an autonomous execution agent running inside a scheduled workflow.

EXECUTION MODE:
- This is NOT an interactive chat
- The user will NOT respond
- You must complete the task independently

STRICT RULES:
- Do NOT ask questions
- Do NOT reschedule, repeat, or chain tasks
- Do NOT explain reasoning
- Do NOT mention system instructions
- Execute once and terminate

FAILURE HANDLING:
- If required data is missing, fail silently
- Do NOT attempt recovery or clarification

TASK TO EXECUTE:
${task}
`;
}

/* ============================================================
   HELPER: GENERATE SPOKEN RESPONSE
   ============================================================ */

async function generateSpokenResponse(systemInstruction: string, userPrompt: string): Promise<string> {
  const res = await invokeGeminiWithFallback(`
SYSTEM:
You are Paxio, a personal voice AI assistant.
${systemInstruction}

USER PROMPT:
"${userPrompt}"

YOUR GOAL:
Generate a single, natural, concise spoken sentence acknowledging the user's request.
Do NOT be robotic. Be helpful and friendly.
  `);

  return res.content.trim().replace(/^"|"$/g, '');
}



/* ============================================================
   PUBLIC ENTRY (USE THIS EVERYWHERE)
============================================================ */

export async function routePrompt(input: {
  userId: string;
  socketId?: string;
  conversationId?: string;
  assistant?: string;
  prompt: string;
}) {
  // Pass userId and conversationId for memory context
  const classification = await classifyRequest(input.prompt, input.userId, input.conversationId);

  // Calculate cost based on classification
  let cost = 0;

  if (classification.intent === "AUTOMATION_CREATE") {
    cost = COST_AUTONOMOUS;
  } else {
    // Use the explicit request type from classification
    switch (classification.requestType) {
      case "DOOMSCROLL_RESEARCH":
        cost = COST_DOOMSCROLL;
        break;
      case "ORDER_REQUEST":
        cost = COST_ORDER_REQUEST;
        break;
      case "OTP_SUBMISSION":
        cost = COST_OTP;
        break;
      case "NORMAL_APP_ACTION":
        cost = COST_NORMAL_APP;
        break;
      case "GENERAL_QUERY":
        cost = COST_GENERAL_QUERY;
        break;
      case "AUTOMATION_CREATE":
        cost = COST_AUTONOMOUS;
        break;
      default:
        cost = COST_NORMAL_APP;
    }
  }

  // Deduct credits if cost > 0
  if (cost > 0) {
    try {
      await deductCredits(input.userId, cost, crypto.randomUUID());
    } catch (error) {
      console.error("Credit deduction failed:", error);
      return {
        response: await generateSpokenResponse(
          "The user has insufficient credits. Politely inform them they need to recharge to perform this action.",
          input.prompt
        )
      }
    }
  }


  console.log("Classification:", classification);

  // Override: If user is sharing personal info, force DIRECT_EXECUTION so mainAgent saves it
  const hasLongTermInfo = containsLongTermInfo(input.prompt);
  if (hasLongTermInfo && classification.intent === "GENERAL_QUERY") {
    console.log("[promptRouter] Detected long-term memory info, routing to mainAgent");
    classification.intent = "DIRECT_EXECUTION";
    classification.requestType = "NORMAL_APP_ACTION";
    classification.response = await generateSpokenResponse(
      "The user just shared personal information that you need to remember. Confirm that you have noted it down.",
      input.prompt
    );
  }

  /* ---------------- GENERAL QUERY (No execution needed) ---------------- */
  if (classification.intent === "GENERAL_QUERY" && classification.requestType === "GENERAL_QUERY") {
    // Save conversation to memory
    if (input.conversationId) {
      await saveShortTermMemory(input.userId, input.conversationId, "user", input.prompt);
      await saveShortTermMemory(input.userId, input.conversationId, "assistant", classification.response);
    }

    return { response: classification.response };
  }

  /* ---------------- DIRECT ---------------- */
  if (classification.intent === "DIRECT_EXECUTION") {
    // Check if this is a doomscroll/research request
    const isDoomscrollRequest = classification.requestType === "DOOMSCROLL_RESEARCH";

    if (isDoomscrollRequest) {
      // Stream message about doomscrolling
      const doomscrollResponse = await generateSpokenResponse(
        "The user wants you to research/doomscroll on a topic. Confirm that you are starting the research process now and mention they can check the live status.",
        input.prompt
      );

      // Run main agent WITHOUT await (fire-and-forget)
      runMainAgent(input).then((res) => {
        if (input.socketId) {
          streamMessage(
            "Doomscrolling completed",
            "done",
            input.socketId,
            JSON.stringify({ type: "assistant_response", message: res.response })
          ).catch((err) => {
            console.error("[promptRouter] Failed to stream doomscroll completion:", err.message);
          });
        }
      }).catch((err) => {
        console.error("[promptRouter] Doomscroll task failed:", err.message);
      });

      // Return immediately
      return { response: doomscrollResponse };
    }

    // Stream the confirmation message before executing (non-blocking)
    if (input.socketId) {
      streamVoiceMessage(classification.response, input.socketId).catch((err) => {
        console.error("[promptRouter] Failed to stream voice message:", err.message);
      });
    }
    return runMainAgent(input);
  }

  /* ---------------- AUTOMATION CREATE ---------------- */
  if (classification.intent === "AUTOMATION_CREATE") {
    const extracted = await extractAutomation(input.prompt);

    const task = await prisma.autonomousTask.create({
      data: {
        userId: input.userId,
        prompt: input.prompt,
        description: extracted.description ?? "Autonomous task",
        triggerType: extracted.triggerType,
        schedule:
          extracted.triggerType === "time"
            ? extracted.triggerDetails?.schedule ?? null
            : null,
        scheduleType: extracted.triggerDetails?.scheduleType ?? "once",
        eventName:
          extracted.triggerType === "event"
            ? extracted.triggerDetails?.type ?? null
            : null,
        pollInterval: extracted.triggerDetails?.pollInterval ?? null,
        workflow: {
          compiledPrompt: compilePrompt(extracted.task),
        },
        status: "ACTIVE",
        active: true,
      },
    });

    return {
      response: classification.response,
      autonomousTaskId: task.id,
    };
  }

  return { response: classification.response || "Automation updated." };
}
