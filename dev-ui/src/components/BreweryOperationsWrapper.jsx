import React from 'react'
import { useBreweryDrawer } from '../contexts/BreweryDrawerContext'
import BreweryOperationsDrawer from './BreweryOperationsDrawer'
import BreweryOperationsFAB from './BreweryOperationsFAB'

const BreweryOperationsWrapper = () => {
  const { isDrawerOpen, closeDrawer } = useBreweryDrawer()

  return (
    <>
      <BreweryOperationsFAB />
      <BreweryOperationsDrawer isOpen={isDrawerOpen} onClose={closeDrawer} />
    </>
  )
}

export default BreweryOperationsWrapper