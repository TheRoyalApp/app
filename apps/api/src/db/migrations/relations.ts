import { relations } from "drizzle-orm/relations";
import { appointments, payments, users, services, schedules } from "./schema";

export const paymentsRelations = relations(payments, ({one}) => ({
	appointment: one(appointments, {
		fields: [payments.appointmentId],
		references: [appointments.id]
	}),
}));

export const appointmentsRelations = relations(appointments, ({one, many}) => ({
	payments: many(payments),
	user_userId: one(users, {
		fields: [appointments.userId],
		references: [users.id],
		relationName: "appointments_userId_users_id"
	}),
	service: one(services, {
		fields: [appointments.serviceId],
		references: [services.id]
	}),
	user_barberId: one(users, {
		fields: [appointments.barberId],
		references: [users.id],
		relationName: "appointments_barberId_users_id"
	}),
}));

export const usersRelations = relations(users, ({many}) => ({
	appointments_userId: many(appointments, {
		relationName: "appointments_userId_users_id"
	}),
	appointments_barberId: many(appointments, {
		relationName: "appointments_barberId_users_id"
	}),
	schedules: many(schedules),
}));

export const servicesRelations = relations(services, ({many}) => ({
	appointments: many(appointments),
}));

export const schedulesRelations = relations(schedules, ({one}) => ({
	user: one(users, {
		fields: [schedules.barberId],
		references: [users.id]
	}),
}));