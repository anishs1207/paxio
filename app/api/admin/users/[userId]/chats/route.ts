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
    const chats = await prisma.newChat.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(
      chats.map((c) => ({
        id: c.id,
        conversationId: c.conversationId,
        userId: c.userId,
        role: c.role,
        message: c.message,
        payload: c.payload,
        creditsUsed: c.creditsUsed,
        createdAt: c.createdAt,
      }))
    );
  } catch (error) {
    console.error("[admin/users/[userId]/chats]", error);
    return NextResponse.json(
      { error: "Failed to fetch chats" },
      { status: 500 }
    );
  }
}
