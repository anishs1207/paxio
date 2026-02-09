import prisma  from "./db";
import { FIXED_DEDUCTION } from "./credits";

export async function deductCredits(
  userId: string,
  requestId: string
) {
  return prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { credits: true }
    });

    if (!user || user.credits < FIXED_DEDUCTION) {
      throw new Error("INSUFFICIENT_CREDITS");
    }

    console.log("credits:",user.credits)

    const updated = await tx.user.update({
      where: { id: userId },
      data: { credits: { decrement: FIXED_DEDUCTION } }
    });

    const balance = Number(updated.credits);

    await tx.creditTransaction.create({
      data: {
        userId,
        type: "DEBIT",
        amount: FIXED_DEDUCTION,
        balanceAfter: balance,
        requestId
      }
    });

    return updated.credits;
  });
}

export async function refundCredits(
  userId: string,
  requestId: string
) {
  return prisma.$transaction(async (tx) => {
    const updated = await tx.user.update({
      where: { id: userId },
      data: { credits: { increment: FIXED_DEDUCTION } }
    });

    const balance = Number(updated.credits);

    await tx.creditTransaction.create({
      data: {
        userId,
        type: "REFUND",
        amount: FIXED_DEDUCTION,
        balanceAfter: balance,
        requestId
      }
    });
  });
}
