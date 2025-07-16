-- Migration to add missing SMS verification and notification preference columns
-- These columns are expected by the auth controller but missing from the database

-- Add SMS verification columns
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "sms_verification_code" text;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "sms_verification_expires" timestamp;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "is_phone_verified" boolean DEFAULT false;

-- Add notification preference columns
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "push_notifications" boolean DEFAULT true;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "email_notifications" boolean DEFAULT true;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "sms_notifications" boolean DEFAULT false;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "appointment_reminders" boolean DEFAULT true;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "promotional_offers" boolean DEFAULT false;

-- Update existing users to have verified phone numbers
UPDATE "users" SET "is_phone_verified" = true WHERE "phone" IS NOT NULL; 