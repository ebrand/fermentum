import { loadStripe } from '@stripe/stripe-js'

// Load Stripe with publishable key
const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_51S9841S4Vkg3juZc0uHOaNnNBJrFfyhetvmmIoRbCEdxnnwKnCZTtQAMg9Rq38kLVq71TqSt1d0TtXBTOOw1qfOw00vYAcStzo'

export const stripePromise = loadStripe(stripePublishableKey)

// Plan configurations matching the onboarding page
export const STRIPE_PLANS = {
  free: {
    id: 'free',
    name: 'Starter',
    price: 0,
    interval: 'month',
    stripePriceId: null, // No Stripe price for free plan
    features: [
      'Up to 5 beer recipes',
      'Basic inventory tracking',
      'Production logging',
      'Email support'
    ]
  },
  pro: {
    id: 'pro',
    name: 'Professional',
    price: 4900, // $49.00 in cents
    interval: 'month',
    stripePriceId: 'price_1S9ADZS4Vkg3juZcORhABZu7', // Pro plan ($249/month)
    features: [
      'Unlimited recipes',
      'Advanced inventory management',
      'Quality control tracking',
      'Analytics & reporting',
      'Priority support'
    ]
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    price: 14900, // $149.00 in cents
    interval: 'month',
    stripePriceId: 'price_1S9AE1S4Vkg3juZcSbvhGTAS', // Enterprise plan ($499/month)
    features: [
      'Everything in Professional',
      'Multi-location support',
      'Custom integrations',
      'Advanced analytics',
      'Dedicated support'
    ]
  }
}

export const formatPrice = (priceInCents) => {
  return (priceInCents / 100).toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD'
  })
}