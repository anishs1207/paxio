import { PrismaClient } from "../generated/prisma";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

const prisma =
    globalForPrisma.prisma ||
    new PrismaClient({
        transactionOptions: {
            maxWait: 5000, // 5 seconds max wait to acquire a transaction slot
            timeout: 10000, // 10 seconds max for the entire transaction
        },
        // log:
        //     process.env.NODE_ENV === "development"
        //         ? ["query", "error", "warn"]
        //         : ["error"],
    });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;
