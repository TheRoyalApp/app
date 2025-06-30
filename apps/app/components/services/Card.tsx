import { View, Pressable } from 'react-native';
import { ThemeText } from '@/components/Themed';
import Colors from '@/constants/Colors';
import { useEffect, useState } from 'react';

interface ServiceCardProps {
	title: string;
	price: number;
	description: string | string[];
	selected?: [string | null, (service: string | null) => void];
}

export default function ServiceCard({
	title,
	price,
	description,
	selected,
}: ServiceCardProps) {
	const [focusedStyle, setFocusedStyle] = useState<{ borderColor?: string }>(
		{}
	);

	const [globalSelectedService, setGlobalSelectedService] =
		selected || [null, () => { }];

	const toggleSelected = () => {
		if (globalSelectedService === title) {
			setGlobalSelectedService(null);
			setFocusedStyle({});
		} else {
			setGlobalSelectedService(title);
			setFocusedStyle({ borderColor: Colors.dark.primary });
		}
	};

	useEffect(() => {
		if (globalSelectedService === title) {
			setFocusedStyle({ borderColor: Colors.dark.primary });
		} else {
			setFocusedStyle({});
		}
	}, [globalSelectedService, title]);

	return (
		<Pressable
			onPress={() => toggleSelected()}
			style={{
				width: '100%',
				borderColor: Colors.dark.gray,
				borderWidth: 1,
				borderRadius: 8,
				padding: 20,
				...focusedStyle,
			}}
		>
			<View style={{ flex: 1, justifyContent: 'center', gap: 8 }}>
				<ThemeText style={{ fontSize: 16, fontWeight: 'bold' }}>
					{title}
				</ThemeText>
				<ThemeText style={{ fontSize: 16, color: Colors.dark.textLight }}>
					${price.toFixed(2)}
				</ThemeText>
				{Array.isArray(description) ? (
					description.map((line, idx) => (
						<ThemeText
							key={idx}
							style={{ fontSize: 14, color: Colors.dark.textLight }}
						>
							{line}
						</ThemeText>
					))
				) : (
					<ThemeText style={{ fontSize: 14, color: Colors.dark.textLight }}>
						{description}
					</ThemeText>
				)}
			</View>
		</Pressable>
	);
}
