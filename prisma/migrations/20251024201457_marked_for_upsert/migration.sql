-- AlterTable
ALTER TABLE "public"."CMJTest" ADD COLUMN     "marked_for_upsert" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "playing_level" TEXT;

-- AlterTable
ALTER TABLE "public"."HJTest" ADD COLUMN     "marked_for_upsert" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "playing_level" TEXT;

-- AlterTable
ALTER TABLE "public"."IMTPTest" ADD COLUMN     "marked_for_upsert" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "playing_level" TEXT;

-- AlterTable
ALTER TABLE "public"."PPUTest" ADD COLUMN     "marked_for_upsert" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "playing_level" TEXT;

-- AlterTable
ALTER TABLE "public"."SJTest" ADD COLUMN     "marked_for_upsert" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "playing_level" TEXT;
