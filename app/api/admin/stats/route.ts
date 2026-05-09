import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";
import { isAdminAuthorized } from "@/lib/admin";

export async function GET(req: NextRequest) {
  if (!isAdminAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();
    const twentyEightDaysAgo = new Date(now);
    twentyEightDaysAgo.setDate(twentyEightDaysAgo.getDate() - 28);
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const [
      totalUsers,
      paidUsers,
      activeUsers28d,
      newUsers7d,
      doomscrollSessionsCount,
      autonomousTasksCount,
      usersLast30Days,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { plan: "PRO" } }),
      prisma.user.count({
        where: { updatedAt: { gte: twentyEightDaysAgo } },
      }),
      prisma.user.count({
        where: { createdAt: { gte: sevenDaysAgo } },
      }),
      prisma.doomscrollSession.count(),
      prisma.autonomousTask.count({ where: { status: "ACTIVE" } }),
      prisma.user.groupBy({
        by: ['createdAt'],
        where: { createdAt: { gte: twentyEightDaysAgo } },
        _count: {
          id: true,
        },
      }),
    ]);

    // Process daily signups for chart
    const chartDataMap = new Map<string, number>();
    const today = new Date();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split("T")[0]; // YYYY-MM-DD
      chartDataMap.set(key, 0);
    }

    usersLast30Days.forEach((group) => {
      const key = group.createdAt.toISOString().split("T")[0];
      if (chartDataMap.has(key)) {
        chartDataMap.set(key, (chartDataMap.get(key) || 0) + group._count.id);
      }
    });

    const chartData = Array.from(chartDataMap.entries()).map(([date, count]) => ({
      date,
      count,
    }));

    return NextResponse.json({
      totalUsers,
      paidUsers,
      freeUsers: totalUsers - paidUsers,
      activeUsers28d,
      newUsers7d,
      doomscrollSessionsCount,
      autonomousTasksCount,
      chartData,
      revenue: null, // Not stored in DB; use Dodo Payments dashboard or add Payment model
    });
  } catch (error) {
    console.error("[admin/stats]", error);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}
