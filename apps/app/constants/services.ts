export interface ServiceInterface {
	name: string;
	price: number;
	description: string[];
	duration: number;
}

export const haircuts = [
	{
		name: 'Corte Prince (Junior)',
		price: 180,
		description: [
			'Lavado de cabello',
			'Corte de cabello',
			'Lavado de cabello final (opcional)',
			'Peinado y perfume',
		],
		duration: 30
	},
	{
		name: 'Corte Royal',
		price: 200,
		description: [
			'Lavado de cabello',
			'Corte de cabello',
			'Lavado de cabello al finalizar (opcional)',
			'Peinado y perfume',
		],
		duration: 30
	},
	{
		name: 'Corte Imperial',
		price: 280,
		description: [
			'Lavado de cabello',
			'Exfoliación',
			'Vapor caliente y masaje con guante',
			'Mascarilla puntos negros',
			'Corte de cabello',
			'Crema humectante para ojeras',
			'Lavado de cabello al finalizar (opcional)',
			'Peinado y perfume',
		],
		duration: 30
	},
	{
		name: 'Limpieza Facial',
		price: 200,
		description: [
			'Limpieza de rostro',
			'Exfoliación',
			'Vapor caliente y masaje con guante',
			'Mascarilla puntos negros',
			'Mascarilla para ojeras',
			'Vapor frío y mascarilla humectante',
			'Crema hidratante',
		],
		duration: 30
	},
	{
		name: 'Barba King',
		price: 170,
		description: [
			'Perfilación y corte de barba',
			'Limpieza de rostro',
			'Aceite pre-shave',
			'Aceite de afeitado y exfoliación',
			'Vapor caliente y masaje con guante',
			'Delineado y afeitado',
			'Vapor frío y crema humectante',
			'After shave y perfume',
		],
		duration: 30
	},
	{
		name: 'Corte y Barba Royal',
		price: 300,
		description: [
			'Lavado de cabello',
			'Corte de cabello',
			'Perfilación y corte de barba',
			'Delineado y afeitado',
			'Lavado de cabello al finalizar (opcional)',
			'After shave',
			'Peinado y perfume',
		],
		duration: 30
	},
	{
		name: 'Corte y Barba Imperial',
		price: 380,
		description: [
			'Lavado de cabello',
			'Corte de cabello',
			'Perfilación y corte de barba',
			'Limpieza de rostro',
			'Exfoliación',
			'Vapor caliente y masaje con guante',
			'Mascarilla puntos negros',
			'Vapor frío y mascarilla para ojeras',
			'Lavado de cabello al finalizar (opcional)',
			'After shave',
			'Peinado y perfume',
		],
		duration: 30
	},
] as ServiceInterface[];

export const spa = [
	{
		name: 'Manicure',
		price: 150,
		description: ['Limpieza de manos y uñas en seco', 'Esmaltado transparente'],
		duration: 30
	},
	{
		name: 'Pedicure',
		price: 200,
		description: ['Limpieza de pies y uñas', 'Esmaltado transparente'],
		duration: 30
	},
	{
		name: 'Manicure Spa',
		price: 200,
		description: [
			'Tina con sales minerales',
			'Limpieza de manos y uñas',
			'Exfoliación',
			'Mascarilla con aceites esenciales y relajantes',
			'Gel semipermanente transparente',
		],
		duration: 30
	},
	{
		name: 'Pedicure Spa',
		price: 350,
		description: [
			'Tina con sales minerales',
			'Limpieza profunda de pies y uñas',
			'Exfoliación',
			'Mascarilla con aceites esenciales y relajantes',
			'Masaje relajante',
			'Gel semipermanente transparente',
		],
		duration: 30
	},
	{
		name: 'Combo del Rey',
		price: 510,
		description: ['Incluye Manicure y Pedicure Spa'],
		duration: 30
	},
] as ServiceInterface[];
