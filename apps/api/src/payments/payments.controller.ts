import type { Context } from 'hono';
import { getDatabase } from '../db/connection.js';
import { payments, appointments } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { successResponse, errorResponse } from '../helpers/response.helper.js';

// Create a new payment
export async function createPayment(paymentData: {
  amount: number;
  paymentMethod: string;
  status: string;
  transactionId: string;
  serviceId?: string;
  appointmentId?: string;
}) {
  const res = {
    data: null as any,
    error: null as string | null,
  };

  try {
    const { amount, paymentMethod, status, transactionId, serviceId, appointmentId } = paymentData;
    
    if (!amount || !paymentMethod || !status || !transactionId) {
      res.error = 'Missing required fields';
      return res;
    }

    const db = await getDatabase();
    const [payment] = await db.insert(payments).values({
      amount: amount.toString(),
      paymentMethod,
      status,
      transactionId,
      appointmentId,
    }).returning();

    if (!payment) {
      res.error = 'Failed to create payment';
      return res;
    }

    res.data = payment;
    return res;
  } catch (error) {
    console.error('Error creating payment:', error);
    res.error = 'Internal server error';
    return res;
  }
}

// Update payment
export async function updatePayment(id: string, updateData: any) {
  const res = {
    data: null as any,
    error: null as string | null,
  };

  try {
    if (!id) {
      res.error = 'Payment ID is required';
      return res;
    }

    const db = await getDatabase();
    
    // Check if payment exists
    const [existingPayment] = await db.select().from(payments).where(eq(payments.id, id));
    if (!existingPayment) {
      res.error = 'Payment not found';
      return res;
    }

    const [updatedPayment] = await db
      .update(payments)
      .set({
        ...updateData,
        updatedAt: new Date()
      })
      .where(eq(payments.id, id))
      .returning();

    if (!updatedPayment) {
      res.error = 'Failed to update payment';
      return res;
    }

    res.data = updatedPayment;
    return res;
  } catch (error) {
    console.error('Error updating payment:', error);
    res.error = 'Internal server error';
    return res;
  }
}

// Get payment by ID
export async function getPaymentById(id: string) {
  const res = {
    data: null as any,
    error: null as string | null,
  };

  try {
    if (!id) {
      res.error = 'Payment ID is required';
      return res;
    }

    const db = await getDatabase();
    const [payment] = await db.select().from(payments).where(eq(payments.id, id));
    
    if (!payment) {
      res.error = 'Payment not found';
      return res;
    }

    res.data = payment;
    return res;
  } catch (error) {
    console.error('Error getting payment:', error);
    res.error = 'Internal server error';
    return res;
  }
}

// Get payment by transaction ID
export async function getPaymentByTransactionId(transactionId: string) {
  const res = {
    data: null as any,
    error: null as string | null,
  };

  try {
    if (!transactionId) {
      res.error = 'Transaction ID is required';
      return res;
    }

    const db = await getDatabase();
    const [payment] = await db.select().from(payments).where(eq(payments.transactionId, transactionId));
    
    if (!payment) {
      res.error = 'Payment not found';
      return res;
    }

    res.data = payment;
    return res;
  } catch (error) {
    console.error('Error getting payment by transaction ID:', error);
    res.error = 'Internal server error';
    return res;
  }
}

// Get payments for a user (through appointments)
export async function getUserPayments(userId: string) {
  const res = {
    data: null as any[] | null,
    error: null as string | null,
  };

  try {
    if (!userId) {
      res.error = 'User ID is required';
      return res;
    }

    // For now, return empty array - we can implement the complex query later
    res.data = [];
    return res;
  } catch (error) {
    console.error('Error getting user payments:', error);
    res.error = 'Internal server error';
    return res;
  }
} 