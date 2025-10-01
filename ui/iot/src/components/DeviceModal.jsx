import { useState, useEffect } from 'react'
import {
  XMarkIcon,
  FireIcon,
  BeakerIcon,
  CircleStackIcon,
  ArrowPathIcon,
  ChartBarIcon,
  BoltIcon,
  WifiIcon,
  SignalSlashIcon,
  ExclamationTriangleIcon,
  CalendarIcon,
  MapPinIcon,
  ArrowUpIcon
} from '@heroicons/react/24/outline'

function DeviceModal({ device, onClose }) {
  const [historicalData, setHistoricalData] = useState([])

  useEffect(() => {
    // Generate some mock historical data
    const generateHistoricalData = () => {
      const data = []
      const now = new Date()
      for (let i = 23; i >= 0; i--) {
        const timestamp = new Date(now.getTime() - i * 60 * 60 * 1000) // Last 24 hours
        const variation = (Math.random() - 0.5) * 0.1
        data.push({
          timestamp,
          value: device.value + (device.value * variation),
          status: Math.random() > 0.9 ? 'warning' : 'online'
        })
      }
      return data
    }

    setHistoricalData(generateHistoricalData())
  }, [device])

  const getDeviceIcon = (type) => {
    switch (type) {
      case 'temperature':
        return <FireIcon className="w-6 h-6" />
      case 'ph':
        return <BeakerIcon className="w-6 h-6" />
      case 'pressure':
        return <CircleStackIcon className="w-6 h-6" />
      case 'flow':
        return <ArrowPathIcon className="w-6 h-6" />
      case 'level':
        return <ChartBarIcon className="w-6 h-6" />
      default:
        return <CircleStackIcon className="w-6 h-6" />
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'online':
        return 'text-success-500'
      case 'warning':
        return 'text-warning-500'
      case 'error':
        return 'text-danger-500'
      case 'offline':
        return 'text-gray-400'
      default:
        return 'text-gray-400'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'online':
        return <WifiIcon className="w-5 h-5 text-success-500" />
      case 'warning':
        return <ExclamationTriangleIcon className="w-5 h-5 text-warning-500" />
      case 'error':
        return <SignalSlashIcon className="w-5 h-5 text-danger-500" />
      case 'offline':
        return <SignalSlashIcon className="w-5 h-5 text-gray-400" />
      default:
        return <SignalSlashIcon className="w-5 h-5 text-gray-400" />
    }
  }

  const getBatteryIcon = (batteryLevel) => {
    if (batteryLevel < 20) {
      return <BoltIcon className="w-5 h-5 text-danger-500" />
    }
    return <BoltIcon className="w-5 h-5 text-gray-500" />
  }

  const formatValue = (value, unit) => {
    if (typeof value === 'number') {
      return `${value.toFixed(1)}${unit}`
    }
    return `${value}${unit}`
  }

  const formatTimestamp = (timestamp) => {
    return timestamp.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const calculateTrend = () => {
    if (historicalData.length < 2) return 0
    const recent = historicalData.slice(-3).map(d => d.value)
    const older = historicalData.slice(-6, -3).map(d => d.value)
    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length
    const olderAvg = older.reduce((a, b) => a + b, 0) / older.length
    return ((recentAvg - olderAvg) / olderAvg * 100)
  }

  const trend = calculateTrend()

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <div className={`p-3 rounded-lg bg-gray-50 ${getStatusColor(device.status)}`}>
              {getDeviceIcon(device.type)}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {device.name}
              </h2>
              <div className="flex items-center space-x-2 text-gray-500">
                <MapPinIcon className="w-4 h-4" />
                <span>{device.location}</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Status Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            {/* Current Value */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm text-gray-500 mb-1">Current Reading</div>
              <div className="text-2xl font-bold text-gray-900">
                {formatValue(device.value, device.unit)}
              </div>
              <div className="flex items-center mt-2 text-sm">
                <ArrowUpIcon className={`w-4 h-4 mr-1 ${trend >= 0 ? 'text-success-500' : 'text-danger-500'}`} />
                <span className={trend >= 0 ? 'text-success-600' : 'text-danger-600'}>
                  {Math.abs(trend).toFixed(1)}% {trend >= 0 ? 'increase' : 'decrease'}
                </span>
              </div>
            </div>

            {/* Status */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm text-gray-500 mb-1">Status</div>
              <div className="flex items-center space-x-2">
                {getStatusIcon(device.status)}
                <span className="font-medium capitalize">
                  {device.status}
                </span>
              </div>
            </div>

            {/* Battery */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm text-gray-500 mb-1">Battery Level</div>
              <div className="flex items-center space-x-2">
                {getBatteryIcon(device.batteryLevel)}
                <span className="font-medium">
                  {Math.round(device.batteryLevel)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div
                  className={`h-2 rounded-full ${
                    device.batteryLevel > 50 ? 'bg-success-500' :
                    device.batteryLevel > 20 ? 'bg-warning-500' : 'bg-danger-500'
                  }`}
                  style={{ width: `${device.batteryLevel}%` }}
                ></div>
              </div>
            </div>

            {/* Last Update */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm text-gray-500 mb-1">Last Update</div>
              <div className="flex items-center space-x-2">
                <CalendarIcon className="w-4 h-4 text-gray-400" />
                <span className="font-medium">
                  {device.lastUpdate.toLocaleTimeString()}
                </span>
              </div>
            </div>
          </div>

          {/* Historical Data Chart */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              24-Hour History
            </h3>
            <div className="h-64 flex items-end space-x-1">
              {historicalData.map((data, index) => (
                <div
                  key={index}
                  className="flex-1 flex flex-col items-center"
                  title={`${formatValue(data.value, device.unit)} at ${formatTimestamp(data.timestamp)}`}
                >
                  <div
                    className={`w-full rounded-t ${
                      data.status === 'warning' ? 'bg-warning-400' : 'bg-primary-400'
                    } transition-all duration-300 hover:opacity-80`}
                    style={{
                      height: `${Math.max(10, (data.value / Math.max(...historicalData.map(d => d.value))) * 100)}%`
                    }}
                  ></div>
                  {index % 4 === 0 && (
                    <div className="text-xs text-gray-500 mt-1 transform -rotate-45 origin-left">
                      {formatTimestamp(data.timestamp)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Device Details */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Device Information</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Device ID:</span>
                  <span className="font-mono">{device.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Type:</span>
                  <span className="capitalize">{device.type} Sensor</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Location:</span>
                  <span>{device.location}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Unit:</span>
                  <span>{device.unit}</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Operational Ranges</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Normal Range:</span>
                  <span className="text-success-600">
                    {device.type === 'temperature' ? '65-72°F' :
                     device.type === 'ph' ? '4.5-6.0 pH' :
                     device.type === 'pressure' ? '800-900 psi' :
                     device.type === 'flow' ? '1.5-3.0 gal/min' :
                     device.type === 'level' ? '20-90%' : 'Variable'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Warning Range:</span>
                  <span className="text-warning-600">
                    {device.type === 'temperature' ? '60-65°F, 72-75°F' :
                     device.type === 'ph' ? '4.0-4.5 pH, 6.0-6.5 pH' :
                     device.type === 'pressure' ? '750-800 psi, 900-950 psi' :
                     device.type === 'flow' ? '1.0-1.5 gal/min, 3.0-4.0 gal/min' :
                     device.type === 'level' ? '10-20%, 90-95%' : 'Variable'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Critical Range:</span>
                  <span className="text-danger-600">
                    {device.type === 'temperature' ? '<60°F, >75°F' :
                     device.type === 'ph' ? '<4.0 pH, >6.5 pH' :
                     device.type === 'pressure' ? '<750 psi, >950 psi' :
                     device.type === 'flow' ? '<1.0 gal/min, >4.0 gal/min' :
                     device.type === 'level' ? '<10%, >95%' : 'Variable'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DeviceModal