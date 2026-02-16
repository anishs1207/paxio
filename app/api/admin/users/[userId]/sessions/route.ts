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
        const sessions = await prisma.doomscrollSession.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" },
            select: {
                id: true,
                prompt: true,
                topic: true,
                platforms: true,
                status: true,
                duration: true,
                createdAt: true,
            },
        });

        return NextResponse.json(sessions);
    } catch (error) {
        console.error("[admin/users/[userId]/sessions]", error);
        return NextResponse.json(
            { error: "Failed to fetch sessions" },
            { status: 500 }
        );
    }
}
