import React from 'react';
import { View, Pressable } from 'react-native';
import { ThemeText } from '@/components/Themed';
import Button from '@/components/Button';
import Colors from '@/constants/Colors';
import { Appointment } from '@/services';

interface AppointmentCardProps {
	appointment: Appointment;
	onCancel?: (appointmentId: string) => void;
	onPress?: (appointment: Appointment) => void;
}

export default function AppointmentCard({ appointment, onCancel, onPress }: AppointmentCardProps) {
	const formatTime = (timeSlot: string) => {
		const [hours, minutes] = timeSlot.split(':');
		const hour = parseInt(hours);
		const ampm = hour >= 12 ? 'PM' : 'AM';
		const displayHour = hour % 12 || 12;
		return `${displayHour}:${minutes} ${ampm}`;
	};

	const formatDate = (dateString: string) => {
		// Handle dd/mm/yyyy format from API
		if (dateString.includes('/')) {
			const [day, month, year] = dateString.split('/');
			const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
			return date.toLocaleDateString('es-ES', {
				weekday: 'short',
				year: 'numeric',
				month: 'short',
				day: 'numeric',
			});
		} else {
			// Fallback to standard date parsing
			const date = new Date(dateString);
			return date.toLocaleDateString('es-ES', {
				weekday: 'short',
				year: 'numeric',
				month: 'short',
				day: 'numeric',
			});
		}
	};

	const formatPrice = (price: string | number) => {
		const numericPrice = typeof price === 'string' ? parseFloat(price) : price;
		return new Intl.NumberFormat('es-ES', {
			style: 'currency',
			currency: 'USD',
		}).format(numericPrice);
	};

	const getStatusColor = (status: string) => {
		switch (status) {
			case 'confirmed':
				return '#4CAF50';
			case 'pending':
				return '#FF9800';
			case 'completed':
				return '#2196F3';
			case 'cancelled':
				return '#F44336';
			case 'no-show':
				return '#9E9E9E';
			default:
				return Colors.dark.textLight;
		}
	};

	const getStatusText = (status: string) => {
		switch (status) {
			case 'confirmed':
				return 'Confirmada';
			case 'pending':
				return 'Pendiente';
			case 'completed':
				return 'Completada';
			case 'cancelled':
				return 'Cancelada';
			case 'no-show':
				return 'No asistió';
			default:
				return status;
		}
	};

	const canCancel = appointment.status === 'confirmed' || appointment.status === 'pending';

	return (
		<Pressable
			onPress={() => onPress?.(appointment)}
			style={{
				backgroundColor: Colors.dark.background,
				borderColor: Colors.dark.gray,
				borderWidth: 1,
				borderRadius: 8,
				padding: 20,
				marginBottom: 15,
				borderLeftWidth: 4,
				borderLeftColor: getStatusColor(appointment.status),
			}}
		>
			<View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
				<View style={{ flex: 1 }}>
					<ThemeText style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 5 }}>
						{appointment.service?.name || 'Servicio'}
					</ThemeText>
					<ThemeText style={{ fontSize: 14, color: Colors.dark.textLight, marginBottom: 5 }}>
						{formatDate(appointment.appointmentDate)} - {formatTime(appointment.timeSlot)}
					</ThemeText>
					{appointment.barber && (
						<ThemeText style={{ fontSize: 14, color: Colors.dark.textLight, marginBottom: 5 }}>
							Barbero: {appointment.barber.name}
						</ThemeText>
					)}
					{appointment.service && (
						<ThemeText style={{ fontSize: 14, color: Colors.dark.textLight, marginBottom: 5 }}>
							Precio: {formatPrice(appointment.service.price)}
						</ThemeText>
					)}
				</View>
				<View style={{ alignItems: 'flex-end' }}>
					<ThemeText
						style={{
							fontSize: 12,
							color: getStatusColor(appointment.status),
							fontWeight: 'bold',
							textTransform: 'uppercase',
						}}
					>
						{getStatusText(appointment.status)}
					</ThemeText>
				</View>
			</View>

			{canCancel && onCancel && (
				<Button
					onPress={() => onCancel(appointment.id)}
					style={{
						backgroundColor: '#F44336',
						borderColor: '#F44336',
						marginTop: 10,
					}}
				>
					Cancelar Cita
				</Button>
			)}
		</Pressable>
	);
} 