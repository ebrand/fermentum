import React, { useState, useEffect } from 'react'
import { PlusIcon, PencilSquareIcon, TrashIcon, WrenchScrewdriverIcon, FunnelIcon } from '@heroicons/react/24/outline'
import { equipmentAPI, equipmentTypeAPI } from '../utils/api'
import DashboardLayout from '../components/DashboardLayout'
import Toast from '../components/common/Toast'
import ConfirmationModal from '../components/common/ConfirmationModal'
import Modal from '../components/common/Modal'

export default function EquipmentPage() {
  const [equipment, setEquipment] = useState([])
  const [equipmentTypes, setEquipmentTypes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' })
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, equipmentId: null, equipmentName: '' })
  const [showEquipmentModal, setShowEquipmentModal] = useState(false)
  const [editingEquipment, setEditingEquipment] = useState(null)
  const [filters, setFilters] = useState({ status: '', equipmentTypeId: '' })
  const [showFilters, setShowFilters] = useState(false)

  // Equipment form state
  const [formData, setFormData] = useState({
    name: '',
    equipmentTypeId: '',
    description: '',
    status: 'Available',
    capacity: '',
    capacityUnit: 'barrels',
    workingCapacity: '',
    serialNumber: '',
    manufacturer: '',
    model: '',
    purchaseDate: '',
    warrantyExpiration: '',
    lastMaintenanceDate: '',
    nextMaintenanceDate: '',
    maintenanceIntervalDays: 90,
    maintenanceNotes: '',
    location: ''
  })

  const statusOptions = ['Available', 'In Use', 'Cleaning', 'Maintenance', 'Offline']
  const capacityUnits = ['barrels', 'gallons', 'liters']

  useEffect(() => {
    loadData()
  }, [filters])

  const loadData = async () => {
    try {
      const [equipmentRes, typesRes] = await Promise.all([
        equipmentAPI.getEquipment(filters),
        equipmentTypeAPI.getEquipmentTypes()
      ])

      if (equipmentRes.data.success) {
        setEquipment(equipmentRes.data.data)
      }
      if (typesRes.data.success) {
        setEquipmentTypes(typesRes.data.data)
      }
    } catch (err) {
      setError('Failed to load equipment data')
      console.error('Error loading equipment:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateEquipment = () => {
    setEditingEquipment(null)
    setFormData({
      name: '',
      equipmentTypeId: '',
      description: '',
      status: 'Available',
      capacity: '',
      capacityUnit: 'barrels',
      workingCapacity: '',
      serialNumber: '',
      manufacturer: '',
      model: '',
      purchaseDate: '',
      warrantyExpiration: '',
      lastMaintenanceDate: '',
      nextMaintenanceDate: '',
      maintenanceIntervalDays: 90,
      maintenanceNotes: '',
      location: ''
    })
    setShowEquipmentModal(true)
  }

  const handleEditEquipment = (equip) => {
    setEditingEquipment(equip)
    setFormData({
      name: equip.name || '',
      equipmentTypeId: equip.equipmentTypeId || '',
      description: equip.description || '',
      status: equip.status || 'Available',
      capacity: equip.capacity || '',
      capacityUnit: equip.capacityUnit || 'barrels',
      workingCapacity: equip.workingCapacity || '',
      serialNumber: equip.serialNumber || '',
      manufacturer: equip.manufacturer || '',
      model: equip.model || '',
      purchaseDate: equip.purchaseDate ? equip.purchaseDate.split('T')[0] : '',
      warrantyExpiration: equip.warrantyExpiration ? equip.warrantyExpiration.split('T')[0] : '',
      lastMaintenanceDate: equip.lastMaintenanceDate ? equip.lastMaintenanceDate.split('T')[0] : '',
      nextMaintenanceDate: equip.nextMaintenanceDate ? equip.nextMaintenanceDate.split('T')[0] : '',
      maintenanceIntervalDays: equip.maintenanceIntervalDays || 90,
      maintenanceNotes: equip.maintenanceNotes || '',
      location: equip.location || ''
    })
    setShowEquipmentModal(true)
  }

  const handleSaveEquipment = async () => {
    try {
      const payload = {
        ...formData,
        capacity: formData.capacity ? parseFloat(formData.capacity) : null,
        workingCapacity: formData.workingCapacity ? parseFloat(formData.workingCapacity) : null,
        maintenanceIntervalDays: formData.maintenanceIntervalDays ? parseInt(formData.maintenanceIntervalDays) : null,
        purchaseDate: formData.purchaseDate || null,
        warrantyExpiration: formData.warrantyExpiration || null,
        lastMaintenanceDate: formData.lastMaintenanceDate || null,
        nextMaintenanceDate: formData.nextMaintenanceDate || null
      }

      if (editingEquipment) {
        await equipmentAPI.updateEquipment(editingEquipment.equipmentId, payload)
        setToast({ show: true, message: 'Equipment updated successfully', type: 'success' })
      } else {
        await equipmentAPI.createEquipment(payload)
        setToast({ show: true, message: 'Equipment created successfully', type: 'success' })
      }

      setShowEquipmentModal(false)
      await loadData()
    } catch (err) {
      console.error('Error saving equipment:', err)
      setToast({ show: true, message: 'Failed to save equipment. Please try again.', type: 'error' })
    }
  }

  const handleDeleteEquipment = (equipmentId, equipmentName) => {
    setDeleteConfirm({ show: true, equipmentId, equipmentName })
  }

  const confirmDelete = async () => {
    try {
      await equipmentAPI.deleteEquipment(deleteConfirm.equipmentId)
      await loadData()
      setToast({ show: true, message: 'Equipment deleted successfully', type: 'success' })
    } catch (err) {
      console.error('Error deleting equipment:', err)
      setToast({ show: true, message: 'Failed to delete equipment. Please try again.', type: 'error' })
    }
  }

  const handleStatusChange = async (equipmentId, newStatus) => {
    try {
      await equipmentAPI.updateEquipmentStatus(equipmentId, newStatus)
      await loadData()
      setToast({ show: true, message: 'Equipment status updated', type: 'success' })
    } catch (err) {
      console.error('Error updating status:', err)
      setToast({ show: true, message: 'Failed to update status', type: 'error' })
    }
  }

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'Available':
        return 'bg-green-100 text-green-800'
      case 'In Use':
        return 'bg-blue-100 text-blue-800'
      case 'Cleaning':
        return 'bg-yellow-100 text-yellow-800'
      case 'Maintenance':
        return 'bg-orange-100 text-orange-800'
      case 'Offline':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const isMaintenanceDue = (equipment) => {
    if (!equipment.nextMaintenanceDate) return false
    const dueDate = new Date(equipment.nextMaintenanceDate)
    const today = new Date()
    const daysUntilDue = Math.floor((dueDate - today) / (1000 * 60 * 60 * 24))
    return daysUntilDue <= 7 && daysUntilDue >= 0
  }

  const isMaintenanceOverdue = (equipment) => {
    if (!equipment.nextMaintenanceDate) return false
    return new Date(equipment.nextMaintenanceDate) < new Date()
  }

  // Group equipment by type
  const groupedEquipment = equipmentTypes.map(type => ({
    type,
    items: equipment.filter(e => e.equipmentTypeId === type.equipmentTypeId)
  })).filter(group => group.items.length > 0)

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading equipment...</div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="max-w-9xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Equipment Management</h1>
            <p className="text-sm text-gray-600 mt-1">
              Manage brewery equipment, track maintenance, and monitor availability
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <FunnelIcon className="h-5 w-5 mr-2" />
              Filters
            </button>
            <button
              onClick={handleCreateEquipment}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-fermentum-800 hover:bg-fermentum-700"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              New Equipment
            </button>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="">All Statuses</option>
                  {statusOptions.map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Equipment Type</label>
                <select
                  value={filters.equipmentTypeId}
                  onChange={(e) => setFilters({ ...filters, equipmentTypeId: e.target.value })}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="">All Types</option>
                  {equipmentTypes.map(type => (
                    <option key={type.equipmentTypeId} value={type.equipmentTypeId}>{type.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Equipment List - Grouped by Type */}
        {equipment.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <WrenchScrewdriverIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No equipment yet</h3>
            <p className="text-sm text-gray-600 mb-6">
              Get started by adding your brewery equipment
            </p>
            <button
              onClick={handleCreateEquipment}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Add Your First Equipment
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {groupedEquipment.map(group => (
              <div key={group.type.equipmentTypeId} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                {/* Equipment Type Header */}
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">{group.type.name}</h3>
                  <p className="text-sm text-gray-600">{group.items.length} item{group.items.length !== 1 ? 's' : ''}</p>
                </div>

                {/* Equipment Table */}
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Capacity</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Maintenance</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {group.items.map((equip) => (
                        <tr key={equip.equipmentId} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{equip.name}</div>
                              {equip.description && (
                                <div className="text-xs text-gray-500 truncate max-w-xs">{equip.description}</div>
                              )}
                              {(equip.manufacturer || equip.model) && (
                                <div className="text-xs text-gray-500">
                                  {equip.manufacturer} {equip.model}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <select
                              value={equip.status}
                              onChange={(e) => handleStatusChange(equip.equipmentId, e.target.value)}
                              className={`text-xs px-2 py-1 rounded-full font-semibold ${getStatusBadgeColor(equip.status)}`}
                            >
                              {statusOptions.map(status => (
                                <option key={status} value={status}>{status}</option>
                              ))}
                            </select>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">
                              {equip.capacity ? `${equip.capacity} ${equip.capacityUnit}` : '-'}
                            </div>
                            {equip.workingCapacity && (
                              <div className="text-xs text-gray-500">
                                Working: {equip.workingCapacity} {equip.capacityUnit}
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{equip.location || '-'}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {isMaintenanceOverdue(equip) ? (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                                Overdue
                              </span>
                            ) : isMaintenanceDue(equip) ? (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">
                                Due Soon
                              </span>
                            ) : equip.nextMaintenanceDate ? (
                              <div className="text-xs text-gray-500">
                                Due: {new Date(equip.nextMaintenanceDate).toLocaleDateString()}
                              </div>
                            ) : (
                              <span className="text-xs text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button
                              onClick={() => handleEditEquipment(equip)}
                              className="text-blue-600 hover:text-blue-900 inline-flex items-center mr-3"
                              title="Edit equipment"
                            >
                              <PencilSquareIcon className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => handleDeleteEquipment(equip.equipmentId, equip.name)}
                              className="text-red-600 hover:text-red-900 inline-flex items-center"
                              title="Delete equipment"
                            >
                              <TrashIcon className="h-5 w-5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Equipment Create/Edit Modal */}
      <Modal
        isOpen={showEquipmentModal}
        onClose={() => setShowEquipmentModal(false)}
        title={editingEquipment ? 'Edit Equipment' : 'Add New Equipment'}
      >
        <div className="space-y-4 max-h-[70vh] overflow-y-auto px-1">
          {/* Basic Information */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Equipment Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Equipment Type *</label>
            <select
              value={formData.equipmentTypeId}
              onChange={(e) => setFormData({ ...formData, equipmentTypeId: e.target.value })}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            >
              <option value="">Select Type...</option>
              {equipmentTypes.map(type => (
                <option key={type.equipmentTypeId} value={type.equipmentTypeId}>{type.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                {statusOptions.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Capacity Information */}
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Capacity</label>
              <input
                type="number"
                step="0.01"
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
              <select
                value={formData.capacityUnit}
                onChange={(e) => setFormData({ ...formData, capacityUnit: e.target.value })}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                {capacityUnits.map(unit => (
                  <option key={unit} value={unit}>{unit}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Working Capacity</label>
            <input
              type="number"
              step="0.01"
              value={formData.workingCapacity}
              onChange={(e) => setFormData({ ...formData, workingCapacity: e.target.value })}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          {/* Equipment Details */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Manufacturer</label>
              <input
                type="text"
                value={formData.manufacturer}
                onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Model</label>
              <input
                type="text"
                value={formData.model}
                onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Serial Number</label>
            <input
              type="text"
              value={formData.serialNumber}
              onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Purchase Date</label>
              <input
                type="date"
                value={formData.purchaseDate}
                onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Warranty Expiration</label>
              <input
                type="date"
                value={formData.warrantyExpiration}
                onChange={(e) => setFormData({ ...formData, warrantyExpiration: e.target.value })}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Maintenance */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Last Maintenance</label>
              <input
                type="date"
                value={formData.lastMaintenanceDate}
                onChange={(e) => setFormData({ ...formData, lastMaintenanceDate: e.target.value })}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Next Maintenance</label>
              <input
                type="date"
                value={formData.nextMaintenanceDate}
                onChange={(e) => setFormData({ ...formData, nextMaintenanceDate: e.target.value })}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Maintenance Interval (days)</label>
            <input
              type="number"
              value={formData.maintenanceIntervalDays}
              onChange={(e) => setFormData({ ...formData, maintenanceIntervalDays: e.target.value })}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Maintenance Notes</label>
            <textarea
              value={formData.maintenanceNotes}
              onChange={(e) => setFormData({ ...formData, maintenanceNotes: e.target.value })}
              rows={3}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={() => setShowEquipmentModal(false)}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSaveEquipment}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
          >
            {editingEquipment ? 'Update Equipment' : 'Create Equipment'}
          </button>
        </div>
      </Modal>

      {/* Toast Notification */}
      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ ...toast, show: false })}
        />
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteConfirm.show}
        onClose={() => setDeleteConfirm({ show: false, equipmentId: null, equipmentName: '' })}
        onConfirm={confirmDelete}
        title="Delete Equipment?"
        message={`Are you sure you want to delete "${deleteConfirm.equipmentName}"? This action cannot be undone.`}
        confirmText="Delete Equipment"
        cancelText="Cancel"
        confirmButtonClass="bg-red-600 hover:bg-red-700 focus:ring-red-500"
      />
    </DashboardLayout>
  )
}
