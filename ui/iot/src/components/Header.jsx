import { PlayIcon, PauseIcon, ChartBarIcon, WifiIcon, SignalSlashIcon } from '@heroicons/react/24/outline'

function Header({ isRunning, onToggleSimulation, deviceCount, onlineCount, activeTab, onTabChange }) {
  const offlineCount = deviceCount - onlineCount

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <ChartBarIcon className="w-8 h-8 text-primary-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Fermentum IoT Simulator
                </h1>
                <p className="text-sm text-gray-500">
                  Brewery Device Monitoring & Testing System
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-6">
            {/* Device Status - Only show on devices tab */}
            {activeTab === 'devices' && (
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-1">
                  <WifiIcon className="w-4 h-4 text-success-500" />
                  <span className="text-sm font-medium text-gray-700">
                    {onlineCount} Online
                  </span>
                </div>
                {offlineCount > 0 && (
                  <div className="flex items-center space-x-1">
                    <SignalSlashIcon className="w-4 h-4 text-danger-500" />
                    <span className="text-sm font-medium text-gray-700">
                      {offlineCount} Offline
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Simulation Control - Only show on devices tab */}
            {activeTab === 'devices' && (
              <div className="flex items-center space-x-3">
                <span className={`text-sm font-medium ${
                  isRunning ? 'text-success-600' : 'text-gray-500'
                }`}>
                  {isRunning ? 'Simulation Running' : 'Simulation Stopped'}
                </span>
                <button
                  onClick={onToggleSimulation}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                    isRunning
                      ? 'bg-danger-500 hover:bg-danger-600 text-white'
                      : 'bg-success-500 hover:bg-success-600 text-white'
                  }`}
                >
                  {isRunning ? (
                    <>
                      <PauseIcon className="w-4 h-4" />
                      <span>Stop</span>
                    </>
                  ) : (
                    <>
                      <PlayIcon className="w-4 h-4" />
                      <span>Start</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mt-4 flex space-x-1 border-b border-gray-200">
          <button
            onClick={() => onTabChange('devices')}
            className={`px-4 py-2 font-medium text-sm transition-colors relative ${
              activeTab === 'devices'
                ? 'text-primary-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            IoT Device Simulator
            {activeTab === 'devices' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600" />
            )}
          </button>
          <button
            onClick={() => onTabChange('lot-alerts')}
            className={`px-4 py-2 font-medium text-sm transition-colors relative ${
              activeTab === 'lot-alerts'
                ? 'text-primary-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Lot Alert Simulator
            {activeTab === 'lot-alerts' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600" />
            )}
          </button>
        </div>
      </div>
    </header>
  )
}

export default Header