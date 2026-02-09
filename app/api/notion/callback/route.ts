import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/db";
import axios from "axios";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");
    const state = searchParams.get("state");

    let userId = "anushay123";

    if (!code) {
      return NextResponse.json({ error: "Missing code" }, { status: 400 });
    }
    if (!state) {
      return NextResponse.json({ error: "Missing state" }, { status: 400 });
    }

    JSON.parse(decodeURIComponent(state)); // not used but decode to validate

    const session = await getServerSession(authOptions);
    if (!session || !session.user || !userId) {
      return NextResponse.json(
        { error: "Unauthorized or state mismatch" },
        { status: 401 },
      );
    }

    const tokenRes = await axios.post(
      "https://api.notion.com/v1/oauth/token",
      {
        grant_type: "authorization_code",
        code,
        redirect_uri: `${process.env.NEXTAUTH_URL}/api/notion/callback`,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization:
            "Basic " +
            Buffer.from(
              `${process.env.NOTION_CLIENT_ID}:${process.env.NOTION_CLIENT_SECRET}`,
            ).toString("base64"),
        },
      },
    );

    const notionTokens = tokenRes.data;

    const accessToken = notionTokens.access_token;

    await prisma.user.update({
      where: { id: userId },
      data: {
        notionAccessToken: accessToken,
      },
    });

    
  return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/voice`);
  } catch (error: any) {
    console.error("Error in Notion callback:", error?.response?.data || error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error?.response?.data },
      { status: 500 },
    );
  }
}
