function Cards() {
  return (
    <div className="space-y-8">
      {/* Basic Cards */}
      <div className="card p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">Basic Cards</h3>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="card p-4">
            <h4 className="text-lg font-medium text-gray-900 mb-2">Simple Card</h4>
            <p className="text-gray-600 text-sm">This is a basic card with minimal content and styling.</p>
          </div>
          <div className="card p-4 hover:shadow-lg transition-shadow">
            <h4 className="text-lg font-medium text-gray-900 mb-2">Hover Card</h4>
            <p className="text-gray-600 text-sm">This card has a hover effect that increases the shadow.</p>
          </div>
          <div className="card p-4 border-l-4 border-teal-500">
            <h4 className="text-lg font-medium text-gray-900 mb-2">Accent Card</h4>
            <p className="text-gray-600 text-sm">This card has a colored left border accent.</p>
          </div>
        </div>
      </div>

      {/* Cards with Images */}
      <div className="card p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">Cards with Images</h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="card overflow-hidden">
            <div className="h-48 bg-gradient-to-r from-teal-400 to-cyan-400"></div>
            <div className="p-4">
              <h4 className="text-lg font-medium text-gray-900 mb-2">Brewery Photo</h4>
              <p className="text-gray-600 text-sm mb-3">Beautiful brewery facility with modern equipment.</p>
              <button className="btn btn-outline text-sm">View Details</button>
            </div>
          </div>
          <div className="card overflow-hidden">
            <div className="h-48 bg-gradient-to-r from-emerald-400 to-teal-400"></div>
            <div className="p-4">
              <h4 className="text-lg font-medium text-gray-900 mb-2">Beer Recipe</h4>
              <p className="text-gray-600 text-sm mb-3">Award-winning IPA recipe with cascade hops.</p>
              <button className="btn btn-primary text-sm">Edit Recipe</button>
            </div>
          </div>
          <div className="card overflow-hidden">
            <div className="h-48 bg-gradient-to-r from-blue-400 to-teal-400"></div>
            <div className="p-4">
              <h4 className="text-lg font-medium text-gray-900 mb-2">Equipment</h4>
              <p className="text-gray-600 text-sm mb-3">Stainless steel fermenter tank - 500L capacity.</p>
              <button className="btn btn-secondary text-sm">Maintenance</button>
            </div>
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="card p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">Stat Cards</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="card p-4 text-center">
            <div className="text-2xl font-bold text-teal-600 mb-1">847</div>
            <div className="text-sm text-gray-600">Total Batches</div>
          </div>
          <div className="card p-4 text-center">
            <div className="text-2xl font-bold text-emerald-600 mb-1">23</div>
            <div className="text-sm text-gray-600">Active Recipes</div>
          </div>
          <div className="card p-4 text-center">
            <div className="text-2xl font-bold text-blue-600 mb-1">12.4k</div>
            <div className="text-sm text-gray-600">Gallons Produced</div>
          </div>
          <div className="card p-4 text-center">
            <div className="text-2xl font-bold text-purple-600 mb-1">98%</div>
            <div className="text-sm text-gray-600">Quality Score</div>
          </div>
        </div>
      </div>

      {/* Feature Cards */}
      <div className="card p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">Feature Cards</h3>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="card p-6 text-center">
            <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h4 className="text-lg font-medium text-gray-900 mb-2">Analytics</h4>
            <p className="text-gray-600 text-sm">Track production metrics and optimize your brewing process.</p>
          </div>
          <div className="card p-6 text-center">
            <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h4 className="text-lg font-medium text-gray-900 mb-2">Inventory</h4>
            <p className="text-gray-600 text-sm">Manage raw materials, ingredients, and finished products.</p>
          </div>
          <div className="card p-6 text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h4 className="text-lg font-medium text-gray-900 mb-2">Team</h4>
            <p className="text-gray-600 text-sm">Collaborate with your team and manage user permissions.</p>
          </div>
        </div>
      </div>

      {/* Profile Cards */}
      <div className="card p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">Profile Cards</h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="card p-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-teal-500 rounded-full flex items-center justify-center text-white font-bold">
                JD
              </div>
              <div>
                <h4 className="text-lg font-medium text-gray-900">John Doe</h4>
                <p className="text-sm text-gray-600">Head Brewer</p>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Experience</span>
                <span className="font-medium">8 years</span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span className="text-gray-600">Recipes</span>
                <span className="font-medium">23</span>
              </div>
            </div>
          </div>
          <div className="card p-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center text-white font-bold">
                AS
              </div>
              <div>
                <h4 className="text-lg font-medium text-gray-900">Alice Smith</h4>
                <p className="text-sm text-gray-600">Quality Manager</p>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Experience</span>
                <span className="font-medium">5 years</span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span className="text-gray-600">Audits</span>
                <span className="font-medium">156</span>
              </div>
            </div>
          </div>
          <div className="card p-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                MB
              </div>
              <div>
                <h4 className="text-lg font-medium text-gray-900">Mike Brown</h4>
                <p className="text-sm text-gray-600">Production Lead</p>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Experience</span>
                <span className="font-medium">12 years</span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span className="text-gray-600">Batches</span>
                <span className="font-medium">847</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Cards */}
      <div className="card p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">Action Cards</h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="card p-6 bg-gradient-to-r from-teal-50 to-cyan-50 border-teal-200">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-2">Start New Batch</h4>
                <p className="text-gray-600 text-sm mb-4">Begin brewing a new batch with your favorite recipe.</p>
                <button className="btn btn-primary">Create Batch</button>
              </div>
              <svg className="w-8 h-8 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
          </div>
          <div className="card p-6 bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="text-lg font-medium text-gray-900 mb-2">Manage Inventory</h4>
                <p className="text-gray-600 text-sm mb-4">Update stock levels and order new ingredients.</p>
                <button className="btn btn-outline">View Inventory</button>
              </div>
              <svg className="w-8 h-8 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Card Variations */}
      <div className="card p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">Card Variations</h3>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg border-2 border-dashed border-gray-200 p-6 text-center">
            <svg className="w-8 h-8 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <h4 className="text-lg font-medium text-gray-900 mb-2">Add New Recipe</h4>
            <p className="text-gray-600 text-sm">Create a new beer recipe to start brewing.</p>
          </div>
          <div className="card p-6 bg-red-50 border-red-200">
            <div className="flex items-center space-x-3 mb-3">
              <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <h4 className="text-lg font-medium text-red-800">Alert Card</h4>
            </div>
            <p className="text-red-700 text-sm">Temperature sensors are offline. Check equipment status.</p>
          </div>
          <div className="card p-6 bg-green-50 border-green-200">
            <div className="flex items-center space-x-3 mb-3">
              <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <h4 className="text-lg font-medium text-green-800">Success Card</h4>
            </div>
            <p className="text-green-700 text-sm">Batch #247 completed successfully. Quality tests passed.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Cards