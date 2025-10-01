import { useState, useEffect } from 'react'
import DeviceGrid from './components/DeviceGrid'
import Header from './components/Header'
import DeviceModal from './components/DeviceModal'
import LotAlertSimulator from './components/LotAlertSimulator'

function App() {
  const [devices, setDevices] = useState([])
  const [selectedDevice, setSelectedDevice] = useState(null)
  const [isRunning, setIsRunning] = useState(false)
  const [activeTab, setActiveTab] = useState('devices') // 'devices' or 'lot-alerts'

  // Initialize devices on app start
  useEffect(() => {
    const initialDevices = [
      {
        id: 'temp-001',
        name: 'Fermenter 1 Temperature',
        type: 'temperature',
        location: 'Fermenter Tank 1',
        value: 68.5,
        unit: '°F',
        status: 'online',
        batteryLevel: 85,
        lastUpdate: new Date()
      },
      {
        id: 'ph-001',
        name: 'Mash Tun pH',
        type: 'ph',
        location: 'Mash Tun',
        value: 5.2,
        unit: 'pH',
        status: 'online',
        batteryLevel: 92,
        lastUpdate: new Date()
      },
      {
        id: 'flow-001',
        name: 'Wort Flow Rate',
        type: 'flow',
        location: 'Transfer Line 1',
        value: 2.3,
        unit: 'gal/min',
        status: 'online',
        batteryLevel: 78,
        lastUpdate: new Date()
      },
      {
        id: 'pressure-001',
        name: 'CO2 Tank Pressure',
        type: 'pressure',
        location: 'CO2 Storage',
        value: 850,
        unit: 'psi',
        status: 'online',
        batteryLevel: 95,
        lastUpdate: new Date()
      },
      {
        id: 'level-001',
        name: 'Bright Tank Level',
        type: 'level',
        location: 'Bright Tank 2',
        value: 75,
        unit: '%',
        status: 'online',
        batteryLevel: 67,
        lastUpdate: new Date()
      },
      {
        id: 'temp-002',
        name: 'Cold Storage Temperature',
        type: 'temperature',
        location: 'Cold Storage Room',
        value: 38.2,
        unit: '°F',
        status: 'warning',
        batteryLevel: 23,
        lastUpdate: new Date()
      }
    ]
    setDevices(initialDevices)
  }, [])

  // Simulate real-time data updates
  useEffect(() => {
    if (!isRunning) return

    const interval = setInterval(() => {
      setDevices(prevDevices =>
        prevDevices.map(device => ({
          ...device,
          value: generateRealisticValue(device),
          batteryLevel: Math.max(0, device.batteryLevel - Math.random() * 0.1),
          lastUpdate: new Date()
        }))
      )
    }, 2000) // Update every 2 seconds

    return () => clearInterval(interval)
  }, [isRunning])

  const generateRealisticValue = (device) => {
    const variation = 0.02 // 2% variation
    const currentValue = device.value
    const change = (Math.random() - 0.5) * variation * currentValue

    switch (device.type) {
      case 'temperature':
        return Math.max(32, Math.min(100, currentValue + change))
      case 'ph':
        return Math.max(3, Math.min(9, currentValue + change * 0.1))
      case 'flow':
        return Math.max(0, Math.min(10, currentValue + change))
      case 'pressure':
        return Math.max(0, Math.min(1000, currentValue + change))
      case 'level':
        return Math.max(0, Math.min(100, currentValue + change * 0.5))
      default:
        return currentValue + change
    }
  }

  const handleDeviceClick = (device) => {
    setSelectedDevice(device)
  }

  const handleCloseModal = () => {
    setSelectedDevice(null)
  }

  const toggleSimulation = () => {
    setIsRunning(!isRunning)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        isRunning={isRunning}
        onToggleSimulation={toggleSimulation}
        deviceCount={devices.length}
        onlineCount={devices.filter(d => d.status === 'online').length}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <main className="container mx-auto px-4 py-8">
        {activeTab === 'devices' ? (
          <DeviceGrid
            devices={devices}
            onDeviceClick={handleDeviceClick}
          />
        ) : (
          <LotAlertSimulator />
        )}
      </main>

      {selectedDevice && (
        <DeviceModal
          device={selectedDevice}
          onClose={handleCloseModal}
        />
      )}
    </div>
  )
}

export default App
