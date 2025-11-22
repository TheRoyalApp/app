import { relations } from "drizzle-orm/relations";
import { users, schedules, appointments, services, payments, notifications } from "./schema";

export const schedulesRelations = relations(schedules, ({one}) => ({
	user: one(users, {
		fields: [schedules.barberId],
		references: [users.id]
	}),
}));

export const usersRelations = relations(users, ({many}) => ({
	schedules: many(schedules),
	appointments_userId: many(appointments, {
		relationName: "appointments_userId_users_id"
	}),
	appointments_barberId: many(appointments, {
		relationName: "appointments_barberId_users_id"
	}),
	notifications: many(notifications),
}));

export const appointmentsRelations = relations(appointments, ({one, many}) => ({
	user_userId: one(users, {
		fields: [appointments.userId],
		references: [users.id],
		relationName: "appointments_userId_users_id"
	}),
	user_barberId: one(users, {
		fields: [appointments.barberId],
		references: [users.id],
		relationName: "appointments_barberId_users_id"
	}),
	service: one(services, {
		fields: [appointments.serviceId],
		references: [services.id]
	}),
	payments: many(payments),
	notifications: many(notifications),
}));

export const servicesRelations = relations(services, ({many}) => ({
	appointments: many(appointments),
}));

export const paymentsRelations = relations(payments, ({one}) => ({
	appointment: one(appointments, {
		fields: [payments.appointmentId],
		references: [appointments.id]
	}),
}));

export const notificationsRelations = relations(notifications, ({one}) => ({
	user: one(users, {
		fields: [notifications.userId],
		references: [users.id]
	}),
	appointment: one(appointments, {
		fields: [notifications.appointmentId],
		references: [appointments.id]
	}),
}));