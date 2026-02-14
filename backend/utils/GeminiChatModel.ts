// apps/backend/src/utils/GeminiChatModel.ts
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

// Collect all GEMINI_API_KEY_* from environment
const apiKeys: string[] = Object.entries(process.env)
  .filter(([key]) => key.startsWith("GEMINI_API_KEY_"))
  .map(([_, value]) => value as string)
  .filter(Boolean);

if (apiKeys.length === 0) {
  throw new Error("❌ No GEMINI_API_KEY_X found in environment variables.");
}

// Cache of LLM instances per API key
const llmCache = new Map<string, ChatGoogleGenerativeAI>();

/**
 * Get a ChatGoogleGenerativeAI instance for the given API key (cached)
 */
function getLLMForKey(apiKey: string): ChatGoogleGenerativeAI {
  if (!llmCache.has(apiKey)) {
    llmCache.set(
      apiKey,
      new ChatGoogleGenerativeAI({
        model: "gemini-2.5-flash",
        temperature: 0.1,
        apiKey,
      })
    );
  }
  return llmCache.get(apiKey)!;
}

/**
 * Shuffle an array using Fisher-Yates and return a new array.
 */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Get a random LLM instance
 */
export function getGeminiLLM(): ChatGoogleGenerativeAI {
  const randomKey = apiKeys[Math.floor(Math.random() * apiKeys.length)];
  return getLLMForKey(randomKey);
}

/**
 * Invoke Gemini with automatic API key fallback using random selection.
 * Shuffles all keys and tries each one until one succeeds.
 */
export async function invokeGeminiWithFallback(
  prompt: string | any[]
): Promise<any> {
  let lastError: any;
  const shuffledKeys = shuffle(apiKeys);

  for (const key of shuffledKeys) {
    const llm = getLLMForKey(key);

    try {
      const result = await llm.invoke(prompt);
      return result;
    } catch (err: any) {
      console.warn(
        `[GeminiLLM] API key failed, trying another...`,
        err.message || err
      );
      lastError = err;

      // Check if error is rate limit or quota exceeded
      const isRetirable =
        err.message?.includes("429") ||
        err.message?.includes("quota") ||
        err.message?.includes("rate") ||
        err.message?.includes("RESOURCE_EXHAUSTED");

      if (!isRetirable) {
        // Don't retry on non-retryable errors
        throw err;
      }
    }
  }

  throw new Error(
    `[GeminiLLM] All ${apiKeys.length} API keys failed. Last error: ${lastError?.message || lastError}`
  );
}

/**
 * Creates a proxy LLM that wraps invoke() with automatic fallback
 */
export function getGeminiLLMWithFallback(): ChatGoogleGenerativeAI & {
  invokeWithFallback: typeof invokeGeminiWithFallback;
} {
  const baseLLM = getGeminiLLM();

  // Return the base LLM with an additional fallback method
  return Object.assign(baseLLM, {
    //@ts-expect-error
    invokeWithFallback,
  });
}

/**
 * Get the number of available API keys
 */
export function getApiKeyCount(): number {
  return apiKeys.length;
}

/**
 * Get an LLM instance for a specific API key index
 */
export function getGeminiLLMByIndex(index: number): ChatGoogleGenerativeAI {
  const keyIndex = index % apiKeys.length;
  return getLLMForKey(apiKeys[keyIndex]);
}

