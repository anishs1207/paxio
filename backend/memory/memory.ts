import prisma from "../../../web/lib/db";

/* ============================================================
   TYPES
============================================================ */

export type ShortTermRole = "user" | "assistant";

export type LongTermCategory =
  | "preference"
  | "project"
  | "habit"
  | "tool"
  | "personal";

/* ============================================================
   SHORT-TERM MEMORY (Conversation)
============================================================ */

const SHORT_TERM_LIMIT = 6; // last 3 user+assistant pairs

export async function getShortTermMemory(
  userId: string,
  conversationId?: string,
) {
  if (!conversationId) return [];

  const rows = await prisma.shortTermMemory.findMany({
    where: { userId, conversationId },
    orderBy: { createdAt: "desc" },
    take: SHORT_TERM_LIMIT,
  });

  console.log("rows short:", rows);

  return rows.reverse();
}

export async function saveShortTermMemory(
  userId: string,
  conversationId: string | undefined,
  role: ShortTermRole,
  content: string,
) {
  if (!conversationId) return;

  console.log("saving");

  await prisma.shortTermMemory.create({
    data: {
      userId,
      conversationId,
      role,
      content,
    },
  });
}

/* ============================================================
   LONG-TERM MEMORY (User Knowledge)
============================================================ */

export async function getRelevantLongTermMemory(
  userId: string,
  prompt: string,
) {
  const memories = await prisma.longTermMemory.findMany({
    where: { userId },
  });

  const lowerPrompt = prompt.toLowerCase();

  return memories.filter((m) => lowerPrompt.includes(m.key.toLowerCase()));
}

export async function saveLongTermMemory(
  userId: string,
  category: LongTermCategory,
  key: string,
  value: string,
) {
  await prisma.longTermMemory.upsert({
    where: {
      userId_key: {
        userId,
        key,
      },
    },
    update: {
      value,
      category,
    },
    create: {
      userId,
      category,
      key,
      value,
    },
  });
}

/* ============================================================
   AI-ASSISTED MEMORY EXTRACTION
============================================================ */

/**
 * Very simple heuristic-based extractor.
 * You can make this smarter later.
 */
export function extractLongTermMemoryFromText(text: string) {
  const memories: {
    category: LongTermCategory;
    key: string;
    value: string;
  }[] = [];

  const lower = text.toLowerCase();

  if (lower.includes("i prefer")) {
    memories.push({
      category: "preference",
      key: "preference",
      value: text,
    });
  }

  if (lower.includes("i am building") || lower.includes("i am working on")) {
    memories.push({
      category: "project",
      key: "current_project",
      value: text,
    });
  }

  if (lower.includes("i use")) {
    memories.push({
      category: "tool",
      key: "tools_used",
      value: text,
    });
  }

  return memories;
}
