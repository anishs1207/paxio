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
        const workflows = await prisma.autonomousTask.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" },
            select: {
                id: true,
                prompt: true,
                description: true,
                status: true,
                active: true,
                lastRunAt: true,
                lastResultSummary: true,
                createdAt: true,
                schedule: true,
                scheduleType: true,
            },
        });

        return NextResponse.json(workflows);
    } catch (error) {
        console.error("[admin/users/[userId]/workflows]", error);
        return NextResponse.json(
            { error: "Failed to fetch workflows" },
            { status: 500 }
        );
    }
}
