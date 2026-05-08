/**
 * Chapa Payment Integration Helper
 * 
 * Note: This uses Chapa's standard checkout flow.
 * In production, you'd use your actual keys from Chapa Dashboard.
 */

const CHAPA_SECRET_KEY = process.env.CHAPA_SECRET_KEY || '';
const CHAPA_BASE_URL = 'https://api.chapa.co/v1';

export type CheckoutData = {
  amount: number;
  currency: string;
  email: string;
  first_name: string;
  last_name: string;
  tx_ref: string; // Unique transaction reference
  callback_url: string;
  return_url: string;
  customization?: {
    title: string;
    description: string;
    logo?: string;
  };
};

export const initializePayment = async (data: CheckoutData) => {
  // Mock implementation for development if key is missing
  if (!CHAPA_SECRET_KEY || CHAPA_SECRET_KEY.includes('xxxx')) {
    if (process.env.NODE_ENV === 'production') {
      return { status: 'error', message: 'Chapa secret key is not configured' };
    }

    console.warn('Chapa Secret Key is missing. Simulating successful initialization.');
    return {
      status: 'success',
      message: 'Checkout URL generated successfully',
      data: {
        checkout_url: `/tickets/callback?tx_ref=${data.tx_ref}&status=success`
      }
    };
  }

  try {
    const response = await fetch(`${CHAPA_BASE_URL}/transaction/initialize`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CHAPA_SECRET_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Chapa Initialization Error:', error);
    return { status: 'error', message: 'Failed to initialize payment' };
  }
};

export const verifyPayment = async (tx_ref: string) => {
  if (!CHAPA_SECRET_KEY || CHAPA_SECRET_KEY.includes('xxxx')) {
    if (process.env.NODE_ENV === 'production') {
      return { status: 'error', message: 'Chapa secret key is not configured' };
    }

    return { status: 'success', data: { status: 'success' } };
  }

  try {
    const response = await fetch(`${CHAPA_BASE_URL}/transaction/verify/${tx_ref}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${CHAPA_SECRET_KEY}`
      }
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Chapa Verification Error:', error);
    return { status: 'error', message: 'Failed to verify payment' };
  }
};
