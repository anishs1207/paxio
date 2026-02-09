-- CreateTable
CREATE TABLE "public"."User" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "password" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isOnboardingCompleted" BOOLEAN NOT NULL DEFAULT false,
    "onboardingName" TEXT,
    "onboardingCountry" TEXT,
    "onboardingSource" TEXT,
    "plan" "public"."PlanEnum" NOT NULL DEFAULT 'FREE',
    "planStartedAt" TIMESTAMP(3),
    "planExpiresAt" TIMESTAMP(3),
    "credits" BIGINT NOT NULL DEFAULT 0,
    "gmailAccessToken" TEXT,
    "gmailRefreshToken" TEXT,
    "gmailExpiry" BIGINT,
    "googleDocsAccessToken" TEXT,
    "googleDocsRefreshToken" TEXT,
    "googleDocsExpiry" BIGINT,
    "googleSheetsAccessToken" TEXT,
    "googleSheetsRefreshToken" TEXT,
    "googleSheetsExpiry" BIGINT,
    "googleCalendarAccessToken" TEXT,
    "googleCalendarRefreshToken" TEXT,
    "googleCalendarExpiry" BIGINT,
    "googleDriveAccessToken" TEXT,
    "googleDriveRefreshToken" TEXT,
    "googleDriveExpiry" BIGINT,
    "notionAccessToken" TEXT,
    "quickDeliveryPhoneNuber" TEXT,
    "quickDeliveryAddress" TEXT,
    "quickDeliveryUpiId" TEXT,
    "quickDeliveryBlinkitCookies" JSONB,
    "quickDeliveryZeptoCookies" JSONB,
    "zeptoSession" JSONB,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."UserEmailList" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserEmailList_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AutonomousTask" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "description" TEXT,
    "workflow" JSONB NOT NULL,
    "triggerType" TEXT NOT NULL,
    "schedule" TEXT,
    "scheduleType" TEXT,
    "eventName" TEXT,
    "pollInterval" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "lastRunAt" TIMESTAMP(3),
    "lastPollAt" TIMESTAMP(3),
    "lastResultSummary" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AutonomousTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."AutonomousTaskRun" (
    "id" TEXT NOT NULL,
    "autonomousTaskId" TEXT NOT NULL,
    "runAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "success" BOOLEAN NOT NULL,
    "summary" TEXT NOT NULL,
    "rawResults" JSONB NOT NULL,

    CONSTRAINT "AutonomousTaskRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."ShortTermMemory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ShortTermMemory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."LongTermMemory" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LongTermMemory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."CreditTransaction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "balanceAfter" INTEGER NOT NULL,
    "requestId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CreditTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."newChat" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "payload" JSONB,
    "creditsUsed" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "newChat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."DoomscrollSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "platforms" TEXT[],
    "status" TEXT NOT NULL DEFAULT 'RUNNING',
    "shareUrl" TEXT,
    "duration" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DoomscrollSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."DoomscrollResult" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "rawOutput" TEXT NOT NULL,
    "preview" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DoomscrollResult_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "public"."User"("email");

-- CreateIndex
CREATE INDEX "ShortTermMemory_userId_conversationId_idx" ON "public"."ShortTermMemory"("userId", "conversationId");

-- CreateIndex
CREATE INDEX "LongTermMemory_userId_idx" ON "public"."LongTermMemory"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "LongTermMemory_userId_key_key" ON "public"."LongTermMemory"("userId", "key");

-- CreateIndex
CREATE INDEX "newChat_conversationId_idx" ON "public"."newChat"("conversationId");

-- CreateIndex
CREATE INDEX "DoomscrollSession_userId_idx" ON "public"."DoomscrollSession"("userId");

-- CreateIndex
CREATE INDEX "DoomscrollSession_status_idx" ON "public"."DoomscrollSession"("status");

-- CreateIndex
CREATE INDEX "DoomscrollResult_sessionId_idx" ON "public"."DoomscrollResult"("sessionId");

-- AddForeignKey
ALTER TABLE "public"."UserEmailList" ADD CONSTRAINT "UserEmailList_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AutonomousTask" ADD CONSTRAINT "AutonomousTask_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."AutonomousTaskRun" ADD CONSTRAINT "AutonomousTaskRun_autonomousTaskId_fkey" FOREIGN KEY ("autonomousTaskId") REFERENCES "public"."AutonomousTask"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."CreditTransaction" ADD CONSTRAINT "CreditTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."DoomscrollResult" ADD CONSTRAINT "DoomscrollResult_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "public"."DoomscrollSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
