import React, { createContext, useContext, useState } from 'react'

const BreweryDrawerContext = createContext()

export const useBreweryDrawer = () => {
  const context = useContext(BreweryDrawerContext)
  if (!context) {
    throw new Error('useBreweryDrawer must be used within a BreweryDrawerProvider')
  }
  return context
}

export const BreweryDrawerProvider = ({ children }) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  const openDrawer = () => setIsDrawerOpen(true)
  const closeDrawer = () => setIsDrawerOpen(false)
  const toggleDrawer = () => setIsDrawerOpen(prev => !prev)

  const value = {
    isDrawerOpen,
    openDrawer,
    closeDrawer,
    toggleDrawer
  }

  return (
    <BreweryDrawerContext.Provider value={value}>
      {children}
    </BreweryDrawerContext.Provider>
  )
}

export default BreweryDrawerContext