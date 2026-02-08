import Razorpay from "razorpay";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_TEST_KEY_ID!,
  key_secret: process.env.RAZORPAY_TEST_KEY_SECRET!,
});

export async function POST() {
  try {
    // TODO: get from auth/session (later here)
    const userId = "user_123";

    const amount = 1;

    const order = await razorpay.orders.create({
      amount: amount * 100, 
      currency: "USD",
      receipt: `receipt_${userId}_${Date.now()}`,
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
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    );
  }
}
