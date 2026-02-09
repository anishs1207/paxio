import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/db";

// GET: Fetch user call & quick delivery info
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

    return NextResponse.json({ data: user }, { status: 200 });
  } catch (err) {
    console.error("Error fetching user tools:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// POST: Save phone & quick delivery info for first-time connection
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, phoneNumber, address, upiId } = body;

    if (!userId || !phoneNumber || !address || !upiId) {
      return NextResponse.json(
        {
          error:
            "All fields (userId, phoneNumber, address, upiId) are required",
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

    // Prevent overwriting if already exists
    if (existingUser.callPhoneNumber || existingUser.quickDeliveryPhoneNuber) {
      return NextResponse.json(
        { error: "User details already exist. Use PATCH to update." },
        { status: 400 }
      );
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        callPhoneNumber: phoneNumber,
        quickDeliveryPhoneNuber: phoneNumber,
        quickDeliveryAddress: address,
        quickDeliveryUpiId: upiId,
      },
    });

    return NextResponse.json(
      { success: true, message: "Details saved successfully" },
      { status: 201 }
    );
  } catch (err) {
    console.error("Error saving user details:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// PATCH: Update existing details
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, phoneNumber, address, upiId } = body;

    if (!userId || !phoneNumber || !address || !upiId) {
      return NextResponse.json(
        {
          error:
            "All fields (userId, phoneNumber, address, upiId) are required",
        },
        { status: 400 }
      );
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        callPhoneNumber: phoneNumber,
        quickDeliveryPhoneNuber: phoneNumber,
        quickDeliveryAddress: address,
        quickDeliveryUpiId: upiId,
      },
    });

    return NextResponse.json(
      { success: true, message: "Details updated successfully" },
      { status: 200 }
    );
  } catch (err) {
    console.error("Error updating user tools:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
