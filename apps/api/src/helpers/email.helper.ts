import { Resend } from 'resend';
import winstonLogger from './logger.js';

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const RESEND_FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

let resend: Resend | null = null;

if (RESEND_API_KEY) {
  resend = new Resend(RESEND_API_KEY);
} else {
  winstonLogger.warn('RESEND_API_KEY not found. Email sending will be disabled.');
}

export async function sendPasswordResetEmail(email: string, token: string, userName: string): Promise<boolean> {
  if (!resend) {
    winstonLogger.warn('Cannot send password reset email: Resend not initialized');
    return false;
  }

  try {
    const { error } = await resend.emails.send({
      from: RESEND_FROM_EMAIL,
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
      winstonLogger.error('Failed to send password reset email', error);
      return false;
    }

    winstonLogger.info('Password reset email sent successfully', { email });
    return true;
  } catch (error) {
    winstonLogger.error('Error sending password reset email', error);
    return false;
  }
}

