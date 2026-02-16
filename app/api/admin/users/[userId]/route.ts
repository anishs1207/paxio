import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { isAdminAuthorized } from "@/lib/admin";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  if (!isAdminAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { userId } = await params;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        onboardingName: true,
        onboardingCountry: true,
        onboardingSource: true,
        plan: true,
        credits: true,
        isOnboardingCompleted: true,
        planStartedAt: true,
        planExpiresAt: true,
        createdAt: true,
        updatedAt: true,
        gmailAccessToken: true,
        googleDocsAccessToken: true,
        googleSheetsAccessToken: true,
        googleCalendarAccessToken: true,
        googleDriveAccessToken: true,
        notionAccessToken: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      ...user,
      credits: Number(user.credits),
      _count: {
        autonomousTasks: await prisma.autonomousTask.count({
          where: { userId },
        }),
        doomscrollSessions: await prisma.doomscrollSession.count({
          where: { userId },
        }),
      },
      tools: {
        gmail: !!user.gmailAccessToken,
        googleDocs: !!user.googleDocsAccessToken,
        googleSheets: !!user.googleSheetsAccessToken,
        googleCalendar: !!user.googleCalendarAccessToken,
        googleDrive: !!user.googleDriveAccessToken,
        notion: !!user.notionAccessToken,
        // Add others as needed
      }
    });
  } catch (error) {
    console.error("[admin/users/[userId]]", error);
    return NextResponse.json(
      { error: "Failed to fetch user" },
      { status: 500 }
    );
  }
}
