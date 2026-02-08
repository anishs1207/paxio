-- CreateEnum
CREATE TYPE "public"."PlanEnum" AS ENUM ('FREE', 'PRO');

-- CreateTable
CREATE TABLE "public"."WaitListUser" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "plan" "public"."PlanEnum" NOT NULL DEFAULT 'FREE',
    "email" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WaitListUser_pkey" PRIMARY KEY ("id")
);
