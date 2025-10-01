import {
  FireIcon,
  BeakerIcon,
  CircleStackIcon,
  ArrowPathIcon,
  ChartBarIcon,
  BoltIcon,
  ExclamationTriangleIcon,
  WifiIcon,
  SignalSlashIcon,
  ExclamationTriangleIcon as AlertTriangleIcon
} from '@heroicons/react/24/outline'

function DeviceCard({ device, onClick }) {
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

  const getCardBorderColor = (status) => {
    switch (status) {
      case 'online':
        return 'border-success-200 hover:border-success-300'
      case 'warning':
        return 'border-warning-200 hover:border-warning-300'
      case 'error':
        return 'border-danger-200 hover:border-danger-300'
      case 'offline':
        return 'border-gray-200 hover:border-gray-300'
      default:
        return 'border-gray-200 hover:border-gray-300'
    }
  }

  const formatValue = (value, unit) => {
    if (typeof value === 'number') {
      return `${value.toFixed(1)}${unit}`
    }
    return `${value}${unit}`
  }

  const getBatteryIcon = (batteryLevel) => {
    if (batteryLevel < 20) {
      return <BoltIcon className="w-4 h-4 text-danger-500" />
    }
    return <BoltIcon className="w-4 h-4 text-gray-500" />
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'online':
        return <WifiIcon className="w-4 h-4 text-success-500" />
      case 'warning':
        return <AlertTriangleIcon className="w-4 h-4 text-warning-500" />
      case 'error':
        return <SignalSlashIcon className="w-4 h-4 text-danger-500" />
      case 'offline':
        return <SignalSlashIcon className="w-4 h-4 text-gray-400" />
      default:
        return <SignalSlashIcon className="w-4 h-4 text-gray-400" />
    }
  }

  const timeAgo = (date) => {
    const seconds = Math.floor((new Date() - date) / 1000)

    if (seconds < 60) return `${seconds}s ago`
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    return `${days}d ago`
  }

  return (
    <div
      className={`bg-white rounded-lg border-2 p-6 cursor-pointer transition-all duration-200 hover:shadow-lg ${getCardBorderColor(device.status)}`}
      onClick={onClick}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className={`p-2 rounded-lg bg-gray-50 ${getStatusColor(device.status)}`}>
          {getDeviceIcon(device.type)}
        </div>
        <div className="flex items-center space-x-2">
          {getStatusIcon(device.status)}
          {getBatteryIcon(device.batteryLevel)}
        </div>
      </div>

      {/* Device Name */}
      <h3 className="font-semibold text-gray-900 mb-1 text-lg">
        {device.name}
      </h3>

      {/* Location */}
      <p className="text-sm text-gray-500 mb-4">
        {device.location}
      </p>

      {/* Value Display */}
      <div className="mb-4">
        <div className="text-3xl font-bold text-gray-900 mb-1">
          {formatValue(device.value, device.unit)}
        </div>
        <div className="text-sm text-gray-500">
          Current Reading
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-gray-500 pt-4 border-t border-gray-100">
        <div className="flex items-center space-x-1">
          <span>Battery:</span>
          <span className={device.batteryLevel < 20 ? 'text-danger-600 font-medium' : ''}>
            {Math.round(device.batteryLevel)}%
          </span>
        </div>
        <div>
          {timeAgo(device.lastUpdate)}
        </div>
      </div>
    </div>
  )
}

export default DeviceCard