import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useTenant } from '../contexts/TenantContext'
import { paymentAPI } from '../utils/api'
import { CheckIcon } from '@heroicons/react/24/solid'
import {
  BuildingOfficeIcon,
  CreditCardIcon,
  UserIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'
import EnhancedSubscriptionStep from '../components/EnhancedSubscriptionStep'
import { FormField, FormButton } from '../components/forms'

const ONBOARDING_STEPS = [
  { id: 'welcome', title: 'Welcome', icon: UserIcon },
  { id: 'brewery', title: 'Brewery Setup', icon: BuildingOfficeIcon },
  { id: 'subscription', title: 'Choose Plan', icon: CreditCardIcon },
  { id: 'complete', title: 'Complete', icon: CheckCircleIcon }
]

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(0)
  const [formData, setFormData] = useState({
    // Brewery data
    breweryName: 'Sunset Craft Brewing',
    breweryDescription: 'Award-winning craft brewery specializing in IPAs and seasonal ales, serving the community since 2020.',
    location: 'Portland, Oregon',
    website: 'https://sunsetcraft.com',
    // Subscription data
    planType: 'free',
    billingEmail: '',
    // Payment data (for paid plans)
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    billingAddress: ''
  })
  const [createdTenant, setCreatedTenant] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const { user } = useAuth()
  const { createTenant } = useTenant()
  const navigate = useNavigate()

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
    if (error) setError('')
  }

  const nextStep = () => {
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleStepSubmit = async () => {
    setLoading(true)
    setError('')

    try {
      switch (ONBOARDING_STEPS[currentStep].id) {
        case 'welcome':
          nextStep()
          break
        case 'brewery':
          await handleBrewerySetup()
          break
        case 'subscription':
          await handleSubscriptionSetup()
          break
        case 'complete':
          navigate('/dashboard')
          break
        default:
          nextStep()
      }
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleBrewerySetup = async () => {
    if (!formData.breweryName.trim()) {
      throw new Error('Brewery name is required')
    }

    const tenantData = {
      name: formData.breweryName,
      description: formData.breweryDescription,
      location: formData.location,
      website: formData.website
    }

    const result = await createTenant(tenantData)
    if (result.success) {
      setCreatedTenant(result.data)
      nextStep()
    } else {
      throw new Error(result.error || 'Failed to create brewery')
    }
  }

  const handleSubscriptionSetup = async () => {
    // For free plan, just validate and proceed
    if (formData.planType === 'free') {
      nextStep()
      return
    }

    // For paid plans, validation is handled by the EnhancedSubscriptionStep component
    // This function should not be called directly for paid plans
    throw new Error('Payment processing should be handled by the payment form')
  }

  const handlePaymentComplete = async (paymentData) => {
    try {
      if (!createdTenant) {
        throw new Error('No tenant created yet')
      }


      // Create subscription via API
      const subscriptionRequest = {
        paymentMethodId: paymentData.paymentMethodId,
        planType: paymentData.planType,
        billingEmail: paymentData.billingInfo.email,
        billingDetails: {
          firstName: paymentData.billingInfo.firstName,
          lastName: paymentData.billingInfo.lastName,
          email: paymentData.billingInfo.email,
          address: paymentData.billingInfo.address || null,
          city: paymentData.billingInfo.city || null,
          state: paymentData.billingInfo.state || null,
          zipCode: paymentData.billingInfo.zipCode || null,
          country: 'US'
        },
        tenantId: createdTenant.tenantId
      }

      console.log('🔍 SUBSCRIPTION REQUEST DEBUG:', JSON.stringify(subscriptionRequest, null, 2))
      console.log('🔍 PAYMENT DATA RECEIVED:', JSON.stringify(paymentData, null, 2))

      const result = await paymentAPI.createSubscription(subscriptionRequest)

      if (result.data.success) {
        nextStep()
      } else {
        throw new Error(result.data.data?.error || 'Failed to create subscription')
      }
    } catch (error) {
      console.error('Payment completion error:', error)
      setError(error.message || 'Failed to process payment')
      throw error
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Progress Steps */}
      <div className="bg-white shadow">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <nav aria-label="Progress">
              <ol className="flex items-center">
                {ONBOARDING_STEPS.map((step, index) => (
                  <li key={step.id} className={`${index !== ONBOARDING_STEPS.length - 1 ? 'pr-8 sm:pr-20' : ''} relative`}>
                    <div className="flex items-center">
                      <div className={`
                        flex h-10 w-10 items-center justify-center rounded-full border-2
                        ${index <= currentStep
                          ? 'border-fermentum-600 bg-fermentum-600'
                          : 'border-gray-300 bg-white'
                        }
                      `}>
                        {index < currentStep ? (
                          <CheckIcon className="h-6 w-6 text-white" />
                        ) : (
                          <step.icon className={`h-6 w-6 ${index <= currentStep ? 'text-white' : 'text-gray-400'}`} />
                        )}
                      </div>
                      <span className={`
                        ml-4 text-sm font-medium
                        ${index <= currentStep ? 'text-fermentum-600' : 'text-gray-500'}
                      `}>
                        {step.title}
                      </span>
                    </div>
                    {index !== ONBOARDING_STEPS.length - 1 && (
                      <div className={`
                        absolute top-5 left-10 -ml-px h-0.5 w-full
                        ${index < currentStep ? 'bg-fermentum-600' : 'bg-gray-300'}
                      `} />
                    )}
                  </li>
                ))}
              </ol>
            </nav>
          </div>
        </div>
      </div>

      {/* Step Content */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-lg shadow-sm p-8">
          {ONBOARDING_STEPS[currentStep].id === 'welcome' && (
            <WelcomeStep user={user} />
          )}

          {ONBOARDING_STEPS[currentStep].id === 'brewery' && (
            <BreweryStep
              formData={formData}
              onChange={handleInputChange}
              error={error}
            />
          )}

          {ONBOARDING_STEPS[currentStep].id === 'subscription' && (
            <EnhancedSubscriptionStep
              formData={formData}
              onChange={handleInputChange}
              onPaymentComplete={handlePaymentComplete}
              onNext={handleSubscriptionSetup}
              onPrevious={prevStep}
              error={error}
              loading={loading}
            />
          )}

          {ONBOARDING_STEPS[currentStep].id === 'complete' && (
            <CompleteStep user={user} />
          )}

          {/* Navigation Buttons - Only show for steps that don't handle their own navigation */}
          {ONBOARDING_STEPS[currentStep].id !== 'subscription' && (
            <div className="flex justify-between mt-8">
              <FormButton
                type="button"
                variant="secondary"
                size="md"
                onClick={prevStep}
                disabled={currentStep === 0}
              >
                Previous
              </FormButton>

              <FormButton
                type="button"
                variant="primary"
                size="md"
                onClick={handleStepSubmit}
                loading={loading}
                disabled={loading}
              >
                {currentStep === ONBOARDING_STEPS.length - 1 ? 'Get Started' : 'Continue'}
              </FormButton>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Welcome Step Component
function WelcomeStep({ user }) {
  return (
    <div className="text-center">
      <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-fermentum-100">
        <UserIcon className="h-8 w-8 text-fermentum-600" />
      </div>
      <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
        Welcome to Fermentum, {user?.firstName}!
      </h2>
      <p className="mt-4 text-lg text-gray-600">
        Let's get your brewery management system set up in just a few steps.
        This will only take a couple of minutes.
      </p>
      <div className="mt-8 bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">What we'll set up:</h3>
        <ul className="text-left space-y-2 text-gray-600">
          <li className="flex items-center">
            <CheckIcon className="h-5 w-5 text-green-500 mr-3" />
            Your brewery profile and information
          </li>
          <li className="flex items-center">
            <CheckIcon className="h-5 w-5 text-green-500 mr-3" />
            Choose the right plan for your needs
          </li>
          <li className="flex items-center">
            <CheckIcon className="h-5 w-5 text-green-500 mr-3" />
            Access to your brewery dashboard
          </li>
        </ul>
      </div>
    </div>
  )
}

// Brewery Setup Step Component
function BreweryStep({ formData, onChange, error }) {
  return (
    <div>
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl mb-6">
          <BuildingOfficeIcon className="h-8 w-8 text-white" />
        </div>
        <h2 className="text-3xl font-semibold text-gray-900 mb-2">Set Up Your Brewery</h2>
        <p className="text-gray-600">
          Tell us about your brewery so we can customize your experience.
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-xl bg-red-50 p-4">
          <div className="text-sm text-red-700">{error}</div>
        </div>
      )}

      <div className="space-y-6">
        <FormField
          label="Brewery Name"
          name="breweryName"
          type="text"
          value={formData.breweryName}
          onChange={onChange}
          placeholder="Brewery Name"
          required
        />

        <FormField
          label="Description"
          name="breweryDescription"
          value={formData.breweryDescription}
          onChange={onChange}
          placeholder="Tell us about your brewery's story, specialties, and what makes you unique..."
        >
          <textarea
            name="breweryDescription"
            id="breweryDescription"
            rows={3}
            className="w-full px-4 py-4 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors resize-none"
            placeholder="Tell us about your brewery's story, specialties, and what makes you unique..."
            value={formData.breweryDescription}
            onChange={onChange}
          />
        </FormField>

        <FormField
          label="Location"
          name="location"
          type="text"
          value={formData.location}
          onChange={onChange}
          placeholder="Location"
        />

        <FormField
          label="Website"
          name="website"
          type="url"
          value={formData.website}
          onChange={onChange}
          placeholder="Website"
        />
      </div>
    </div>
  )
}


// Complete Step Component
function CompleteStep({ user }) {
  return (
    <div className="text-center">
      <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100">
        <CheckCircleIcon className="h-10 w-10 text-green-600" />
      </div>
      <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
        You're All Set!
      </h2>
      <p className="mt-4 text-lg text-gray-600">
        Welcome to Fermentum, {user?.firstName}! Your brewery management system is ready to go.
      </p>
      <div className="mt-8 bg-fermentum-50 rounded-lg p-6">
        <h3 className="text-lg font-medium text-fermentum-900 mb-4">What's next?</h3>
        <ul className="text-left space-y-3 text-fermentum-800">
          <li className="flex items-center">
            <CheckIcon className="h-5 w-5 text-fermentum-600 mr-3" />
            Explore your brewery dashboard
          </li>
          <li className="flex items-center">
            <CheckIcon className="h-5 w-5 text-fermentum-600 mr-3" />
            Add your first beer recipe
          </li>
          <li className="flex items-center">
            <CheckIcon className="h-5 w-5 text-fermentum-600 mr-3" />
            Set up your inventory tracking
          </li>
          <li className="flex items-center">
            <CheckIcon className="h-5 w-5 text-fermentum-600 mr-3" />
            Invite your team members
          </li>
        </ul>
      </div>
    </div>
  )
}