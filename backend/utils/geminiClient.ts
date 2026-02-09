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

let currentKeyIndex = 0;

export async function callGemini(
  prompt: string,
  files?: File[],
): Promise<string> {
  let lastError: any;

  for (let i = 0; i < apiKeys.length; i++) {
    const key = apiKeys[(currentKeyIndex + i) % apiKeys.length];

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

      // Rotate key for next use
      currentKeyIndex = (currentKeyIndex + i) % apiKeys.length;

      //@ts-expect-error
      return response.text;
    } catch (err: any) {
      console.error(`Gemini API key ${key} failed:`, err);
      lastError = err;
    }
  }

  throw new Error(
    `All Gemini API keys failed. Last error: ${lastError?.message || lastError}`,
  );
}
