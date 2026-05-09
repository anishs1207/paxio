import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

// GET: Fetch user's Zepto delivery info
export async function GET(req: NextRequest) {
  const userId = req.headers.get("userid");

  if (!userId) {
    return NextResponse.json({ error: "Missing userId" }, { status: 400 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        quickDeliveryPhoneNuber: true,
        quickDeliveryAddress: true,
        quickDeliveryUpiId: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      data: {
        phoneNumber: user.quickDeliveryPhoneNuber || "",
        address: user.quickDeliveryAddress || "",
        upiId: user.quickDeliveryUpiId || "",
      }
    }, { status: 200 });
  } catch (err) {
    console.error("Error fetching Zepto info:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// POST: Save Zepto delivery info
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, phoneNumber, address, upiId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    if (!phoneNumber || !address || !upiId) {
      return NextResponse.json(
        {
          error: "All fields (phoneNumber, address, upiId) are required",
        },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!existingUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        quickDeliveryPhoneNuber: phoneNumber,
        quickDeliveryAddress: address,
        quickDeliveryUpiId: upiId,
      },
    });

    return NextResponse.json(
      { success: true, message: "Zepto details saved successfully" },
      { status: 200 }
    );
  } catch (err) {
    console.error("Error saving Zepto details:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
