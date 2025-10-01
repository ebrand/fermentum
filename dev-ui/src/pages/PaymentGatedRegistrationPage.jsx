import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSession } from '../contexts/SessionContext'
import { authAPI } from '../utils/api'
import { CheckIcon } from '@heroicons/react/24/solid'
import {
  UserIcon,
  CreditCardIcon,
  BuildingOfficeIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'
import { FormField, FormButton } from '../components/forms'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js'

// Initialize Stripe (replace with your publishable key from CLAUDE.md)
const stripePromise = loadStripe('pk_test_51S9841S4Vkg3juZc0uHOaNnNBJrFfyhetvmmIoRbCEdxnnwKnCZTtQAMg9Rq38kLVq71TqSt1d0TtXBTOOw1qfOw00vYAcStzo')

const REGISTRATION_STEPS = [
  { id: 'profile', title: 'Profile', icon: UserIcon },
  { id: 'payment', title: 'Payment', icon: CreditCardIcon },
  { id: 'brewery', title: 'Brewery', icon: BuildingOfficeIcon },
  { id: 'complete', title: 'Complete', icon: CheckCircleIcon }
]

const PLANS = [
  {
    id: 'starter',
    name: 'Starter',
    price: 'Free',
    description: 'Perfect for getting started',
    features: [
      'Basic brewery management',
      'Up to 50 batches per month',
      'Standard reporting',
      'Email support'
    ]
  },
  {
    id: 'professional',
    name: 'Professional',
    price: '$49/month',
    description: 'For growing breweries',
    features: [
      'Advanced brewery management',
      'Unlimited batches',
      'Advanced analytics',
      'Priority support',
      'Custom branding'
    ]
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: '$149/month',
    description: 'For established operations',
    features: [
      'Full brewery suite',
      'Multi-location support',
      'API access',
      'Dedicated support',
      'Custom integrations'
    ]
  }
]

function ProgressIndicator({ currentStep, steps }) {
  return (
    <div className="flex items-center justify-center mb-8">
      {steps.map((step, index) => {
        const isCompleted = index < currentStep
        const isCurrent = index === currentStep
        const IconComponent = step.icon

        return (
          <React.Fragment key={step.id}>
            <div className="flex flex-col items-center">
              <div className={`
                flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-200
                ${isCompleted
                  ? 'bg-green-500 border-green-500 text-white'
                  : isCurrent
                    ? 'border-blue-500 text-blue-500 bg-blue-50'
                    : 'border-gray-300 text-gray-400'
                }
              `}>
                {isCompleted ? (
                  <CheckIcon className="w-5 h-5" />
                ) : (
                  <IconComponent className="w-5 h-5" />
                )}
              </div>
              <span className={`
                mt-2 text-sm font-medium
                ${isCurrent ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-400'}
              `}>
                {step.title}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div className={`
                flex-1 h-0.5 mx-4 transition-all duration-200
                ${isCompleted ? 'bg-green-500' : 'bg-gray-200'}
              `} />
            )}
          </React.Fragment>
        )
      })}
    </div>
  )
}

function ProfileStep({ formData, onChange, onNext, errors }) {
  const [validation, setValidation] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false,
    noCommonPatterns: false,
    notSequential: false,
    notKeyboard: false,
    mixedCase: false,
    multipleNumbers: false,
    multipleSpecial: false
  })

  const validatePassword = (password) => {
    const validation = {
      length: password.length >= 12,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    }

    const advancedChecks = {
      noCommonPatterns: !/(.)\1{2,}/.test(password),
      notSequential: !/(?:abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz|123|234|345|456|567|678|789|890)/i.test(password),
      notKeyboard: !/(?:qwe|wer|ert|rty|tyu|yui|uio|iop|asd|sdf|dfg|fgh|ghj|hjk|jkl|zxc|xcv|cvb|vbn|bnm)/i.test(password),
      mixedCase: /[A-Z]/.test(password) && /[a-z]/.test(password),
      multipleNumbers: (password.match(/\d/g) || []).length >= 2,
      multipleSpecial: (password.match(/[!@#$%^&*(),.?":{}|<>]/g) || []).length >= 2,
    }

    const allValidation = { ...validation, ...advancedChecks }
    setValidation(allValidation)
    return Object.values(allValidation).every(Boolean)
  }

  const handlePasswordChange = (e) => {
    const password = e.target.value
    onChange(e)
    validatePassword(password)
  }

  const displayedCriteria = [
    { key: 'length', label: '12+ characters' },
    { key: 'uppercase', label: 'Uppercase letter' },
    { key: 'lowercase', label: 'Lowercase letter' },
    { key: 'number', label: 'Number' },
    { key: 'special', label: 'Special character' },
    { key: 'noCommonPatterns', label: 'No repeated characters (aaa)' },
    { key: 'notSequential', label: 'No sequences (abc, 123)' },
    { key: 'notKeyboard', label: 'No keyboard patterns (qwe)' }
  ]

  const isValid = displayedCriteria.every(criteria => validation[criteria.key]) &&
                  formData.firstName && formData.lastName && formData.email && formData.password

  return (
    <div className="max-w-md mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Create Your Profile</h2>
        <p className="text-gray-600">Let's start with your basic information</p>
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            label="First Name"
            type="text"
            name="firstName"
            value={formData.firstName}
            onChange={onChange}
            required
            error={errors.firstName}
          />
          <FormField
            label="Last Name"
            type="text"
            name="lastName"
            value={formData.lastName}
            onChange={onChange}
            required
            error={errors.lastName}
          />
        </div>

        <FormField
          label="Email"
          type="email"
          name="email"
          value={formData.email}
          onChange={onChange}
          required
          error={errors.email}
        />

        <FormField
          label="Password"
          type="password"
          name="password"
          value={formData.password}
          onChange={handlePasswordChange}
          required
          error={errors.password}
        />

        {formData.password && (
          <div className="mt-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Password Requirements:</h4>
            <div className="grid grid-cols-1 gap-2">
              {displayedCriteria.map(({ key, label }) => (
                <div key={key} className={`flex items-center text-sm ${
                  validation[key] ? 'text-green-600' : 'text-gray-500'
                }`}>
                  <CheckIcon className={`w-4 h-4 mr-2 ${
                    validation[key] ? 'text-green-500' : 'text-gray-300'
                  }`} />
                  {label}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="mt-8">
        <FormButton
          onClick={onNext}
          disabled={!isValid}
          className="w-full"
        >
          Continue to Payment
        </FormButton>
      </div>
    </div>
  )
}

function PaymentStep({ formData, onChange, onNext, onBack, errors }) {
  const [selectedPlan, setSelectedPlan] = useState(formData.planType || 'starter')

  const handlePlanSelect = (planId) => {
    setSelectedPlan(planId)
    onChange({ target: { name: 'planType', value: planId } })
  }

  const handleNext = () => {
    // For starter plan, skip payment details
    if (selectedPlan === 'starter') {
      onNext()
      return
    }

    // For paid plans, validate billing details
    if (!formData.billingEmail || !formData.billingFirstName || !formData.billingLastName) {
      return
    }

    onNext()
  }

  const needsPayment = selectedPlan !== 'starter'
  const isValid = selectedPlan === 'starter' ||
    (formData.billingEmail && formData.billingFirstName && formData.billingLastName)

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Choose Your Plan</h2>
        <p className="text-gray-600">Select the plan that fits your brewery's needs</p>
      </div>

      {/* Plan Selection */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {PLANS.map((plan) => (
          <div
            key={plan.id}
            className={`border rounded-lg p-6 cursor-pointer transition-all duration-200 ${
              selectedPlan === plan.id
                ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => handlePlanSelect(plan.id)}
          >
            <div className="text-center">
              <h3 className="text-lg font-semibold text-gray-900">{plan.name}</h3>
              <p className="text-2xl font-bold text-blue-600 mt-2">{plan.price}</p>
              <p className="text-gray-600 mt-2">{plan.description}</p>
            </div>

            <ul className="mt-4 space-y-2">
              {plan.features.map((feature, index) => (
                <li key={index} className="flex items-center text-sm text-gray-600">
                  <CheckIcon className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                  {feature}
                </li>
              ))}
            </ul>

            {plan.id !== 'starter' && (
              <div className="mt-4 text-center">
                <span className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                  14-day free trial
                </span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Billing Details for Paid Plans */}
      {needsPayment && (
        <div className="border rounded-lg p-6 bg-gray-50">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Billing Information</h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <FormField
              label="First Name"
              type="text"
              name="billingFirstName"
              value={formData.billingFirstName}
              onChange={onChange}
              required
              error={errors.billingFirstName}
            />
            <FormField
              label="Last Name"
              type="text"
              name="billingLastName"
              value={formData.billingLastName}
              onChange={onChange}
              required
              error={errors.billingLastName}
            />
          </div>
          <FormField
            label="Billing Email"
            type="email"
            name="billingEmail"
            value={formData.billingEmail}
            onChange={onChange}
            required
            error={errors.billingEmail}
          />

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
            <div className="border border-gray-300 rounded-md p-3 bg-white">
              <CardElement
                options={{
                  style: {
                    base: {
                      fontSize: '16px',
                      color: '#424770',
                      '::placeholder': {
                        color: '#aab7c4',
                      },
                    },
                  },
                }}
              />
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between mt-8">
        <FormButton
          onClick={onBack}
          variant="secondary"
        >
          Back
        </FormButton>
        <FormButton
          onClick={handleNext}
          disabled={!isValid}
        >
          Continue to Brewery Setup
        </FormButton>
      </div>
    </div>
  )
}

function BreweryStep({ formData, onChange, onNext, onBack, errors }) {
  const isValid = formData.breweryName

  return (
    <div className="max-w-md mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Setup Your Brewery</h2>
        <p className="text-gray-600">Tell us about your brewery</p>
      </div>

      <div className="space-y-4">
        <FormField
          label="Brewery Name"
          type="text"
          name="breweryName"
          value={formData.breweryName}
          onChange={onChange}
          required
          error={errors.breweryName}
          placeholder="e.g. Sunset Craft Brewing"
        />

        <FormField
          label="Description (Optional)"
          type="textarea"
          name="breweryDescription"
          value={formData.breweryDescription}
          onChange={onChange}
          error={errors.breweryDescription}
          placeholder="Tell us about your brewery..."
          rows={3}
        />

        <FormField
          label="Website (Optional)"
          type="url"
          name="breweryWebsite"
          value={formData.breweryWebsite}
          onChange={onChange}
          error={errors.breweryWebsite}
          placeholder="https://your-brewery.com"
        />

        <FormField
          label="Address (Optional)"
          type="text"
          name="breweryAddress"
          value={formData.breweryAddress}
          onChange={onChange}
          error={errors.breweryAddress}
          placeholder="123 Brewery St"
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            label="City (Optional)"
            type="text"
            name="breweryCity"
            value={formData.breweryCity}
            onChange={onChange}
            error={errors.breweryCity}
            placeholder="Portland"
          />
          <FormField
            label="State (Optional)"
            type="text"
            name="breweryState"
            value={formData.breweryState}
            onChange={onChange}
            error={errors.breweryState}
            placeholder="OR"
          />
        </div>

        <FormField
          label="ZIP Code (Optional)"
          type="text"
          name="breweryZipCode"
          value={formData.breweryZipCode}
          onChange={onChange}
          error={errors.breweryZipCode}
          placeholder="97201"
        />
      </div>

      <div className="flex justify-between mt-8">
        <FormButton
          onClick={onBack}
          variant="secondary"
        >
          Back
        </FormButton>
        <FormButton
          onClick={onNext}
          disabled={!isValid}
        >
          Complete Registration
        </FormButton>
      </div>
    </div>
  )
}

function CompleteStep({ formData }) {
  return (
    <div className="max-w-md mx-auto text-center">
      <div className="mb-8">
        <CheckCircleIcon className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome to Fermentum!</h2>
        <p className="text-gray-600">
          Your account has been created successfully. You'll be redirected to your brewery dashboard.
        </p>
      </div>

      <div className="bg-gray-50 rounded-lg p-4 text-left">
        <h3 className="font-semibold text-gray-900 mb-2">Account Summary:</h3>
        <ul className="space-y-1 text-sm text-gray-600">
          <li><strong>Name:</strong> {formData.firstName} {formData.lastName}</li>
          <li><strong>Email:</strong> {formData.email}</li>
          <li><strong>Brewery:</strong> {formData.breweryName}</li>
          <li><strong>Plan:</strong> {PLANS.find(p => p.id === formData.planType)?.name}</li>
        </ul>
      </div>
    </div>
  )
}

function PaymentGatedRegistrationContent() {
  const [currentStep, setCurrentStep] = useState(0)
  const [formData, setFormData] = useState({
    // Profile data
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    // Payment data
    planType: 'starter',
    billingFirstName: '',
    billingLastName: '',
    billingEmail: '',
    // Brewery data
    breweryName: '',
    breweryDescription: '',
    breweryWebsite: '',
    breweryAddress: '',
    breweryCity: '',
    breweryState: '',
    breweryZipCode: ''
  })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

  const { createSessionFromAuth } = useSession()
  const navigate = useNavigate()
  const stripe = useStripe()
  const elements = useElements()

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const handleNext = () => {
    setCurrentStep(prev => Math.min(prev + 1, REGISTRATION_STEPS.length - 1))
  }

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0))
  }

  const handleCompleteRegistration = async () => {
    setLoading(true)
    setErrors({})

    try {
      let paymentMethodId = null

      // Create payment method if not free plan
      if (formData.planType !== 'starter' && stripe && elements) {
        const cardElement = elements.getElement(CardElement)

        const { error, paymentMethod } = await stripe.createPaymentMethod({
          type: 'card',
          card: cardElement,
          billing_details: {
            name: `${formData.billingFirstName} ${formData.billingLastName}`,
            email: formData.billingEmail,
          },
        })

        if (error) {
          throw new Error(`Payment method creation failed: ${error.message}`)
        }

        paymentMethodId = paymentMethod.id
      }

      // Call the new payment-gated registration endpoint
      const response = await fetch('/api/auth/register-with-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          profile: {
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            password: formData.password
          },
          payment: {
            paymentMethodId,
            planType: formData.planType,
            billingDetails: {
              firstName: formData.billingFirstName || formData.firstName,
              lastName: formData.billingLastName || formData.lastName,
              email: formData.billingEmail || formData.email,
              address: formData.breweryAddress,
              city: formData.breweryCity,
              state: formData.breweryState,
              zipCode: formData.breweryZipCode,
              country: 'US'
            }
          },
          tenant: {
            name: formData.breweryName,
            description: formData.breweryDescription,
            website: formData.breweryWebsite,
            address: formData.breweryAddress,
            city: formData.breweryCity,
            state: formData.breweryState,
            zipCode: formData.breweryZipCode
          }
        })
      })

      const result = await response.json()

      if (!result.success) {
        throw new Error(result.message || 'Registration failed')
      }

      // Set authentication context
      login(result.data.accessToken, result.data.user, result.data.tenant)

      // Show completion step briefly, then redirect
      setCurrentStep(3)
      setTimeout(() => {
        navigate('/dashboard')
      }, 3000)

    } catch (error) {
      setErrors({ general: error.message })
    } finally {
      setLoading(false)
    }
  }

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <ProfileStep
            formData={formData}
            onChange={handleInputChange}
            onNext={handleNext}
            errors={errors}
          />
        )
      case 1:
        return (
          <PaymentStep
            formData={formData}
            onChange={handleInputChange}
            onNext={handleNext}
            onBack={handleBack}
            errors={errors}
          />
        )
      case 2:
        return (
          <BreweryStep
            formData={formData}
            onChange={handleInputChange}
            onNext={handleCompleteRegistration}
            onBack={handleBack}
            errors={errors}
          />
        )
      case 3:
        return <CompleteStep formData={formData} />
      default:
        return null
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Creating your account...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <ProgressIndicator currentStep={currentStep} steps={REGISTRATION_STEPS} />

        {errors.general && (
          <div className="max-w-md mx-auto mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-800 text-sm">{errors.general}</p>
          </div>
        )}

        {renderCurrentStep()}
      </div>
    </div>
  )
}

export default function PaymentGatedRegistrationPage() {
  return (
    <Elements stripe={stripePromise}>
      <PaymentGatedRegistrationContent />
    </Elements>
  )
}