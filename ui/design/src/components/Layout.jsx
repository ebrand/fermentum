function Layout() {
  return (
    <div className="space-y-8">
      {/* Grid Layouts */}
      <div className="card p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">Grid Layouts</h3>
        <div className="space-y-8">
          <div>
            <h4 className="font-medium text-gray-900 mb-4">Basic Grid (3 columns)</h4>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-teal-100 p-4 rounded text-center text-teal-800">Column 1</div>
              <div className="bg-teal-100 p-4 rounded text-center text-teal-800">Column 2</div>
              <div className="bg-teal-100 p-4 rounded text-center text-teal-800">Column 3</div>
            </div>
            <code className="text-sm bg-gray-100 px-2 py-1 rounded mt-2 inline-block">grid grid-cols-3 gap-4</code>
          </div>

          <div>
            <h4 className="font-medium text-gray-900 mb-4">Responsive Grid</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-cyan-100 p-4 rounded text-center text-cyan-800">Item 1</div>
              <div className="bg-cyan-100 p-4 rounded text-center text-cyan-800">Item 2</div>
              <div className="bg-cyan-100 p-4 rounded text-center text-cyan-800">Item 3</div>
              <div className="bg-cyan-100 p-4 rounded text-center text-cyan-800">Item 4</div>
            </div>
            <code className="text-sm bg-gray-100 px-2 py-1 rounded mt-2 inline-block">grid-cols-1 md:grid-cols-2 lg:grid-cols-4</code>
          </div>

          <div>
            <h4 className="font-medium text-gray-900 mb-4">Grid with Spanning</h4>
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-emerald-100 p-4 rounded text-center text-emerald-800 col-span-2">Span 2</div>
              <div className="bg-emerald-100 p-4 rounded text-center text-emerald-800">Item</div>
              <div className="bg-emerald-100 p-4 rounded text-center text-emerald-800">Item</div>
              <div className="bg-emerald-100 p-4 rounded text-center text-emerald-800">Item</div>
              <div className="bg-emerald-100 p-4 rounded text-center text-emerald-800 col-span-3">Span 3</div>
            </div>
            <code className="text-sm bg-gray-100 px-2 py-1 rounded mt-2 inline-block">col-span-2, col-span-3</code>
          </div>
        </div>
      </div>

      {/* Flex Layouts */}
      <div className="card p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">Flex Layouts</h3>
        <div className="space-y-8">
          <div>
            <h4 className="font-medium text-gray-900 mb-4">Basic Flex</h4>
            <div className="flex gap-4">
              <div className="bg-blue-100 p-4 rounded text-center text-blue-800 flex-1">Flex 1</div>
              <div className="bg-blue-100 p-4 rounded text-center text-blue-800 flex-1">Flex 1</div>
              <div className="bg-blue-100 p-4 rounded text-center text-blue-800 flex-1">Flex 1</div>
            </div>
            <code className="text-sm bg-gray-100 px-2 py-1 rounded mt-2 inline-block">flex gap-4, flex-1</code>
          </div>

          <div>
            <h4 className="font-medium text-gray-900 mb-4">Flex with Different Ratios</h4>
            <div className="flex gap-4">
              <div className="bg-purple-100 p-4 rounded text-center text-purple-800 flex-1">1x</div>
              <div className="bg-purple-100 p-4 rounded text-center text-purple-800 flex-2">2x</div>
              <div className="bg-purple-100 p-4 rounded text-center text-purple-800 flex-1">1x</div>
            </div>
            <code className="text-sm bg-gray-100 px-2 py-1 rounded mt-2 inline-block">flex-1, flex-2, flex-1</code>
          </div>

          <div>
            <h4 className="font-medium text-gray-900 mb-4">Flex Alignment</h4>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded">
                <span className="text-gray-700">Left Content</span>
                <span className="text-gray-700">Right Content</span>
              </div>
              <div className="flex items-center justify-center p-4 bg-gray-50 rounded">
                <span className="text-gray-700">Centered Content</span>
              </div>
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded">
                <span className="text-gray-700">Item 1</span>
                <span className="text-gray-700">Item 2</span>
                <span className="text-gray-700 ml-auto">Right Aligned</span>
              </div>
            </div>
            <code className="text-sm bg-gray-100 px-2 py-1 rounded mt-2 inline-block">justify-between, justify-center, ml-auto</code>
          </div>
        </div>
      </div>

      {/* Container Layouts */}
      <div className="card p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">Container Layouts</h3>
        <div className="space-y-6">
          <div>
            <h4 className="font-medium text-gray-900 mb-4">Full Width</h4>
            <div className="w-full bg-gray-100 p-4 rounded text-center text-gray-700">
              Full width container
            </div>
            <code className="text-sm bg-gray-100 px-2 py-1 rounded mt-2 inline-block">w-full</code>
          </div>

          <div>
            <h4 className="font-medium text-gray-900 mb-4">Max Width with Center</h4>
            <div className="max-w-4xl mx-auto bg-gray-100 p-4 rounded text-center text-gray-700">
              Max width container (4xl) centered
            </div>
            <code className="text-sm bg-gray-100 px-2 py-1 rounded mt-2 inline-block">max-w-4xl mx-auto</code>
          </div>

          <div>
            <h4 className="font-medium text-gray-900 mb-4">Responsive Max Width</h4>
            <div className="max-w-sm md:max-w-lg lg:max-w-4xl mx-auto bg-gray-100 p-4 rounded text-center text-gray-700">
              Responsive max width container
            </div>
            <code className="text-sm bg-gray-100 px-2 py-1 rounded mt-2 inline-block">max-w-sm md:max-w-lg lg:max-w-4xl</code>
          </div>
        </div>
      </div>

      {/* Dashboard Layouts */}
      <div className="card p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">Dashboard Layout Examples</h3>
        <div className="space-y-8">
          <div>
            <h4 className="font-medium text-gray-900 mb-4">Sidebar + Content Layout</h4>
            <div className="h-64 border border-gray-200 rounded overflow-hidden">
              <div className="flex h-full">
                <div className="w-48 bg-teal-700 text-white p-4">
                  <div className="text-sm font-medium mb-4">Navigation</div>
                  <div className="space-y-2 text-xs">
                    <div className="p-2 bg-teal-600 rounded">Dashboard</div>
                    <div className="p-2 hover:bg-teal-600 rounded cursor-pointer">Inventory</div>
                    <div className="p-2 hover:bg-teal-600 rounded cursor-pointer">Production</div>
                    <div className="p-2 hover:bg-teal-600 rounded cursor-pointer">Settings</div>
                  </div>
                </div>
                <div className="flex-1 bg-cyan-50 p-4">
                  <div className="text-sm font-medium mb-4">Main Content Area</div>
                  <div className="grid grid-cols-2 gap-4 h-32">
                    <div className="bg-white p-3 rounded shadow">Content Block 1</div>
                    <div className="bg-white p-3 rounded shadow">Content Block 2</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-medium text-gray-900 mb-4">Header + Sidebar + Content Layout</h4>
            <div className="h-64 border border-gray-200 rounded overflow-hidden">
              <div className="h-full flex flex-col">
                <div className="h-12 bg-teal-700 text-white px-4 flex items-center">
                  <div className="text-sm font-medium">Fermentum Dashboard</div>
                  <div className="ml-auto text-xs">User Profile</div>
                </div>
                <div className="flex-1 flex">
                  <div className="w-48 bg-white border-r p-4">
                    <div className="text-xs font-medium mb-3">Menu</div>
                    <div className="space-y-1 text-xs">
                      <div className="p-2 bg-teal-50 text-teal-700 rounded">Overview</div>
                      <div className="p-2 hover:bg-gray-50 rounded cursor-pointer">Batches</div>
                      <div className="p-2 hover:bg-gray-50 rounded cursor-pointer">Recipes</div>
                    </div>
                  </div>
                  <div className="flex-1 bg-cyan-50 p-4">
                    <div className="text-sm font-medium mb-3">Page Content</div>
                    <div className="bg-white p-3 rounded shadow text-xs">
                      Main application content goes here...
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Spacing and Padding */}
      <div className="card p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">Spacing Examples</h3>
        <div className="space-y-6">
          <div>
            <h4 className="font-medium text-gray-900 mb-4">Padding Variations</h4>
            <div className="space-y-3">
              <div className="p-2 bg-gray-100 rounded">Small padding (p-2)</div>
              <div className="p-4 bg-gray-100 rounded">Medium padding (p-4)</div>
              <div className="p-6 bg-gray-100 rounded">Large padding (p-6)</div>
              <div className="px-8 py-4 bg-gray-100 rounded">Horizontal/Vertical padding (px-8 py-4)</div>
            </div>
          </div>

          <div>
            <h4 className="font-medium text-gray-900 mb-4">Margin Variations</h4>
            <div className="bg-gray-50 p-4 rounded">
              <div className="mb-2 bg-teal-100 p-2 rounded">Margin bottom 2 (mb-2)</div>
              <div className="mb-4 bg-teal-100 p-2 rounded">Margin bottom 4 (mb-4)</div>
              <div className="mb-6 bg-teal-100 p-2 rounded">Margin bottom 6 (mb-6)</div>
              <div className="bg-teal-100 p-2 rounded">No margin</div>
            </div>
          </div>

          <div>
            <h4 className="font-medium text-gray-900 mb-4">Gap Spacing</h4>
            <div className="flex gap-2 mb-3">
              <div className="bg-cyan-100 p-2 rounded flex-1 text-center text-sm">Gap 2</div>
              <div className="bg-cyan-100 p-2 rounded flex-1 text-center text-sm">Gap 2</div>
              <div className="bg-cyan-100 p-2 rounded flex-1 text-center text-sm">Gap 2</div>
            </div>
            <div className="flex gap-6">
              <div className="bg-cyan-100 p-2 rounded flex-1 text-center text-sm">Gap 6</div>
              <div className="bg-cyan-100 p-2 rounded flex-1 text-center text-sm">Gap 6</div>
              <div className="bg-cyan-100 p-2 rounded flex-1 text-center text-sm">Gap 6</div>
            </div>
          </div>
        </div>
      </div>

      {/* Responsive Utilities */}
      <div className="card p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">Responsive Utilities</h3>
        <div className="space-y-4">
          <div className="p-4 bg-red-100 md:bg-yellow-100 lg:bg-green-100 rounded text-center">
            <span className="md:hidden">Mobile (red)</span>
            <span className="hidden md:block lg:hidden">Tablet (yellow)</span>
            <span className="hidden lg:block">Desktop (green)</span>
          </div>
          <code className="text-sm bg-gray-100 px-2 py-1 rounded">bg-red-100 md:bg-yellow-100 lg:bg-green-100</code>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
            <div className="bg-gray-100 p-3 rounded text-center text-sm">1 col mobile</div>
            <div className="bg-gray-100 p-3 rounded text-center text-sm">2 col tablet</div>
            <div className="bg-gray-100 p-3 rounded text-center text-sm">3 col desktop</div>
          </div>
          <code className="text-sm bg-gray-100 px-2 py-1 rounded">grid-cols-1 md:grid-cols-2 lg:grid-cols-3</code>
        </div>
      </div>
    </div>
  )
}

export default Layout