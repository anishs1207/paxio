import crypto from "crypto";
import { NextResponse } from "next/server";
import prisma from "@/lib/db";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = await req.json();

    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_TEST_KEY_SECRET!)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return NextResponse.json(
        { success: false },
        { status: 400 }
      );
    }

    const user = await prisma.waitListUser.update({
      where: {
        // rempve hardcode later here
        id: "1cb90e53-9ef5-4ae3-94d3-d40c3bbaf579",
        email: "anishs1207@gmail.com"
      },
      data: {
        plan: "PRO",
      },
    });

    console.log("user", user);

    // syore the payment stiff related here

    // // ✅ Payment verified
    // await activateMonthlyPlan({
    //   userId: "user_123",
    //   orderId: razorpay_order_id,
    //   paymentId: razorpay_payment_id,
    // });
    // also store the orderId, userId and oaymentId here, startTime, endTime etc can be stored

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { success: false },
      { status: 500 }
    );
  }
}
