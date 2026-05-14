import Stripe from 'stripe';

let stripePromise: Stripe | null = null;

export const getStripe = () => {
  if (!stripePromise) {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      throw new Error('STRIPE_SECRET_KEY is not defined in environment variables');
    }
    stripePromise = new Stripe(secretKey, {
      apiVersion: '2025-01-27' as any, // Use the latest supported version
    });
  }
  return stripePromise;
};
