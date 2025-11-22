ALTER TABLE "users" ADD COLUMN "expo_push_token" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "push_notifications_enabled" boolean DEFAULT true;--> statement-breakpoint
ALTER TABLE "services" DROP COLUMN "deleted_at";