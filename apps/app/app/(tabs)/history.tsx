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
import ScreenWrapper from '@/components/ui/ScreenWrapper';
import AppointmentCard from '@/components/services/AppointmentCard';
import Colors from '@/constants/Colors';
import { AppointmentsService, Appointment } from '@/services';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '@/components/auth/AuthContext';

export default function HistoryScreen() {
	const [appointments, setAppointments] = useState<Appointment[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);
	const { user } = useAuth();

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

	const handleReschedule = (appointment: Appointment) => {
		console.log('🔍 HISTORY RESCHEDULE DEBUG:', { 
			appointmentId: appointment.id,
			appointmentUserId: appointment.userId,
			currentUserId: user?.id,
			appointment,
			user 
		});
		router.push(`/appointment/reschedule/${appointment.id}` as any);
	};

	const handleCancel = async (appointmentId: string) => {
		Alert.alert(
			'Cancelar Cita',
			'¿Estás seguro de que quieres cancelar esta cita?',
			[
				{
					text: 'No',
					style: 'cancel',
				},
				{
					text: 'Sí, Cancelar',
					style: 'destructive',
					onPress: async () => {
						try {
							const response = await AppointmentsService.cancelAppointment(appointmentId);
							
							if (response.success) {
								Alert.alert('Éxito', 'Cita cancelada exitosamente');
								// Reload appointments to reflect the change
								loadAppointments();
							} else {
								Alert.alert('Error', response.error || 'No se pudo cancelar la cita');
							}
						} catch (error) {
							console.error('Error canceling appointment:', error);
							Alert.alert('Error', 'No se pudo cancelar la cita');
						}
					},
				},
			]
		);
	};

	if (isLoading) {
		return (
			<ScreenWrapper>
				<View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
					<ActivityIndicator size="large" color={Colors.dark.primary} />
					<ThemeText style={{ marginTop: 10 }}>Loading appointments...</ThemeText>
				</View>
			</ScreenWrapper>
		);
	}

	return (
		<SafeAreaView style={{ flex: 1, backgroundColor: Colors.dark.background }}>
			<StatusBar barStyle="light-content" />
			<ScrollView
				style={{ flex: 1 }}
				contentContainerStyle={{ paddingHorizontal: 20 }}
				showsVerticalScrollIndicator={false}
				refreshControl={
					<RefreshControl 
						refreshing={refreshing} 
						onRefresh={onRefresh}
						tintColor={Colors.dark.primary}
						colors={[Colors.dark.primary]}
					/>
				}
			>
				<View style={{ paddingTop: 20, marginBottom: 20 }}>
					<ThemeText style={{ fontSize: 24, fontWeight: 'bold' }}>
						Historial
					</ThemeText>
				</View>
				
				<View style={{ gap: 12, paddingBottom: 20 }}>
					{appointments.length === 0 ? (
						<View style={{ alignItems: 'center', paddingVertical: 40 }}>
							<ThemeText style={{ fontSize: 16, color: Colors.dark.textLight, textAlign: 'center' }}>
								No tienes citas agendadas
							</ThemeText>
							<Button
								onPress={() => router.push('/appointment' as any)}
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
										.map(appointment => (
											<AppointmentCard
												key={appointment.id}
												appointment={appointment}
												onReschedule={handleReschedule}
											/>
										))}
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
										.map(appointment => (
											<AppointmentCard
												key={appointment.id}
												appointment={appointment}
												onReschedule={handleReschedule}
											/>
										))}
								</View>
							)}
						</View>
					)}
				</View>
			</ScrollView>
		</SafeAreaView>
	);
}
