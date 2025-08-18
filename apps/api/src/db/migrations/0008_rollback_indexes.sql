-- Rollback script for performance indexes
-- Run this if you need to remove the indexes

-- Drop appointment indexes
DROP INDEX CONCURRENTLY IF EXISTS idx_appointments_user_id;
DROP INDEX CONCURRENTLY IF EXISTS idx_appointments_barber_id;
DROP INDEX CONCURRENTLY IF EXISTS idx_appointments_service_id;
DROP INDEX CONCURRENTLY IF EXISTS idx_appointments_appointment_date;
DROP INDEX CONCURRENTLY IF EXISTS idx_appointments_status;
DROP INDEX CONCURRENTLY IF EXISTS idx_appointments_created_at;
DROP INDEX CONCURRENTLY IF EXISTS idx_appointments_barber_date;
DROP INDEX CONCURRENTLY IF EXISTS idx_appointments_user_status;
DROP INDEX CONCURRENTLY IF EXISTS idx_appointments_date_status;

-- Drop user indexes
DROP INDEX CONCURRENTLY IF EXISTS idx_users_email;
DROP INDEX CONCURRENTLY IF EXISTS idx_users_phone;
DROP INDEX CONCURRENTLY IF EXISTS idx_users_role;
DROP INDEX CONCURRENTLY IF EXISTS idx_users_is_admin;
DROP INDEX CONCURRENTLY IF EXISTS idx_users_created_at;

-- Drop service indexes
DROP INDEX CONCURRENTLY IF EXISTS idx_services_is_active;
DROP INDEX CONCURRENTLY IF EXISTS idx_services_stripe_product_id;
DROP INDEX CONCURRENTLY IF EXISTS idx_services_name;

-- Drop schedule indexes
DROP INDEX CONCURRENTLY IF EXISTS idx_schedules_barber_id;
DROP INDEX CONCURRENTLY IF EXISTS idx_schedules_day_of_week;
DROP INDEX CONCURRENTLY IF EXISTS idx_schedules_is_active;
DROP INDEX CONCURRENTLY IF EXISTS idx_schedules_barber_day;

-- Drop payment indexes
DROP INDEX CONCURRENTLY IF EXISTS idx_payments_appointment_id;
DROP INDEX CONCURRENTLY IF EXISTS idx_payments_status;
DROP INDEX CONCURRENTLY IF EXISTS idx_payments_transaction_id;
DROP INDEX CONCURRENTLY IF EXISTS idx_payments_created_at;