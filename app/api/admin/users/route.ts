import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { isAdminAuthorized } from "@/lib/admin";

export async function GET(req: NextRequest) {
  if (!isAdminAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const filter = searchParams.get("filter") ?? "all"; // all | paid | free

    const where =
      filter === "paid"
        ? { plan: "PRO" as const }
        : filter === "free"
          ? { plan: "FREE" as const }
          : {};

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        name: true,
        onboardingName: true,
        onboardingCountry: true,
        onboardingSource: true,
        plan: true,
        credits: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(
      users.map((u) => ({
        ...u,
        credits: Number(u.credits),
      }))
    );
  } catch (error) {
    console.error("[admin/users]", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}
