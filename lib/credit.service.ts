import prisma from "./db";

export async function deductCredits(
  userId: string,
  amount: number,
  requestId: string
) {
  return prisma.$transaction(async (tx) => {
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { credits: true }
    });

    if (!user || user.credits < amount) {
      throw new Error("INSUFFICIENT_CREDITS");
    }

    console.log("credits:", user.credits)

    const updated = await tx.user.update({
      where: { id: userId },
      data: { credits: { decrement: amount } }
    });

    const balance = Number(updated.credits);

    await tx.creditTransaction.create({
      data: {
        userId,
        type: "DEBIT",
        amount: amount,
        balanceAfter: balance,
        requestId
      }
    });

    return updated.credits;
  });
}

export async function refundCredits(
  userId: string,
  amount: number,
  requestId: string
) {
  return prisma.$transaction(async (tx) => {
    const updated = await tx.user.update({
      where: { id: userId },
      data: { credits: { increment: amount } }
    });

    const balance = Number(updated.credits);

    await tx.creditTransaction.create({
      data: {
        userId,
        type: "REFUND",
        amount: amount,
        balanceAfter: balance,
        requestId
      }
    });
  });
}
