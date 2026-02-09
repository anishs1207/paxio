// apps/web/app/api/status-tools/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getUserConnectedNodes } from "@/lib/getUserConnectedNodes";

export async function GET(req: NextRequest) {
  // const session = await getServerSession(authOptions);
  // if (!session?.user?.email) {
  //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  // }

  const userId = req.headers.get("userId");
  if (!userId) {
    return NextResponse.json(
      { error: "userId is not present" },
      { status: 401 }
    );
  }

  const status = await getUserConnectedNodes(userId);
  if (!status) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json(status);
}
