import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSession } from '../contexts/SessionContext'
import { tenantAPI, paymentAPI } from '../utils/api'
import { CheckIcon } from '@heroicons/react/24/solid'
import {
  BuildingOfficeIcon,
  CreditCardIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'
import EnhancedSubscriptionStep from '../components/EnhancedSubscriptionStep'
import { FormField, FormButton } from '../components/forms'

const SETUP_STEPS = [
  { id: 'brewery', title: 'Brewery Setup', icon: BuildingOfficeIcon },
  { id: 'subscription', title: 'Choose Plan', icon: CreditCardIcon },
  { id: 'complete', title: 'Complete', icon: CheckCircleIcon }
]

export default function BrewerySetupPage() {
  const [currentStep, setCurrentStep] = useState(0)
  const [formData, setFormData] = useState({
    // Brewery data
    breweryName: 'Test Brewery Co.',
    breweryDescription: 'A craft brewery specializing in hop-forward IPAs and traditional ales with a focus on sustainability and local ingredients.',
    location: 'Portland, Oregon',
    website: 'https://testbrewery.com',
    // Subscription data
    planType: 'free',
    billingEmail: '',
    // Stored payment data from subscription step
    paymentData: null
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const { user } = useSession()
  const navigate = useNavigate()

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
    if (error) setError('')
  }

  const nextStep = () => {
    if (currentStep < SETUP_STEPS.length - 1) {
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
      switch (SETUP_STEPS[currentStep].id) {
        case 'brewery':
          await handleBrewerySetup()
          break
        case 'subscription':
          await handleSubscriptionSetup()
          break
        case 'complete':
          console.log('🎉 [BrewerySetup] Setup complete, navigating to brewery operations')
          navigate('/brewery-operations')
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

    // Just validate and move to next step - don't create tenant yet
    nextStep()
  }

  const handleSubscriptionSetup = async () => {
    // For free plan, create account and complete setup
    if (formData.planType === 'free') {
      await createAccountWithData()
      return
    }

    // For paid plans, validation is handled by the EnhancedSubscriptionStep component
    throw new Error('Payment processing should be handled by the payment form')
  }

  const createAccountWithDataDirect = async (dataToUse) => {
    const currentFormData = dataToUse || formData
    try {
      console.log('🏗️ [BrewerySetup] Starting account creation with data:', {
        breweryName: currentFormData.breweryName,
        planType: currentFormData.planType,
        hasPaymentData: !!currentFormData.paymentData
      })

      // Step 1: Create the tenant
      const tenantData = {
        name: currentFormData.breweryName,
        description: currentFormData.breweryDescription,
        location: currentFormData.location,
        website: currentFormData.website
      }

      console.log('🏢 [BrewerySetup] Creating tenant with data:', tenantData)
      const tenantResult = await tenantAPI.createTenant(tenantData)
      console.log('🏢 [BrewerySetup] Tenant creation result:', tenantResult)

      if (!tenantResult.data.success) {
        throw new Error(tenantResult.data.message || 'Failed to create brewery')
      }

      const tenant = tenantResult.data.data
      console.log('✅ [BrewerySetup] Tenant created successfully:', tenant)

      // Step 2: Create subscription if payment data exists (paid plan)
      if (currentFormData.paymentData && currentFormData.planType !== 'free') {
        console.log('💳 [BrewerySetup] Creating subscription for paid plan')
        const subscriptionRequest = {
          paymentMethodId: currentFormData.paymentData.paymentMethodId,
          planType: currentFormData.paymentData.planType,
          billingEmail: currentFormData.paymentData.billingEmail || user?.email,
          billingDetails: currentFormData.paymentData.billingDetails,
          tenantId: tenant.id
        }

        console.log('💰 [BrewerySetup] Subscription request:', subscriptionRequest)
        const subscriptionResult = await paymentAPI.createSubscription(subscriptionRequest)
        console.log('💰 [BrewerySetup] Subscription result:', subscriptionResult)

        if (!subscriptionResult.data.success) {
          throw new Error(subscriptionResult.data.message || 'Failed to create subscription')
        }

        console.log('✅ [BrewerySetup] Subscription created successfully')
      } else {
        console.log('📝 [BrewerySetup] Free plan selected, skipping subscription creation')
      }

      // Success - move to completion
      console.log('🎯 [BrewerySetup] Account creation complete, advancing to final step')

      // Ensure we're on the correct step before advancing
      console.log('📍 [BrewerySetup] Current step before advancement:', currentStep)

      // Advance to completion step (step 2)
      setCurrentStep(SETUP_STEPS.length - 1) // Go directly to completion step
      console.log('📍 [BrewerySetup] Advanced to completion step')

    } catch (error) {
      console.error('❌ [BrewerySetup] Account creation failed:', error)
      throw error
    }
  }

  const createAccountWithData = async () => {
    try {
      // Step 1: Create the tenant
      const tenantData = {
        name: formData.breweryName,
        description: formData.breweryDescription,
        location: formData.location,
        website: formData.website
      }

      const tenantResult = await tenantAPI.createTenant(tenantData)

      if (!tenantResult.data.success) {
        throw new Error(tenantResult.data.message || 'Failed to create brewery')
      }

      const tenant = tenantResult.data.data

      // Step 2: Create subscription if payment data exists (paid plan)

      if (formData.paymentData && formData.planType !== 'free') {
                const subscriptionRequest = {
          paymentMethodId: formData.paymentData.paymentMethodId,
          planType: formData.paymentData.planType,
          billingEmail: formData.paymentData.billingEmail || user?.email,
          billingDetails: formData.paymentData.billingDetails,
          tenantId: tenant.id
        }

                const subscriptionResult = await paymentAPI.createSubscription(subscriptionRequest)
        
        if (!subscriptionResult.data.success) {
          throw new Error(subscriptionResult.data.message || 'Failed to create subscription')
        }

              } else {
      }

      // Success - move to completion
      nextStep()
      nextStep() // Skip to complete step
    } catch (error) {
            throw error
    }
  }

  const handlePaymentComplete = async (paymentData) => {
    console.log('💳 [BrewerySetup] Payment completed, data:', paymentData)
    try {
      setLoading(true)
      setError('')

      // Store payment data and update plan type
      const updatedFormData = {
        ...formData,
        paymentData: paymentData,
        planType: paymentData.planType // Update plan type from payment data
      }

      console.log('📝 [BrewerySetup] Updated form data:', updatedFormData)
      setFormData(updatedFormData)

      // Create account with the updated data directly
      console.log('🏭 [BrewerySetup] Creating account with tenant and subscription')
      await createAccountWithDataDirect(updatedFormData)

      console.log('✅ [BrewerySetup] Account creation successful!')
      setLoading(false) // Reset loading state on success
    } catch (error) {
      console.error('❌ [BrewerySetup] Payment completion failed:', error)
      setError(error.message || 'Failed to process payment')
      setLoading(false)
      // Don't throw error - just show it to user
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
                {SETUP_STEPS.map((step, index) => (
                  <li key={step.id} className={`${index !== SETUP_STEPS.length - 1 ? 'pr-8 sm:pr-20' : ''} relative`}>
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
                    {index !== SETUP_STEPS.length - 1 && (
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
          {SETUP_STEPS[currentStep].id === 'brewery' && (
            <BreweryStep
              formData={formData}
              onChange={handleInputChange}
              error={error}
            />
          )}

          {SETUP_STEPS[currentStep].id === 'subscription' && (
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

          {SETUP_STEPS[currentStep].id === 'complete' && (
            <CompleteStep user={user} />
          )}

          {/* Navigation Buttons - Only show for steps that don't handle their own navigation */}
          {!['subscription'].includes(SETUP_STEPS[currentStep].id) && (
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
                {currentStep === SETUP_STEPS.length - 1 ? 'Get Started' : 'Continue'}
              </FormButton>
            </div>
          )}
        </div>
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
          placeholder="Enter your brewery name"
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
          placeholder="City, State or Region"
        />

        <FormField
          label="Website"
          name="website"
          type="url"
          value={formData.website}
          onChange={onChange}
          placeholder="https://yourbrewery.com"
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