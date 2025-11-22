import { pgTable, serial, text, timestamp, boolean, integer, decimal, uuid, pgEnum, json } from 'drizzle-orm/pg-core';

// User roles enum
export const userRoleEnum = pgEnum('user_role', ['customer', 'staff']);

// Day of week enum
export const dayOfWeekEnum = pgEnum('day_of_week', ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']);

// Users table
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  password: text('password').notNull(),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  phone: text('phone'),
  isAdmin: boolean('is_admin').default(false),
  role: userRoleEnum('role').default('customer'),
  refreshToken: text('refresh_token'),
  expoPushToken: text('expo_push_token'),
  pushNotificationsEnabled: boolean('push_notifications_enabled').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Services table
export const services = pgTable('services', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  description: text('description'),
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
  duration: integer('duration').notNull(), // in minutes
  isActive: boolean('is_active').default(true),
  // Stripe-related fields
  stripeProductId: text('stripe_product_id'),
  stripePriceId: text('stripe_price_id'),
  stripeAdvancePriceId: text('stripe_advance_price_id'),
  stripeCurrency: text('stripe_currency').default('mxn'),
  deletedAt: timestamp('deleted_at'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Schedules table
export const schedules = pgTable('schedules', {
  id: uuid('id').primaryKey().defaultRandom(),
  barberId: uuid('barber_id').references(() => users.id).notNull(),
  dayOfWeek: dayOfWeekEnum('day_of_week').notNull(),
  availableTimeSlots: json('available_time_slots').$type<string[]>().notNull(),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Appointments table
export const appointments = pgTable('appointments', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id),
  barberId: uuid('barber_id').references(() => users.id).notNull(),
  serviceId: uuid('service_id').references(() => services.id),
  appointmentDate: timestamp('appointment_date').notNull(),
  timeSlot: text('time_slot').notNull(), // e.g., '09:00'
  status: text('status').default('pending'), // pending, confirmed, completed, cancelled
  notes: text('notes'),
  rescheduleCount: integer('reschedule_count').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Payments table
export const payments = pgTable('payments', {
  id: uuid('id').primaryKey().defaultRandom(),
  appointmentId: uuid('appointment_id').references(() => appointments.id),
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  paymentMethod: text('payment_method').notNull(), // cash, card, etc.
  paymentType: text('payment_type'), // 'full' or 'advance'
  status: text('status').default('pending'), // pending, completed, failed
  transactionId: text('transaction_id'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Password Reset Tokens table
export const passwordResetTokens = pgTable('password_reset_tokens', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  token: text('token').notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  used: boolean('used').default(false),
  createdAt: timestamp('created_at').defaultNow(),
});
