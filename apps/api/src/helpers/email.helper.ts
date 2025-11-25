import { Resend } from 'resend';
import winstonLogger from './logger.js';

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const RESEND_FROM_EMAIL = process.env.RESEND_FROM_EMAIL;
const NODE_ENV = process.env.NODE_ENV;

let resend: Resend | null = null;
let emailConfigError: string | null = null;

// Validate email configuration
if (!RESEND_API_KEY) {
  emailConfigError = 'RESEND_API_KEY not found in environment variables';
  winstonLogger.error('Email configuration error', { error: emailConfigError });
} else if (!RESEND_FROM_EMAIL) {
  emailConfigError = 'RESEND_FROM_EMAIL not found in environment variables';
  winstonLogger.error('Email configuration error', { 
    error: emailConfigError,
    hint: 'Set RESEND_FROM_EMAIL to a verified domain email (e.g., noreply@yourdomain.com)'
  });
} else {
  try {
    resend = new Resend(RESEND_API_KEY);
    winstonLogger.info('Resend email service initialized successfully', { 
      fromEmail: RESEND_FROM_EMAIL,
      environment: NODE_ENV 
    });
  } catch (error) {
    emailConfigError = 'Failed to initialize Resend service';
    winstonLogger.error('Resend initialization error', { error });
  }
}

export async function sendPasswordResetEmail(email: string, token: string, userName: string): Promise<boolean> {
  if (!resend || emailConfigError) {
    winstonLogger.error('Cannot send password reset email', { 
      reason: emailConfigError || 'Resend not initialized',
      recipientEmail: email,
      hasApiKey: !!RESEND_API_KEY,
      hasFromEmail: !!RESEND_FROM_EMAIL,
      fromEmail: RESEND_FROM_EMAIL
    });
    return false;
  }

  try {
    winstonLogger.info('Attempting to send password reset email', { 
      to: email, 
      from: RESEND_FROM_EMAIL 
    });

    const { data, error } = await resend.emails.send({
      from: RESEND_FROM_EMAIL!,
      to: [email],
      subject: 'Restablece tu Contraseña - The Royal Barber',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Solicitud de Restablecimiento de Contraseña</h2>
          <p>Hola ${userName},</p>
          <p>Recibimos una solicitud para restablecer tu contraseña. Tu token de restablecimiento es:</p>
          <div style="background-color: #f4f4f4; padding: 15px; text-align: center; margin: 20px 0; font-weight: bold; font-size: 24px; letter-spacing: 2px;">
            ${token}
          </div>
          <p>Este token expirará en 1 hora.</p>
          <p>Si no solicitaste un restablecimiento de contraseña, por favor ignora este correo.</p>
          <p>Saludos cordiales,<br>El equipo de The Royal Barber</p>
        </div>
      `,
    });

    if (error) {
      winstonLogger.error('Resend API returned an error', { 
        error,
        errorMessage: error.message,
        errorName: error.name,
        recipientEmail: email,
        fromEmail: RESEND_FROM_EMAIL
      });
      return false;
    }

    winstonLogger.info('Password reset email sent successfully', { 
      email,
      emailId: data?.id 
    });
    return true;
  } catch (error: any) {
    winstonLogger.error('Exception while sending password reset email', { 
      error: error?.message || error,
      stack: error?.stack,
      recipientEmail: email,
      fromEmail: RESEND_FROM_EMAIL
    });
    return false;
  }
}

/**
 * Check if email service is configured and ready
 */
export function isEmailConfigured(): boolean {
  return resend !== null && emailConfigError === null;
}

/**
 * Get email configuration status for health checks
 */
export function getEmailStatus() {
  return {
    configured: isEmailConfigured(),
    hasApiKey: !!RESEND_API_KEY,
    hasFromEmail: !!RESEND_FROM_EMAIL,
    fromEmail: RESEND_FROM_EMAIL || 'not set',
    error: emailConfigError
  };
}

