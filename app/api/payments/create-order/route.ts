import Razorpay from "razorpay";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const runtime = "nodejs";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_TEST_KEY_ID!,
  key_secret: process.env.RAZORPAY_TEST_KEY_SECRET!,
});

export async function POST() {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
      
    const amount = 10;

    const userId = session?.user?.id;

    const order = await razorpay.orders.create({
      amount: amount * 100, // paise
      currency: "INR",
      // add userId here
      receipt: `receipt_${Date.now()}`,
      notes: {
        userId,
        plan: "monthly_manual",
      },
    });

    return NextResponse.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      key: process.env.RAZORPAY_TEST_KEY_ID,
    });
  } catch (error) {
    console.error("❌ Create order error:", error);
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    );
  }
}
