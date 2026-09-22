-- AlterTable
ALTER TABLE "CustomerEvent" ADD COLUMN     "source" TEXT DEFAULT 'organic';

-- CreateIndex
CREATE INDEX "CustomerEvent_workerId_createdAt_idx" ON "CustomerEvent"("workerId", "createdAt");

-- CreateIndex
CREATE INDEX "CustomerEvent_workerId_source_idx" ON "CustomerEvent"("workerId", "source");
