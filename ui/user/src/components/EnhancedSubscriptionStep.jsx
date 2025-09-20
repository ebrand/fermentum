import React, { useState } from 'react'
import { Elements } from '@stripe/react-stripe-js'
import { stripePromise, STRIPE_PLANS } from '../config/stripe'

import StripePaymentForm from './StripePaymentForm'
import {
  CreditCardIcon,
  CheckIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline'

export default function EnhancedSubscriptionStep({
  formData,
  onChange,
  onPaymentComplete,
  onNext,
  onPrevious,
  error,
  loading
}) {
  const [showPaymentForm, setShowPaymentForm] = useState(false)
  const [billingInfo, setBillingInfo] = useState({
    firstName: '',
    lastName: '',
    email: formData.billingEmail || '',
    address: '',
    city: '',
    state: '',
    zipCode: ''
  })

  const selectedPlan = STRIPE_PLANS[formData.planType]

  const handlePlanChange = (planType) => {
    onChange({ target: { name: 'planType', value: planType } })
    setShowPaymentForm(false)
  }

  const handleBillingInfoChange = (e) => {
    setBillingInfo({
      ...billingInfo,
      [e.target.name]: e.target.value
    })

    // Update the main form data for billing email
    if (e.target.name === 'email') {
      onChange({ target: { name: 'billingEmail', value: e.target.value } })
    }
  }

  const handleContinueToPayment = () => {
    if (!billingInfo.email || !billingInfo.firstName || !billingInfo.lastName) {
      return
    }
    setShowPaymentForm(true)
  }

  const handlePaymentSuccess = async (paymentData) => {
    try {
      console.log('🔧 ENHANCED SUBSCRIPTION STEP - Payment success data received:', paymentData)

      const finalPaymentData = {
        ...paymentData,
        billingInfo,
        planType: formData.planType
      }

      console.log('🔧 ENHANCED SUBSCRIPTION STEP - Final payment data being sent to parent:', finalPaymentData)

      // Call the parent component's payment completion handler
      await onPaymentComplete(finalPaymentData)
    } catch (error) {
      console.error('Payment completion error:', error)
      throw error
    }
  }

  return (
    <div>
      <div className="text-center mb-8">
        <CreditCardIcon className="mx-auto h-16 w-16 text-fermentum-600" />
        <h2 className="mt-4 text-2xl font-bold text-gray-900">Choose Your Plan</h2>
        <p className="mt-2 text-gray-600">
          Select the plan that best fits your brewery's needs. You can change this anytime.
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-md bg-red-50 p-4">
          <div className="flex">
            <ExclamationCircleIcon className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <div className="text-sm text-red-700">{error}</div>
            </div>
          </div>
        </div>
      )}

      {!showPaymentForm ? (
        <>
          {/* Plan Selection */}
          <div className="space-y-4 mb-8">
            {Object.values(STRIPE_PLANS).map((plan) => (
              <label
                key={plan.id}
                className={`
                  relative block cursor-pointer rounded-lg border p-6 hover:border-fermentum-500
                  ${formData.planType === plan.id ? 'border-fermentum-500 bg-fermentum-50' : 'border-gray-300'}
                `}
              >
                <input
                  type="radio"
                  name="planType"
                  value={plan.id}
                  checked={formData.planType === plan.id}
                  onChange={(e) => handlePlanChange(e.target.value)}
                  className="sr-only"
                />
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center">
                      <h3 className="text-lg font-medium text-gray-900">{plan.name}</h3>
                      <span className="ml-3 text-lg font-bold text-fermentum-600">
                        {plan.price === 0 ? 'Free' : `$${(plan.price / 100).toFixed(0)}/month`}
                      </span>
                    </div>
                    <ul className="mt-3 space-y-1">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-center text-sm text-gray-600">
                          <CheckIcon className="h-4 w-4 text-green-500 mr-2" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className={`
                    h-5 w-5 rounded-full border-2 flex items-center justify-center
                    ${formData.planType === plan.id ? 'border-fermentum-500 bg-fermentum-500' : 'border-gray-300'}
                  `}>
                    {formData.planType === plan.id && (
                      <CheckIcon className="h-3 w-3 text-white" />
                    )}
                  </div>
                </div>
              </label>
            ))}
          </div>

          {/* Billing Information for Paid Plans */}
          {formData.planType !== 'free' && (
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Billing Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                    First Name *
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    id="firstName"
                    required
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-fermentum-500 focus:border-fermentum-500"
                    value={billingInfo.firstName}
                    onChange={handleBillingInfoChange}
                  />
                </div>

                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    id="lastName"
                    required
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-fermentum-500 focus:border-fermentum-500"
                    value={billingInfo.lastName}
                    onChange={handleBillingInfoChange}
                  />
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Billing Email *
                  </label>
                  <input
                    type="email"
                    name="email"
                    id="email"
                    required
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-fermentum-500 focus:border-fermentum-500"
                    placeholder="billing@yourbrewery.com"
                    value={billingInfo.email}
                    onChange={handleBillingInfoChange}
                  />
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                    Address
                  </label>
                  <input
                    type="text"
                    name="address"
                    id="address"
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-fermentum-500 focus:border-fermentum-500"
                    value={billingInfo.address}
                    onChange={handleBillingInfoChange}
                  />
                </div>

                <div>
                  <label htmlFor="city" className="block text-sm font-medium text-gray-700">
                    City
                  </label>
                  <input
                    type="text"
                    name="city"
                    id="city"
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-fermentum-500 focus:border-fermentum-500"
                    value={billingInfo.city}
                    onChange={handleBillingInfoChange}
                  />
                </div>

                <div>
                  <label htmlFor="state" className="block text-sm font-medium text-gray-700">
                    State
                  </label>
                  <input
                    type="text"
                    name="state"
                    id="state"
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-fermentum-500 focus:border-fermentum-500"
                    value={billingInfo.state}
                    onChange={handleBillingInfoChange}
                  />
                </div>

                <div>
                  <label htmlFor="zipCode" className="block text-sm font-medium text-gray-700">
                    ZIP Code
                  </label>
                  <input
                    type="text"
                    name="zipCode"
                    id="zipCode"
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-fermentum-500 focus:border-fermentum-500"
                    value={billingInfo.zipCode}
                    onChange={handleBillingInfoChange}
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  onClick={handleContinueToPayment}
                  disabled={!billingInfo.email || !billingInfo.firstName || !billingInfo.lastName}
                  className="px-6 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-fermentum-600 hover:bg-fermentum-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-fermentum-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continue to Payment
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        /* Payment Form */
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-2">Payment Information</h3>
            <p className="text-sm text-gray-600">
              Enter your payment details to start your 14-day free trial.
            </p>
          </div>

          <Elements stripe={stripePromise}>
            <StripePaymentForm
              onPaymentSuccess={handlePaymentSuccess}
              billingDetails={billingInfo}
              planType={formData.planType}
              planPrice={selectedPlan.price}
              loading={loading}
            />
          </Elements>

          <div className="mt-4">
            <button
              type="button"
              onClick={() => setShowPaymentForm(false)}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              ← Back to billing information
            </button>
          </div>
        </div>
      )}

      {/* Navigation Buttons */}
      {!showPaymentForm && (
        <div className="flex justify-between mt-8">
          <button
            type="button"
            onClick={onPrevious}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-fermentum-500"
          >
            Previous
          </button>

          {formData.planType === 'free' ? (
            <button
              type="button"
              onClick={onNext}
              disabled={loading}
              className="px-6 py-2 text-sm font-medium text-white bg-fermentum-600 border border-transparent rounded-md hover:bg-fermentum-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-fermentum-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Loading...
                </div>
              ) : (
                'Continue'
              )}
            </button>
          ) : (
            <div className="text-sm text-gray-500">
              Complete billing information to continue
            </div>
          )}
        </div>
      )}
    </div>
  )
}