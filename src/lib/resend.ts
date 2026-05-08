import { Resend } from 'resend';
import { escapeHtml } from '@/lib/security';

let resendInstance: Resend | null = null;

const getResend = () => {
  if (!resendInstance) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error('RESEND_API_KEY is not defined');
    }
    resendInstance = new Resend(apiKey);
  }
  return resendInstance;
};

export const sendRSVPConfirmation = async (email: string, guestName: string, eventTitle: string, qrCode: string) => {
  try {
    if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY === 'your_resend_api_key') {
      return { success: false, error: 'Resend is not configured.' };
    }

    const resend = getResend();
    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'Addis Events <confirm@addisevents.et>',
      to: [email],
      subject: `Confirmation: ${eventTitle}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h1 style="color: #91091E;">Confirmation Received!</h1>
          <p>Hello ${escapeHtml(guestName)},</p>
          <p>Your RSVP for <strong>${escapeHtml(eventTitle)}</strong> has been confirmed.</p>
          <div style="background: #f9f9f9; padding: 20px; border-radius: 10px; text-align: center; margin: 20px 0;">
            <p style="margin-bottom: 10px; font-weight: bold;">Your Check-in QR Code</p>
            <img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrCode)}" alt="QR Code" style="width: 150px; height: 150px;" />
            <p style="font-size: 10px; color: #666; margin-top: 10px;">${escapeHtml(qrCode)}</p>
          </div>
          <p>Please present this QR code at the entrance for quick check-in.</p>
          <hr style="border: 0; border-top: 1px solid #eee;" />
          <p style="font-size: 12px; color: #999;">Powered by Addis Events</p>
        </div>
      `,
    });

    if (error) {
      console.error('Resend Error:', error);
      return { success: false, error };
    }

    return { success: true, data };
  } catch (err) {
    console.error('Email Exception:', err);
    return { success: false, error: err };
  }
};
