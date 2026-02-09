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
      select: { credits: true },
    });

    const credits =
      user?.credits !== undefined ? Number(user.credits) : 0;

    return NextResponse.json({ credits });
  } catch (err) {
    console.error("FINAL CREDITS ERROR:", err);
    return NextResponse.json(
      { error: "Credits failed" },
      { status: 500 }
    );
  }
}
