-- Performance indexes for production optimization
-- These indexes will be created concurrently to avoid blocking operations

-- Users table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_is_admin ON users(is_admin);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_created_at ON users(created_at);

-- Appointments table indexes (most critical for performance)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_appointments_user_id ON appointments(user_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_appointments_barber_id ON appointments(barber_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_appointments_service_id ON appointments(service_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_appointments_appointment_date ON appointments(appointment_date);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_appointments_created_at ON appointments(created_at);

-- Composite indexes for common queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_appointments_barber_date ON appointments(barber_id, appointment_date);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_appointments_user_status ON appointments(user_id, status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_appointments_date_status ON appointments(appointment_date, status);

-- Services table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_services_is_active ON services(is_active);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_services_stripe_product_id ON services(stripe_product_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_services_name ON services(name);

-- Schedules table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_schedules_barber_id ON schedules(barber_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_schedules_day_of_week ON schedules(day_of_week);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_schedules_is_active ON schedules(is_active);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_schedules_barber_day ON schedules(barber_id, day_of_week);

-- Payments table indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payments_appointment_id ON payments(appointment_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payments_transaction_id ON payments(transaction_id);
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_payments_created_at ON payments(created_at);

-- Add comments explaining the purpose of key indexes
COMMENT ON INDEX idx_appointments_barber_date IS 'Optimizes barber availability queries by date';
COMMENT ON INDEX idx_appointments_user_status IS 'Optimizes user appointment history queries';
COMMENT ON INDEX idx_appointments_date_status IS 'Optimizes appointment listing and filtering';
COMMENT ON INDEX idx_schedules_barber_day IS 'Optimizes schedule lookup for specific barber and day';