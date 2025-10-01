import React, { useState, useEffect } from 'react'
import DashboardLayout from '../components/DashboardLayout'
import EmployeeModal from '../components/EmployeeModal'
import { useSession } from '../contexts/SessionContext'
import { hasPermission, PERMISSIONS } from '../utils/permissions'
import { employeeAPI } from '../utils/api'
import StandardDropdown, { DEPARTMENT_OPTIONS, STATUS_OPTIONS } from '../components/common/StandardDropdown'
import {
  PlusIcon,
  UserIcon,
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowsUpDownIcon,
  EyeIcon,
  UserPlusIcon,
  BuildingOfficeIcon,
  PhoneIcon,
  EnvelopeIcon,
  CalendarDaysIcon,
  BanknotesIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'

// Mock data based on the database schema
const mockEmployees = [
  {
    employee_id: 1,
    employee_number: 'EMP001',
    first_name: 'John',
    last_name: 'Smith',
    middle_name: 'Michael',
    email: 'john.smith@brewery.com',
    phone: '(555) 123-4567',
    job_title: 'Head Brewer',
    department: 'brewing',
    hire_date: '2023-01-15',
    employment_status: 'active',
    hourly_rate: 28.50,
    access_level: 'supervisor',
    certifications: ['Certified Brew Master', 'Food Safety Certified'],
    is_active: true
  },
  {
    employee_id: 2,
    employee_number: 'EMP002',
    first_name: 'Sarah',
    last_name: 'Johnson',
    email: 'sarah.johnson@brewery.com',
    phone: '(555) 234-5678',
    job_title: 'Sales Manager',
    department: 'sales',
    hire_date: '2023-03-20',
    employment_status: 'active',
    salary_annual: 65000,
    access_level: 'supervisor',
    certifications: ['Sales Professional Certified'],
    is_active: true
  },
  {
    employee_id: 3,
    employee_number: 'EMP003',
    first_name: 'Mike',
    last_name: 'Wilson',
    email: 'mike.wilson@brewery.com',
    phone: '(555) 345-6789',
    job_title: 'Maintenance Technician',
    department: 'maintenance',
    hire_date: '2023-02-10',
    employment_status: 'active',
    hourly_rate: 24.00,
    access_level: 'standard',
    certifications: ['HVAC Certified', 'Electrical Safety'],
    is_active: true
  },
  {
    employee_id: 4,
    employee_number: 'EMP004',
    first_name: 'Emily',
    last_name: 'Davis',
    email: 'emily.davis@brewery.com',
    phone: '(555) 456-7890',
    job_title: 'Brewer',
    department: 'brewing',
    hire_date: '2023-06-01',
    employment_status: 'active',
    hourly_rate: 22.00,
    access_level: 'standard',
    certifications: ['Food Safety Certified'],
    is_active: true
  },
  {
    employee_id: 5,
    employee_number: 'EMP005',
    first_name: 'David',
    last_name: 'Brown',
    email: 'david.brown@brewery.com',
    phone: '(555) 567-8901',
    job_title: 'Quality Control Specialist',
    department: 'quality',
    hire_date: '2023-04-15',
    employment_status: 'active',
    hourly_rate: 26.00,
    access_level: 'standard',
    certifications: ['Quality Assurance Certified', 'Lab Technician'],
    is_active: true
  }
]

const departmentColors = {
  brewing: 'bg-amber-100 text-amber-800',
  sales: 'bg-green-100 text-green-800',
  maintenance: 'bg-blue-100 text-blue-800',
  quality: 'bg-purple-100 text-purple-800',
  admin: 'bg-gray-100 text-gray-800'
}

const statusColors = {
  active: 'bg-green-100 text-green-800',
  inactive: 'bg-yellow-100 text-yellow-800',
  terminated: 'bg-red-100 text-red-800'
}

const accessLevelColors = {
  admin: 'bg-red-100 text-red-800',
  supervisor: 'bg-orange-100 text-orange-800',
  standard: 'bg-blue-100 text-blue-800',
  read_only: 'bg-gray-100 text-gray-800'
}

export default function EmployeesPage() {
  const { user } = useSession()
  const [employees, setEmployees] = useState([])
  const [filteredEmployees, setFilteredEmployees] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [departmentFilter, setDepartmentFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortField, setSortField] = useState('last_name')
  const [sortDirection, setSortDirection] = useState('asc')

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isPageLoading, setIsPageLoading] = useState(true)
  const [error, setError] = useState(null)

  // Data transformation helpers
  const transformEmployeeForModal = (employee) => {
    if (!employee) return null
    return {
      id: employee.employee_id, // Keep the ID for updates
      firstName: employee.first_name,
      lastName: employee.last_name,
      middleName: employee.middle_name,
      email: employee.email,
      phone: employee.phone,
      jobTitle: employee.job_title,
      department: employee.department,
      hireDate: employee.hire_date,
      employmentStatus: employee.employment_status,
      hourlyRate: employee.hourly_rate,
      salaryAnnual: employee.salary_annual,
      accessLevel: employee.access_level,
      certifications: employee.certifications || [],
      securityClearance: employee.security_clearance,
      emergencyContactName: employee.emergency_contact_name,
      emergencyContactPhone: employee.emergency_contact_phone,
      emergencyContactRelationship: employee.emergency_contact_relationship
    }
  }

  const transformEmployeeFromModal = (formData) => {
    return {
      firstName: formData.firstName,
      lastName: formData.lastName,
      middleName: formData.middleName,
      email: formData.email,
      phone: formData.phone,
      jobTitle: formData.jobTitle,
      department: formData.department,
      hireDate: formData.hireDate,
      employmentStatus: formData.employmentStatus,
      hourlyRate: formData.hourlyRate,
      salaryAnnual: formData.salaryAnnual,
      accessLevel: formData.accessLevel,
      certifications: formData.certifications,
      securityClearance: formData.securityClearance,
      emergencyContactName: formData.emergencyContactName,
      emergencyContactPhone: formData.emergencyContactPhone,
      emergencyContactRelationship: formData.emergencyContactRelationship
    }
  }

  // Modal handlers
  const openCreateModal = () => {
    setSelectedEmployee(null)
    setIsModalOpen(true)
  }

  const openEditModal = (employee) => {
    setSelectedEmployee(transformEmployeeForModal(employee))
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setSelectedEmployee(null)
  }

  // Load employees from API
  const loadEmployees = async () => {
    try {
      setIsPageLoading(true)
      setError(null)
      const response = await employeeAPI.getEmployees()
      setEmployees(response.data || [])
    } catch (error) {
      console.error('Error loading employees:', error)
      setError('Failed to load employees. Please try again.')
      // Fall back to mock data for development
      setEmployees(mockEmployees)
    } finally {
      setIsPageLoading(false)
    }
  }

  // Load employees on component mount
  useEffect(() => {
    loadEmployees()
  }, [])

  // Employee operations
  const handleSaveEmployee = async (employeeData) => {
    setIsLoading(true)
    const transformedData = transformEmployeeFromModal(employeeData)
    try {

      if (selectedEmployee && selectedEmployee.id) {
        // Update existing employee
        await employeeAPI.updateEmployee(selectedEmployee.id, transformedData)
      } else {
        // Create new employee
        await employeeAPI.createEmployee(transformedData)
      }

      // Reload employees to get updated data
      await loadEmployees()
      closeModal()
    } catch (error) {
      console.error('Error saving employee:', error)

      // Fallback to local state update for development
      if (selectedEmployee && selectedEmployee.id) {
        const updatedEmployees = employees.map(emp =>
          emp.employee_id === selectedEmployee.id
            ? { ...emp, ...transformedData }
            : emp
        )
        setEmployees(updatedEmployees)
      } else {
        const newEmployee = {
          employee_id: employees.length + 1,
          employee_number: `EMP${String(employees.length + 1).padStart(3, '0')}`,
          ...transformedData,
          is_active: true
        }
        setEmployees([...employees, newEmployee])
      }
      closeModal()

      alert('Employee saved locally. API connection may be unavailable.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteEmployee = async (employeeId) => {
    if (window.confirm('Are you sure you want to remove this employee?')) {
      try {
        await employeeAPI.deleteEmployee(employeeId)
        // Reload employees to get updated data
        await loadEmployees()
      } catch (error) {
        console.error('Error deleting employee:', error)

        // Fallback to local state update for development
        setEmployees(employees.filter(emp => emp.employee_id !== employeeId))
        alert('Employee removed locally. API connection may be unavailable.')
      }
    }
  }

  // Permissions
  const canViewEmployees = hasPermission(user, PERMISSIONS.TEAM.VIEW)
  const canManageEmployees = hasPermission(user, PERMISSIONS.TEAM.MANAGE_EMPLOYEES)
  const canManageAccess = hasPermission(user, PERMISSIONS.TEAM.MANAGE_ACCESS)
  const canViewPayroll = hasPermission(user, PERMISSIONS.TEAM.VIEW_PAYROLL)

  // Filter and search effect
  useEffect(() => {
    let filtered = employees.filter(employee => {
      const matchesSearch = !searchTerm ||
        employee.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.employee_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.job_title.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesDepartment = departmentFilter === 'all' || employee.department === departmentFilter
      const matchesStatus = statusFilter === 'all' || employee.employment_status === statusFilter

      return matchesSearch && matchesDepartment && matchesStatus
    })

    // Sort
    filtered.sort((a, b) => {
      let aValue = a[sortField]
      let bValue = b[sortField]

      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase()
        bValue = bValue.toLowerCase()
      }

      if (sortDirection === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
      }
    })

    setFilteredEmployees(filtered)
  }, [employees, searchTerm, departmentFilter, statusFilter, sortField, sortDirection])

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  if (!canViewEmployees) {
    return (
      <DashboardLayout title="Access Denied" currentPage="Team">
        <div className="text-center py-12">
          <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Access Denied</h3>
          <p className="mt-1 text-sm text-gray-500">
            You don't have permission to view employee information.
          </p>
        </div>
      </DashboardLayout>
    )
  }

  if (isPageLoading) {
    return (
      <DashboardLayout title="Employees" currentPage="Team">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <h3 className="mt-2 text-sm font-medium text-gray-900">Loading employees...</h3>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout
      title="Employees"
      subtitle="Manage your brewery team and staff information"
      currentPage="Team"
    >
      {/* Error Message */}
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
              <div className="mt-4">
                <button
                  onClick={loadEmployees}
                  className="bg-red-100 px-2 py-1 text-sm rounded-md text-red-800 hover:bg-red-200"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center space-x-4">
          {/* Search */}
          <div className="relative">
            <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search employees..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Department Filter */}
          <StandardDropdown
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            options={DEPARTMENT_OPTIONS}
            placeholder="All Departments"
          />

          {/* Status Filter */}
          <StandardDropdown
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={STATUS_OPTIONS}
            placeholder="All Status"
          />
        </div>

        {/* Add Employee Button */}
        {canManageEmployees && (
          <button
            onClick={openCreateModal}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <UserPlusIcon className="h-5 w-5 mr-2" />
            Add Employee
          </button>
        )}
      </div>

      {/* Employee Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <UserIcon className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Employees</p>
              <p className="text-2xl font-bold text-gray-900">{employees.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <BuildingOfficeIcon className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active</p>
              <p className="text-2xl font-bold text-gray-900">
                {employees.filter(e => e.employment_status === 'active').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <ShieldCheckIcon className="h-8 w-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Supervisors</p>
              <p className="text-2xl font-bold text-gray-900">
                {employees.filter(e => e.access_level === 'supervisor').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <CalendarDaysIcon className="h-8 w-8 text-orange-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">New This Month</p>
              <p className="text-2xl font-bold text-gray-900">2</p>
            </div>
          </div>
        </div>
      </div>

      {/* Employee Table */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('employee_number')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Employee #</span>
                    <ArrowsUpDownIcon className="h-4 w-4" />
                  </div>
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('last_name')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Name</span>
                    <ArrowsUpDownIcon className="h-4 w-4" />
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('job_title')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Position</span>
                    <ArrowsUpDownIcon className="h-4 w-4" />
                  </div>
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('department')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Department</span>
                    <ArrowsUpDownIcon className="h-4 w-4" />
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Access Level
                </th>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('employment_status')}
                >
                  <div className="flex items-center space-x-1">
                    <span>Status</span>
                    <ArrowsUpDownIcon className="h-4 w-4" />
                  </div>
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredEmployees.map((employee) => (
                <tr key={employee.employee_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {employee.employee_number}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-white">
                          {employee.first_name[0]}{employee.last_name[0]}
                        </span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {employee.first_name} {employee.last_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {employee.job_title}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="space-y-1">
                      <div className="flex items-center">
                        <EnvelopeIcon className="h-4 w-4 mr-2" />
                        {employee.email}
                      </div>
                      <div className="flex items-center">
                        <PhoneIcon className="h-4 w-4 mr-2" />
                        {employee.phone}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {employee.job_title}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${departmentColors[employee.department] || departmentColors.admin}`}>
                      {employee.department}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${accessLevelColors[employee.access_level] || accessLevelColors.standard}`}>
                      {employee.access_level}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${statusColors[employee.employment_status] || statusColors.active}`}>
                      {employee.employment_status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => openEditModal(employee)}
                        className="text-blue-600 hover:text-blue-900 p-1 rounded"
                        title="View Details"
                      >
                        <EyeIcon className="h-4 w-4" />
                      </button>
                      {canManageEmployees && (
                        <>
                          <button
                            onClick={() => openEditModal(employee)}
                            className="text-indigo-600 hover:text-indigo-900 p-1 rounded"
                            title="Edit Employee"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteEmployee(employee.employee_id)}
                            className="text-red-600 hover:text-red-900 p-1 rounded"
                            title="Remove Employee"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredEmployees.length === 0 && (
          <div className="text-center py-12">
            <UserIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No employees found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || departmentFilter !== 'all' || statusFilter !== 'all'
                ? 'Try adjusting your search criteria.'
                : 'Get started by adding your first employee.'
              }
            </p>
          </div>
        )}
      </div>

      {/* Employee Modal */}
      <EmployeeModal
        isOpen={isModalOpen}
        onClose={closeModal}
        onSave={handleSaveEmployee}
        employee={selectedEmployee}
        isLoading={isLoading}
      />
    </DashboardLayout>
  )
}