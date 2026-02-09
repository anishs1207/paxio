import prisma from "@/lib/db";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  if (!session || !session.user || !userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { credits: true, plan: true },
    });

    const credits =
      user?.credits !== undefined ? Number(user.credits) : 0;
    const plan = user?.plan ?? "FREE";

    return NextResponse.json({ credits, plan });
  } catch (err) {
    console.error("FINAL CREDITS ERROR:", err);
    return NextResponse.json(
      { error: "Credits failed" },
      { status: 500 }
    );
  }
}

