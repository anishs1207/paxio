import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { conversationId, userId, role, message, payload } = body;

    console.log("payload", payload);

    if (!conversationId || !userId || !role || !message) {
      return NextResponse.json(
        { error: "conversationId, userId, role and message are required" },
        { status: 400 },
      );
    }

    const chat = await prisma.newChat.create({
      data: {
        conversationId,
        userId,
        role,
        message,
        payload,
      },
    });

    console.log("added chat", chat);

    return NextResponse.json(chat, { status: 201 });
  } catch (error) {
    console.error("Create chat error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    const conversationId = searchParams.get("conversationId");

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 },
      );
    }

    console.log("getting all chats")

    const chats = await prisma.newChat.findMany({
      where: {
      userId
      },
      orderBy: {
        createdAt: "asc",
      }, 
    });

    console.log("chats", chats);

    return NextResponse.json(chats);
  } catch (error) {
    console.error("Fetch chats error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
