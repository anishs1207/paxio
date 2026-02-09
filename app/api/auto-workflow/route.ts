import { NextResponse, NextRequest } from "next/server";
//@fix this
import { BartAutonomous } from "@/backend/autonomous/index";

export enum Assistant {
  Personal = "AI Personal Assistant",
  Finance = "AI Financial Expert",
  HealthAndFitness = "AI Health & Fitness Assistant",
  LifeCoach = "AI Life Coach",
  Shopping = "AI Shopping",
  autonomous = "autonomous",
  Legal = "AI Legal Expert",
  Research = "AI Research Expert",
}

type FinalReturnType = {
  response: string;
  suggestedWorkflows: string[];
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const userPrompt = searchParams.get("userPrompt");
  const socketId = searchParams.get("socketId");
  const userId = searchParams.get("userId");
  const assistant = searchParams.get("assistant");

  if (!userPrompt || !socketId || !userId || !assistant) {
    return NextResponse.json(
      { error: "Missing userPrompt, socketId, or userId or assistant" },
      { status: 400 }
    );
  }

  if (!Object.values(Assistant).includes(assistant as Assistant)) {
    return NextResponse.json(
      { error: "Invalid assistant provided" },
      { status: 400 }
    );
  }

  try {
    const result: FinalReturnType = await BartAutonomous(
      userPrompt,
      socketId,
      userId
    );

    return NextResponse.json(result, { status: 200 });
  } catch (err: any) {
    console.error("Error getting response:", err);
    return NextResponse.json(
      { error: "Error getting response", details: err.message },
      { status: 500 }
    );
  }
}
