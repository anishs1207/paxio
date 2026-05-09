import {
  GoogleGenAI,
  createUserContent,
  createPartFromUri,
} from "@google/genai";
import dotenv from "dotenv";
import { getAvailableKeys, markKeyFailed } from "./failedKeyCache";

dotenv.config();

const apiKeys: string[] = Object.entries(process.env)
  .filter(([key]) => key.startsWith("GEMINI_API_KEY_"))
  .map(([, value]) => value as string)
  .filter(Boolean);

if (apiKeys.length === 0) {
  throw new Error("No GEMINI_API_KEY_X found in environment");
}

/**
 * Shuffle an array in place using Fisher-Yates algorithm and return it.
 */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export async function callGemini(
  prompt: string,
  files?: File[],
): Promise<string> {
  let lastError: unknown;
  const available = getAvailableKeys(apiKeys);
  if (available.length === 0) {
    console.warn("[callGemini] All API keys are rate-limited. Falling back to full list.");
  }
  const keysToTry = available.length > 0 ? available : apiKeys;
  const shuffledKeys = shuffle(keysToTry);

  for (const key of shuffledKeys) {
    try {
      const ai = new GoogleGenAI({ apiKey: key });
      const parts: unknown[] = [prompt];

      // Handle multiple file uploads
      if (files && files.length > 0) {
        for (const file of files) {
          const upload = await ai.files.upload({ file });
          //@ts-expect-error - createPartFromUri might not be fully typed in this version of the GenAI SDK
          parts.push(createPartFromUri(upload.uri, upload.mimeType));
        }
      }

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [createUserContent(parts)],
      });

      //@ts-expect-error - response.text may not be directly available in all SDK response shapes
      return response.text;
    } catch (err: unknown) {
      console.error(`Gemini API key failed, trying another...`, (err as Error).message || err);
      lastError = err;

      // Mark key as failed for 24h on rate-limit / quota errors
      const msg = err.message || "";
      const isRateLimit =
        msg.includes("429") ||
        msg.includes("quota") ||
        msg.includes("rate") ||
        msg.includes("RESOURCE_EXHAUSTED");
      if (isRateLimit) {
        markKeyFailed(key, msg).catch(() => { });
      }
    }
  }

  throw new Error(
    `All Gemini API keys failed. Last error: ${(lastError as Error)?.message || lastError}`,
  );
}
