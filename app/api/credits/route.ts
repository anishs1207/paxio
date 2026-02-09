import prisma from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  const USER_ID = "anushay123";

  try {
    const user = await prisma.user.findUnique({
      where: { id: USER_ID },
      select: { credits: true },
    });

    // ✅ REQUIRED conversion
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
