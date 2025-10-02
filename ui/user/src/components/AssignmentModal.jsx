import React, { useState, useEffect } from 'react'
import { XMarkIcon, CalendarIcon, ClockIcon } from '@heroicons/react/24/outline'
import StyledCombobox from './common/StyledCombobox'
import StyledDatePicker from './common/StyledDatePicker'
import { employeeAPI } from '../utils/api'

const priorityOptions = [
  { id: 'low', name: 'Low', color: 'text-green-700' },
  { id: 'medium', name: 'Medium', color: 'text-yellow-700' },
  { id: 'high', name: 'High', color: 'text-orange-700' },
  { id: 'urgent', name: 'Urgent', color: 'text-red-700' }
]

export default function AssignmentModal({
  isOpen,
  onClose,
  onSave,
  assignment = null,
  isLoading = false,
  preSelectedEmployee = null,
  readOnly = false,
  onStatusChange = null
}) {
  const [formData, setFormData] = useState({
    title: 'Test Assignment',
    description: 'This is a test assignment for debugging',
    priority: 'medium',
    assignedTo: '',
    assignedToName: '',
    categoryId: null,
    dueDate: new Date().toISOString().split('T')[0], // Today's date
    dueTime: '10:00',
    location: 'Brewery Floor',
    requiresConfirmation: false,
    notes: 'Please complete this test assignment'
  })

  const [employees, setEmployees] = useState([])
  const [loadingEmployees, setLoadingEmployees] = useState(false)

  const [selectedEmployee, setSelectedEmployee] = useState(null)
  const [selectedPriority, setSelectedPriority] = useState(null)

  // Load employees from API
  const loadEmployees = async () => {
    if (employees.length > 0) return // Already loaded

    setLoadingEmployees(true)
    try {
      const response = await employeeAPI.getEmployees()
      const employeeData = response.data || []

      // Format employees for the combobox
      const formattedEmployees = employeeData.map(emp => ({
        id: emp.employeeId,
        name: `${emp.firstName} ${emp.lastName}`.trim()
      }))

      setEmployees(formattedEmployees)
    } catch (error) {
      console.error('Error loading employees:', error)
      setEmployees([]) // Fallback to empty array
    } finally {
      setLoadingEmployees(false)
    }
  }

  // Load employees when modal opens
  useEffect(() => {
    if (isOpen) {
      loadEmployees()
    }
  }, [isOpen])

  // Initialize form with assignment data or pre-selected employee
  useEffect(() => {
    if (assignment) {
      // Editing existing assignment
      const dueDateTime = assignment.dueDate ? new Date(assignment.dueDate) : null

      // Try to find the assigned employee - check both assignedTo ID and assignedToEmployee object
      let assignedEmployee = null
      if (assignment.assignedTo) {
        assignedEmployee = employees.find(emp => emp.id === assignment.assignedTo)
      }

      // If not found and we have assignedToEmployee data, create employee object
      if (!assignedEmployee && assignment.assignedToEmployee) {
        assignedEmployee = {
          id: assignment.assignedToEmployee.employeeId,
          name: `${assignment.assignedToEmployee.firstName} ${assignment.assignedToEmployee.lastName}`.trim()
        }
      }

      const assignedPriority = priorityOptions.find(priority => priority.id === assignment.priority)

      setFormData({
        title: assignment.title || '',
        description: assignment.description || '',
        priority: assignment.priority || 'medium',
        assignedTo: assignment.assignedTo || assignment.assignedToEmployee?.employeeId || '',
        assignedToName: assignment.assignedToName || (assignment.assignedToEmployee ? `${assignment.assignedToEmployee.firstName} ${assignment.assignedToEmployee.lastName}`.trim() : ''),
        categoryId: assignment.categoryId || null,
        dueDate: dueDateTime ? dueDateTime.toISOString().split('T')[0] : '',
        dueTime: dueDateTime ? dueDateTime.toTimeString().slice(0, 5) : '',
        location: assignment.location || '',
        requiresConfirmation: assignment.requiresConfirmation || false,
        notes: assignment.notes || ''
      })

      setSelectedEmployee(assignedEmployee || null)
      setSelectedPriority(assignedPriority || priorityOptions.find(p => p.id === 'medium'))
    } else if (preSelectedEmployee) {
      // Creating new assignment with pre-selected employee
      // Create an employee object from the pre-selected data
      const preSelected = { id: preSelectedEmployee.id, name: preSelectedEmployee.name }

      setFormData(prev => ({
        ...prev,
        assignedTo: preSelectedEmployee.id || '',
        assignedToName: preSelectedEmployee.name || ''
      }))

      setSelectedEmployee(preSelected)
    } else {
      // Reset form for new assignment with pre-filled test data
      setFormData({
        title: 'Test Assignment',
        description: 'This is a test assignment for debugging',
        priority: 'medium',
        assignedTo: '',
        assignedToName: '',
        categoryId: null,
        dueDate: new Date().toISOString().split('T')[0], // Today's date
        dueTime: '10:00',
        location: 'Brewery Floor',
        requiresConfirmation: false,
        notes: 'Please complete this test assignment'
      })

      setSelectedEmployee(null)
      setSelectedPriority(priorityOptions.find(p => p.id === 'medium'))
    }
  }, [assignment, preSelectedEmployee, employees])

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Basic validation
    if (!formData.title.trim()) {
      alert('Title is required')
      return
    }

    // Combine date and time
    let dueDateTime = null
    if (formData.dueDate) {
      dueDateTime = formData.dueTime
        ? new Date(`${formData.dueDate}T${formData.dueTime}`)
        : new Date(`${formData.dueDate}T00:00`)
    }

    // Convert selectedEmployee to Guid or null
    const assignedToGuid = selectedEmployee?.id || null

    // Map priority to capitalized enum values for API
    const priorityMapping = {
      'low': 'Low',
      'medium': 'Medium',
      'high': 'High',
      'urgent': 'Urgent'
    }

    const assignmentData = {
      title: formData.title,
      description: formData.description || null,
      instructions: formData.notes || null,  // Map notes to instructions
      priority: priorityMapping[selectedPriority?.id] || 'Medium', // Send as capitalized enum value
      assignedTo: assignedToGuid,
      categoryId: formData.categoryId,
      dueDate: dueDateTime?.toISOString() || null,
      location: formData.location || null,
      requiresConfirmation: formData.requiresConfirmation || false,
      requiresPhotos: false,
      requiresSignoff: false,
      isRecurring: false
    }

    await onSave(assignmentData)
  }

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50" style={{position: 'fixed', top: -25, left: 0, right: 0, bottom: 0, height: '100vh', width: '100vw'}}>
      <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">
            {readOnly ? 'View Assignment' : assignment ? 'Edit Assignment' : 'Create New Assignment'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Assignment Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              className={`w-full px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${readOnly ? 'bg-gray-100 cursor-not-allowed' : ''}`}
              placeholder="Enter assignment title"
              disabled={readOnly}
              required={!readOnly}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              rows={3}
              className={`w-full px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none ${readOnly ? 'bg-gray-100 cursor-not-allowed' : ''}`}
              placeholder="Describe the assignment details"
              disabled={readOnly}
            />
          </div>

          {/* Priority and Employee Assignment Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Priority */}
            <div>
              <StyledCombobox
                label="Priority"
                options={priorityOptions}
                value={selectedPriority}
                onChange={setSelectedPriority}
                placeholder="Select priority..."
                className="w-full"
                disabled={readOnly}
              />
            </div>

            {/* Assigned To */}
            <div>
              <StyledCombobox
                label="Assign To"
                options={employees}
                value={selectedEmployee}
                onChange={setSelectedEmployee}
                placeholder="Search for an employee..."
                disabled={readOnly || !!preSelectedEmployee}
                className="w-full"
              />
              {preSelectedEmployee && (
                <p className="text-xs text-gray-500 mt-1">
                  Pre-selected from employee list
                </p>
              )}
            </div>
          </div>

          {/* Due Date and Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <StyledDatePicker
              label="Due Date"
              value={formData.dueDate}
              onChange={(date) => handleChange('dueDate', date)}
              placeholder="Select due date..."
              disabled={readOnly}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <ClockIcon className="h-4 w-4 inline mr-1" />
                Due Time
              </label>
              <input
                type="time"
                value={formData.dueTime}
                onChange={(e) => handleChange('dueTime', e.target.value)}
                className={`w-full px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${readOnly ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                disabled={readOnly}
              />
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Location
            </label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => handleChange('location', e.target.value)}
              className={`w-full px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${readOnly ? 'bg-gray-100 cursor-not-allowed' : ''}`}
              placeholder="Where should this task be performed?"
              disabled={readOnly}
            />
          </div>

          {/* Requires Confirmation */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="requiresConfirmation"
              checked={formData.requiresConfirmation}
              onChange={(e) => handleChange('requiresConfirmation', e.target.checked)}
              className={`h-4 w-4 text-fermentum-600 focus:ring-fermentum-500 border-gray-300 rounded ${readOnly ? 'cursor-not-allowed' : ''}`}
              disabled={readOnly}
            />
            <label htmlFor="requiresConfirmation" className="ml-2 block text-sm text-gray-900">
              Requires confirmation before starting
            </label>
          </div>

          {/* Additional Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Additional Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              rows={2}
              className={`w-full px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none ${readOnly ? 'bg-gray-100 cursor-not-allowed' : ''}`}
              placeholder="Any additional instructions or notes"
              disabled={readOnly}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t">
            {/* Workflow Actions (left side) */}
            {readOnly && assignment && onStatusChange && (
              <div className="flex items-center space-x-2">
                {assignment.status === 'assigned' && (
                  <button
                    type="button"
                    onClick={() => onStatusChange(assignment.assignmentId, 'start')}
                    className="px-3 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700"
                    disabled={isLoading}
                  >
                    Start Task
                  </button>
                )}

                {assignment.status === 'inprogress' && (
                  <button
                    type="button"
                    onClick={() => onStatusChange(assignment.assignmentId, 'complete')}
                    className="px-3 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
                    disabled={isLoading}
                  >
                    Mark Complete
                  </button>
                )}

                {assignment.status === 'pending' && assignment.requiresConfirmation && (
                  <button
                    type="button"
                    onClick={() => onStatusChange(assignment.assignmentId, 'confirm')}
                    className="px-3 py-2 text-sm font-medium text-white bg-purple-600 border border-transparent rounded-md hover:bg-purple-700"
                    disabled={isLoading}
                  >
                    Confirm
                  </button>
                )}
              </div>
            )}

            {/* Standard Actions (right side) */}
            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                disabled={isLoading}
              >
                {readOnly ? 'Close' : 'Cancel'}
              </button>
              {!readOnly && (
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-fermentum-800 border border-transparent rounded-md hover:bg-fermentum-700 focus:ring-2 focus:ring-fermentum-500 disabled:opacity-50"
                  disabled={isLoading}
                >
                  {isLoading ? 'Saving...' : assignment ? 'Update Assignment' : 'Create Assignment'}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}