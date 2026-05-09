import prisma from "@/lib/db";

/* ============================================================
   TYPES
============================================================ */

export type ShortTermRole = "user" | "assistant";

export type LongTermCategory =
  | "preference"
  | "project"
  | "habit"
  | "tool"
  | "personal"
  | "contact"
  | "instruction";

/* ============================================================
   SHORT-TERM MEMORY (Conversation)
============================================================ */

const SHORT_TERM_LIMIT = 4; // last 2 user+assistant pairs

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

/**
 * Lightweight keyword-based matching for long-term memory retrieval.
 * Uses multi-word tokenization and partial matching without heavy embeddings.
 */
export async function getRelevantLongTermMemory(
  userId: string,
  prompt: string,
) {
  const memories = await prisma.longTermMemory.findMany({
    where: { userId },
  });

  if (memories.length === 0) return [];

  const lowerPrompt = prompt.toLowerCase();

  // Tokenize prompt into words (remove common stop words)
  const stopWords = new Set([
    "i", "me", "my", "we", "you", "your", "the", "a", "an", "is", "are",
    "was", "were", "be", "been", "being", "have", "has", "had", "do", "does",
    "did", "will", "would", "could", "should", "can", "may", "might", "must",
    "to", "of", "in", "for", "on", "with", "at", "by", "from", "as", "into",
    "about", "like", "through", "after", "over", "between", "out", "against",
    "during", "before", "above", "below", "up", "down", "this", "that", "these",
    "those", "what", "which", "who", "whom", "when", "where", "why", "how",
    "and", "or", "but", "if", "then", "so", "than", "because", "while", "although",
    "just", "also", "only", "very", "too", "now", "here", "there", "please", "thanks"
  ]);

  const promptTokens = lowerPrompt
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter(word => word.length > 2 && !stopWords.has(word));

  // Score each memory based on keyword matches
  const scoredMemories = memories.map(mem => {
    const keyLower = mem.key.toLowerCase();
    const valueLower = mem.value.toLowerCase();
    const categoryLower = mem.category.toLowerCase();

    let score = 0;

    // Direct key match in prompt (highest weight)
    if (lowerPrompt.includes(keyLower)) {
      score += 10;
    }

    // Token matches in key (high weight)
    for (const token of promptTokens) {
      if (keyLower.includes(token)) {
        score += 5;
      }
      // Token matches in value (medium weight)
      if (valueLower.includes(token)) {
        score += 2;
      }
      // Category match (low weight)
      if (categoryLower.includes(token)) {
        score += 1;
      }
    }

    return { memory: mem, score };
  });

  // Return memories with score > 0, sorted by score descending, limit to top 5
  return scoredMemories
    .filter(m => m.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map(m => m.memory);
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
   CHECK IF PROMPT CONTAINS LONG-TERM MEMORY INFO
============================================================ */

/**
 * Quick check to detect if user prompt contains information
 * that should be saved as long-term memory.
 * Returns true if the prompt contains personal info patterns.
 */
export function containsLongTermInfo(prompt: string): boolean {
  const lower = prompt.toLowerCase();

  // Patterns that indicate user is sharing personal information
  const patterns = [
    // Preferences
    /i (prefer|like|love|hate|dislike|enjoy|want)/,
    /my (favorite|preferred|usual)/,
    // Personal info
    /my (name|email|phone|address|birthday|job|work|company|team)/,
    /i (am|work|live|study|go) (at|in|for|as)/,
    /call me/,
    // Projects & habits
    /i('m| am) (building|working on|developing|creating|starting)/,
    /i (use|always|usually|never|often)/,
    // Instructions
    /always (send|remember|use|do|include)/,
    /whenever (i|you)/,
    /don't (ever|forget|include)/,
    // Contact info
    /(email|contact|reach|call) .* (at|is|:)/,
  ];

  return patterns.some(pattern => pattern.test(lower));
}

/* ============================================================
   AI-ASSISTED MEMORY EXTRACTION (Legacy - improved version above)
============================================================ */

/**
 * Simple heuristic-based extractor for basic cases.
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
