-- AlterTable
ALTER TABLE "WorkerProfile" ADD COLUMN     "boostExpiresAt" TIMESTAMP(3),
ADD COLUMN     "hasUsedBoost" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isBoosted" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "CustomerEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "serviceSlug" TEXT,
    "categorySlug" TEXT,
    "workerId" TEXT,
    "city" TEXT,
    "query" TEXT,
    "weight" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CustomerEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Boost" (
    "id" TEXT NOT NULL,
    "workerProfileId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'MMK',
    "durationDays" INTEGER NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "paymentMethod" TEXT NOT NULL DEFAULT 'CASH_ON_COMPLETION',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Boost_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CustomerEvent_userId_createdAt_idx" ON "CustomerEvent"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "CustomerEvent_userId_type_idx" ON "CustomerEvent"("userId", "type");

-- CreateIndex
CREATE INDEX "Boost_workerProfileId_idx" ON "Boost"("workerProfileId");

-- CreateIndex
CREATE INDEX "Boost_expiresAt_idx" ON "Boost"("expiresAt");

-- CreateIndex
CREATE INDEX "WorkerProfile_isBoosted_boostExpiresAt_idx" ON "WorkerProfile"("isBoosted", "boostExpiresAt");

-- AddForeignKey
ALTER TABLE "CustomerEvent" ADD CONSTRAINT "CustomerEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Boost" ADD CONSTRAINT "Boost_workerProfileId_fkey" FOREIGN KEY ("workerProfileId") REFERENCES "WorkerProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
