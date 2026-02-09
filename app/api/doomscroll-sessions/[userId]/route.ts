// apps/web/app/api/doomscroll-sessions/[userId]/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function GET(
    _: Request,
    { params }: { params: Promise<{ userId: string }> }
) {
    try {
        const { userId } = await params;
        if (!userId) {
            return NextResponse.json({ error: "Missing userId" }, { status: 400 });
        }

        // Fetch all doomscroll sessions for the user with their results
        const sessions = await prisma.doomscrollSession.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" },
            include: {
                results: {
                    orderBy: { createdAt: "asc" },
                    select: {
                        id: true,
                        platform: true,
                        rawOutput: true,
                        preview: true,
                        createdAt: true,
                    },
                },
            },
        });

        // Shape the data for the frontend
        const formatted = sessions.map((session) => ({
            id: session.id,
            userId: session.userId,
            prompt: session.prompt,
            topic: session.topic,
            platforms: session.platforms,
            status: session.status,
            shareUrl: session.shareUrl,
            duration: session.duration,
            createdAt: session.createdAt,
            updatedAt: session.updatedAt,
            results: session.results.map((r) => ({
                id: r.id,
                platform: r.platform,
                rawOutput: r.rawOutput,
                preview: r.preview,
                createdAt: r.createdAt,
            })),
        }));

        console.log(
            `[doomscroll-sessions] sending ${formatted.length} sessions for user ${userId}`
        );

        return NextResponse.json(formatted);
    } catch (err) {
        console.error("[doomscroll-sessions] Error fetching sessions:", err);
        return NextResponse.json(
            { error: "Failed to fetch doomscroll sessions" },
            { status: 500 }
        );
    }
}
