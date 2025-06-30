export interface Service {
    id: string;
    name: string;
    description?: string;
    price: string;
    duration: number;
    isActive: boolean;
    // Stripe-related fields
    stripeProductId?: string;
    stripePriceId?: string;
    stripeAdvancePriceId?: string;
    stripeCurrency?: string;
    createdAt: Date;
    updatedAt: Date;
} 