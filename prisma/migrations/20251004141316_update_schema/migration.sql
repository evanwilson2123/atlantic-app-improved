/*
  Warnings:

  - You are about to drop the column `NET_PEAK_VERTICAL_FORCE` on the `IMTPTest` table. All the data in the column will be lost.
  - You are about to drop the column `RELATIVE_STRENGTH` on the `IMTPTest` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."IMTPTest" DROP COLUMN "NET_PEAK_VERTICAL_FORCE",
DROP COLUMN "RELATIVE_STRENGTH";
