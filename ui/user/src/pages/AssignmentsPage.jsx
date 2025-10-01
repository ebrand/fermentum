import React, { useState, useEffect } from 'react'
import { useSession } from '../contexts/SessionContext'
import { useLocation } from 'react-router-dom'
import DashboardLayout from '../components/DashboardLayout'
import AssignmentModal from '../components/AssignmentModal'
import ConfirmationModal from '../components/common/ConfirmationModal'
import { assignmentsAPI } from '../utils/api'
import {
  ClipboardDocumentListIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  PlusIcon,
  FunnelIcon,
  EyeIcon,
  PlayIcon,
  PauseIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline'

export default function AssignmentsPage() {
  const { user, currentTenant } = useSession()
  const location = useLocation()
  const [assignments, setAssignments] = useState([])
  const [myAssignments, setMyAssignments] = useState([])
  const [categories, setCategories] = useState([])
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('all') // all, my, summary
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    category: ''
  })

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedAssignment, setSelectedAssignment] = useState(null)
  const [isModalLoading, setIsModalLoading] = useState(false)
  const [preSelectedEmployee, setPreSelectedEmployee] = useState(null)

  // Confirmation modal state
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false)
  const [assignmentToDelete, setAssignmentToDelete] = useState(null)

  useEffect(() => {
    if (currentTenant) {
      loadData()
    }
  }, [currentTenant])

  // Parse URL parameters and location state for pre-selected employee
  useEffect(() => {
    // Check for state first (from navigation with state)
    if (location.state?.preSelectedEmployee) {
      const preSelected = location.state.preSelectedEmployee
      setPreSelectedEmployee(preSelected)
      setIsModalOpen(true)
      return
    }

    // Fallback to URL parameters (for direct links or bookmarks)
    const urlParams = new URLSearchParams(location.search)
    const assignToId = urlParams.get('assignTo')
    const assigneeName = urlParams.get('assigneeName')

    if (assignToId && assigneeName) {
      const preSelected = {
        id: assignToId,
        name: decodeURIComponent(assigneeName)
      }
      setPreSelectedEmployee(preSelected)
      setIsModalOpen(true)

      // Clear URL parameters to avoid reopening modal on refresh
      window.history.replaceState({}, '', '/assignments')
    }
  }, [location.search, location.state])

  const loadData = async () => {
    setLoading(true)
    try {
      const [assignmentsRes, myAssignmentsRes, categoriesRes, summaryRes] = await Promise.all([
        assignmentsAPI.getAssignments(),
        assignmentsAPI.getMyAssignments(),
        assignmentsAPI.getCategories(),
        assignmentsAPI.getSummary()
      ])

      // Sort assignments by due date descending (most urgent first)
      const sortByDueDate = (a, b) => {
        const dateA = a.dueDate ? new Date(a.dueDate) : new Date('9999-12-31')
        const dateB = b.dueDate ? new Date(b.dueDate) : new Date('9999-12-31')
        return dateA - dateB // Ascending order (earliest due date first)
      }

      const sortedAssignments = (assignmentsRes.data || []).sort(sortByDueDate)
      const sortedMyAssignments = (myAssignmentsRes.data || []).sort(sortByDueDate)

      // Log assignment objects to console for debugging
      console.log('📋 [AssignmentsPage] All Assignments:', sortedAssignments)
      console.log('👤 [AssignmentsPage] My Assignments:', sortedMyAssignments)
      if (sortedAssignments.length > 0) {
        console.log('🔍 [AssignmentsPage] Sample Assignment Object:', sortedAssignments[0])
      }

      setAssignments(sortedAssignments)
      setMyAssignments(sortedMyAssignments)
      setCategories(categoriesRes.data || [])
      setSummary(summaryRes.data || {})
    } catch (error) {
      console.error('Error loading assignment data:', error)
      // Set empty defaults on error
      setAssignments([])
      setMyAssignments([])
      setCategories([])
      setSummary({})
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (assignmentId, action) => {
    try {
      switch (action) {
        case 'accepted':
          await assignmentsAPI.confirmAssignment(assignmentId)
          break
        case 'inprogress':
          await assignmentsAPI.startAssignment(assignmentId)
          break
        case 'paused':
          await assignmentsAPI.pauseAssignment(assignmentId)
          break
        case 'completed':
          await assignmentsAPI.completeAssignment(assignmentId)
          break
        case 'cancelled':
          await assignmentsAPI.cancelAssignment(assignmentId)
          break
        default:
          return
      }

      // Reload data after status change
      await loadData()
    } catch (error) {
      console.error(`Error ${action} assignment:`, error)
    }
  }

  const handleDeleteAssignment = (assignmentId) => {
    setAssignmentToDelete(assignmentId)
    setIsConfirmModalOpen(true)
  }

  const confirmDeleteAssignment = async () => {
    if (!assignmentToDelete) return

    try {
      await assignmentsAPI.deleteAssignment(assignmentToDelete)
      await loadData()
    } catch (error) {
      console.error('Error deleting assignment:', error)
    } finally {
      setAssignmentToDelete(null)
      setIsConfirmModalOpen(false)
    }
  }

  // Modal handlers
  const openCreateModal = () => {
    setSelectedAssignment(null)
    setPreSelectedEmployee(null)
    setIsModalOpen(true)
  }

  const openEditModal = (assignment) => {
    setSelectedAssignment(assignment)
    setPreSelectedEmployee(null)
    setIsModalOpen(true)
  }

  const handleAssignmentDoubleClick = (assignment) => {
    setSelectedAssignment(assignment)
    setPreSelectedEmployee(null)
    setIsModalOpen(true)
  }

  const canEditAssignment = (assignment) => {
    return assignment.assignedByUser?.userId === user?.userId
  }

  const isAssignedToCurrentUser = (assignment) => {
    // Check if current user's employee ID matches the assigned employee
    return assignment.assignedToEmployee?.employeeId === user?.currentEmployeeId
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setSelectedAssignment(null)
    setPreSelectedEmployee(null)
  }

  const handleSaveAssignment = async (assignmentData) => {
    setIsModalLoading(true)
    try {
      if (selectedAssignment) {
        // Update existing assignment
        await assignmentsAPI.updateAssignment(selectedAssignment.assignmentId, assignmentData)
      } else {
        // Create new assignment
        await assignmentsAPI.createAssignment(assignmentData)
      }

      // Reload data
      await loadData()
      closeModal()
    } catch (error) {
      console.error('Error saving assignment:', error)
      // Could add toast notification here
    } finally {
      setIsModalLoading(false)
    }
  }

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200'
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed': return 'bg-green-100 text-green-800'
      case 'inprogress': return 'bg-blue-100 text-blue-800'
      case 'accepted': return 'bg-indigo-100 text-indigo-800'
      case 'assigned': return 'bg-purple-100 text-purple-800'
      case 'pending': return 'bg-gray-100 text-gray-800'
      case 'paused': return 'bg-yellow-100 text-yellow-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'No due date'
    const date = new Date(dateString)
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  const isOverdue = (dueDateString) => {
    if (!dueDateString) return false
    return new Date(dueDateString) < new Date()
  }

  // Inner components
  const AssignmentRow = ({ assignment, index }) => (
    <tr
      className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50 transition-colors cursor-pointer`}
      onDoubleClick={() => handleAssignmentDoubleClick(assignment)}
    >
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex flex-col">
          <div className="text-sm font-medium text-gray-900">{assignment.title}</div>
          {assignment.description && (
            <div className="text-sm text-gray-500 truncate max-w-xs">{assignment.description}</div>
          )}
        </div>
      </td>

      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(assignment.priority)}`}>
          {assignment.priority}
        </span>
      </td>

      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(assignment.status)}`}>
          {assignment.status}
        </span>
      </td>

      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        {assignment.assignedToEmployee ?
          `${assignment.assignedToEmployee.firstName} ${assignment.assignedToEmployee.lastName}` :
          'Unassigned'
        }
      </td>

      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        <div className={`flex items-center ${isOverdue(assignment.dueDate) ? 'text-red-600 font-medium' : ''}`}>
          <ClockIcon className="h-4 w-4 mr-1" />
          {formatDate(assignment.dueDate)}
          {isOverdue(assignment.dueDate) && (
            <ExclamationTriangleIcon className="h-4 w-4 ml-1 text-red-500" />
          )}
        </div>
      </td>

      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        {assignment.location || '-'}
      </td>

      <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
        <div className="flex items-center justify-center space-x-2">
          
          {/* Accept */}
          {assignment.status.toLowerCase() === 'assigned' && isAssignedToCurrentUser(assignment) && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleStatusChange(assignment.assignmentId, 'accepted')
              }}
              className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 p-1 rounded"
              title="Accept Assignment"
            >
              <CheckIcon className="h-6 w-6 border border-1 border-gray-300 p-1 rounded-md hover:border-gray-500 mx-auto" />
              <span className="text-xs text-gray-400">Accept</span>
            </button>
          )}

          {/* In-progress */}
          {(assignment.status.toLowerCase() === 'accepted' || assignment.status.toLowerCase() === 'paused') && isAssignedToCurrentUser(assignment) && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleStatusChange(assignment.assignmentId, 'inprogress')
              }}
              className="text-green-600 hover:text-green-800 hover:bg-green-50 p-1 rounded"
              title="Start Assignment"
            >
              <PlayIcon className="h-6 w-6 border border-1 border-gray-300 p-1 rounded-md hover:border-gray-500 mx-auto" />
              <span className="text-xs text-gray-400">Start</span>
            </button>
          )}

          {/* Pause & Complete */}
          {assignment.status.toLowerCase() === 'inprogress' && isAssignedToCurrentUser(assignment) && (
            <>
              
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleStatusChange(assignment.assignmentId, 'paused')
                }}
                className="text-green-600 hover:text-green-800 hover:bg-green-50 p-1 rounded"
                title="Start Assignment"
              >
                <PauseIcon className="h-6 w-6 border border-1 border-gray-300 p-1 rounded-md hover:border-gray-500 mx-auto" />
                <span className="text-xs text-gray-400">Pause</span>
              </button>
              
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleStatusChange(assignment.assignmentId, 'completed')
                }}
                className="text-purple-600 hover:text-purple-800 hover:bg-purple-50 p-1 rounded"
                title="Confirm Assignment"
              >
                <CheckCircleIcon className="h-6 w-6 border border-1 border-gray-300 p-1 rounded-md hover:border-gray-500 mx-auto" />
                <span className="text-xs text-gray-400">Complete</span>
              </button>
            
            </>
          )}

          {canEditAssignment(assignment) && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleDeleteAssignment(assignment.assignmentId)
              }}
              className="text-red-600 hover:text-red-800 hover:bg-red-50 p-1 rounded"
              title="Delete Assignment"
            >
              <XMarkIcon className="h-6 w-6 border border-1 border-gray-300 p-1 rounded-md hover:border-gray-500" />
            </button>
          )}

          {/*
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleAssignmentDoubleClick(assignment)
            }}
            className="text-gray-400 hover:text-gray-600 hover:bg-gray-50 p-1 rounded"
            title="View Details"
          >
            <EyeIcon className="h-6 w-6 border border-1 border-gray-300 p-1 rounded-md hover:border-gray-500" />
          </button> */}
        </div>
      </td>
    </tr>
  )

  const SummaryCards = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ClipboardDocumentListIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Total Assignments</dt>
                <dd className="text-lg font-medium text-gray-900">
                  {summary?.totalAssignments || 0}
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ClockIcon className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">In Progress</dt>
                <dd className="text-lg font-medium text-gray-900">
                  {summary?.inProgressAssignments || 0}
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <CheckCircleIcon className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Completed Today</dt>
                <dd className="text-lg font-medium text-gray-900">
                  {summary?.completedToday || 0}
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="p-5">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">Overdue</dt>
                <dd className="text-lg font-medium text-gray-900">
                  {summary?.overdueAssignments || 0}
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  if (loading) {
    return (
      <DashboardLayout title="Assignments" subtitle="Manage and track work assignments" currentPage="Assignments">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-fermentum-600"></div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout title="Assignments" subtitle="Manage and track work assignments" currentPage="Assignments">
      <div className="w-full">
        {/* Summary Cards */}
        <SummaryCards />

        {/* Tab Navigation */}
        <div className="mb-6">
          <nav className="flex space-x-8" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('all')}
              className={`${
                activeTab === 'all'
                  ? 'border-fermentum-500 text-fermentum-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm`}
            >
              All Assignments ({assignments.length})
            </button>
            <button
              onClick={() => setActiveTab('my')}
              className={`${
                activeTab === 'my'
                  ? 'border-fermentum-500 text-fermentum-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm`}
            >
              My Assignments ({myAssignments.length})
            </button>
          </nav>
        </div>

        {/* Action Bar */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-4">
            <button
              onClick={openCreateModal}
              className="bg-fermentum-800 text-white px-4 py-2 rounded-lg hover:bg-fermentum-700 flex items-center"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              New Assignment
            </button>
            <button className="bg-white border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 flex items-center">
              <FunnelIcon className="h-4 w-4 mr-2" />
              Filter
            </button>
          </div>
        </div>

        {/* Assignment List */}
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-800 uppercase tracking-wider">
                  Assignment
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-800 uppercase tracking-wider">
                  Priority
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-800 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-800 uppercase tracking-wider">
                  Assigned To
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-800 uppercase tracking-wider">
                  Due Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-800 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-800 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {activeTab === 'all' && assignments.map((assignment, index) => (
                <AssignmentRow key={assignment.assignmentId} assignment={assignment} index={index} />
              ))}

              {activeTab === 'my' && myAssignments.map((assignment, index) => (
                <AssignmentRow key={assignment.assignmentId} assignment={assignment} index={index} />
              ))}
            </tbody>
          </table>
        </div>

        {/* Empty State */}
        {((activeTab === 'all' && assignments.length === 0) || (activeTab === 'my' && myAssignments.length === 0)) && (
          <div className="text-center py-12">
            <ClipboardDocumentListIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No assignments found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {activeTab === 'all' ? 'Get started by creating a new assignment.' : 'No assignments have been assigned to you yet.'}
            </p>
            {activeTab === 'all' && (
              <div className="mt-6">
                <button
                  onClick={openCreateModal}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-fermentum-800 hover:bg-fermentum-700"
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Create Assignment
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Assignment Modal */}
      <AssignmentModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onSave={handleSaveAssignment}
        assignment={selectedAssignment}
        isLoading={isModalLoading}
        preSelectedEmployee={preSelectedEmployee}
        readOnly={selectedAssignment ? !canEditAssignment(selectedAssignment) : false}
        onStatusChange={handleStatusChange}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={confirmDeleteAssignment}
        title="Delete Assignment"
        message="Are you sure you want to delete this assignment? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        confirmButtonClass="bg-red-600 hover:bg-red-700 focus:ring-red-500"
      />
    </DashboardLayout>
  )
}