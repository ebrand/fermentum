import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useSession } from '../contexts/SessionContext'
import {
  ChartBarIcon,
  UsersIcon,
  CogIcon,
  ArrowRightIcon,
  CheckIcon
} from '@heroicons/react/24/outline'

import {
  GrainIcon
 } from '../components/Icons'

 export default function LandingPage() {
  const navigate = useNavigate()
  const { isAuthenticated, invalidateSession } = useSession()

   const handleGetStarted = () => {
    if (isAuthenticated) {
      navigate('/tenant-selection')
    } else {
      navigate('/onboarding')
    }
  }

  const handleLogout = async () => {
    await invalidateSession()
    // Page will automatically update when auth state changes
  }

  const features = [
    {
      icon: GrainIcon,
      title: 'Recipe Management',
      description: 'Create, store, and scale your brewing recipes with precision. Track ingredients, processes, and variations.'
    },
    {
      icon: ChartBarIcon,
      title: 'Production Analytics',
      description: 'Monitor batch performance, track yields, and optimize your brewing processes with detailed analytics.'
    },
    {
      icon: UsersIcon,
      title: 'Team Collaboration',
      description: 'Coordinate with your brewing team, assign tasks, and maintain quality standards across all operations.'
    },
    {
      icon: CogIcon,
      title: 'Inventory Control',
      description: 'Manage raw materials, track usage, and automate reorder points to never run out of critical ingredients.'
    }
  ]

  const benefits = [
    'Reduce waste and optimize ingredient usage',
    'Maintain consistent quality across batches',
    'Scale operations with confidence',
    'Streamline regulatory compliance',
    'Increase profitability through data insights'
  ]

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-fermentum-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <GrainIcon className="h-10 w-10 text-gray-400" />
              <span className="-ml-2 text-2xl font-bold text-white">Fermentum</span>
            </div>
            <div className="flex items-center gap-3">
              {!isAuthenticated && (
                  <button
                    onClick={handleGetStarted}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-fermentum-800 bg-white hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white"
                  >
                    Sign Up or Sign In
                    <ArrowRightIcon className="ml-2 h-4 w-4" />
                  </button>
              )}
              {isAuthenticated && (
                <>
                  <button
                    onClick={handleLogout}
                    className="text-sm text-fermentum-200 hover:text-white"
                  >
                    Sign out
                  </button>
                  <button
                    onClick={handleGetStarted}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-fermentum-800 bg-white hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white"
                  >
                    Go to Dashboard
                    <ArrowRightIcon className="ml-2 h-4 w-4" />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-fermentum-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-6">
              Brew Better.
              <span className="block text-fermentum-200">Scale Smarter.</span>
            </h1>
            <p className="text-xl md:text-2xl text-fermentum-100 mb-8 max-w-3xl mx-auto">
              The complete brewery management platform designed for craft brewers who want to
              perfect their recipes, optimize operations, and grow their business.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={handleGetStarted}
                className="inline-flex items-center px-8 py-4 border border-transparent text-lg font-medium rounded-md text-fermentum-600 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white"
              >
                {isAuthenticated ? 'Go to Dashboard' : 'Start Your Free Trial'}
                <ArrowRightIcon className="ml-2 h-5 w-5" />
              </button>
              <button className="inline-flex items-center px-8 py-4 border-2 border-white text-lg font-medium rounded-md text-white hover:bg-white hover:text-fermentum-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white">
                Watch Demo
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4">
              Everything you need to run your brewery
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              From recipe development to production analytics, Fermentum gives you the tools
              to perfect your craft and grow your business.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-white rounded-lg p-6 shadow-md hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-center w-12 h-12 bg-fermentum-100 rounded-lg mb-4">
                  <feature.icon className="h-6 w-6 text-fermentum-800" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-6">
                Trusted by craft breweries nationwide
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                Join hundreds of successful breweries who have streamlined their operations
                and increased profitability with Fermentum's comprehensive management platform.
              </p>
              <ul className="space-y-4">
                {benefits.map((benefit, index) => (
                  <li key={index} className="flex items-start">
                    <CheckIcon className="h-6 w-6 text-green-500 mt-0.5 mr-3 flex-shrink-0" />
                    <span className="text-gray-700">{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-gray-100 rounded-lg p-8 text-center">
              <div className="bg-white rounded-lg p-6 shadow-md">
                <div className="text-4xl font-bold text-fermentum-800 mb-2">30-Day</div>
                <div className="text-gray-600 mb-4">Free Trial</div>
                <div className="text-sm text-gray-500 mb-6">
                  No credit card required. Full access to all features.
                </div>
                <button
                  onClick={handleGetStarted}
                  className="w-full inline-flex justify-center items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-fermentum-800 hover:bg-fermentum-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-fermentum-500"
                >
                  {isAuthenticated ? 'Go to Dashboard' : 'Get Started Now'}
                  <ArrowRightIcon className="ml-2 h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-fermentum-800 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4">
            Ready to transform your brewery?
          </h2>
          <p className="text-xl text-fermentum-100 mb-8 max-w-2xl mx-auto">
            Join the growing community of craft brewers who are scaling their operations
            and perfecting their craft with Fermentum.
          </p>
          <button
            onClick={handleGetStarted}
            className="inline-flex items-center px-8 py-4 border border-transparent text-lg font-medium rounded-md text-fermentum-600 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white"
          >
            {isAuthenticated ? 'Go to Dashboard' : 'Start Your Free Trial Today'}
            <ArrowRightIcon className="ml-2 h-5 w-5" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <GrainIcon className="h-6 w-6 text-white" />
              <span className="ml-2 text-lg font-semibold text-white">Fermentum</span>
            </div>
            <p className="text-gray-400">© 2025 Fermentum. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}