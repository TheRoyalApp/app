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

export default function AppointmentScreen() {
	const { user } = useAuth();
	const [services, setServices] = useState<Service[]>([]);
	const [barbers, setBarbers] = useState<Barber[]>([]);
	const [selectedService, setSelectedService] = useState<Service | null>(null);
	const [selectedBarber, setSelectedBarber] = useState<Barber | null>(null);
	const [selectedDate, setSelectedDate] = useState<string>('');
	const [selectedTime, setSelectedTime] = useState<string>('');
	const [paymentType, setPaymentType] = useState<'full' | 'advance'>('full');
	const [isLoading, setIsLoading] = useState(true);
	const [isLoadingBarbers, setIsLoadingBarbers] = useState(false);
	const [isBooking, setIsBooking] = useState(false);
	const [selectedServiceName, setSelectedServiceName] = useState<string | null>(null);
	const [barberError, setBarberError] = useState<string | null>(null);

	
	useEffect(() => {
		loadInitialData();
	}, []);

	// Handle deep links from Stripe checkout and WebBrowser returns
	useEffect(() => {
		const handleUrl = (url: string) => {
			console.log('Received URL:', url);
			
			if (url.includes('app://payment-callback')) {
				// Close any open WebBrowser session
				WebBrowser.dismissBrowser();
				
				// Parse URL parameters
				const urlObj = new URL(url);
				const status = urlObj.searchParams.get('status');
				const timeSlot = urlObj.searchParams.get('timeSlot');
				
				if (status === 'success' && timeSlot) {
					// Format the time for display
					const formatTime = (time: string) => {
						const [hours, minutes] = time.split(':');
						const hour = parseInt(hours);
						const ampm = hour >= 12 ? 'PM' : 'AM';
						const displayHour = hour % 12 || 12;
						return `${displayHour}:${minutes} ${ampm}`;
					};
					
					const formattedTime = formatTime(timeSlot);
					
					Alert.alert(
						'¡Pago Exitoso!',
						`Te esperamos a las: ${formattedTime}`,
						[
							{
								text: 'OK',
								onPress: () => router.replace('/(tabs)'),
							}
						]
					);
				} else {
					Alert.alert(
						'Pago Fallido',
						'El pago no se pudo procesar. Por favor, intenta nuevamente.',
						[
							{
								text: 'OK',
								onPress: () => router.replace('/(tabs)'),
							}
						]
					);
				}
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
			
			// Add timeout to prevent infinite loading
			const timeoutPromise = new Promise((_, reject) => {
				setTimeout(() => reject(new Error('Loading timeout')), 10000);
			});
			
			await Promise.race([
				Promise.allSettled([loadServices(), loadBarbers()]),
				timeoutPromise
			]);
		} catch (error) {
			console.error('Error loading initial data:', error);
			// Don't show alert, just set loading to false
		} finally {
			setIsLoading(false);
		}
	};

	const retryLoadServices = async () => {
		try {
			setServices([]); // Clear existing services
			await loadServices();
		} catch (error) {
			console.error('Error retrying services load:', error);
		}
	};

	const retryLoadBarbers = async () => {
		try {
			setBarbers([]); // Clear existing barbers
			setBarberError(null); // Clear any previous errors
			await loadBarbers();
		} catch (error) {
			console.error('Error retrying barbers load:', error);
		}
	};

	const loadServices = async () => {
		try {
			// Reset services and error state
			setServices([]);
			
			// Use a faster request without retry logic for better UX
			const controller = new AbortController();
			const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout
			
			try {
				const response = await fetch(`${API_CONFIG.baseURL}/services`, {
					method: 'GET',
					headers: {
						'Content-Type': 'application/json',
						'Accept': 'application/json',
					},
					signal: controller.signal,
				});
				
				clearTimeout(timeoutId);
				
				if (!response.ok) {
					let errorMessage = `HTTP ${response.status}`;
					try {
						const errorData = await response.json();
						errorMessage = errorData.message || errorData.error || errorMessage;
					} catch (parseError) {
						// If we can't parse the error response, use the status text
						errorMessage = response.statusText || errorMessage;
					}
					throw new Error(errorMessage);
				}
				
				const data = await response.json();
				
				if (data.success && data.data) {
					setServices(data.data);
				} else {
					console.error('Failed to load services:', data.error);
					// Don't show alert here, let the fallback UI handle it
				}
			} catch (fetchError) {
				clearTimeout(timeoutId);
				throw fetchError;
			}
		} catch (error) {
			console.error('Error loading services:', error);
			// Don't show alert here, let the fallback UI handle it
			// Log the full error for debugging
			if (error instanceof Error) {
				console.log('Services error details:', {
					name: error.name,
					message: error.message,
					stack: error.stack
				});
			}
		}
	};

	const loadBarbers = async () => {
		try {
			setIsLoadingBarbers(true);
			setBarberError(null);
			console.log('Loading barbers...');
			
			// Use a faster request without retry logic for better UX
			const controller = new AbortController();
			const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout
			
			try {
				const response = await fetch(`${API_CONFIG.baseURL}/users/staff`, {
					method: 'GET',
					headers: {
						'Content-Type': 'application/json',
						'Accept': 'application/json',
					},
					signal: controller.signal,
				});
				
				clearTimeout(timeoutId);
				
				if (!response.ok) {
					let errorMessage = `HTTP ${response.status}`;
					try {
						const errorData = await response.json();
						errorMessage = errorData.message || errorData.error || errorMessage;
					} catch (parseError) {
						// If we can't parse the error response, use the status text
						errorMessage = response.statusText || errorMessage;
					}
					throw new Error(errorMessage);
				}
				
				const data = await response.json();
				
				if (data.success && data.data && Array.isArray(data.data)) {
					console.log('Staff users found:', data.data);
					
					if (data.data.length === 0) {
						setBarberError('No hay barberos disponibles en el sistema');
						setBarbers([]);
						setSelectedBarber(null);
						return;
					}
					
					const mappedBarbers = data.data.map((user: any) => ({
						id: user.id,
						name: `${user.firstName} ${user.lastName}`,
						email: user.email,
						firstName: user.firstName,
						lastName: user.lastName
					}));
					
					console.log('Mapped barbers:', mappedBarbers);
					setBarbers(mappedBarbers);
					
					// Auto-select Carlos Rodriguez if available
					const carlos = data.data.find((user: any) => user.email === 'barber@theroyalbarber.com');
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
					} else if (data.data.length > 0) {
						// If Carlos not found, select the first available barber
						const firstBarber = data.data[0];
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
					setBarberError('No se pudieron cargar los barberos. Por favor, intenta nuevamente.');
					setBarbers([]);
					setSelectedBarber(null);
				}
			} catch (fetchError) {
				clearTimeout(timeoutId);
				throw fetchError;
			}
		} catch (error) {
			console.error('Error loading barbers:', error);
			
			// Log detailed error information for debugging
			if (error instanceof Error) {
				console.log('Barbers error details:', {
					name: error.name,
					message: error.message,
					stack: error.stack
				});
			}
			
			if (error instanceof Error) {
				if (error.name === 'AbortError') {
					setBarberError('Tiempo de espera agotado. Por favor, intenta nuevamente.');
				} else if (error.message.includes('Network') || error.message.includes('fetch')) {
					setBarberError('Error de conexión. Por favor, verifica tu internet e intenta nuevamente.');
				} else if (error.message.includes('404') || error.message.includes('not found')) {
					setBarberError('No hay barberos disponibles en el sistema. Por favor, contacta al administrador.');
				} else if (error.message.includes('500') || error.message.includes('server')) {
					setBarberError('Error del servidor. Por favor, intenta más tarde.');
				} else {
					// Limit error message length to prevent truncation
					const errorMsg = error.message.length > 50 ? 
						error.message.substring(0, 50) + '...' : 
						error.message;
					setBarberError(`Error al cargar barberos: ${errorMsg}`);
				}
			} else {
				setBarberError('Error de conexión. Por favor, verifica tu internet e intenta nuevamente.');
			}
			
			setBarbers([]);
			setSelectedBarber(null);
		} finally {
			setIsLoadingBarbers(false);
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
				successUrl: `app://payment-callback?status=success&timeSlot=${selectedTime}&appointmentDate=${formattedDate}`,
				cancelUrl: `app://payment-callback?status=cancel&timeSlot=${selectedTime}&appointmentDate=${formattedDate}`,
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
					// User closed the browser - payment callback will handle the result
					console.log('Payment browser dismissed - callback will handle result');
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

	// Show fallback when no data is available
	if (services.length === 0 && barbers.length === 0) {
		return (
			<ScreenWrapper>
				<View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
					<ThemeText style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10, textAlign: 'center' }}>
						No hay datos disponibles
					</ThemeText>
					<ThemeText style={{ marginBottom: 20, textAlign: 'center', color: Colors.dark.textLight }}>
						No se pudieron cargar los servicios o barberos. Esto puede deberse a:
					</ThemeText>
					<View style={{ marginBottom: 20, paddingHorizontal: 20 }}>
						<ThemeText style={{ marginBottom: 8, color: Colors.dark.textLight, fontSize: 14 }}>
							• Problemas de conexión a internet
						</ThemeText>
						<ThemeText style={{ marginBottom: 8, color: Colors.dark.textLight, fontSize: 14 }}>
							• Servicios temporalmente no disponibles
						</ThemeText>
						<ThemeText style={{ marginBottom: 8, color: Colors.dark.textLight, fontSize: 14 }}>
							• No hay barberos activos en el sistema
						</ThemeText>
					</View>
					<Button onPress={() => loadInitialData()} style={{ marginBottom: 10 }}>
						Reintentar
					</Button>
					<Button secondary onPress={() => router.back()}>
						Volver
					</Button>
				</View>
			</ScreenWrapper>
		);
	}

	// Show specific error when only services are missing
	if (services.length === 0 && barbers.length > 0) {
		return (
			<ScreenWrapper>
				<View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
					<ThemeText style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10, textAlign: 'center' }}>
						No hay servicios disponibles
					</ThemeText>
					<ThemeText style={{ marginBottom: 20, textAlign: 'center', color: Colors.dark.textLight }}>
						No se pudieron cargar los servicios. Por favor, contacta al administrador o intenta más tarde.
					</ThemeText>
					<Button onPress={() => retryLoadServices()} style={{ marginBottom: 10 }}>
						Reintentar
					</Button>
					<Button secondary onPress={() => router.back()}>
						Volver
					</Button>
				</View>
			</ScreenWrapper>
		);
	}

	// Show specific error when only barbers are missing
	if (barbers.length === 0 && services.length > 0) {
		return (
			<ScreenWrapper>
				<View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
					<ThemeText style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10, textAlign: 'center' }}>
						No hay barberos disponibles
					</ThemeText>
					<ThemeText style={{ marginBottom: 20, textAlign: 'center', color: Colors.dark.textLight }}>
						{barberError || 'No hay barberos activos en el sistema. Esto puede deberse a:'}
					</ThemeText>
					{!barberError && (
						<View style={{ marginBottom: 20, paddingHorizontal: 20 }}>
							<ThemeText style={{ marginBottom: 8, color: Colors.dark.textLight, fontSize: 14 }}>
								• No hay barberos registrados en el sistema
							</ThemeText>
							<ThemeText style={{ marginBottom: 8, color: Colors.dark.textLight, fontSize: 14 }}>
								• Los barberos no están activos
							</ThemeText>
							<ThemeText style={{ marginBottom: 8, color: Colors.dark.textLight, fontSize: 14 }}>
								• Problemas de configuración del sistema
							</ThemeText>
						</View>
					)}
					<Button onPress={() => retryLoadBarbers()} style={{ marginBottom: 10 }} disabled={isLoadingBarbers}>
						{isLoadingBarbers ? 'Cargando...' : 'Reintentar'}
					</Button>
					<Button secondary onPress={() => router.back()}>
						Volver
					</Button>
				</View>
			</ScreenWrapper>
		);
	}

	return (
		<ScreenWrapper showBottomFade={true} showTopFade={false}>
			{/* Header with back button */}
			<View style={{ 
				flexDirection: 'row', 
				alignItems: 'center', 
				paddingHorizontal: 20, 
				paddingVertical: 15,
				borderBottomWidth: 1,
				borderBottomColor: Colors.dark.gray
			}}>
				<Pressable 
					onPress={() => router.back()}
					style={{ 
						padding: 8,
						marginRight: 15
					}}
				>
					<ThemeText style={{ fontSize: 18 }}>←</ThemeText>
				</Pressable>
				<ThemeText style={{ fontSize: 20, fontWeight: 'bold' }}>
					Agendar Cita
				</ThemeText>
			</View>
			
			<ScrollView>
				<Container style={{ paddingBottom: 30 }}>
					{/* Remove the duplicate title since we now have a header */}
					{/* <ThemeText style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20 }}>
						Agendar Cita
					</ThemeText> */}

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
								{isLoadingBarbers ? (
									<>
										<ActivityIndicator size="small" color={Colors.dark.primary} style={{ marginBottom: 10 }} />
										<ThemeText style={{ 
											textAlign: 'center', 
											color: Colors.dark.textLight,
											marginBottom: 5
										}}>
											Cargando barberos...
										</ThemeText>
									</>
								) : (
									<>
										<ThemeText style={{ 
											textAlign: 'center', 
											color: Colors.dark.textLight,
											marginBottom: 5
										}}>
											{barberError || 'No hay barberos disponibles'}
										</ThemeText>
										<ThemeText style={{ 
											textAlign: 'center', 
											color: Colors.dark.textLight,
											fontSize: 12,
											marginBottom: 10
										}}>
											Por favor contacta al administrador
										</ThemeText>
										<Button 
											onPress={() => retryLoadBarbers()} 
											style={{ marginTop: 5 }}
											secondary
											disabled={isLoadingBarbers}
										>
											{isLoadingBarbers ? 'Cargando...' : 'Reintentar'}
										</Button>
									</>
								)}
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
