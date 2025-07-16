import { pgTable, uuid, text, numeric, integer, boolean, timestamp, unique, foreignKey, json, pgEnum } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const dayOfWeek = pgEnum("day_of_week", ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'])
export const userRole = pgEnum("user_role", ['customer', 'staff'])


export const services = pgTable("services", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: text().notNull(),
	description: text(),
	price: numeric({ precision: 10, scale:  2 }).notNull(),
	duration: integer().notNull(),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
	stripeCurrency: text("stripe_currency").default('mxn'),
	stripeProductId: text("stripe_product_id"),
	stripePriceId: text("stripe_price_id"),
	stripeAdvancePriceId: text("stripe_advance_price_id"),
});

export const users = pgTable("users", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	email: text().notNull(),
	password: text().notNull(),
	firstName: text("first_name").notNull(),
	lastName: text("last_name").notNull(),
	phone: text(),
	isAdmin: boolean("is_admin").default(false),
	refreshToken: text("refresh_token"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
	role: userRole().default('customer'),
}, (table) => [
	unique("users_email_unique").on(table.email),
]);

export const payments = pgTable("payments", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	appointmentId: uuid("appointment_id"),
	amount: numeric({ precision: 10, scale:  2 }).notNull(),
	paymentMethod: text("payment_method").notNull(),
	status: text().default('pending'),
	transactionId: text("transaction_id"),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.appointmentId],
			foreignColumns: [appointments.id],
			name: "payments_appointment_id_appointments_id_fk"
		}),
]);

export const appointments = pgTable("appointments", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id"),
	serviceId: uuid("service_id"),
	appointmentDate: timestamp("appointment_date", { mode: 'string' }).notNull(),
	status: text().default('pending'),
	notes: text(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
	barberId: uuid("barber_id").notNull(),
	timeSlot: text("time_slot").notNull(),
	rescheduleCount: integer("reschedule_count").default(0).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "appointments_user_id_users_id_fk"
		}),
	foreignKey({
			columns: [table.serviceId],
			foreignColumns: [services.id],
			name: "appointments_service_id_services_id_fk"
		}),
	foreignKey({
			columns: [table.barberId],
			foreignColumns: [users.id],
			name: "appointments_barber_id_users_id_fk"
		}),
]);

export const schedules = pgTable("schedules", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	barberId: uuid("barber_id").notNull(),
	dayOfWeek: dayOfWeek("day_of_week").notNull(),
	availableTimeSlots: json("available_time_slots").notNull(),
	isActive: boolean("is_active").default(true),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	foreignKey({
			columns: [table.barberId],
			foreignColumns: [users.id],
			name: "schedules_barber_id_users_id_fk"
		}),
]);
