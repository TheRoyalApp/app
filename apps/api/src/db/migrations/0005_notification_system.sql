-- Create notification enums
CREATE TYPE IF NOT EXISTS "public"."notification_status" AS ENUM('pending', 'sent', 'failed', 'read');
CREATE TYPE IF NOT EXISTS "public"."notification_type" AS ENUM('appointment_created', 'appointment_reminder', 'appointment_confirmed', 'appointment_cancelled', 'appointment_completed');

-- Create notification templates table
CREATE TABLE IF NOT EXISTS "notification_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" "notification_type" NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"appointment_id" uuid,
	"type" "notification_type" NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"status" "notification_status" DEFAULT 'pending',
	"scheduled_for" timestamp,
	"sent_at" timestamp,
	"read_at" timestamp,
	"metadata" json,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);

-- Add notification preferences to users table (only if they don't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'push_notifications') THEN
        ALTER TABLE "users" ADD COLUMN "push_notifications" boolean DEFAULT true;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'email_notifications') THEN
        ALTER TABLE "users" ADD COLUMN "email_notifications" boolean DEFAULT true;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'sms_notifications') THEN
        ALTER TABLE "users" ADD COLUMN "sms_notifications" boolean DEFAULT false;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'appointment_reminders') THEN
        ALTER TABLE "users" ADD COLUMN "appointment_reminders" boolean DEFAULT true;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'promotional_offers') THEN
        ALTER TABLE "users" ADD COLUMN "promotional_offers" boolean DEFAULT false;
    END IF;
END $$;

-- Add foreign key constraints
ALTER TABLE "notifications" ADD CONSTRAINT IF NOT EXISTS "notifications_user_id_users_id_fk" 
    FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

ALTER TABLE "notifications" ADD CONSTRAINT IF NOT EXISTS "notifications_appointment_id_appointments_id_fk" 
    FOREIGN KEY ("appointment_id") REFERENCES "public"."appointments"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- Insert default notification templates
INSERT INTO "notification_templates" ("type", "title", "message", "is_active") VALUES
('appointment_created', 'Nueva Cita Creada', 'Se ha creado una nueva cita para {serviceName} el {date} a las {time} con {clientName}', true),
('appointment_reminder', 'Recordatorio de Cita', 'Tu cita para {serviceName} está programada para mañana a las {time}. ¡Te esperamos!', true),
('appointment_confirmed', 'Cita Confirmada', 'Tu cita para {serviceName} ha sido confirmada para el {date} a las {time}', true),
('appointment_cancelled', 'Cita Cancelada', 'Tu cita para {serviceName} programada para el {date} a las {time} ha sido cancelada', true),
('appointment_completed', 'Cita Completada', 'Gracias por visitarnos. Tu cita para {serviceName} ha sido completada exitosamente', true)
ON CONFLICT DO NOTHING; 