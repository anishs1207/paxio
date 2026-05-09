// import Razorpay from "razorpay";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const runtime = "nodejs";

// const razorpay = new Razorpay({
//   key_id: process.env.RAZORPAY_TEST_KEY_ID!,
//   key_secret: process.env.RAZORPAY_TEST_KEY_SECRET!,
// });

// export async function POST() {
//   try {
//     const session = await getServerSession(authOptions);

//     if (!session || !session.user || !session.user.id) {
//       return NextResponse.json(
//         { error: "Unauthorized" },
//         { status: 401 }
//       );
//     }

//     const amount = 10;

//     const userId = session?.user?.id;

//     const order = await razorpay.orders.create({
//       amount: amount * 100, // paise
//       currency: "INR",
//       // add userId here
//       receipt: `receipt_${Date.now()}`,
//       notes: {
//         userId,
//         plan: "monthly_manual",
//       },
//     });

//     return NextResponse.json({
//       orderId: order.id,
//       amount: order.amount,
//       currency: order.currency,
//       key: process.env.RAZORPAY_TEST_KEY_ID,
//     });
//   } catch (error) {
//     console.error("❌ Create order error:", error);
//     return NextResponse.json(
//       { error: "Failed to create order" },
//       { status: 500 }
//     );
//   }
// }

import DodoPayments from 'dodopayments';

const client = new DodoPayments({
  bearerToken: process.env.DODO_PAYMENTS_API_KEY, // This is the default and can be omitted
  environment: 'live_mode', // or 'live_mode'
});

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !session.user.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = session?.user?.id;

    const body = await req.json().catch(() => ({}));
    const { plan } = body;

    let productId = process.env.DODO_PAYMENTS_PRODUCT_ID!;
    let credits = 1000; // Default fallback

    if (plan === 'BASIC') {
      productId = process.env.DODO_PRODUCT_ID_BASIC || process.env.DODO_PAYMENTS_PRODUCT_ID!;
      credits = 4000;
    } else if (plan === 'PRO') {
      productId = process.env.DODO_PRODUCT_ID_PRO || process.env.DODO_PAYMENTS_PRODUCT_ID!;
      credits = 10000;
    }

    const checkout = await client.checkoutSessions.create({
      customer: {
        email: session.user.email || 'customer@example.com',
        name: session.user.name || 'Customer Name',
      },
      metadata: {
        userId: userId,
        credits: credits.toString(),
        plan: plan || 'unknown',
      },
      product_cart: [
        {
          product_id: productId,
          quantity: 1,
        }
      ],
      return_url: `${process.env.NEXTAUTH_URL}/api/payments/verify?session_id={checkout_session_id}`,
    });

    return NextResponse.json({
      checkout_url: checkout.checkout_url,
    });
  } catch (error) {
    console.error("❌ Create order error:", error);
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    );
  }
}
