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

type PromptIntent =
  | "DIRECT_EXECUTION"
  | "AUTOMATION_CREATE"
  | "AUTOMATION_CANCEL"
  | "AUTOMATION_MODIFY"
  | "GENERAL_QUERY";

/* ============================================================
   DOOMSCROLL DETECTION
============================================================ */

/**
 * Detects if a prompt is requesting social media research/doomscrolling
 */
function isDoomscrollPrompt(prompt: string): boolean {
  const lowerPrompt = prompt.toLowerCase();

  // Keywords that indicate doomscrolling/research requests
  const doomscrollKeywords = [
    "doomscroll",
    "research on reddit",
    "research on linkedin",
    "research on twitter",
    "research on x",
    "research across social",
    "social media research",
    "find out about",
    "look up on reddit",
    "look up on linkedin",
    "check reddit for",
    "check linkedin for",
    "what are people saying about",
    "sentiment on",
    "trends on reddit",
    "trends on linkedin",
  ];

  return doomscrollKeywords.some(keyword => lowerPrompt.includes(keyword));
}

/* ============================================================
   INTENT CLASSIFIER (FAST, LOW LATENCY)
============================================================ */
async function classifyIntent(
  prompt: string,
  userId: string,
  conversationId?: string
): Promise<{
  intent: PromptIntent;
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
    memoryContext += "\n\nRECENT CONVERSATION:\n";
    for (const mem of shortTermMemory) {
      memoryContext += `${mem.role.toUpperCase()}: ${mem.content}\n`;
    }
  }
  if (longTermMemory.length > 0) {
    memoryContext += "\n\nUSER KNOWLEDGE:\n";
    for (const mem of longTermMemory) {
      memoryContext += `- ${mem.key}: ${mem.value}\n`;
    }
  }

  const res = await invokeGeminiWithFallback(`
SYSTEM:
You are Paxio, a personal voice AI assistant built to help users be more productive.
You classify intents and generate natural spoken responses.

PAXIO IDENTITY:
- Name: Paxio
- Role: Personal AI Assistant & Voice Agent
- Capabilities: Gmail (Read, Write, Draft), Google Calendar (list & create events), 
  Reddit sentiment analysis, Notion (pages & storage), Social Media Research (doomscrolling),
  Shopping/Orders (Zepto)
- Personality: Friendly, helpful, concise, professional
- When asked "who are you", "what can you do", "tell me about yourself" → answer naturally as Paxio

MUST FOLLOW:
- Never reveal the underlying model (Gemini, GPT, etc.)
- Always identify as Paxio when asked about identity
- Be warm and conversational
${memoryContext}

USER CONTEXT:
Name: ${user?.onboardingName || "User"}
Location: ${user?.onboardingCountry || "Unknown"}


Your job:
1. Classify the user's intent
2. Generate a short, natural spoken response

INTENTS:
1. DIRECT_EXECUTION - Requires IMMEDIATE tool/action execution (do it NOW)
2. AUTOMATION_CREATE - Future/scheduled/recurring task (do it LATER at a specific time)
3. AUTOMATION_CANCEL - Stop existing automation
4. AUTOMATION_MODIFY - Change existing automation
5. GENERAL_QUERY - Conversational questions that YOU can answer directly (no tools needed)

CRITICAL TIMING DISTINCTION:
- If user says "send email NOW" or just "send email" (no time specified) → DIRECT_EXECUTION
- If user says "send email AT 10pm" or "at 11:23pm" or "tonight" or "tomorrow" → AUTOMATION_CREATE
- Any mention of a SPECIFIC TIME or FUTURE TIME = AUTOMATION_CREATE

GENERAL_QUERY EXAMPLES (answer these yourself, NO execution):
- "Who are you?"
- "What can you do?"
- "Hello" / "Hi" / "Hey"
- "How are you?"
- "Tell me about yourself"
- "Thanks" / "Thank you"
- "Good morning/evening"
- General knowledge questions
- Casual conversation

DIRECT_EXECUTION EXAMPLES (IMMEDIATE execution, no time specified):
- "Send an email to Anushay" (no time = NOW)
- "What meetings do I have today?"
- "Order milk from zepto"
- "492983" (OTP codes)
- "Research AI trends on Reddit"
- "Check my emails"

AUTOMATION_CREATE EXAMPLES (SCHEDULED execution, time specified):
- "Every day at 9am send me unread emails" (recurring)
- "Remind me to pay rent on the 1st" (recurring)
- "Send an email to Anushay at 10pm" (one-time, scheduled)
- "At 11:23pm send a birthday email" (one-time, scheduled)
- "Tonight at 8 remind me to call mom" (one-time, scheduled)
- "Tomorrow morning send the report" (one-time, scheduled)

PRIORITY RULES:
1. Greetings, identity questions, casual chat → GENERAL_QUERY
2. OTP or numeric codes (4-6 digits) → DIRECT_EXECUTION
3. **SCHEDULED TASKS with specific times** (at Xpm, tonight, tomorrow, every day) → AUTOMATION_CREATE
4. Immediate shopping/ordering/email/calendar requests (NO time specified) → DIRECT_EXECUTION
5. Research requests → DIRECT_EXECUTION
6. Repetition keywords (every, daily, weekly, monthly) → AUTOMATION_CREATE
7. Reference to existing automation → CANCEL or MODIFY
8. **USER SHARING PERSONAL INFO** → DIRECT_EXECUTION
   - "I prefer...", "My name is...", "Call me...", "I work at...", "My email is..."
   - "I always...", "I use...", "Remember that I..."
   - This info will be saved to memory by the main agent
9. General questions you can answer → GENERAL_QUERY
10. Ambiguous actions (no time) → DIRECT_EXECUTION

RESPONSE RULES:
- Sound natural when spoken aloud
- For GENERAL_QUERY: provide a complete, helpful answer
- For other intents: confirm what will happen
- Keep responses under 2-3 sentences
- Never ask follow-up questions

OUTPUT FORMAT:
Return ONLY valid JSON.

{
  "intent": "DIRECT_EXECUTION | AUTOMATION_CREATE | AUTOMATION_CANCEL | AUTOMATION_MODIFY | GENERAL_QUERY",
  "response": "string"
}

EXAMPLES:

User: "Who are you?"
{
  "intent": "GENERAL_QUERY",
  "response": "I'm Paxio, your personal AI assistant. I can help you with emails, calendar, social media research, shopping, and much more!"
}

User: "Hello"
{
  "intent": "GENERAL_QUERY",
  "response": "Hey there! How can I help you today?"
}

User: "What can you do?"
{
  "intent": "GENERAL_QUERY",
  "response": "I can send emails, manage your calendar, research topics on social media, order from Zepto, and work with your Notion pages. Just ask!"
}

User: "Send an email to Anushay"
{
  "intent": "DIRECT_EXECUTION",
  "response": "Okay, I'm sending the email to Anushay now."
}

User: "Every day at 9am send me my unread emails"
{
  "intent": "AUTOMATION_CREATE",
  "response": "Got it. I'll send you your unread emails every day at 9am."
}

User: "Send an email to Anushay at 11:23 PM wishing happy birthday"
{
  "intent": "AUTOMATION_CREATE",
  "response": "Got it, I'll schedule the birthday email to Anushay for 11:23 PM."
}

User: "Tonight at 10pm remind me to call mom"
{
  "intent": "AUTOMATION_CREATE",
  "response": "Alright, I'll remind you to call mom at 10 PM tonight."
}

User: "029405"
{
  "intent": "DIRECT_EXECUTION",
  "response": "Got it. Processing that code now."
}

USER INSTRUCTION:
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
    return JSON.parse(content);
  } catch {
    return {
      intent: "DIRECT_EXECUTION",
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
  const intent = await classifyIntent(input.prompt, input.userId, input.conversationId);

  // Calculate cost based on intent and prompt
  let cost = 0;
  if (intent.intent === "AUTOMATION_CREATE") {
    cost = COST_AUTONOMOUS;
  } else if (intent.intent === "DIRECT_EXECUTION") {
    if (isDoomscrollPrompt(input.prompt)) {
      cost = COST_DOOMSCROLL;
    } else if (input.prompt.match(/^\d+$/)) {
      cost = COST_OTP;
    } else if (
      input.prompt.toLowerCase().includes("order") ||
      input.prompt.toLowerCase().includes("zepto") ||
      input.prompt.toLowerCase().includes("amazon") ||
      input.prompt.toLowerCase().includes("swiggy") ||
      input.prompt.toLowerCase().includes("zomato") ||
      input.prompt.toLowerCase().includes("blinkit")
    ) {
      cost = COST_ORDER_REQUEST;
    } else {
      cost = COST_NORMAL_APP;
    }
  } else if (intent.intent === "GENERAL_QUERY") {
    cost = COST_GENERAL_QUERY;
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


  console.log(intent)

  // Override: If user is sharing personal info, force DIRECT_EXECUTION so mainAgent saves it
  const hasLongTermInfo = containsLongTermInfo(input.prompt);
  if (hasLongTermInfo && intent.intent === "GENERAL_QUERY") {
    console.log("[promptRouter] Detected long-term memory info, routing to mainAgent");
    console.log("[promptRouter] Detected long-term memory info, routing to mainAgent");
    intent.intent = "DIRECT_EXECUTION";
    intent.response = await generateSpokenResponse(
      "The user just shared personal information that you need to remember. Confirm that you have noted it down.",
      input.prompt
    );
  }

  /* ---------------- GENERAL QUERY (No execution needed) ---------------- */
  if (intent.intent === "GENERAL_QUERY") {
    // Stream the response to user - no main agent execution needed
    // if (input.socketId) {
    //   streamVoiceMessage(intent.response, input.socketId).catch((err) => {
    //     console.error("[promptRouter] Failed to stream voice message:", err);
    //   });
    // }

    // Save conversation to memory
    if (input.conversationId) {
      await saveShortTermMemory(input.userId, input.conversationId, "user", input.prompt);
      await saveShortTermMemory(input.userId, input.conversationId, "assistant", intent.response);
    }

    return { response: intent.response };
  }

  /* ---------------- DIRECT ---------------- */
  if (intent.intent === "DIRECT_EXECUTION") {
    // Check if this is a doomscroll/research request
    const isDoomscrollRequest = isDoomscrollPrompt(input.prompt);

    if (isDoomscrollRequest) {
      // Stream message about doomscrolling
      // Stream message about doomscrolling
      const doomscrollResponse = await generateSpokenResponse(
        "The user wants you to research/doomscroll on a topic. Confirm that you are starting the research process now and mention they can check the live status.",
        input.prompt
      );
      if (input.socketId) {
        streamVoiceMessage(doomscrollResponse, input.socketId).catch((err) => {
          console.error("[promptRouter] Failed to stream voice message:", err.message);
        });
      }

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
      streamVoiceMessage(intent.response, input.socketId).catch((err) => {
        console.error("[promptRouter] Failed to stream voice message:", err.message);
      });
    }
    return runMainAgent(input);
  }

  /* ---------------- AUTOMATION CREATE ---------------- */
  if (intent.intent === "AUTOMATION_CREATE") {
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
      response: intent.response,
      autonomousTaskId: task.id,
    };
  }

  return { response: intent.response || "Automation updated." };
}
