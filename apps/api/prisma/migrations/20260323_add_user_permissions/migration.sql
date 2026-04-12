-- Add permissions array to users
ALTER TABLE "User" ADD COLUMN "permissions" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
