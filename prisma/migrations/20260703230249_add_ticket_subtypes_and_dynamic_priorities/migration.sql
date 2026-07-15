/*
  Warnings:

  - You are about to drop the column `priority` on the `tickets` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "tickets" DROP COLUMN "priority",
ADD COLUMN     "priorityId" INTEGER,
ADD COLUMN     "slaResolvedAt" TIMESTAMP(3),
ADD COLUMN     "slaStartedAt" TIMESTAMP(3),
ADD COLUMN     "ticketSubtypeId" INTEGER;

-- DropEnum
DROP TYPE "TicketPriority";

-- CreateTable
CREATE TABLE "ticket_subtypes" (
    "id" SERIAL NOT NULL,
    "ticketTypeId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ticket_subtypes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ticket_priorities" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "slaDurationMinutes" INTEGER NOT NULL,
    "color" TEXT,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ticket_priorities_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ticket_subtypes_ticketTypeId_idx" ON "ticket_subtypes"("ticketTypeId");

-- CreateIndex
CREATE INDEX "ticket_subtypes_isActive_idx" ON "ticket_subtypes"("isActive");

-- CreateIndex
CREATE INDEX "ticket_subtypes_displayOrder_idx" ON "ticket_subtypes"("displayOrder");

-- CreateIndex
CREATE UNIQUE INDEX "ticket_subtypes_ticketTypeId_name_key" ON "ticket_subtypes"("ticketTypeId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "ticket_priorities_name_key" ON "ticket_priorities"("name");

-- CreateIndex
CREATE INDEX "ticket_priorities_isActive_idx" ON "ticket_priorities"("isActive");

-- CreateIndex
CREATE INDEX "ticket_priorities_displayOrder_idx" ON "ticket_priorities"("displayOrder");

-- CreateIndex
CREATE INDEX "tickets_ticketSubtypeId_idx" ON "tickets"("ticketSubtypeId");

-- CreateIndex
CREATE INDEX "tickets_priorityId_idx" ON "tickets"("priorityId");

-- CreateIndex
CREATE INDEX "tickets_sla_due_at_idx" ON "tickets"("sla_due_at");

-- AddForeignKey
ALTER TABLE "ticket_subtypes" ADD CONSTRAINT "ticket_subtypes_ticketTypeId_fkey" FOREIGN KEY ("ticketTypeId") REFERENCES "ticket_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_ticketSubtypeId_fkey" FOREIGN KEY ("ticketSubtypeId") REFERENCES "ticket_subtypes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_priorityId_fkey" FOREIGN KEY ("priorityId") REFERENCES "ticket_priorities"("id") ON DELETE SET NULL ON UPDATE CASCADE;
