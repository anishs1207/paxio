import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { google } from "googleapis";
import { authOptions } from "@/lib/auth";
import type { User } from "@/generated/prisma";
import prisma from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state");

    if (!state) {
      return NextResponse.json({ error: "State not found" }, { status: 400 });
    }
    const decodedState = JSON.parse(decodeURIComponent(state));
    const { service } = decodedState;

    const session = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.id) {
      return NextResponse.json(
        { error: "Unauthorized or state mismatch" },
        { status: 401 }
      );
    }

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID!,
      process.env.GOOGLE_CLIENT_SECRET!,
      `${process.env.NEXTAUTH_URL}/api/connect/callback`
    );

    const { tokens } = await oauth2Client.getToken(code!);
 
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
      // forms: {
      //   accessTokenField: "googleFormsAccessToken", // add these fields in your User model
      //   refreshTokenField: "googleFormsRefreshToken",
      // },
    };

    const fields = serviceTokenFields[service];
    if (!fields) {
      throw new Error("Invalid service mapping");
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        [fields.accessTokenField]: tokens.access_token,
        [fields.refreshTokenField]: tokens.refresh_token ?? undefined,
      },
    });

    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/voice`);
  } catch (error: unknown) {
    console.error("Error during token exchange:", error);

    return NextResponse.json(
      { error: `Internal Server Error: ${String(error)}` },
      { status: 500 }
    );
  }
}
