/*
  Warnings:

  - Added the required column `currency` to the `accounts` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "accounts" ADD COLUMN     "currency" TEXT NOT NULL;
