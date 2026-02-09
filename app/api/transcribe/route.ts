export const runtime = "nodejs"; // ensure Node runtime for Deepgram SDK

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@deepgram/sdk";

const deepgram = createClient(process.env.DEEPGRAM_API_KEY!);

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

    const { result, error } = await deepgram.listen.prerecorded.transcribeFile(
      buffer,
      {
        //  language: "en",  => to prebnt multilinual cbehaviour
        model: "nova-3", // new, improved model
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

    if (!text) {
      return NextResponse.json(
        { error: "No transcription generated." },
        { status: 400 }
      );
    }

    console.log("returned transscription here", text);

    return NextResponse.json({ text }, { status: 200 });
  } catch (error) {
    console.error("Deepgram Transcription Error:", error);
    return NextResponse.json(
      { error: "Internal server error during transcription" },
      { status: 500 }
    );
  }
}
