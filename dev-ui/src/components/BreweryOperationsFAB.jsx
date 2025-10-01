import React from 'react'
import { useBreweryDrawer } from '../contexts/BreweryDrawerContext'
import { BuildingOfficeIcon } from '@heroicons/react/24/outline'

const BreweryOperationsFAB = () => {
  const { toggleDrawer } = useBreweryDrawer()

  return (
    <button
      onClick={toggleDrawer}
      className="fixed bottom-6 right-6 z-30 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-lg transition-all duration-200 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      title="Brewery Operations"
    >
      <BuildingOfficeIcon className="h-6 w-6" />
    </button>
  )
}

export default BreweryOperationsFAB