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
      subject: 'Reset Your Password - The Royal Barber',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Password Reset Request</h2>
          <p>Hello ${userName},</p>
          <p>We received a request to reset your password. Your reset token is:</p>
          <div style="background-color: #f4f4f4; padding: 15px; text-align: center; margin: 20px 0; font-weight: bold; font-size: 24px; letter-spacing: 2px;">
            ${token}
          </div>
          <p>This token will expire in 1 hour.</p>
          <p>If you did not request a password reset, please ignore this email.</p>
          <p>Best regards,<br>The Royal Barber Team</p>
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

