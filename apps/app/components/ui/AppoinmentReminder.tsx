import { View } from 'react-native';
import { CalendarCheck } from 'lucide-react-native';
import Colors from '@/constants/Colors';
import { ThemeText } from '@/components/Themed';

export default function AppoinmentRemider() {
	return (
		<View
			style={{
				backgroundColor: Colors.dark.gray,
				borderRadius: 10,
				padding: 20,
				flexDirection: 'row',
				alignItems: 'center',
				marginBottom: 20,
			}}
		>
			<CalendarCheck
				color={Colors.dark.primary}
				size={40}
				style={{ marginRight: 15 }}
			/>
			<View>
				<ThemeText
					style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 5 }}
				>
					Corte Royal - $200
				</ThemeText>
				<ThemeText
					style={{
						fontSize: 14,
						color: Colors.dark.textLight,
						marginBottom: 5,
					}}
				>
					Lavado, corte y peinado
				</ThemeText>
				<ThemeText style={{ fontSize: 14, color: Colors.dark.textLight }}>
					a las 14:20 PM
				</ThemeText>
			</View>
		</View>
	);
}
