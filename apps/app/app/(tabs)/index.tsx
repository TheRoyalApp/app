// React Native core imports
import React from 'react';
import { View, ScrollView, Alert, RefreshControl } from 'react-native';
import { useState, useCallback, useEffect } from 'react';

// Third-party library imports
import { Link, router, useFocusEffect } from 'expo-router';

// Local imports
import { ThemeText, Container } from '@/components/Themed';
import Button from '@/components/Button';
import AppointmentReminder from '@/components/ui/AppoinmentReminder';
import ScreenWrapper from '@/components/ui/ScreenWrapper';
import Colors from '@/constants/Colors';
import { useAuth } from '@/components/auth/AuthContext';
import { AppointmentsService, Appointment } from '@/services';

export default function HomeScreen() {
	const { user, clearStorage } = useAuth();
	const [upcomingAppointment, setUpcomingAppointment] = useState<Appointment | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [refreshing, setRefreshing] = useState(false);
	const [response, setResponse] = useState<any>(null);
	const [hasAttemptedFetch, setHasAttemptedFetch] = useState(false);

	if (__DEV__) {
		console.log('🏠 HomeScreen rendered. User:', user?.name || 'No user', 'Loading:', isLoading, 'HasAttemptedFetch:', hasAttemptedFetch);
	}

	// Effect to handle initial load and user state changes
	useEffect(() => {
		if (user && !hasAttemptedFetch) {
			if (__DEV__) {
				console.log('🎯 User available, attempting initial fetch');
			}
			fetchUpcomingAppointment();
			setHasAttemptedFetch(true);
		} else if (!user && hasAttemptedFetch) {
			// Reset state when user becomes unavailable
			setUpcomingAppointment(null);
			setHasAttemptedFetch(false);
			setIsLoading(false);
		}
	}, [user, hasAttemptedFetch]);

	useFocusEffect(
		useCallback(() => {
			if (__DEV__) {
				console.log('🎯 useFocusEffect triggered - user:', user?.name || 'No user');
			}
			
			// Only fetch if user is available and we haven't attempted yet
			if (user && !hasAttemptedFetch) {
				fetchUpcomingAppointment();
				setHasAttemptedFetch(true);
			}
		}, [user, hasAttemptedFetch])
	);

	const fetchUpcomingAppointment = async () => {
		try {
			setIsLoading(true);
			if (__DEV__) {
				console.log('🔄 Fetching appointments...');
				console.log('👤 Current user:', user);
			}

			if (!user) {
				if (__DEV__) {
					console.log('❌ No user authenticated - skipping API call');
				}
				setUpcomingAppointment(null);
				setIsLoading(false);
				return;
			}

			const response = await AppointmentsService.getUserAppointments();

			if (__DEV__) {
				console.log('📊 API Response:', {
					success: response.success,
					dataLength: response.data?.length || 0,
					error: response.error,
					rawData: response.data
				});
			}

			if (response.success && response.data && response.data.length > 0) {
				if (__DEV__) {
					console.log('📋 Raw API data structure:', response.data[0]);
					console.log('📊 All appointments received:', response.data.length);
					response.data.forEach((apt: any, index) => {
						console.log(`📋 Appointment ${index + 1}:`, {
							id: apt.id,
							date: apt.appointmentDate,
							time: apt.timeSlot,
							status: apt.status,
							service: apt.serviceName || apt.service?.name,
							barber: apt.barberName || apt.barber?.name
						});
					});
				}

				// Filter upcoming appointments (confirmed or pending status, and future dates)
				const upcomingAppointments = response.data
					.filter(appointment => {
						// Only include confirmed or pending
						if (!['confirmed', 'pending'].includes(appointment.status)) return false;

						// Combine appointment date and time for accurate comparison
						const appointmentDate = new Date(appointment.appointmentDate);
						const [hours, minutes] = appointment.timeSlot.split(':');
						appointmentDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);

						const now = new Date();

						// Temporarily include appointments from today for testing
						const today = new Date();
						today.setHours(0, 0, 0, 0);
						const appointmentDateOnly = new Date(appointmentDate);
						appointmentDateOnly.setHours(0, 0, 0, 0);

						const isFuture = appointmentDate > now || appointmentDateOnly.getTime() === today.getTime();
						if (__DEV__ && !isFuture) {
							console.log('❌ Filtered out - not future. Appointment:', {
								id: appointment.id,
								appointmentDateTime: appointmentDate.toString(),
								now: now.toString(),
								status: appointment.status,
								rawDate: appointment.appointmentDate,
								timeSlot: appointment.timeSlot,
								combinedDateTime: appointmentDate.toString()
							});
						} else if (__DEV__) {
							console.log('✅ Future appointment found:', {
								id: appointment.id,
								appointmentDateTime: appointmentDate.toString(),
								now: now.toString(),
								status: appointment.status,
								timeSlot: appointment.timeSlot
							});
						}
						return isFuture;
					})
					.sort((a, b) => new Date(a.appointmentDate).getTime() - new Date(b.appointmentDate).getTime());

				if (__DEV__) {
					console.log('✅ Filtered upcoming appointments:', upcomingAppointments.length, upcomingAppointments);
				}

				// Get the next upcoming appointment
				if (upcomingAppointments.length > 0) {
					if (__DEV__) {
						console.log('🎯 Next appointment:', upcomingAppointments[0]);
					}
					setUpcomingAppointment(upcomingAppointments[0]);
				} else {
					if (__DEV__) {
						console.log('❌ No upcoming appointments found');
					}
					setUpcomingAppointment(null);
				}
			} else {
				if (__DEV__) {
					console.log('❌ No appointments data or API failed');
				}
				setUpcomingAppointment(null);
			}
			setResponse(response);
		} catch (error) {
			if (__DEV__) {
				console.error('Error fetching upcoming appointment:', error);
			}
			Alert.alert('Error', 'Failed to load appointment data');
		} finally {
			setIsLoading(false);
		}
	};

	const onRefresh = useCallback(async () => {
		setRefreshing(true);
		await fetchUpcomingAppointment();
		setRefreshing(false);
	}, []);

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
				weekday: 'long',
				year: 'numeric',
				month: 'long',
				day: 'numeric',
			});
		} else {
			// Fallback to standard date parsing
			const date = new Date(dateString);
			return date.toLocaleDateString('es-ES', {
				weekday: 'long',
				year: 'numeric',
				month: 'long',
				day: 'numeric',
			});
		}
	};

	return (
		<ScreenWrapper showBottomFade={true} showTopFade={false} isLoading={isLoading}>
			<ScrollView
				refreshControl={
					<RefreshControl
						refreshing={refreshing}
						onRefresh={onRefresh}
						tintColor={Colors.dark.primary}
						colors={[Colors.dark.primary]}
					/>
				}
			>
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
				</View>

				<Container>
					<View style={{ marginBottom: 20 }}>
						<ThemeText
							style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 5 }}
						>
							Hola, {user?.firstName || 'Usuario'}!
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
						<Button onPress={() => router.push('/appointment')}>
							Agendar cita
						</Button>
						<Button
							secondary
							disabled={!upcomingAppointment}
							onPress={() => {
								console.log('🔍 RESCHEDULE BUTTON CLICKED');
								console.log('upcomingAppointment:', upcomingAppointment);
								console.log('user:', user);

								if (upcomingAppointment) {
									console.log('🔍 RESCHEDULE NAVIGATION DEBUG:', {
										appointmentId: upcomingAppointment.id,
										appointmentUserId: upcomingAppointment.userId,
										currentUserId: user?.id,
										appointment: upcomingAppointment
									});

									try {
										// Add a small delay to show button press feedback
										setTimeout(() => {
											console.log('🚀 Navigating to reschedule page...');
											router.push(`/appointment/reschedule/${upcomingAppointment.id}`);
										}, 100);
									} catch (error) {
										console.error('❌ Navigation error:', error);
										Alert.alert('Error', 'No se pudo abrir la página de reprogramación');
									}
								} else {
									console.log('❌ No appointment available for reschedule');
									Alert.alert('Sin citas', 'No tienes citas disponibles para reprogramar');
								}
							}}
						>
							{upcomingAppointment ? 'Reagendar' : 'Sin citas'}
						</Button>
					</View>

					<AppointmentReminder appointment={upcomingAppointment} />
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

					{/* Admin Panel link - only visible for admin/staff users */}
					{user && (user.isAdmin === true || user.role === 'staff') && (
						<Link
							href="/admin"
							style={{
								flexDirection: 'row',
								justifyContent: 'space-between',
								alignItems: 'center',
								marginBottom: 15,
								backgroundColor: Colors.dark.primary + '20',
								padding: 10,
								borderRadius: 8,
								borderLeftWidth: 3,
								borderLeftColor: Colors.dark.primary,
							}}
						>
							<ThemeText style={{ fontSize: 16, color: Colors.dark.primary, fontWeight: '600' }}>
								Panel de Administración{'  '}
							</ThemeText>
							<ThemeText style={{ fontSize: 20, color: Colors.dark.primary }}>
								→
							</ThemeText>
						</Link>
					)}
				</View>
			</ScrollView>
		</ScreenWrapper>
	);
}
