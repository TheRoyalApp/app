ALTER TABLE "appointments" ADD COLUMN "reschedule_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "services" ADD COLUMN "stripe_product_id" text;--> statement-breakpoint
ALTER TABLE "services" ADD COLUMN "stripe_price_id" text;--> statement-breakpoint
ALTER TABLE "services" ADD COLUMN "stripe_currency" text DEFAULT 'mxn';