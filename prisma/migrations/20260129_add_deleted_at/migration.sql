-- AlterTable
ALTER TABLE "clients" ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMP(3);
