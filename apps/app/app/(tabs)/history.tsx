// React core imports
import { useEffect } from 'react';

// React Native core imports
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar, View, ScrollView } from 'react-native';
import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';

// Local imports
import { ThemeText, Container } from '@/components/Themed';
import Colors from '@/constants/Colors';
import HistoryCard from '@/components/services/History';

export default function HistoryScreen() {
	useEffect(() => { }, []);

	return (
		<SafeAreaView style={{ flex: 1, backgroundColor: Colors.dark.background }}>
			<StatusBar barStyle="light-content" />

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
								<HistoryCard
									title="Corte de cabello"
									date="20-04-2025"
									price={200}
								/>
								<HistoryCard title="Barba" date="15-11-2024" price={150} />
								<HistoryCard
									title="Corte + Barba"
									date="10-11-2024"
									price={300}
								/>
								<HistoryCard
									title="Spa facial"
									date="05-11-2024"
									price={250}
								/>
								<HistoryCard
									title="Corte de cabello"
									date="01-11-2024"
									price={200}
								/>
								<HistoryCard title="Barba" date="25-10-2024" price={150} />
								<HistoryCard
									title="Corte + Barba"
									date="15-10-2024"
									price={300}
								/>
							</View>
						</ScrollView>
					</MaskedView>
				</View>
			</Container>
		</SafeAreaView>
	);
}
