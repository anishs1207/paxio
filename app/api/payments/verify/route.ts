// import crypto from "crypto";
import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import DodoPayments from 'dodopayments';

export const runtime = "nodejs";

const client = new DodoPayments({
  bearerToken: process.env.DODO_PAYMENTS_API_KEY,
  environment: 'test_mode',
});

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    // Dodo Payments might not replace {checkout_session_id} in test mode or if configured differently,
    // but payment_id seems to be present and valid.
    let paymentId = searchParams.get('payment_id');
    const sessionId = searchParams.get('session_id');

    if (!paymentId && sessionId && !sessionId.startsWith('{')) {
      paymentId = sessionId;
    }

    if (!paymentId) {
      return NextResponse.json({ error: "Missing payment ID" }, { status: 400 });
    }

    const session = await getServerSession(authOptions);

    // Check payment status
    console.log(`[Verify] Retrieving payment details for: ${paymentId}`);

    let payment: any;
    // If it's a payment ID (starts with pay_), retrieve payment directly
    if (paymentId.startsWith('pay_')) {
      payment = await client.payments.retrieve(paymentId);
    } else {
      // Fallback to session retrieval (though less likely to work with pay_ id)
      payment = await client.checkoutSessions.retrieve(paymentId);
    }

    console.log(`[Verify] Payment response:`, JSON.stringify(payment, null, 2));

    // Handle different potential return types
    const status = payment.status || payment.payment_status || payment.business_status;
    console.log(`[Verify] Payment status: ${status}`);

    if (status === 'succeeded' || status === 'completed' || status === 'paid') {
      let userId = session?.user?.id;

      // Fallback to metadata if session userId is missing
      if (!userId && payment.metadata && payment.metadata.userId) {
        userId = payment.metadata.userId;
        console.log(`[Verify] User ID from metadata: ${userId}`);
      } else {
        console.log(`[Verify] User ID from session: ${userId}`);
      }

      if (userId) {
        const updatedUser = await prisma.user.update({
          where: { id: userId },
          data: {
            plan: "PRO",
            credits: { increment: 1000 },
          },
        });
        console.log(`[Verify] User updated:`, updatedUser);
      } else {
        console.error("[Verify] No user ID found in session");
      }

      // Redirect to dashboard
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/voice?payment=success`);
    } else {
      console.warn(`[Verify] Payment not successful. Status: ${status}`);
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/voice?payment=failed&status=${status}`);
    }

  } catch (error) {
    console.error("Payment verification failed", error);
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/voice?payment=error&message=${encodeURIComponent((error as Error).message)}`);
  }
}

// export async function POST(req: Request) {
//   try {
//     const {
//       razorpay_order_id,
//       razorpay_payment_id,
//       razorpay_signature,
//     } = await req.json();
//
//
//     const session = await getServerSession(authOptions);
//     const userId = session?.user?.id;
//
//     if (!session || !session.user || !userId) {
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//     }
//
//     const body = razorpay_order_id + "|" + razorpay_payment_id;
//
//     const expectedSignature = crypto
//       .createHmac("sha256", process.env.RAZORPAY_TEST_KEY_SECRET!)
//       .update(body)
//       .digest("hex");
//
//     if (expectedSignature !== razorpay_signature) {
//       return NextResponse.json(
//         { success: false },
//         { status: 400 }
//       );
//     }
//
//     await prisma.user.update({
//       where: {
//         id: userId,
//       },
//       data: {
//         plan: "PRO",
//         credits: {
//           increment: 1000,
//         },
//       },
//     });
//
//     return NextResponse.json({ success: true });
//   } catch (error) {
//     return NextResponse.json(
//       { success: false },
//       { status: 500 }
//     );
//   }
// }
