import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import type { User } from "@/generated/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ service: string }> }
  // { params }: { params: { service: string } }
) {
  try {
    const { service } = await context.params;

    if (!service) {
      return NextResponse.json({ error: "Service not specified" }, { status: 400 });
    }

    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    if (!session || !session.user || !userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const serviceTokenFields: Record<
      string,
      {
        accessTokenField: keyof User;
        refreshTokenField: keyof User;
      }
    > = {
      gmail: {
        accessTokenField: "gmailAccessToken",
        refreshTokenField: "gmailRefreshToken",
      },
      docs: {
        accessTokenField: "googleDocsAccessToken",
        refreshTokenField: "googleDocsRefreshToken",
      },
      sheets: {
        accessTokenField: "googleSheetsAccessToken",
        refreshTokenField: "googleSheetsRefreshToken",
      },
      calendar: {
        accessTokenField: "googleCalendarAccessToken",
        refreshTokenField: "googleCalendarRefreshToken",
      },
      drive: {
        accessTokenField: "googleDriveAccessToken",
        refreshTokenField: "googleDriveRefreshToken",
      },
      notion: {
        accessTokenField: "notionAccessToken",
        refreshTokenField: "notionAccessToken",
      },
      // outlook: {
      //   accessTokenField: "outlookAccessToken",
      //   refreshTokenField: "outlookRefreshToken",
      // },
      // slack: {
      //   accessTokenField: "slackAccessToken",
      //   refreshTokenField: "slackRefreshToken",
      // },
      cal: {
        accessTokenField: "calAccessToken" as keyof User,
        refreshTokenField: "calRefreshToken" as keyof User,
      },
    };

    const fields = serviceTokenFields[service];

    if (!fields) {
      return NextResponse.json({ error: "Invalid service" }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        [fields.accessTokenField]: null,
        [fields.refreshTokenField]: null,
      },
    });

    return NextResponse.json(
      { message: `${service} disconnected successfully` },
      { status: 200 }
    );
  } catch (error) {
    console.error("disconnect error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
