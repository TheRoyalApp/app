// React Native core imports
import { StatusBar, View, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Third-party library imports
import { Mail } from 'lucide-react-native';
import { Link, router } from 'expo-router';

// Local imports
import { ThemeText, Container } from '@/components/Themed';
import Button from '@/components/Button';
import AppoinmentRemider from '@/components/ui/AppoinmentReminder';
import Colors from '@/constants/Colors';

export default function HomeScreen() {
	const user = {
		name: 'Mario',
		appoinment: {
			hour: '14:30',
			barber: 'Santiago',
		},
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
							Hola, {user.name}!
						</ThemeText>
						<ThemeText
							style={{
								fontSize: 16,
								marginBottom: 5,
								color: Colors.dark.textLight,
							}}
						>
							Tienes una cita agendada para las {user.appoinment.hour} PM
						</ThemeText>
						<ThemeText style={{ fontSize: 16, color: Colors.dark.textLight }}>
							Tu barbero es: {user.appoinment.barber}
						</ThemeText>
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
						<Button secondary onPress={() => router.push('/appoinment/reschedule')}>Reagendar</Button>
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

				{/* <View style={{ flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', paddingVertical: 10, borderTopWidth: 1, borderTopColor: Colors.dark.gray }}>
        <View style={{ alignItems: 'center' }}>
          <Home color={Colors.dark.primary} size={24} />
          <ThemeText style={{ fontSize: 12, color: Colors.dark.primary }}>Inicio</ThemeText>
        </View>
        <View style={{ alignItems: 'center' }}>
          <History color={Colors.dark.textLight} size={24} />
          <ThemeText style={{ fontSize: 12, color: Colors.dark.textLight }}>Historial</ThemeText>
        </View>
        <View style={{ alignItems: 'center' }}>
          <User color={Colors.dark.textLight} size={24} />
          <ThemeText style={{ fontSize: 12, color: Colors.dark.textLight }}>Perfil</ThemeText>
        </View>
      </View> */}
			</ScrollView>
		</SafeAreaView>
	);
}
