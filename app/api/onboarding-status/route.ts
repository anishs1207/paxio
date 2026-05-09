import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

// GET - Fetch the onboarding status for a user
export async function GET(req: NextRequest) {
  const userId = req.headers.get("userId");
  
  if (!userId) {
    return NextResponse.json(
      { error: "userId is not present" },
      { status: 401 }
    );
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { isOnboardingCompleted: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      isOnboardingCompleted: user.isOnboardingCompleted,
    });
  } catch (error) {
    console.error("Error fetching onboarding status:", error);
    return NextResponse.json(
      { error: "Failed to fetch onboarding status" },
      { status: 500 }
    );
  }
}

// POST - Complete onboarding with form data
export async function POST(req: NextRequest) {
  const userId = req.headers.get("userId");

  if (!userId) {
    return NextResponse.json(
      { error: "userId is not present" },
      { status: 401 }
    );
  }

  try {
    // Parse optional body data
    let body: { name?: string; country?: string; source?: string } = {};
    try {
      body = await req.json();
    } catch {
      // Body is optional, so ignore parse errors
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        isOnboardingCompleted: true,
        ...(body.name && { onboardingName: body.name }),
        ...(body.country && { onboardingCountry: body.country }),
        ...(body.source && { onboardingSource: body.source }),
      },
      select: {
        isOnboardingCompleted: true,
        onboardingName: true,
        onboardingCountry: true,
        onboardingSource: true,
      },
    });

    // Create a default assistant welcome message for the new user
    await prisma.newChat.create({
      data: {
        conversationId: "default",
        userId: userId,
        role: "assistant",
        message: "How can I help you?",
        payload: {},
        creditsUsed: 0,
      },
    });

    return NextResponse.json({
      success: true,
      isOnboardingCompleted: updatedUser.isOnboardingCompleted,
      onboardingData: {
        name: updatedUser.onboardingName,
        country: updatedUser.onboardingCountry,
        source: updatedUser.onboardingSource,
      },
    });
  } catch (error) {
    console.error("Error updating onboarding status:", error);
    return NextResponse.json(
      { error: "Failed to update onboarding status" },
      { status: 500 }
    );
  }
}
