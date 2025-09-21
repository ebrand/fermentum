import React, { useState } from 'react'
import {
  useStripe,
  useElements,
  CardNumberElement,
  CardExpiryElement,
  CardCvcElement
} from '@stripe/react-stripe-js'
import { CreditCardIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline'

const cardElementOptions = {
  style: {
    base: {
      fontSize: '16px',
      color: '#424770',
      '::placeholder': {
        color: '#aab7c4',
      },
    },
    invalid: {
      color: '#9e2146',
    },
  },
}

export default function StripePaymentForm({
  onPaymentSuccess,
  onPaymentError,
  loading: externalLoading,
  billingDetails,
  planType,
  planPrice
}) {
  const stripe = useStripe()
  const elements = useElements()

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [cardComplete, setCardComplete] = useState({
    cardNumber: false,
    cardExpiry: false,
    cardCvc: false
  })

  const isFormComplete = Object.values(cardComplete).every(Boolean) && billingDetails.email

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!stripe || !elements) {
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Create payment method
      const cardElement = elements.getElement(CardNumberElement)

      const { error: pmError, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
        billing_details: {
          name: `${billingDetails.firstName} ${billingDetails.lastName}`.trim(),
          email: billingDetails.email,
          address: {
            line1: billingDetails.address || '',
            city: billingDetails.city || '',
            state: billingDetails.state || '',
            postal_code: billingDetails.zipCode || '',
            country: 'US'
          }
        }
      })

      if (pmError) {
        throw new Error(pmError.message)
      }


      // Call the success callback with payment method
      await onPaymentSuccess({
        paymentMethodId: paymentMethod.id,
        planType,
        billingDetails
      })

    } catch (err) {
      setError(err.message || 'Payment failed. Please try again.')
      onPaymentError && onPaymentError(err)
    } finally {
      setLoading(false)
    }
  }

  const handleCardChange = (elementType) => (event) => {
    setCardComplete(prev => ({
      ...prev,
      [elementType]: event.complete
    }))

    if (event.error) {
      setError(event.error.message)
    } else {
      setError(null)
    }
  }

  const isSubmitLoading = loading || externalLoading

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Plan Summary */}
      <div className="bg-fermentum-50 border border-fermentum-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <CreditCardIcon className="h-5 w-5 text-fermentum-600 mr-2" />
            <span className="font-medium text-fermentum-900">
              {planType === 'pro' ? 'Professional Plan' : 'Enterprise Plan'}
            </span>
          </div>
          <span className="text-lg font-bold text-fermentum-600">
            ${(planPrice / 100).toFixed(2)}/month
          </span>
        </div>
        <p className="text-sm text-fermentum-700 mt-1">
          14-day free trial • Cancel anytime
        </p>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <ExclamationCircleIcon className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Card Number */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Card Number
        </label>
        <div className="relative">
          <div className="border border-gray-300 rounded-md px-3 py-3 focus-within:ring-1 focus-within:ring-fermentum-500 focus-within:border-fermentum-500">
            <CardNumberElement
              options={cardElementOptions}
              onChange={handleCardChange('cardNumber')}
            />
          </div>
        </div>
      </div>

      {/* Expiry and CVC */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Expiry Date
          </label>
          <div className="border border-gray-300 rounded-md px-3 py-3 focus-within:ring-1 focus-within:ring-fermentum-500 focus-within:border-fermentum-500">
            <CardExpiryElement
              options={cardElementOptions}
              onChange={handleCardChange('cardExpiry')}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            CVC
          </label>
          <div className="border border-gray-300 rounded-md px-3 py-3 focus-within:ring-1 focus-within:ring-fermentum-500 focus-within:border-fermentum-500">
            <CardCvcElement
              options={cardElementOptions}
              onChange={handleCardChange('cardCvc')}
            />
          </div>
        </div>
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={!stripe || !isFormComplete || isSubmitLoading}
        className="w-full flex justify-center items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-fermentum-600 hover:bg-fermentum-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-fermentum-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSubmitLoading ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            Processing...
          </>
        ) : (
          `Start 14-Day Free Trial`
        )}
      </button>

      {/* Security Notice */}
      <div className="text-center">
        <p className="text-xs text-gray-500">
          🔒 Your payment information is encrypted and secure.
          You won't be charged until your 14-day trial ends.
        </p>
      </div>
    </form>
  )
}