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

let currentKeyIndex = Math.floor(Math.random() * apiKeys.length);

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
 * Get the current LLM instance (randomly selected)
 */
export function getGeminiLLM(): ChatGoogleGenerativeAI {
  // Pick a random key each time for better distribution
  const randomIndex = Math.floor(Math.random() * apiKeys.length);
  return getLLMForKey(apiKeys[randomIndex]);
}

/**
 * Invoke Gemini with automatic API key rotation on failure.
 * Tries keys in RANDOM order until one succeeds.
 */
export async function invokeGeminiWithFallback(
  prompt: string | any[]
): Promise<any> {
  let lastError: any;

  // Create a pool of remaining indices to try
  const remainingIndices = Array.from({ length: apiKeys.length }, (_, i) => i);

  // Shuffle indices (Fisher-Yates shuffle)
  for (let i = remainingIndices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [remainingIndices[i], remainingIndices[j]] = [remainingIndices[j], remainingIndices[i]];
  }

  for (let i = 0; i < remainingIndices.length; i++) {
    const keyIndex = remainingIndices[i];
    const key = apiKeys[keyIndex];
    const llm = getLLMForKey(key);

    try {
      const result = await llm.invoke(prompt);

      // Success - update current index logic mostly for tracking if needed,
      // but strictly we just return the result here.
      currentKeyIndex = keyIndex;

      return result;
    } catch (err: any) {
      console.warn(
        `[GeminiLLM] API key index ${keyIndex} failed:`,
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

/**
 * Rotate to a random API key
 */
export function rotateApiKey(): void {
  currentKeyIndex = Math.floor(Math.random() * apiKeys.length);
}
