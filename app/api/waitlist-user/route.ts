import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email } = body;

    // Basic validatio
    if (!name || !email) {
      return NextResponse.json(
        { error: "Name and email are required." },
        { status: 400 },
      );
    }

    // Optional: email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format." },
        { status: 400 },
      );
    }

    // Store in database
    const newUser = await prisma.waitListUser.create({
      data: {
        name,
        email,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "User added to waitlist successfully",
        data: newUser,
      },
      { status: 200 },
    );
  } catch (error: any) {
    console.error("Error adding waitlist user:", error);
    return NextResponse.json(
      { error: "Internal Server Error", details: error.message },
      { status: 500 },
    );
  }
}
