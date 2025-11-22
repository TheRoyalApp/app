import { pgTable, index, unique, uuid, text, boolean, timestamp, foreignKey, jsonb, integer, numeric, pgEnum } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const dayOfWeek = pgEnum("day_of_week", ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'])
export const notificationStatus = pgEnum("notification_status", ['pending', 'sent', 'failed', 'read'])
export const notificationType = pgEnum("notification_type", ['appointment_created', 'appointment_reminder', 'appointment_confirmed', 'appointment_cancelled', 'appointment_completed'])
export const userRole = pgEnum("user_role", ['customer', 'staff'])


export const users = pgTable("users", {
	id: uuid().default(sql`uuid_generate_v4()`).primaryKey().notNull(),
	email: text(),
	password: text(),
	firstName: text("first_name").notNull(),
	lastName: text("last_name").notNull(),
	phone: text().notNull(),
	isAdmin: boolean("is_admin").default(false),
	role: userRole().default('customer'),
	refreshToken: text("refresh_token"),
	smsVerificationCode: text("sms_verification_code"),
	smsVerificationExpires: timestamp("sms_verification_expires", { mode: 'string' }),
	isPhoneVerified: boolean("is_phone_verified").default(false),
	pushNotifications: boolean("push_notifications").default(true),
	emailNotifications: boolean("email_notifications").default(true),
	smsNotifications: boolean("sms_notifications").default(false),
	appointmentReminders: boolean("appointment_reminders").default(true),
	promotionalOffers: boolean("promotional_offers").default(false),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_users_email").using("btree", table.email.asc().nullsLast().op("text_ops")),
	index("idx_users_phone").using("btree", table.phone.asc().nullsLast().op("text_ops")),
	unique("users_phone_key").on(table.phone),
]);

export const schedules = pgTable("schedules", {
	id: uuid().default(sql`uuid_generate_v4()`).primaryKey().notNull(),
	barberId: uuid("barber_id").notNull(),
	dayOfWeek: dayOfWeek("day_of_week").notNull(),
	availableTimeSlots: jsonb("available_time_slots").notNull(),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_schedules_barber_id").using("btree", table.barberId.asc().nullsLast().op("uuid_ops")),
	index("idx_schedules_day_of_week").using("btree", table.dayOfWeek.asc().nullsLast().op("enum_ops")),
	foreignKey({
			columns: [table.barberId],
			foreignColumns: [users.id],
			name: "schedules_barber_id_fkey"
		}),
]);

export const appointments = pgTable("appointments", {
	id: uuid().default(sql`uuid_generate_v4()`).primaryKey().notNull(),
	userId: uuid("user_id"),
	barberId: uuid("barber_id").notNull(),
	serviceId: uuid("service_id"),
	appointmentDate: timestamp("appointment_date", { mode: 'string' }).notNull(),
	timeSlot: text("time_slot").notNull(),
	status: text().default('pending'),
	notes: text(),
	rescheduleCount: integer("reschedule_count").default(0).notNull(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_appointments_barber_id").using("btree", table.barberId.asc().nullsLast().op("uuid_ops")),
	index("idx_appointments_date").using("btree", table.appointmentDate.asc().nullsLast().op("timestamp_ops")),
	index("idx_appointments_status").using("btree", table.status.asc().nullsLast().op("text_ops")),
	index("idx_appointments_user_id").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "appointments_user_id_fkey"
		}),
	foreignKey({
			columns: [table.barberId],
			foreignColumns: [users.id],
			name: "appointments_barber_id_fkey"
		}),
	foreignKey({
			columns: [table.serviceId],
			foreignColumns: [services.id],
			name: "appointments_service_id_fkey"
		}),
]);

export const services = pgTable("services", {
	id: uuid().default(sql`uuid_generate_v4()`).primaryKey().notNull(),
	name: text().notNull(),
	description: text(),
	price: numeric({ precision: 10, scale:  2 }).notNull(),
	duration: integer().notNull(),
	isActive: boolean("is_active").default(true),
	stripeProductId: text("stripe_product_id"),
	stripePriceId: text("stripe_price_id"),
	stripeAdvancePriceId: text("stripe_advance_price_id"),
	stripeCurrency: text("stripe_currency").default('mxn'),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
});

export const payments = pgTable("payments", {
	id: uuid().default(sql`uuid_generate_v4()`).primaryKey().notNull(),
	appointmentId: uuid("appointment_id"),
	amount: numeric({ precision: 10, scale:  2 }).notNull(),
	paymentMethod: text("payment_method").notNull(),
	paymentType: text("payment_type"),
	status: text().default('pending'),
	transactionId: text("transaction_id"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_payments_appointment_id").using("btree", table.appointmentId.asc().nullsLast().op("uuid_ops")),
	index("idx_payments_status").using("btree", table.status.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.appointmentId],
			foreignColumns: [appointments.id],
			name: "payments_appointment_id_fkey"
		}),
]);

export const notifications = pgTable("notifications", {
	id: uuid().default(sql`uuid_generate_v4()`).primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	appointmentId: uuid("appointment_id"),
	type: notificationType().notNull(),
	title: text().notNull(),
	message: text().notNull(),
	status: notificationStatus().default('pending'),
	scheduledFor: timestamp("scheduled_for", { mode: 'string' }),
	sentAt: timestamp("sent_at", { mode: 'string' }),
	readAt: timestamp("read_at", { mode: 'string' }),
	metadata: jsonb(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_notifications_appointment_id").using("btree", table.appointmentId.asc().nullsLast().op("uuid_ops")),
	index("idx_notifications_scheduled_for").using("btree", table.scheduledFor.asc().nullsLast().op("timestamp_ops")),
	index("idx_notifications_status").using("btree", table.status.asc().nullsLast().op("enum_ops")),
	index("idx_notifications_user_id").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "notifications_user_id_fkey"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.appointmentId],
			foreignColumns: [appointments.id],
			name: "notifications_appointment_id_fkey"
		}).onDelete("cascade"),
]);

export const notificationTemplates = pgTable("notification_templates", {
	id: uuid().default(sql`uuid_generate_v4()`).primaryKey().notNull(),
	type: notificationType().notNull(),
	title: text().notNull(),
	message: text().notNull(),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_notification_templates_type").using("btree", table.type.asc().nullsLast().op("enum_ops")),
]);
