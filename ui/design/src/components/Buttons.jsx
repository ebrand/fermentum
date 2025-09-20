function Buttons() {
  return (
    <div className="space-y-8">
      {/* Primary Buttons */}
      <div className="card p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">Primary Buttons</h3>
        <div className="flex flex-wrap items-center gap-4 mb-4">
          <button className="btn btn-primary text-sm">Small</button>
          <button className="btn btn-primary">Regular</button>
          <button className="btn btn-primary text-lg px-6 py-3">Large</button>
        </div>
        <code className="text-sm bg-gray-100 px-2 py-1 rounded">btn btn-primary</code>
      </div>

      {/* Secondary Buttons */}
      <div className="card p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">Secondary Buttons</h3>
        <div className="flex flex-wrap items-center gap-4 mb-4">
          <button className="btn btn-secondary text-sm">Small</button>
          <button className="btn btn-secondary">Regular</button>
          <button className="btn btn-secondary text-lg px-6 py-3">Large</button>
        </div>
        <code className="text-sm bg-gray-100 px-2 py-1 rounded">btn btn-secondary</code>
      </div>

      {/* Outline Buttons */}
      <div className="card p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">Outline Buttons</h3>
        <div className="flex flex-wrap items-center gap-4 mb-4">
          <button className="btn btn-outline text-sm">Small</button>
          <button className="btn btn-outline">Regular</button>
          <button className="btn btn-outline text-lg px-6 py-3">Large</button>
        </div>
        <code className="text-sm bg-gray-100 px-2 py-1 rounded">btn btn-outline</code>
      </div>

      {/* Button States */}
      <div className="card p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">Button States</h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 mb-4">Primary States</h4>
            <div className="space-y-3">
              <div className="flex items-center gap-4">
                <button className="btn btn-primary">Normal</button>
                <code className="text-sm bg-gray-100 px-2 py-1 rounded">btn btn-primary</code>
              </div>
              <div className="flex items-center gap-4">
                <button className="btn btn-primary hover:bg-teal-700">Hover</button>
                <code className="text-sm bg-gray-100 px-2 py-1 rounded">hover:bg-teal-700</code>
              </div>
              <div className="flex items-center gap-4">
                <button className="btn btn-primary opacity-50 cursor-not-allowed" disabled>Disabled</button>
                <code className="text-sm bg-gray-100 px-2 py-1 rounded">disabled</code>
              </div>
              <div className="flex items-center gap-4">
                <button className="btn btn-primary">
                  <svg className="w-4 h-4 mr-2 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Loading
                </button>
                <code className="text-sm bg-gray-100 px-2 py-1 rounded">with spinner</code>
              </div>
            </div>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-4">With Icons</h4>
            <div className="space-y-3">
              <div className="flex items-center gap-4">
                <button className="btn btn-primary">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Item
                </button>
                <code className="text-sm bg-gray-100 px-2 py-1 rounded">icon + text</code>
              </div>
              <div className="flex items-center gap-4">
                <button className="btn btn-outline">
                  Download
                  <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </button>
                <code className="text-sm bg-gray-100 px-2 py-1 rounded">text + icon</code>
              </div>
              <div className="flex items-center gap-4">
                <button className="btn btn-secondary w-10 h-10 p-0 flex items-center justify-center">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                <code className="text-sm bg-gray-100 px-2 py-1 rounded">icon only</code>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Special Purpose Buttons */}
      <div className="card p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">Special Purpose Buttons</h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Danger Actions</h4>
            <div className="space-y-3">
              <button className="btn bg-red-600 text-white hover:bg-red-700">Delete</button>
              <button className="btn border border-red-300 text-red-700 hover:bg-red-50">Cancel</button>
            </div>
          </div>
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Success Actions</h4>
            <div className="space-y-3">
              <button className="btn bg-green-600 text-white hover:bg-green-700">Save</button>
              <button className="btn bg-emerald-600 text-white hover:bg-emerald-700">Publish</button>
            </div>
          </div>
        </div>
      </div>

      {/* Button Groups */}
      <div className="card p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">Button Groups</h3>
        <div className="space-y-6">
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Attached Group</h4>
            <div className="inline-flex rounded-lg border border-gray-300 overflow-hidden">
              <button className="px-4 py-2 bg-teal-600 text-white text-sm font-medium">Active</button>
              <button className="px-4 py-2 bg-white text-gray-700 text-sm font-medium hover:bg-gray-50 border-l border-gray-300">Option 1</button>
              <button className="px-4 py-2 bg-white text-gray-700 text-sm font-medium hover:bg-gray-50 border-l border-gray-300">Option 2</button>
            </div>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Spaced Group</h4>
            <div className="flex gap-2">
              <button className="btn btn-outline">Filter</button>
              <button className="btn btn-outline">Sort</button>
              <button className="btn btn-primary">Search</button>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Action Button */}
      <div className="card p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">Floating Action Button</h3>
        <div className="relative h-32 bg-gray-50 rounded-lg overflow-hidden">
          <button className="absolute bottom-4 right-4 w-14 h-14 bg-teal-600 text-white rounded-full shadow-lg hover:bg-teal-700 flex items-center justify-center transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
        <code className="text-sm bg-gray-100 px-2 py-1 rounded mt-4 inline-block">fixed bottom-4 right-4 w-14 h-14 bg-teal-600</code>
      </div>
    </div>
  )
}

export default Buttons