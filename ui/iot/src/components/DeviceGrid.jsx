import DeviceCard from './DeviceCard'

function DeviceGrid({ devices, onDeviceClick }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {devices.map(device => (
        <DeviceCard
          key={device.id}
          device={device}
          onClick={() => onDeviceClick(device)}
        />
      ))}
    </div>
  )
}

export default DeviceGrid