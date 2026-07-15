-- Additive-only: storage fields for Supabase migration (Sprint 18).
-- filePath becomes nullable since new attachments no longer store a local path.

ALTER TABLE "ticket_attachments" ALTER COLUMN "file_path" DROP NOT NULL;
ALTER TABLE "ticket_attachments" ADD COLUMN "storage_key" TEXT;
ALTER TABLE "ticket_attachments" ADD COLUMN "bucket" TEXT;
