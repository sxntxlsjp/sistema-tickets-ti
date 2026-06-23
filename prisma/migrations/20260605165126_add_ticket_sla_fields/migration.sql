-- AlterTable
ALTER TABLE "tickets" ADD COLUMN     "sla_due_at" TIMESTAMP(3),
ADD COLUMN     "sla_status" VARCHAR(30) NOT NULL DEFAULT 'ON_TIME';
