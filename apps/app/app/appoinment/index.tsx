// React core imports
import { useState, useEffect } from 'react';

// React Native core imports
import { StatusBar, View, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Third-party library imports
import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';

// Local imports
import { ThemeText, Container } from '@/components/Themed';
import Button from '@/components/Button';
import ServiceCard from '@/components/services/Card';
import Colors from '@/constants/Colors';
import { haircuts, spa, ServiceInterface } from '@/constants/services';
import { router, Stack } from 'expo-router';
import { useAuth } from '@/components/auth/AuthContext';

export default function AppoinmentScreen() {
	const [mode, setMode] = useState<'haircut' | 'spa'>('haircut');
	const [data, setData] = useState<ServiceInterface[]>([]);
	const [selectedService, setSelectedService] = useState<null | string>(null);

	useEffect(() => {
		if (mode === 'haircut') {
			setData(haircuts);
		} else {
			setData(spa);
		}
	}, [mode]);

	return (
		<SafeAreaView style={{ flex: 1, backgroundColor: Colors.dark.background }} edges={['bottom']}>
			<Stack.Screen 
				options={{ 
					headerShown: true, 
					title: 'Agendar Cita', 
					headerBackTitle: 'Volver',
					headerStyle: { backgroundColor: Colors.dark.background },
					headerTintColor: '#fff'
				}} 
			/>
			<StatusBar barStyle="light-content" />

			<Container style={{ flex: 1 }}>
				<View style={{marginTop: 20}}>
					<View
						style={{
							flexDirection: 'row',
							alignItems: 'center',
							paddingBottom: 20,
						}}
					>
						<ThemeText style={{ fontSize: 24, fontWeight: 'bold' }}>
							Agendar Cita
						</ThemeText>
					</View>
				</View>

				<View>
					<ThemeText
						style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 20 }}
					>
						Elige tu servicio:
					</ThemeText>
					<View
						style={{
							flexDirection: 'row',
							justifyContent: 'space-between',
							marginBottom: 20,
						}}
					>
						<Button
							onPress={() => setMode('haircut')}
							secondary={mode !== 'haircut'}
						>
							Corte
						</Button>
						<Button onPress={() => setMode('spa')} secondary={mode !== 'spa'}>
							Spa
						</Button>
					</View>
				</View>

				<View style={{ flex: 1, marginBottom: 20 }}>
					<MaskedView
						style={{ flex: 1 }}
						maskElement={
							<LinearGradient
								style={{ flex: 1 }}
								colors={['black', 'black', 'transparent']}
								locations={[0, 0.8, 1]}
							/>
						}
					>
						<FlatList
							data={data}
							renderItem={({ item, index }) => (
								<ServiceCard
									key={index}
									title={item.name}
									price={item.price}
									description={item.description}
									selected={[selectedService, setSelectedService]}
								/>
							)}
							keyExtractor={(item, index) => index.toString()}
							showsVerticalScrollIndicator={false}
							contentContainerStyle={{
								paddingBottom: 20,
								paddingTop: 10,
							}}
							ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
						/>
					</MaskedView>
				</View>

				<Button
					disabled={!selectedService ? true : false}
					onPress={() => {
						if (selectedService) {
							router.push({
								pathname: '/appoinment/confirmation',
								params: { service: selectedService },
							});
						}
					}}
				>
					Siguiente
				</Button>
			</Container>
		</SafeAreaView>
	);
}
