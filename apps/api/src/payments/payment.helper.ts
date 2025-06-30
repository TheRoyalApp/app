import type { Context } from 'hono';

export interface PaymentSessionData {
  sessionId: string;
  serviceId: string;
  paymentType: 'full' | 'advance';
  amount: number;
  currency: string;
  userId?: string;
  appointmentData?: {
    barberId: string;
    appointmentDate: string;
    timeSlot: string;
    notes?: string;
  };
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

interface Payment {
  id: string;
  amount: string;
  paymentMethod: string;
  status: string;
  transactionId: string;
  appointmentId?: string;
}

interface Appointment {
  id: string;
  userId?: string;
  barberId: string;
  serviceId: string;
  appointmentDate: string;
  timeSlot: string;
  status: string;
  notes?: string;
}

export class PaymentHelper {
  /**
   * Create payment record and optionally create appointment after successful payment
   * Uses existing API endpoints instead of direct database access
   */
  static async handleSuccessfulPayment(sessionData: PaymentSessionData) {
    try {
      // Get the base URL from environment or use localhost for development
      const baseUrl = process.env.API_BASE_URL || 'http://localhost:3000';
      
      // 1. Create payment record using the payments endpoint
      const paymentResponse = await fetch(`${baseUrl}/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: sessionData.amount,
          paymentMethod: 'stripe',
          status: 'completed',
          transactionId: sessionData.sessionId,
          serviceId: sessionData.serviceId,
        }),
      });

      if (!paymentResponse.ok) {
        throw new Error(`Failed to create payment: ${paymentResponse.statusText}`);
      }

      const paymentResult = await paymentResponse.json() as ApiResponse<Payment>;
      const payment = paymentResult.data;

      // 2. If appointment data is provided, create the appointment using the appointments endpoint
      if (sessionData.appointmentData) {
        const appointmentResponse = await fetch(`${baseUrl}/appointments`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Internal-Secret': process.env.INTERNAL_API_SECRET || '',
          },
          body: JSON.stringify({
            userId: sessionData.userId,
            barberId: sessionData.appointmentData.barberId,
            serviceId: sessionData.serviceId,
            appointmentDate: sessionData.appointmentData.appointmentDate,
            timeSlot: sessionData.appointmentData.timeSlot,
            status: 'confirmed',
            notes: sessionData.appointmentData.notes,
            paymentId: payment.id, // Link to the payment we just created
          }),
        });

        if (!appointmentResponse.ok) {
          throw new Error(`Failed to create appointment: ${appointmentResponse.statusText}`);
        }

        const appointmentResult = await appointmentResponse.json() as ApiResponse<Appointment>;
        const appointment = appointmentResult.data;

        // 3. Update the payment to link it to the appointment
        await fetch(`${baseUrl}/payments/${payment.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            appointmentId: appointment.id,
          }),
        });

        return {
          payment,
          appointment,
        };
      }

      return {
        payment,
      };
    } catch (error) {
      console.error('Error handling successful payment:', error);
      throw error;
    }
  }

  /**
   * Verify payment session and return session details
   */
  static async verifyPaymentSession(sessionId: string) {
    // This would typically verify with Stripe
    // For now, we'll return a mock verification
    return {
      sessionId,
      isValid: true,
      status: 'completed',
    };
  }

  /**
   * Get payment history for a user
   */
  static async getUserPayments(userId: string) {
    const baseUrl = process.env.API_BASE_URL || 'http://localhost:3000';
    
    const response = await fetch(`${baseUrl}/payments/user/${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get user payments: ${response.statusText}`);
    }

    const result = await response.json() as ApiResponse<any[]>;
    return result.data;
  }

  /**
   * Get payment details by transaction ID
   */
  static async getPaymentByTransactionId(transactionId: string) {
    const baseUrl = process.env.API_BASE_URL || 'http://localhost:3000';
    
    const response = await fetch(`${baseUrl}/payments/transaction/${transactionId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get payment by transaction ID: ${response.statusText}`);
    }

    const result = await response.json() as ApiResponse<Payment>;
    return result.data;
  }
} 