// React core imports
import React, { useState, useEffect } from 'react';

// React Native core imports
import { StatusBar, View, FlatList, ScrollView, Alert, ActivityIndicator, Pressable, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as WebBrowser from 'expo-web-browser';

// Third-party library imports
import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';

// Local imports
import { ThemeText, Container } from '@/components/Themed';
import Button from '@/components/Button';
import ServiceCard from '@/components/services/Card';
import AppointmentDatePicker from '@/components/ui/AppointmentDatePicker';
import ScreenWrapper from '@/components/ui/ScreenWrapper';
import Colors from '@/constants/Colors';
import { haircuts, spa, ServiceInterface } from '@/constants/services';
import { router, Stack } from 'expo-router';
import { useAuth } from '@/components/auth/AuthContext';
import { ServicesService, AppointmentsService, PaymentsService, apiClient } from '@/services';
import { Service, CreateAppointmentData } from '@/services';
import { API_CONFIG } from '@/config/api';

interface Barber {
	id: string;
	name: string;
	email: string;
	firstName: string;
	lastName: string;
}

export default function AppoinmentScreen() {
	const { user } = useAuth();
	const [services, setServices] = useState<Service[]>([]);
	const [barbers, setBarbers] = useState<Barber[]>([]);
	const [selectedService, setSelectedService] = useState<Service | null>(null);
	const [selectedBarber, setSelectedBarber] = useState<Barber | null>(null);
	const [selectedDate, setSelectedDate] = useState<string>('');
	const [selectedTime, setSelectedTime] = useState<string>('');
	const [paymentType, setPaymentType] = useState<'full' | 'advance'>('full');
	const [isLoading, setIsLoading] = useState(true);
	const [isBooking, setIsBooking] = useState(false);
	const [selectedServiceName, setSelectedServiceName] = useState<string | null>(null);

	
	useEffect(() => {
		loadInitialData();
	}, []);

	// Handle deep links from Stripe checkout and WebBrowser returns
	useEffect(() => {
		const handleUrl = (url: string) => {
			console.log('Received URL:', url);
			
			if (url.includes('app://payment/success')) {
				// Close any open WebBrowser session
				WebBrowser.dismissBrowser();
				
				Alert.alert(
					'¡Pago Exitoso!',
					'Tu pago se ha procesado correctamente. Tu cita ha sido confirmada automáticamente.',
					[
						{
							text: 'Ver Historial',
							onPress: () => router.push('/(tabs)/history'),
						},
						{
							text: 'Ir al Inicio',
							onPress: () => router.push('/(tabs)'),
						},
					]
				);
			} else if (url.includes('app://payment/cancel')) {
				// Close any open WebBrowser session
				WebBrowser.dismissBrowser();
				
				Alert.alert(
					'Pago Cancelado',
					'El pago fue cancelado. Tu cita no ha sido reservada. Puedes intentar nuevamente.',
					[
						{
							text: 'OK',
							style: 'default',
						},
					]
				);
			}
		};

		const subscription = Linking.addEventListener('url', ({ url }) => {
			handleUrl(url);
		});

		// Check if app was opened from a URL
		Linking.getInitialURL().then((url) => {
			if (url) {
				handleUrl(url);
			}
		});

		return () => subscription?.remove();
	}, []);

	const loadInitialData = async () => {
		try {
			setIsLoading(true);
			await Promise.all([loadServices(), loadBarbers()]);
		} catch (error) {
			console.error('Error loading initial data:', error);
			Alert.alert('Error', 'Failed to load data');
		} finally {
			setIsLoading(false);
		}
	};

	const loadServices = async () => {
		try {
			const response = await ServicesService.getActiveServices();
			
			if (response.success && response.data) {
				setServices(response.data);
			} else {
				Alert.alert('Error', 'Failed to load services');
			}
		} catch (error) {
			console.error('Error loading services:', error);
			Alert.alert('Error', 'Failed to load services');
		}
	};

	const loadBarbers = async () => {
		try {
			console.log('Loading barbers...');
			// Use the new public staff endpoint
			const response = await apiClient.get('/users/staff');
			console.log('Barbers API response:', response);
			
			if (response.success && response.data && Array.isArray(response.data)) {
				console.log('Staff users found:', response.data);
				
				const mappedBarbers = response.data.map((user: any) => ({
					id: user.id,
					name: `${user.firstName} ${user.lastName}`,
					email: user.email,
					firstName: user.firstName,
					lastName: user.lastName
				}));
				
				console.log('Mapped barbers:', mappedBarbers);
				setBarbers(mappedBarbers);
				
				// Auto-select Carlos Rodriguez if available
				const carlos = response.data.find((user: any) => user.email === 'barber@theroyalbarber.com');
				if (carlos) {
					const selectedCarlos = {
						id: carlos.id,
						name: `${carlos.firstName} ${carlos.lastName}`,
						email: carlos.email,
						firstName: carlos.firstName,
						lastName: carlos.lastName
					};
					console.log('Auto-selecting Carlos:', selectedCarlos);
					setSelectedBarber(selectedCarlos);
				} else if (response.data.length > 0) {
					// If Carlos not found, select the first available barber
					const firstBarber = response.data[0];
					const selectedFirstBarber = {
						id: firstBarber.id,
						name: `${firstBarber.firstName} ${firstBarber.lastName}`,
						email: firstBarber.email,
						firstName: firstBarber.firstName,
						lastName: firstBarber.lastName
					};
					console.log('Auto-selecting first barber:', selectedFirstBarber);
					setSelectedBarber(selectedFirstBarber);
				}
			} else {
				console.log('API response failed or no data');
				setBarbers([]);
				setSelectedBarber(null);
			}
		} catch (error) {
			console.error('Error loading barbers:', error);
			setBarbers([]);
			setSelectedBarber(null);
		}
	};

	const handleDateSelect = (date: string) => {
		setSelectedDate(date);
	};

	const handleTimeSelect = (time: string) => {
		setSelectedTime(time);
	};

	const handleServiceSelect = (service: Service) => {
		setSelectedService(service);
		setSelectedServiceName(service.name);
	};

	const handleBooking = async () => {
		
		if (!user?.id) {
			Alert.alert('Error', 'Please log in to book an appointment');
			return;
		}

		if (!selectedService || !selectedDate || !selectedTime || !selectedBarber) {
			Alert.alert('Error', 'Please select a barber, service, date, and time');
			return;
		}

		try {
			setIsBooking(true);
			
			// Format date for API (expects dd/mm/yyyy format)
			const dateObj = new Date(selectedDate);
			const formattedDate = `${dateObj.getDate().toString().padStart(2, '0')}/${(dateObj.getMonth() + 1).toString().padStart(2, '0')}/${dateObj.getFullYear()}`;
			
			// Create checkout session data
			const checkoutData = {
				serviceId: selectedService.id,
				paymentType: paymentType,
				successUrl: 'app://payment/success',
				cancelUrl: 'app://payment/cancel',
				userId: user.id,
				appointmentData: {
					barberId: selectedBarber.id,
					appointmentDate: formattedDate,
					timeSlot: selectedTime,
					notes: undefined
				}
			};

			console.log('Creating checkout session with data:', checkoutData);
			
			const response = await PaymentsService.createCheckoutSession(checkoutData);
			
			if (response.success && response.data) {
				console.log('Checkout session created, opening in-app browser:', response.data.url);
				
				// Open Stripe checkout URL in in-app browser
				const result = await WebBrowser.openBrowserAsync(response.data.url, {
					presentationStyle: WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN,
					showTitle: true,
					enableBarCollapsing: true,
					showInRecents: false,
					toolbarColor: Colors.dark.background,
					controlsColor: Colors.dark.primary,
					dismissButtonStyle: 'cancel',
					createTask: false,
				});
				
				console.log('WebBrowser result:', result);
				
				// Handle the browser result
				if (result.type === 'cancel') {
					Alert.alert(
						'Pago Cancelado',
						'El pago fue cancelado. Tu cita no ha sido reservada. Puedes intentar nuevamente.',
						[{ text: 'OK', style: 'default' }]
					);
				} else if (result.type === 'dismiss') {
					// User closed the browser - check if payment was successful
					// Wait a moment for the webhook to process, then check for recent appointments
					setTimeout(async () => {
						try {
							// Check if there are any recent appointments for this user
							const appointmentsResponse = await AppointmentsService.getUserAppointments();
							
							if (appointmentsResponse.success && appointmentsResponse.data) {
								const recentAppointments = appointmentsResponse.data.filter((apt: any) => {
									// Handle dd/mm/yyyy format from API
									let aptDate: Date;
									if (apt.appointmentDate.includes('/')) {
										const [day, month, year] = apt.appointmentDate.split('/');
										aptDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
									} else {
										aptDate = new Date(apt.appointmentDate);
									}
									const today = new Date();
									return aptDate >= today;
								});
								
								if (recentAppointments && recentAppointments.length > 0) {
									// Payment was successful - appointment was created
									Alert.alert(
										'¡Pago Exitoso!',
										'Tu pago se ha procesado correctamente. Tu cita ha sido confirmada automáticamente.',
										[
											{
												text: 'Ver Historial',
												onPress: () => router.push('/(tabs)/history'),
											},
											{
												text: 'Ir al Inicio',
												onPress: () => router.push('/(tabs)'),
											},
										]
									);
								} else {
									// No recent appointments found - payment might have failed
									Alert.alert(
										'Verificando Pago',
										'No se encontró una cita reciente. El pago podría estar procesándose o haber fallado.',
										[
											{
												text: 'Ver Historial',
												onPress: () => router.push('/(tabs)/history'),
											},
											{
												text: 'Intentar Nuevamente',
												onPress: () => handleBooking(),
											},
											{
												text: 'OK',
												style: 'default',
											},
										]
									);
								}
							} else {
								// Could not verify payment status
								Alert.alert(
									'Verificando Pago',
									'No se pudo verificar el estado del pago. Revisa tu historial para confirmar.',
									[
										{
											text: 'Ver Historial',
											onPress: () => router.push('/(tabs)/history'),
										},
										{
											text: 'OK',
											style: 'default',
										},
									]
								);
							}
						} catch (error) {
							console.error('Error checking payment status:', error);
							Alert.alert(
								'Verificando Pago',
								'No se pudo verificar el estado del pago. Revisa tu historial para confirmar.',
								[
									{
										text: 'Ver Historial',
										onPress: () => router.push('/(tabs)/history'),
									},
									{
										text: 'OK',
										style: 'default',
									},
								]
							);
						}
					}, 2000); // Wait 2 seconds for webhook to process
				}
			} else {
				Alert.alert('Error', response.error || 'Failed to create payment session');
			}
		} catch (error) {
			console.error('Error creating payment session:', error);
			Alert.alert('Error', 'Failed to create payment session');
		} finally {
			setIsBooking(false);
		}
	};

	const formatTime = (time: string) => {
		const [hours, minutes] = time.split(':');
		const hour = parseInt(hours);
		const ampm = hour >= 12 ? 'PM' : 'AM';
		const displayHour = hour % 12 || 12;
		return `${displayHour}:${minutes} ${ampm}`;
	};

	const formatPrice = (price: string | number) => {
		const numericPrice = typeof price === 'string' ? parseFloat(price) : price;
		return new Intl.NumberFormat('es-MX', {
			style: 'currency',
			currency: 'MXN',
		}).format(numericPrice);
	};

	if (isLoading) {
		return (
			<ScreenWrapper>
				<View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
					<ActivityIndicator size="large" color={Colors.dark.primary} />
					<ThemeText style={{ marginTop: 10 }}>Loading services...</ThemeText>
				</View>
			</ScreenWrapper>
		);
	}

	return (
		<ScreenWrapper showBottomFade={true} showTopFade={false}>
			<ScrollView>
				<Container style={{ paddingBottom: 30 }}>
					<ThemeText style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20 }}>
						Agendar Cita
					</ThemeText>

					{/* Barber Selection */}
					<View style={{ marginBottom: 30 }}>
						<ThemeText style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 15 }}>
							Seleccionar Barbero
						</ThemeText>
						{/* Debug info */}
						<ThemeText style={{ fontSize: 12, color: Colors.dark.textLight, marginBottom: 10 }}>
							Debug: {barbers.length} barbers loaded, Selected: {selectedBarber?.name || 'None'}
						</ThemeText>
						
						{barbers.length === 0 ? (
							<View style={{ 
								padding: 20, 
								backgroundColor: Colors.dark.gray, 
								borderRadius: 10,
								alignItems: 'center'
							}}>
								<ThemeText style={{ 
									textAlign: 'center', 
									color: Colors.dark.textLight,
									marginBottom: 5
								}}>
									No hay barberos disponibles
								</ThemeText>
								<ThemeText style={{ 
									textAlign: 'center', 
									color: Colors.dark.textLight,
									fontSize: 12
								}}>
									Por favor contacta al administrador
								</ThemeText>
							</View>
						) : (
							<ScrollView 
								horizontal 
								showsHorizontalScrollIndicator={false}
								contentContainerStyle={{ paddingHorizontal: 5 }}
							>
								{barbers.map((barber, index) => (
									<Pressable
										key={barber.id}
										onPress={() => {
											setSelectedBarber(barber);
											// Reset date and time when barber changes
											setSelectedDate('');
											setSelectedTime('');
										}}
										style={{
											width: 120,
											marginRight: index === barbers.length - 1 ? 0 : 15,
											padding: 15,
											backgroundColor: selectedBarber?.id === barber.id ? Colors.dark.primary : Colors.dark.background,
											borderColor: selectedBarber?.id === barber.id ? Colors.dark.primary : Colors.dark.gray,
											borderWidth: 1,
											borderRadius: 10,
											alignItems: 'center'
										}}
									>
										<View style={{
											width: 50,
											height: 50,
											borderRadius: 25,
											backgroundColor: selectedBarber?.id === barber.id ? 'rgba(255,255,255,0.2)' : Colors.dark.gray,
											justifyContent: 'center',
											alignItems: 'center',
											marginBottom: 8
										}}>
											<ThemeText style={{ 
												fontSize: 18, 
												fontWeight: 'bold',
												color: selectedBarber?.id === barber.id ? Colors.dark.background : Colors.dark.text
											}}>
												{barber.firstName.charAt(0)}{barber.lastName.charAt(0)}
											</ThemeText>
										</View>
										<ThemeText style={{ 
											fontSize: 12, 
											fontWeight: '600',
											textAlign: 'center',
											color: selectedBarber?.id === barber.id ? Colors.dark.background : Colors.dark.text
										}}>
											{barber.firstName}
										</ThemeText>
										<ThemeText style={{ 
											fontSize: 12, 
											textAlign: 'center',
											color: selectedBarber?.id === barber.id ? Colors.dark.background : Colors.dark.text
										}}>
											{barber.lastName}
										</ThemeText>
									</Pressable>
								))}
							</ScrollView>
						)}
					</View>

					{/* Services Section - Fixed Height Vertical Scroll */}
					<View style={{ marginBottom: 30 }}>
						<ThemeText style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 15 }}>
							Seleccionar Servicio
						</ThemeText>
						<ScrollView 
							showsVerticalScrollIndicator={false}
							style={{ 
								height: 220, // Fixed height to maintain layout
								borderRadius: 10,
								backgroundColor: 'rgba(255, 255, 255, 0.05)'
							}}
							contentContainerStyle={{ 
								padding: 10,
								gap: 12 
							}}
						>
							{services.map((service) => (
								<ServiceCard
									key={service.id}
									title={service.name}
									price={service.price}
									description={service.description || ''}
									selected={[selectedServiceName, (serviceName) => {
										setSelectedServiceName(serviceName);
										if (serviceName) {
											const foundService = services.find(s => s.name === serviceName);
											setSelectedService(foundService || null);
										} else {
											setSelectedService(null);
										}
									}]}
								/>
							))}
						</ScrollView>
					</View>

					{/* Payment Type Selection */}
					{selectedService && (
						<View style={{ marginBottom: 30 }}>
							<ThemeText style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 15 }}>
								Tipo de Pago
							</ThemeText>
							<View style={{ flexDirection: 'row', gap: 15 }}>
								<Pressable
									onPress={() => setPaymentType('full')}
									style={{
										flex: 1,
										padding: 15,
										backgroundColor: paymentType === 'full' ? Colors.dark.primary : Colors.dark.background,
										borderColor: paymentType === 'full' ? Colors.dark.primary : Colors.dark.gray,
										borderWidth: 1,
										borderRadius: 10,
										alignItems: 'center'
									}}
								>
									<ThemeText style={{ 
										fontSize: 16, 
										fontWeight: '600',
										color: paymentType === 'full' ? Colors.dark.background : Colors.dark.text,
										marginBottom: 5
									}}>
										Pago Completo
									</ThemeText>
									<ThemeText style={{ 
										fontSize: 14,
										color: paymentType === 'full' ? Colors.dark.background : Colors.dark.textLight
									}}>
										{formatPrice(selectedService.price)}
									</ThemeText>
								</Pressable>
								
								<Pressable
									onPress={() => setPaymentType('advance')}
									style={{
										flex: 1,
										padding: 15,
										backgroundColor: paymentType === 'advance' ? Colors.dark.primary : Colors.dark.background,
										borderColor: paymentType === 'advance' ? Colors.dark.primary : Colors.dark.gray,
										borderWidth: 1,
										borderRadius: 10,
										alignItems: 'center'
									}}
								>
									<ThemeText style={{ 
										fontSize: 16, 
										fontWeight: '600',
										color: paymentType === 'advance' ? Colors.dark.background : Colors.dark.text,
										marginBottom: 5
									}}>
										Anticipo (50%)
									</ThemeText>
									<ThemeText style={{ 
										fontSize: 14,
										color: paymentType === 'advance' ? Colors.dark.background : Colors.dark.textLight
									}}>
										{formatPrice(parseFloat(selectedService.price) * 0.5)}
									</ThemeText>
								</Pressable>
							</View>
							<ThemeText style={{ 
								fontSize: 12, 
								color: Colors.dark.textLight,
								textAlign: 'center',
								marginTop: 10
							}}>
								{paymentType === 'advance' 
									? 'Pagarás el resto del servicio en la barbería'
									: 'Pago completo del servicio'
								}
							</ThemeText>
						</View>
					)}

					{/* Date and Time Selection */}
					<View style={{ marginBottom: 30 }}>
						{selectedBarber && (
							<AppointmentDatePicker
								barberId={selectedBarber.id}
								onDateSelect={setSelectedDate}
								onTimeSelect={setSelectedTime}
								showConfirmButton={false}
								showSummary={false}
								title="Seleccionar Fecha y Hora"
								subtitle="Elige la fecha y hora de tu cita"
							/>
						)}
						{!selectedBarber && (
							<View style={{ padding: 15, backgroundColor: Colors.dark.gray, borderRadius: 10 }}>
								<ThemeText style={{ textAlign: 'center', color: Colors.dark.textLight }}>
									Por favor selecciona un barbero primero
								</ThemeText>
							</View>
						)}
					</View>

					{/* Booking Summary */}
					{selectedBarber && selectedService && selectedDate && selectedTime && (
						<View style={{ marginBottom: 30, padding: 15, backgroundColor: Colors.dark.gray, borderRadius: 10 }}>
							<ThemeText style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>
								Resumen de la Cita
							</ThemeText>
							<ThemeText style={{ marginBottom: 5 }}>
								Barbero: {selectedBarber.name}
							</ThemeText>
							<ThemeText style={{ marginBottom: 5 }}>
								Servicio: {selectedService.name}
							</ThemeText>
							<ThemeText style={{ marginBottom: 5 }}>
								Precio del servicio: {formatPrice(selectedService.price)}
							</ThemeText>
							<ThemeText style={{ marginBottom: 5, fontWeight: '600', color: Colors.dark.primary }}>
								Monto a pagar: {paymentType === 'full' 
									? formatPrice(selectedService.price)
									: formatPrice(parseFloat(selectedService.price) * 0.5)
								} ({paymentType === 'full' ? 'Pago completo' : 'Anticipo 50%'})
							</ThemeText>
							<ThemeText style={{ marginBottom: 5 }}>
								Duración: {selectedService.duration} minutos
							</ThemeText>
							<ThemeText style={{ marginBottom: 5 }}>
								Fecha: {new Date(selectedDate).toLocaleDateString('es-ES')}
							</ThemeText>
							<ThemeText>
								Hora: {formatTime(selectedTime)}
							</ThemeText>
							{paymentType === 'advance' && (
								<View style={{ 
									marginTop: 10, 
									padding: 10, 
									backgroundColor: 'rgba(255, 193, 7, 0.1)', 
									borderRadius: 5,
									borderLeftWidth: 3,
									borderLeftColor: '#ffc107'
								}}>
									<ThemeText style={{ fontSize: 12, color: '#ffc107', fontWeight: '500' }}>
										💡 Recordatorio: Pagarás el resto ({formatPrice(parseFloat(selectedService.price) * 0.5)}) en la barbería
									</ThemeText>
								</View>
							)}
						</View>
					)}

					{/* Payment Info */}
					{selectedBarber && selectedService && selectedDate && selectedTime && (
						<View style={{ 
							marginBottom: 20, 
							padding: 12, 
							backgroundColor: 'rgba(75, 181, 67, 0.1)', 
							borderRadius: 8,
							borderLeftWidth: 3,
							borderLeftColor: '#4bb543'
						}}>
							<ThemeText style={{ fontSize: 12, color: '#4bb543', fontWeight: '500' }}>
								🔒 Pago seguro con Stripe • Tu cita se confirmará automáticamente
							</ThemeText>
						</View>
					)}

					{/* Book Button */}
					<Button
						onPress={handleBooking}
						disabled={!selectedBarber || !selectedService || !selectedDate || !selectedTime || isBooking}
						style={{ marginBottom: 20 }}
					>
						{isBooking ? 'Creando sesión de pago...' : '💳 Pagar y Reservar'}
					</Button>

					<Button secondary onPress={() => router.back()}>
						Cancelar
					</Button>
				</Container>
			</ScrollView>
		</ScreenWrapper>
	);
}
