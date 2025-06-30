// React core imports
import React, { useState, useEffect } from 'react';

// React Native core imports
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar, View, ScrollView, Alert, ActivityIndicator, RefreshControl } from 'react-native';
import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';

// Local imports
import { ThemeText, Container } from '@/components/Themed';
import Button from '@/components/Button';
import Colors from '@/constants/Colors';
import { AppointmentsService, Appointment } from '@/services';

export default function HistoryScreen() {
	const [appointments, setAppointments] = useState<Appointment[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);

	useEffect(() => {
		loadAppointments();
	}, []);

	const loadAppointments = async () => {
		try {
			setIsLoading(true);
			const response = await AppointmentsService.getUserAppointments();
			
			if (response.success && response.data) {
				setAppointments(response.data);
			} else {
				Alert.alert('Error', 'Failed to load appointments');
			}
		} catch (error) {
			console.error('Error loading appointments:', error);
			Alert.alert('Error', 'Failed to load appointments');
		} finally {
			setIsLoading(false);
		}
	};

	const onRefresh = async () => {
		setRefreshing(true);
		await loadAppointments();
		setRefreshing(false);
	};

	const handleCancelAppointment = async (appointmentId: string) => {
		try {
			const response = await AppointmentsService.cancelAppointment(appointmentId);
			
			if (response.success) {
				Alert.alert('Success', 'Appointment cancelled successfully');
				loadAppointments(); // Reload the list
			} else {
				Alert.alert('Error', response.error || 'Failed to cancel appointment');
			}
		} catch (error) {
			console.error('Error cancelling appointment:', error);
			Alert.alert('Error', 'Failed to cancel appointment');
		}
	};

	const formatTime = (timeSlot: string) => {
		const [hours, minutes] = timeSlot.split(':');
		const hour = parseInt(hours);
		const ampm = hour >= 12 ? 'PM' : 'AM';
		const displayHour = hour % 12 || 12;
		return `${displayHour}:${minutes} ${ampm}`;
	};

	const formatDate = (dateString: string) => {
		const date = new Date(dateString);
		return date.toLocaleDateString('es-ES', {
			weekday: 'short',
			year: 'numeric',
			month: 'short',
			day: 'numeric',
		});
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

	const renderAppointmentCard = (appointment: Appointment) => {
		const isUpcoming = appointment.status === 'confirmed' || appointment.status === 'pending';
		const canCancel = appointment.status === 'confirmed' || appointment.status === 'pending';

		return (
			<View
				key={appointment.id}
				style={{
					backgroundColor: Colors.dark.gray,
					borderRadius: 10,
					padding: 15,
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

				{canCancel && (
					<Button
						onPress={() => handleCancelAppointment(appointment.id)}
						style={{
							backgroundColor: '#F44336',
							borderColor: '#F44336',
							marginTop: 10,
						}}
					>
						Cancelar Cita
					</Button>
				)}
			</View>
		);
	};

	if (isLoading) {
		return (
			<SafeAreaView style={{ flex: 1, backgroundColor: Colors.dark.background, justifyContent: 'center', alignItems: 'center' }}>
				<ActivityIndicator size="large" color={Colors.dark.primary} />
				<ThemeText style={{ marginTop: 10 }}>Loading appointments...</ThemeText>
			</SafeAreaView>
		);
	}

	return (
		<SafeAreaView style={{ flex: 1, backgroundColor: Colors.dark.background }}>
			<StatusBar barStyle="light-content" />

			<ScrollView
				refreshControl={
					<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
				}
			>
				<Container style={{ flex: 1, paddingHorizontal: 20 }}>
					<View style={{ paddingTop: 20, marginBottom: 20 }}>
						<ThemeText style={{ fontSize: 24, fontWeight: 'bold' }}>
							Historial
						</ThemeText>
					</View>
					<View style={{ flex: 1 }}>
						<MaskedView
							style={{ flex: 1 }}
							maskElement={
								<LinearGradient
									style={{ flex: 1 }}
									colors={['black', 'black', 'transparent']}
									locations={[0, 0.9, 1]}
								/>
							}
						>
							<ScrollView showsVerticalScrollIndicator={false}>
								<View style={{ gap: 12, paddingBottom: 20 }}>
									{appointments.length === 0 ? (
										<View style={{ alignItems: 'center', paddingVertical: 40 }}>
											<ThemeText style={{ fontSize: 16, color: Colors.dark.textLight, textAlign: 'center' }}>
												No tienes citas agendadas
											</ThemeText>
											<Button
												onPress={() => router.push('/appoinment')}
												style={{ marginTop: 20 }}
											>
												Agendar Cita
											</Button>
										</View>
									) : (
										<View>
											{/* Upcoming Appointments */}
											{appointments.filter(a => a.status === 'confirmed' || a.status === 'pending').length > 0 && (
												<View style={{ marginBottom: 30 }}>
													<ThemeText style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 15 }}>
														Próximas Citas
													</ThemeText>
													{appointments
														.filter(appointment => appointment.status === 'confirmed' || appointment.status === 'pending')
														.map(renderAppointmentCard)}
												</View>
											)}

											{/* Past Appointments */}
											{appointments.filter(a => a.status === 'completed' || a.status === 'cancelled' || a.status === 'no-show').length > 0 && (
												<View>
													<ThemeText style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 15 }}>
														Historial
													</ThemeText>
													{appointments
														.filter(appointment => appointment.status === 'completed' || appointment.status === 'cancelled' || appointment.status === 'no-show')
														.map(renderAppointmentCard)}
												</View>
											)}
										</View>
									)}
								</View>
							</ScrollView>
						</MaskedView>
					</View>
				</Container>
			</ScrollView>
		</SafeAreaView>
	);
}
