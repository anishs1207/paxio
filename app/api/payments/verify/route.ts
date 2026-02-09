import crypto from "crypto";
import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = await req.json();


    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    if (!session || !session.user || !userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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

    await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        plan: "PRO",
        credits: {
          increment: 1000,
        },
      },
    });

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
