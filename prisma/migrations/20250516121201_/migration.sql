/*
  Warnings:

  - A unique constraint covering the columns `[walletAddress,network]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "User_email_key";

-- DropIndex
DROP INDEX "User_walletAddress_key";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "ethereumAddress" TEXT,
ADD COLUMN     "network" TEXT NOT NULL DEFAULT 'solana',
ADD COLUMN     "pointsHistory" JSONB,
ADD COLUMN     "solanaAddress" TEXT;

-- CreateTable
CREATE TABLE "CheckIn" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "points" INTEGER NOT NULL DEFAULT 10,
    "signature" TEXT NOT NULL,
    "network" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "CheckIn_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_walletAddress_network_key" ON "User"("walletAddress", "network");

-- AddForeignKey
ALTER TABLE "CheckIn" ADD CONSTRAINT "CheckIn_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
