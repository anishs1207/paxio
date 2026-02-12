import { routePrompt } from "@/backend/agents/promptRouter";
import { NextRequest, NextResponse } from "next/server";
// import { createClient } from "@deepgram/sdk";
import { AssemblyAI } from "assemblyai";
import { CartesiaClient } from "@cartesia/cartesia-js";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
// import { deductCredits, refundCredits } from "@/lib/credit.service";

// const deepgram = createClient(process.env.DEEPGRAM_API_KEY!);
const assemblyClient = new AssemblyAI({
  apiKey: process.env.ASSEMBLYAI_API_KEY!,
});

const cartesiaClient = new CartesiaClient({
  apiKey: process.env.CARTESIA_API_KEY!,
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !session.user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const requestId = crypto.randomUUID();

  try {
    // ✅ DEDUCT CREDITS MOVED TO PROMPT ROUTER FOR GRATULARITY
    // await deductCredits(session.user.id, requestId);

    const formData = await req.formData();
    const audioFile = formData.get("audio") as File | null;
    const promptFromUser = formData.get("prompt")?.toString() || "";

    let text;

    if (promptFromUser === "") {
      if (!audioFile) {
        return NextResponse.json(
          { error: "Missing audio file in request" },
          { status: 400 },
        );
      }

      const arrayBuffer = await audioFile.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // --- DEEPGRAM STT COMMENTED OUT ---
      /*
      const { result, error } =
        await deepgram.listen.prerecorded.transcribeFile(buffer, {
          model: "nova-3",
          smart_format: true,
          detect_language: true,
        });

      if (error) {
        console.error("Deepgram error:", error);
        throw new Error("Transcription failed");
      }

      text =
        result?.results?.channels?.[0]?.alternatives?.[0]?.transcript || "";
      */

      // --- ASSEMBLYAI STT IMPLEMENTATION ---
      const transcript = await assemblyClient.transcripts.transcribe({
        audio: buffer,
        // @ts-ignore - universal-2 is valid per API but not yet in SDK types
        speech_models: ["universal-2"],
      });

      if (transcript.status === "error") {
        console.error("AssemblyAI error:", transcript.error);
        throw new Error("Transcription failed");
      }

      text = transcript.text || "";

      if (!text) {
        return NextResponse.json(
          { error: "No transcription generated." },
          { status: 400 },
        );
      }
    } else {
      text = promptFromUser;
    }

    const socketId = formData.get("socketId")?.toString();

    console.log("returned transcription here", text);

    const obj = await routePrompt({
      prompt: text,
      userId: session.user.id,
      conversationId: "default",
      socketId,
    });

    console.log("reply", obj);

    // Handle different response shapes from routePrompt
    // For automation: { response, autonomousTaskId }
    // For direct execution: { parsed: { response, data } }
    //@ts-expect-error
    const responseText = obj.response || obj.parsed?.response || "Task completed.";
    //@ts-expect-error
    const responseData = obj.parsed || { response: responseText, data: {} };

    // --- DEEPGRAM TTS COMMENTED OUT ---
    /*
    const response = await deepgram.speak.request(
      { text: responseText },
      {
        model: "aura-2-thalia-en",
        encoding: "linear16",
        container: "wav",
      },
    );

    const stream = await response.getStream();

    if (!stream) {
      throw new Error("Audio generation failed");
    }

    const reader = stream.getReader();
    const chunks: Uint8Array[] = [];

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
    }

    const audioBuffer = Buffer.concat(chunks);
    const audioBase64 = audioBuffer.toString("base64");
    */

    // --- CARTESIA TTS IMPLEMENTATION ---
    // Using sonic-english model and a sample voice. 
    // You might want to parameterize the voice ID.
    // --- CARTESIA TTS IMPLEMENTATION ---
    const response = await cartesiaClient.tts.bytes({
      modelId: "sonic-english",
      transcript: responseText,
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

    let finalBuffer: Buffer;

    if (Buffer.isBuffer(response)) {
      finalBuffer = response;
    } else if (response && typeof (response as any).arrayBuffer === "function") {
      finalBuffer = Buffer.from(await (response as any).arrayBuffer());
    } else if (response && typeof (response as any).buffer === "function") {
      finalBuffer = Buffer.from(await (response as any).buffer());
    } else {
      // Is it an async iterable stream? (Node18UniversalStreamWrapper likely is)
      try {
        const chunks: any[] = [];
        // @ts-ignore
        for await (const chunk of response) {
          chunks.push(chunk);
        }
        finalBuffer = Buffer.concat(chunks);
      } catch (err) {
        console.error("Failed to consume stream:", err);
        // Last resort fallback
        // @ts-ignore
        finalBuffer = Buffer.from(response);
      }
    }

    const audioBase64 = finalBuffer.toString("base64");


    return NextResponse.json({
      audio: audioBase64,
      data: responseData,
      transcription: text,
    });
  } catch (error) {
    console.error("Voice Agent Error:", error);

    // // ✅ REFUND 100 CREDITS ON FAILURE
    // try {
    //   await refundCredits(session.user.id, requestId);
    // } catch (refundError) {
    //   console.error("Credit refund failed:", refundError);
    // }

    return NextResponse.json(
      { error: "Internal server error during processing" },
      { status: 500 },
    );
  }
}
