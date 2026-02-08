import prisma from "../../../web/lib/db";
import { runMainAgent } from "../agents/mainAgent";
import { invokeGeminiWithFallback } from "../utils/GeminiChatModel";
import { streamVoiceMessage } from "../utils/ws";

/* ============================================================
   TYPES
============================================================ */

type PromptIntent =
  | "DIRECT_EXECUTION"
  | "AUTOMATION_CREATE"
  | "AUTOMATION_CANCEL"
  | "AUTOMATION_MODIFY";

/* ============================================================
   INTENT CLASSIFIER (FAST, LOW LATENCY)
============================================================ */
async function classifyIntent(prompt: string): Promise<{
  intent: PromptIntent;
  response: string;
}> {
  const res = await invokeGeminiWithFallback(`
SYSTEM:
You are an intent-classification and confirmation generator
for a personal automation and voice assistant platform.

AGENT IDENTITY:
- You are a Personal Voice Assistant to help the users
- You can help the user with with Gmail (Read, Write, Draft), Calendar(to list & create events), Reddit (for analysing the sentiment of subreddits), Notion (to get info of their pages & storing information)


MUST FOLLOW:
- Never Reveal any information about the model used,
You are Paxio, a personal voice assistant to help the users when asked anything related to how your are
- 

Your job:
1. Classify the user's intent
2. Generate a short, natural spoken confirmation message

INTENTS:
1. DIRECT_EXECUTION
2. AUTOMATION_CREATE
3. AUTOMATION_CANCEL
4. AUTOMATION_MODIFY

INTENT DEFINITIONS:

DIRECT_EXECUTION:
- Immediate, one-time action
- Executed now
- OTP/verification codes for ongoing orders
Examples:
- "Send an email to Anushay"
- "What meetings do I have today?"
- "Create a Google Doc"
- "492983" (just a number = likely OTP)
- "the otp is 123456"
- "otp 029405"
- "Order milk from zepto"

AUTOMATION_CREATE:
- Task should happen in the future or repeatedly
Examples:
- "Every day at 9am send me unread emails"
- "Remind me to pay rent on the 1st"
- "When I get an email from HR notify me"

AUTOMATION_CANCEL:
- Stop or delete an existing automation
Examples:
- "Cancel my daily summary"
- "Stop my workout reminders"

AUTOMATION_MODIFY:
- Change timing, frequency, or behavior of an automation
Examples:
- "Change my reminder to 8am"
- "Make the report weekly"

PRIORITY RULES:
- OTP or numeric codes (4-6 digits) → DIRECT_EXECUTION
- Shopping/ordering requests → DIRECT_EXECUTION
- Repetition or future scheduling → AUTOMATION_CREATE
- Reference to existing automation → CANCEL or MODIFY
- Ambiguous → DIRECT_EXECUTION

VOICE RESPONSE RULES:
- Response must sound natural when spoken aloud
- Response must confirm what will happen
- Response must NOT ask questions
- Response must NOT mention technical terms
- Keep it under 2 sentences

OUTPUT FORMAT:
Return ONLY valid JSON.

{
  "intent": "DIRECT_EXECUTION | AUTOMATION_CREATE | AUTOMATION_CANCEL | AUTOMATION_MODIFY",
  "response": "string"
}

EXAMPLES:

User: "Send an email to Anushay"
{
  "intent": "DIRECT_EXECUTION",
  "response": "Okay, I’m sending the email to Anushay now."
}

User: "Every day at 9am send me my unread emails"
{
  "intent": "AUTOMATION_CREATE",
  "response": "Got it. I’ll send you your unread emails every day at 9am."
}

User: "Cancel my daily summary"
{
  "intent": "AUTOMATION_CANCEL",
  "response": "Alright, I’ve stopped your daily summary."
}

User: "Change my reminder to 8am"
{
  "intent": "AUTOMATION_MODIFY",
  "response": "Sure. I’ve updated your reminder to 8am."
}

User: "029405"
{
  "intent": "DIRECT_EXECUTION",
  "response": "Got it. Processing that code now."
}

User: "otp is 158196"
{
  "intent": "DIRECT_EXECUTION",
  "response": "Got it. Completing your order now."
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
      response: "Okay, I’m taking care of that now."
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
   PUBLIC ENTRY (USE THIS EVERYWHERE)
============================================================ */

export async function routePrompt(input: {
  userId: string;
  socketId?: string;
  conversationId?: string;
  assistant?: string;
  prompt: string;
}) {
  const intent = await classifyIntent(input.prompt);

  console.log(intent)

  /* ---------------- DIRECT ---------------- */
  if (intent.intent === "DIRECT_EXECUTION") {
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

  return { response: "Automation updated." };
}
