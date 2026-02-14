import {
  GoogleGenAI,
  createUserContent,
  createPartFromUri,
} from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const apiKeys: string[] = Object.entries(process.env)
  .filter(([key]) => key.startsWith("GEMINI_API_KEY_"))
  .map(([_, value]) => value as string)
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
  let lastError: any;
  const shuffledKeys = shuffle(apiKeys);

  for (const key of shuffledKeys) {
    try {
      const ai = new GoogleGenAI({ apiKey: key });
      const parts: any[] = [prompt];

      // Handle multiple file uploads
      if (files && files.length > 0) {
        for (const file of files) {
          const upload = await ai.files.upload({ file });
          //@ts-expect-error
          parts.push(createPartFromUri(upload.uri, upload.mimeType));
        }
      }

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [createUserContent(parts)],
      });

      //@ts-expect-error
      return response.text;
    } catch (err: any) {
      console.error(`Gemini API key failed, trying another...`, err.message || err);
      lastError = err;
    }
  }

  throw new Error(
    `All Gemini API keys failed. Last error: ${lastError?.message || lastError}`,
  );
}
