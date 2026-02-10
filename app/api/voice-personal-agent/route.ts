import { routePrompt } from "@/backend/agents/promptRouter";
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@deepgram/sdk";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
// import { deductCredits, refundCredits } from "@/lib/credit.service";

const deepgram = createClient(process.env.DEEPGRAM_API_KEY!);

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

    return NextResponse.json({
      audio: audioBase64,
      data: responseData,
      transcription: text,
    });
  } catch (error) {
    console.error("Deepgram Transcription Error:", error);

    // // ✅ REFUND 100 CREDITS ON FAILURE
    // try {
    //   await refundCredits(session.user.id, requestId);
    // } catch (refundError) {
    //   console.error("Credit refund failed:", refundError);
    // }

    return NextResponse.json(
      { error: "Internal server error during transcription" },
      { status: 500 },
    );
  }
}
