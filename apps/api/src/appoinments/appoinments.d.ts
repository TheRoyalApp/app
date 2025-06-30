export interface Appointment {
    id: string;
    customerId: string;
    barberId: string;
    serviceId: string;
    date: Date;
    time: string;
    status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
    createdAt: Date;
    updatedAt: Date;
}

export type Status = 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'all';