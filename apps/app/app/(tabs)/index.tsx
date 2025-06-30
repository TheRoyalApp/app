// React Native core imports
import React from 'react';
import { StatusBar, View, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEffect, useState } from 'react';

// Third-party library imports
import { Mail } from 'lucide-react-native';
import { Link, router } from 'expo-router';

// Local imports
import { ThemeText, Container } from '@/components/Themed';
import Button from '@/components/Button';
import AppoinmentRemider from '@/components/ui/AppoinmentReminder';
import Colors from '@/constants/Colors';
import { useAuth } from '@/components/auth/AuthContext';
import { AppointmentsService, Appointment } from '@/services';

export default function HomeScreen() {
	const { user } = useAuth();
	const [upcomingAppointment, setUpcomingAppointment] = useState<Appointment | null>(null);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		fetchUpcomingAppointment();
	}, []);

	const fetchUpcomingAppointment = async () => {
		try {
			setIsLoading(true);
			const response = await AppointmentsService.getUpcomingAppointments();
			
			if (response.success && response.data && response.data.length > 0) {
				// Get the next upcoming appointment
				const nextAppointment = response.data[0];
				setUpcomingAppointment(nextAppointment);
			} else {
				setUpcomingAppointment(null);
			}
		} catch (error) {
			console.error('Error fetching upcoming appointment:', error);
			Alert.alert('Error', 'Failed to load appointment data');
		} finally {
			setIsLoading(false);
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
			weekday: 'long',
			year: 'numeric',
			month: 'long',
			day: 'numeric',
		});
	};

	return (
		<SafeAreaView style={{ flex: 1, backgroundColor: Colors.dark.background }}>
			<ScrollView>
				<StatusBar barStyle="light-content" />

				<View
					style={{
						flexDirection: 'row',
						justifyContent: 'space-between',
						alignItems: 'center',
						padding: 20,
					}}
				>
					<ThemeText style={{ fontSize: 24, fontWeight: 'bold' }}>
						Inicio
					</ThemeText>
					<Mail color={Colors.dark.text} />
				</View>

				<Container>
					<View style={{ marginBottom: 20 }}>
						<ThemeText
							style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 5 }}
						>
							Hola, {user?.name || 'Usuario'}!
						</ThemeText>
						
						{isLoading ? (
							<ThemeText
								style={{
									fontSize: 16,
									marginBottom: 5,
									color: Colors.dark.textLight,
								}}
							>
								Cargando citas...
							</ThemeText>
						) : upcomingAppointment ? (
							<>
								<ThemeText
									style={{
										fontSize: 16,
										marginBottom: 5,
										color: Colors.dark.textLight,
									}}
								>
									Tienes una cita agendada para las {formatTime(upcomingAppointment.timeSlot)}
								</ThemeText>
								<ThemeText style={{ fontSize: 16, color: Colors.dark.textLight, marginBottom: 5 }}>
									Fecha: {formatDate(upcomingAppointment.appointmentDate)}
								</ThemeText>
								{upcomingAppointment.barber && (
									<ThemeText style={{ fontSize: 16, color: Colors.dark.textLight }}>
										Tu barbero es: {upcomingAppointment.barber.name}
									</ThemeText>
								)}
								{upcomingAppointment.service && (
									<ThemeText style={{ fontSize: 16, color: Colors.dark.textLight }}>
										Servicio: {upcomingAppointment.service.name}
									</ThemeText>
								)}
							</>
						) : (
							<ThemeText
								style={{
									fontSize: 16,
									marginBottom: 5,
									color: Colors.dark.textLight,
								}}
							>
								No tienes citas agendadas
							</ThemeText>
						)}
					</View>

					<View
						style={{
							flex: 1,
							flexDirection: 'row',
							justifyContent: 'space-between',
							marginBottom: 20,
						}}
					>
						<Button onPress={() => router.push('/appoinment')}>
							Agendar cita
						</Button>
						<Button secondary onPress={() => router.push('/appoinment/reschedule')}>
							Reagendar
						</Button>
					</View>

					<AppoinmentRemider />
				</Container>

				<View
					style={{ marginTop: 20, marginBottom: 20, paddingHorizontal: 20 }}
				>
					<ThemeText
						style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 15 }}
					>
						Enlaces
					</ThemeText>
					<Link
						href="/(tabs)/history"
						style={{
							flexDirection: 'row',
							justifyContent: 'space-between',
							alignItems: 'center',
							marginBottom: 15,
						}}
					>
						<ThemeText style={{ fontSize: 16, color: Colors.dark.text }}>
							Mis citas{'  '}
						</ThemeText>
						<ThemeText style={{ fontSize: 20, color: Colors.dark.text }}>
							→
						</ThemeText>
					</Link>

					<Link
						href="/history"
						style={{
							flexDirection: 'row',
							justifyContent: 'space-between',
							alignItems: 'center',
							marginBottom: 15,
						}}
					>
						<ThemeText style={{ fontSize: 16, color: Colors.dark.text }}>
							Historial de citas{'  '}
						</ThemeText>
						<ThemeText style={{ fontSize: 20, color: Colors.dark.text }}>
							→
						</ThemeText>
					</Link>

					<Link
						href="/profile"
						style={{
							flexDirection: 'row',
							justifyContent: 'space-between',
							alignItems: 'center',
							marginBottom: 15,
						}}
					>
						<ThemeText style={{ fontSize: 16, color: Colors.dark.text }}>
							Perfil{'  '}
						</ThemeText>
						<ThemeText style={{ fontSize: 20, color: Colors.dark.text }}>
							→
						</ThemeText>
					</Link>
				</View>
			</ScrollView>
		</SafeAreaView>
	);
}
