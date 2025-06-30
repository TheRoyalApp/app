CREATE TYPE "public"."day_of_week" AS ENUM('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday');--> statement-breakpoint
CREATE TABLE "schedules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"barber_id" uuid NOT NULL,
	"day_of_week" "day_of_week" NOT NULL,
	"available_time_slots" json NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "appointments" ADD COLUMN "barber_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "appointments" ADD COLUMN "time_slot" text NOT NULL;--> statement-breakpoint
ALTER TABLE "schedules" ADD CONSTRAINT "schedules_barber_id_users_id_fk" FOREIGN KEY ("barber_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_barber_id_users_id_fk" FOREIGN KEY ("barber_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;

-- Add reschedule_count to appointments
ALTER TABLE appointments ADD COLUMN reschedule_count INTEGER NOT NULL DEFAULT 0;