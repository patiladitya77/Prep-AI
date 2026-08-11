/*
  Warnings:

  - You are about to drop the column `password_hash` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `reset_token` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `reset_token_expiry` on the `users` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."users" DROP COLUMN "password_hash",
DROP COLUMN "reset_token",
DROP COLUMN "reset_token_expiry";
