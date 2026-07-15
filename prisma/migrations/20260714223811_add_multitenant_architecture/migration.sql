-- Multi-tenant architecture migration.
-- Safe expand -> backfill -> contract pattern. Preserves all existing data.
-- Does NOT reset or drop any existing table.

-- CreateEnum
CREATE TYPE "TenantRole" AS ENUM ('TENANT_ADMIN', 'AGENT', 'USER');

-- CreateTable: tenants
CREATE TABLE "tenants" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "legalName" TEXT,
    "taxId" TEXT,
    "logoUrl" TEXT,
    "primaryColor" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenants_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tenants_slug_key" ON "tenants"("slug");

-- CreateTable: tenant_users
CREATE TABLE "tenant_users" (
    "id" SERIAL NOT NULL,
    "tenantId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "role" "TenantRole" NOT NULL DEFAULT 'USER',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tenant_users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tenant_users_tenantId_idx" ON "tenant_users"("tenantId");
CREATE INDEX "tenant_users_userId_idx" ON "tenant_users"("userId");
CREATE UNIQUE INDEX "tenant_users_tenantId_userId_key" ON "tenant_users"("tenantId", "userId");

-- AlterTable: users -> add isSuperAdmin
ALTER TABLE "users" ADD COLUMN "isSuperAdmin" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable: system_settings -> add nullable tenantId, drop global unique on key
ALTER TABLE "system_settings" ADD COLUMN "tenantId" INTEGER;
DROP INDEX "system_settings_key_key";

-- AlterTable: ticket_types -> add nullable tenantId, drop global unique on name
ALTER TABLE "ticket_types" ADD COLUMN "tenantId" INTEGER;
DROP INDEX "ticket_types_name_key";

-- AlterTable: ticket_subtypes -> add nullable tenantId
ALTER TABLE "ticket_subtypes" ADD COLUMN "tenantId" INTEGER;

-- AlterTable: ticket_priorities -> add nullable tenantId, drop global unique on name
ALTER TABLE "ticket_priorities" ADD COLUMN "tenantId" INTEGER;
DROP INDEX "ticket_priorities_name_key";

-- AlterTable: tickets -> add nullable tenantId
ALTER TABLE "tickets" ADD COLUMN "tenantId" INTEGER;

-- Backfill: create initial tenant and associate all existing data with it.
DO $$
DECLARE
  initial_tenant_id INTEGER;
BEGIN
  INSERT INTO "tenants" ("name", "slug", "legalName", "isActive", "createdAt", "updatedAt")
  VALUES ('MasterDiv Demo', 'masterdiv-demo', 'MasterDiv Demo', true, now(), now())
  RETURNING "id" INTO initial_tenant_id;

  UPDATE "tickets" SET "tenantId" = initial_tenant_id WHERE "tenantId" IS NULL;
  UPDATE "ticket_types" SET "tenantId" = initial_tenant_id WHERE "tenantId" IS NULL;
  UPDATE "ticket_subtypes" SET "tenantId" = initial_tenant_id WHERE "tenantId" IS NULL;
  UPDATE "ticket_priorities" SET "tenantId" = initial_tenant_id WHERE "tenantId" IS NULL;
  UPDATE "system_settings" SET "tenantId" = initial_tenant_id WHERE "tenantId" IS NULL;

  INSERT INTO "tenant_users" ("tenantId", "userId", "role", "isActive", "createdAt", "updatedAt")
  SELECT
    initial_tenant_id,
    "id",
    CASE "role"
      WHEN 'ADMIN' THEN 'TENANT_ADMIN'
      WHEN 'SUPPORT' THEN 'AGENT'
      ELSE 'USER'
    END::"TenantRole",
    true,
    now(),
    now()
  FROM "users";

  UPDATE "users" SET "isSuperAdmin" = true WHERE "role" = 'ADMIN';
END $$;

-- Contract: enforce NOT NULL now that every row has a tenantId.
ALTER TABLE "tickets" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "ticket_types" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "ticket_subtypes" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "ticket_priorities" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "system_settings" ALTER COLUMN "tenantId" SET NOT NULL;

-- CreateIndex (tenant scoping)
CREATE INDEX "tickets_tenantId_idx" ON "tickets"("tenantId");
CREATE INDEX "tickets_tenantId_status_idx" ON "tickets"("tenantId", "status");
CREATE INDEX "tickets_tenantId_createdAt_idx" ON "tickets"("tenantId", "created_at");
CREATE INDEX "tickets_tenantId_assignedTo_idx" ON "tickets"("tenantId", "assigned_to");
CREATE INDEX "ticket_types_tenantId_idx" ON "ticket_types"("tenantId");
CREATE INDEX "ticket_subtypes_tenantId_idx" ON "ticket_subtypes"("tenantId");
CREATE INDEX "ticket_priorities_tenantId_idx" ON "ticket_priorities"("tenantId");
CREATE INDEX "system_settings_tenantId_idx" ON "system_settings"("tenantId");

-- CreateIndex (new per-tenant uniqueness, replacing the old global ones)
CREATE UNIQUE INDEX "ticket_types_tenantId_name_key" ON "ticket_types"("tenantId", "name");
CREATE UNIQUE INDEX "ticket_priorities_tenantId_name_key" ON "ticket_priorities"("tenantId", "name");
CREATE UNIQUE INDEX "system_settings_tenantId_key_key" ON "system_settings"("tenantId", "key");

-- AddForeignKey
ALTER TABLE "tenant_users" ADD CONSTRAINT "tenant_users_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "tenant_users" ADD CONSTRAINT "tenant_users_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ticket_types" ADD CONSTRAINT "ticket_types_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ticket_subtypes" ADD CONSTRAINT "ticket_subtypes_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ticket_priorities" ADD CONSTRAINT "ticket_priorities_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "system_settings" ADD CONSTRAINT "system_settings_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
