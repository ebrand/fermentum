import React from 'react'
import { useBreweryDrawer } from '../contexts/BreweryDrawerContext'
import BreweryOperationsDrawer from './BreweryOperationsDrawer'

const BreweryOperationsWrapper = () => {
  const { isDrawerOpen, openDrawer, closeDrawer } = useBreweryDrawer()

  return (
    <>
      {/* The drawer component now handles its own tab button */}
      <BreweryOperationsDrawer isOpen={isDrawerOpen} onClose={closeDrawer} onOpen={openDrawer} />
    </>
  )
}

export default BreweryOperationsWrapper