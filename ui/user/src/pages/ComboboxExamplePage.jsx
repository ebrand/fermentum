import React, { useState } from 'react'
import DashboardLayout from '../components/DashboardLayout'
import StyledCombobox from '../components/common/StyledCombobox'

const samplePeople = [
  { id: 1, name: 'Leslie Alexander' },
  { id: 2, name: 'Michael Foster' },
  { id: 3, name: 'Dries Vincent' },
  { id: 4, name: 'Lindsay Walton' },
  { id: 5, name: 'Courtney Henry' },
  { id: 6, name: 'Tom Cook' },
  { id: 7, name: 'Whitney Francis' },
  { id: 8, name: 'Leonard Krasner' },
  { id: 9, name: 'Floyd Miles' },
  { id: 10, name: 'Emily Selman' }
]

const sampleEmployees = [
  { id: 'emp-1', name: 'John Smith - Head Brewer' },
  { id: 'emp-2', name: 'Sarah Johnson - Sales Manager' },
  { id: 'emp-3', name: 'Mike Wilson - Maintenance Technician' },
  { id: 'emp-4', name: 'Emily Davis - Brewer' },
  { id: 'emp-5', name: 'David Brown - Quality Control Specialist' }
]

export default function ComboboxExamplePage() {
  const [selectedPerson, setSelectedPerson] = useState(null)
  const [selectedEmployee, setSelectedEmployee] = useState(null)
  const [selectedWithCustom, setSelectedWithCustom] = useState(null)

  return (
    <DashboardLayout
      title="Styled Combobox Examples"
      subtitle="Demonstration of the StyledCombobox component"
      currentPage="Examples"
    >
      <div className="max-w-4xl mx-auto">
        <div className="space-y-8">
          {/* Basic Example */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold mb-4">Basic Combobox</h3>
            <div className="max-w-md">
              <StyledCombobox
                label="Select a Person"
                options={samplePeople}
                value={selectedPerson}
                onChange={setSelectedPerson}
                placeholder="Search for a person..."
              />
            </div>
            {selectedPerson && (
              <div className="mt-4 p-3 bg-gray-50 rounded">
                <p><strong>Selected:</strong> {selectedPerson.name} (ID: {selectedPerson.id})</p>
              </div>
            )}
          </div>

          {/* Employee Example */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold mb-4">Employee Selection</h3>
            <div className="max-w-md">
              <StyledCombobox
                label="Assign To Employee"
                options={sampleEmployees}
                value={selectedEmployee}
                onChange={setSelectedEmployee}
                placeholder="Search for an employee..."
              />
            </div>
            {selectedEmployee && (
              <div className="mt-4 p-3 bg-blue-50 rounded border border-blue-200">
                <p><strong>Assigned to:</strong> {selectedEmployee.name}</p>
                <p><strong>Employee ID:</strong> {selectedEmployee.id}</p>
              </div>
            )}
          </div>

          {/* Custom Value Example */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold mb-4">With Custom Value Creation</h3>
            <div className="max-w-md">
              <StyledCombobox
                label="Select or Create New"
                options={samplePeople}
                value={selectedWithCustom}
                onChange={setSelectedWithCustom}
                placeholder="Search or type to create new..."
                allowCustomValue={true}
              />
            </div>
            {selectedWithCustom && (
              <div className="mt-4 p-3 bg-green-50 rounded border border-green-200">
                <p><strong>Selected:</strong> {selectedWithCustom.name}</p>
                <p><strong>Type:</strong> {selectedWithCustom.id ? 'Existing' : 'Custom'}</p>
                {!selectedWithCustom.id && (
                  <p className="text-sm text-green-600 mt-1">This is a custom value created by the user</p>
                )}
              </div>
            )}
          </div>

          {/* Disabled Example */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold mb-4">Disabled State</h3>
            <div className="max-w-md">
              <StyledCombobox
                label="Disabled Combobox"
                options={samplePeople}
                value={samplePeople[0]}
                onChange={() => {}}
                placeholder="This is disabled..."
                disabled={true}
              />
            </div>
            <p className="text-sm text-gray-500 mt-2">
              This combobox is disabled and cannot be interacted with.
            </p>
          </div>

          {/* Error State Example */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold mb-4">Error State</h3>
            <div className="max-w-md">
              <StyledCombobox
                label="Selection with Error"
                options={samplePeople}
                value={null}
                onChange={setSelectedPerson}
                placeholder="This has an error..."
                error="Please select a person from the list"
              />
            </div>
          </div>

          {/* Usage Examples */}
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <h3 className="text-lg font-semibold mb-4">Usage Examples</h3>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900">Basic Usage:</h4>
                <pre className="mt-1 p-3 bg-gray-100 rounded text-sm overflow-x-auto">
{`<StyledCombobox
  label="Select Person"
  options={people}
  value={selected}
  onChange={setSelected}
  placeholder="Search..."
/>`}
                </pre>
              </div>

              <div>
                <h4 className="font-medium text-gray-900">With Custom Values:</h4>
                <pre className="mt-1 p-3 bg-gray-100 rounded text-sm overflow-x-auto">
{`<StyledCombobox
  label="Select or Create"
  options={options}
  value={value}
  onChange={setValue}
  allowCustomValue={true}
  placeholder="Type to create new..."
/>`}
                </pre>
              </div>

              <div>
                <h4 className="font-medium text-gray-900">With Error State:</h4>
                <pre className="mt-1 p-3 bg-gray-100 rounded text-sm overflow-x-auto">
{`<StyledCombobox
  label="Required Field"
  options={options}
  value={value}
  onChange={setValue}
  error="This field is required"
/>`}
                </pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}