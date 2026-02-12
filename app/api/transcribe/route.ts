export const runtime = "nodejs"; // ensure Node runtime

import { NextRequest, NextResponse } from "next/server";
// import { createClient } from "@deepgram/sdk";
import { AssemblyAI } from "assemblyai";

// const deepgram = createClient(process.env.DEEPGRAM_API_KEY!);
const client = new AssemblyAI({
  apiKey: process.env.ASSEMBLYAI_API_KEY!,
});

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const audioFile = formData.get("audio") as File | null;

    if (!audioFile) {
      return NextResponse.json(
        { error: "Missing audio file in request" },
        { status: 400 }
      );
    }

    const arrayBuffer = await audioFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // --- DEEPGRAM CODE COMMENTED OUT ---
    /*
    const { result, error } = await deepgram.listen.prerecorded.transcribeFile(
      buffer,
      {
        model: "nova-3",
        smart_format: true,
        detect_language: true,
      }
    );

    if (error) {
      console.error("Deepgram error:", error);
      return NextResponse.json(
        { error: "Transcription failed" },
        { status: 500 }
      );
    }

    const text =
      result?.results?.channels?.[0]?.alternatives?.[0]?.transcript || "";
    */

    // --- ASSEMBLYAI IMPLEMENTATION ---
    const transcript = await client.transcripts.transcribe({
      audio: buffer,
      // @ts-ignore - universal-2 is valid per API but not yet in SDK types
      speech_model: "universal-2" as any,
    });

    if (transcript.status === "error") {
      console.error("AssemblyAI error:", transcript.error);
      return NextResponse.json(
        { error: "Transcription failed" },
        { status: 500 }
      );
    }

    const text = transcript.text || "";

    if (!text) {
      return NextResponse.json(
        { error: "No transcription generated." },
        { status: 400 }
      );
    }

    console.log("returned transscription here", text);

    return NextResponse.json({ text }, { status: 200 });
  } catch (error) {
    console.error("Transcription Error:", error);
    return NextResponse.json(
      { error: "Internal server error during transcription" },
      { status: 500 }
    );
  }
}
