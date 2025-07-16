-- Migration for phone-based authentication
-- Make phone the primary identifier and add SMS verification fields

-- Add SMS verification columns
ALTER TABLE "users" ADD COLUMN "sms_verification_code" text;
ALTER TABLE "users" ADD COLUMN "sms_verification_expires" timestamp;
ALTER TABLE "users" ADD COLUMN "is_phone_verified" boolean DEFAULT false;

-- Make phone number required and unique
ALTER TABLE "users" ALTER COLUMN "phone" SET NOT NULL;
ALTER TABLE "users" ADD CONSTRAINT "users_phone_unique" UNIQUE ("phone");

-- Make email optional
ALTER TABLE "users" ALTER COLUMN "email" DROP NOT NULL;

-- Make password optional (for phone-only auth)
ALTER TABLE "users" ALTER COLUMN "password" DROP NOT NULL;

-- Update existing users to have verified phone numbers
UPDATE "users" SET "is_phone_verified" = true WHERE "phone" IS NOT NULL; 