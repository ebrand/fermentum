import React, { useState } from 'react'
import { useSession } from '../contexts/SessionContext'
import DashboardLayout from '../components/DashboardLayout'
import {
  BeakerIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  PlusIcon,
  EyeIcon,
  PencilIcon
} from '@heroicons/react/24/outline'

export default function ProductionBatchesPage() {
  const { user, currentTenant } = useSession()

  // Mock batch data
  const batches = [
    {
      id: 'BATCH-001',
      recipeName: 'West Coast IPA',
      status: 'fermenting',
      startDate: '2025-09-15',
      expectedCompletion: '2025-10-15',
      volume: '15 BBL',
      currentStage: 'Primary Fermentation',
      temperature: '68°F',
      gravity: '1.015',
      progress: 45
    },
    {
      id: 'BATCH-002',
      recipeName: 'Imperial Stout',
      status: 'conditioning',
      startDate: '2025-08-20',
      expectedCompletion: '2025-10-20',
      volume: '10 BBL',
      currentStage: 'Conditioning',
      temperature: '38°F',
      gravity: '1.008',
      progress: 85
    },
    {
      id: 'BATCH-003',
      recipeName: 'Session Lager',
      status: 'mashing',
      startDate: '2025-09-19',
      expectedCompletion: '2025-11-19',
      volume: '20 BBL',
      currentStage: 'Mashing',
      temperature: '152°F',
      gravity: '1.042',
      progress: 15
    },
    {
      id: 'BATCH-004',
      recipeName: 'Wheat Beer',
      status: 'completed',
      startDate: '2025-07-10',
      expectedCompletion: '2025-09-10',
      volume: '12 BBL',
      currentStage: 'Ready for Packaging',
      temperature: '35°F',
      gravity: '1.004',
      progress: 100
    }
  ]

  const getStatusBadge = (status) => {
    const badges = {
      mashing: 'bg-blue-100 text-blue-800',
      fermenting: 'bg-yellow-100 text-yellow-800',
      conditioning: 'bg-purple-100 text-purple-800',
      completed: 'bg-green-100 text-green-800',
      error: 'bg-red-100 text-red-800'
    }
    return badges[status] || 'bg-gray-100 text-gray-800'
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'mashing':
      case 'fermenting':
      case 'conditioning':
        return <ClockIcon className="h-4 w-4" />
      case 'completed':
        return <CheckCircleIcon className="h-4 w-4" />
      case 'error':
        return <ExclamationTriangleIcon className="h-4 w-4" />
      default:
        return <ClockIcon className="h-4 w-4" />
    }
  }

  return (
    <DashboardLayout
      title="Production Batches"
      subtitle="Monitor and manage your brewing batches"
      currentPage="Production"
    >
      <div className="w-full">
        {/* Header Actions */}
        <div className="flex justify-end mb-6">
          <button className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
            <PlusIcon className="h-4 w-4 mr-2" />
            Start New Batch
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <BeakerIcon className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Active Batches
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {batches.filter(b => b.status !== 'completed').length}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <ClockIcon className="h-6 w-6 text-yellow-600" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Fermenting
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {batches.filter(b => b.status === 'fermenting').length}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <CheckCircleIcon className="h-6 w-6 text-green-600" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Completed
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {batches.filter(b => b.status === 'completed').length}
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <BeakerIcon className="h-6 w-6 text-purple-600" />
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          Total Volume
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          57 BBL
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            </div>

        {/* Batches Table */}
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <div className="px-4 py-5 sm:px-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  All Batches
                </h3>
                <p className="mt-1 max-w-2xl text-sm text-gray-500">
                  Current brewing operations and batch status
                </p>
              </div>
              <ul className="divide-y divide-gray-200">
                {batches.map((batch) => (
                  <li key={batch.id}>
                    <div className="px-4 py-4 sm:px-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <BeakerIcon className="h-8 w-8 text-gray-400" />
                          </div>
                          <div className="ml-4">
                            <div className="flex items-center space-x-3">
                              <h4 className="text-lg font-medium text-gray-900">
                                {batch.recipeName}
                              </h4>
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(batch.status)}`}>
                                {getStatusIcon(batch.status)}
                                <span className="ml-1 capitalize">{batch.status}</span>
                              </span>
                            </div>
                            <p className="text-sm text-gray-500">
                              Batch ID: {batch.id} • {batch.volume} • Started {batch.startDate}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="text-right">
                            <p className="text-sm font-medium text-gray-900">{batch.currentStage}</p>
                            <p className="text-sm text-gray-500">
                              {batch.temperature} • SG: {batch.gravity}
                            </p>
                          </div>
                          <div className="flex-shrink-0">
                            <div className="w-16 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-fermentum-600 h-2 rounded-full"
                                style={{ width: `${batch.progress}%` }}
                              ></div>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">{batch.progress}%</p>
                          </div>
                          <div className="flex space-x-2">
                            <button className="text-gray-400 hover:text-gray-500">
                              <EyeIcon className="h-5 w-5" />
                            </button>
                            <button className="text-gray-400 hover:text-gray-500">
                              <PencilIcon className="h-5 w-5" />
                            </button>
                          </div>
                        </div>
                      </div>

                      {batch.status !== 'completed' && (
                        <div className="mt-4">
                          <div className="flex justify-between text-sm text-gray-500">
                            <span>Expected completion: {batch.expectedCompletion}</span>
                            <span>
                              {Math.ceil((new Date(batch.expectedCompletion) - new Date()) / (1000 * 60 * 60 * 24))} days remaining
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
        </div>
      </div>
    </DashboardLayout>
  )
}