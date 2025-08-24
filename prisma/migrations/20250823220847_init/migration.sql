/*
  Warnings:

  - You are about to drop the column `ip` on the `RefreshToken` table. All the data in the column will be lost.
  - You are about to drop the column `sessionId` on the `RefreshToken` table. All the data in the column will be lost.
  - You are about to drop the column `userAgent` on the `RefreshToken` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."RefreshToken" DROP CONSTRAINT "RefreshToken_userId_fkey";

-- AlterTable
ALTER TABLE "public"."RefreshToken" DROP COLUMN "ip",
DROP COLUMN "sessionId",
DROP COLUMN "userAgent";

-- AddForeignKey
ALTER TABLE "public"."RefreshToken" ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
