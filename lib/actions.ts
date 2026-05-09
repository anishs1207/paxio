"use server";

import { CartesiaClient } from "@cartesia/cartesia-js";

async function consumeResponse(response: unknown): Promise<Buffer> {
  if (Buffer.isBuffer(response)) {
    return response;
  } else if (response && typeof response.arrayBuffer === "function") {
    return Buffer.from(await response.arrayBuffer());
  } else if (response && typeof response[Symbol.asyncIterator] === "function") {
    const chunks: Uint8Array[] = [];
    for await (const chunk of response) {
      chunks.push(chunk instanceof Uint8Array ? chunk : Buffer.from(chunk));
    }
    return Buffer.concat(chunks);
  }
  //
  throw new Error("Unexpected response type from Cartesia TTS");
}

export async function generateSpeech(text: string) {
  const keys = [
    process.env.CARTESIA_API_KEY_1,
    process.env.CARTESIA_API_KEY_2,
  ].filter(Boolean) as string[];

  if (keys.length === 0) {
    console.error("No Cartesia API keys configured");
    return { success: false, error: "No Cartesia API keys configured" };
  }

  for (let i = 0; i < keys.length; i++) {
    const apiKey = keys[i];
    try {
      console.log(`[Cartesia TTS] Trying key ${i + 1}/${keys.length}...`);

      const cartesia = new CartesiaClient({ apiKey });

      const response = await cartesia.tts.bytes({
        modelId: "sonic-english",
        transcript: text,
        voice: {
          mode: "id",
          id: "79a125e8-cd45-4c13-8a67-188112f4dd22",
        },
        outputFormat: {
          container: "wav",
          encoding: "pcm_f32le",
          sampleRate: 44100,
        },
      });

      const finalBuffer = await consumeResponse(response);

      console.log(`[Cartesia TTS] Success with key ${i + 1}`);
      return { success: true, audio: finalBuffer.toString("base64") };
    } catch (error: unknown) {
      const err = error as { statusCode?: number; message?: string };
      console.warn(
        `[Cartesia TTS] Key ${i + 1} failed:`,
        err?.statusCode || err?.message
      );
    }
  }

  console.error("[Cartesia TTS] All API keys exhausted");
  return { success: false, error: "All Cartesia API keys failed" };
}
