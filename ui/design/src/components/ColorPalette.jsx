function ColorPalette() {
  const colorGroups = [
    {
      name: 'Teal',
      colors: [
        { name: 'teal-50', value: '#f0fdfa', class: 'bg-teal-50' },
        { name: 'teal-100', value: '#ccfbf1', class: 'bg-teal-100' },
        { name: 'teal-200', value: '#99f6e4', class: 'bg-teal-200' },
        { name: 'teal-300', value: '#5eead4', class: 'bg-teal-300' },
        { name: 'teal-400', value: '#2dd4bf', class: 'bg-teal-400' },
        { name: 'teal-500', value: '#14b8a6', class: 'bg-teal-500' },
        { name: 'teal-600', value: '#0d9488', class: 'bg-teal-600' },
        { name: 'teal-700', value: '#0f766e', class: 'bg-teal-700' },
        { name: 'teal-800', value: '#115e59', class: 'bg-teal-800' },
        { name: 'teal-900', value: '#134e4a', class: 'bg-teal-900' },
      ]
    },
    {
      name: 'Cyan',
      colors: [
        { name: 'cyan-50', value: '#ecfeff', class: 'bg-cyan-50' },
        { name: 'cyan-100', value: '#cffafe', class: 'bg-cyan-100' },
        { name: 'cyan-200', value: '#a5f3fc', class: 'bg-cyan-200' },
        { name: 'cyan-300', value: '#67e8f9', class: 'bg-cyan-300' },
        { name: 'cyan-400', value: '#22d3ee', class: 'bg-cyan-400' },
        { name: 'cyan-500', value: '#06b6d4', class: 'bg-cyan-500' },
        { name: 'cyan-600', value: '#0891b2', class: 'bg-cyan-600' },
        { name: 'cyan-700', value: '#0e7490', class: 'bg-cyan-700' },
        { name: 'cyan-800', value: '#155e75', class: 'bg-cyan-800' },
        { name: 'cyan-900', value: '#164e63', class: 'bg-cyan-900' },
      ]
    },
    {
      name: 'Gray',
      colors: [
        { name: 'gray-50', value: '#f9fafb', class: 'bg-gray-50' },
        { name: 'gray-100', value: '#f3f4f6', class: 'bg-gray-100' },
        { name: 'gray-200', value: '#e5e7eb', class: 'bg-gray-200' },
        { name: 'gray-300', value: '#d1d5db', class: 'bg-gray-300' },
        { name: 'gray-400', value: '#9ca3af', class: 'bg-gray-400' },
        { name: 'gray-500', value: '#6b7280', class: 'bg-gray-500' },
        { name: 'gray-600', value: '#4b5563', class: 'bg-gray-600' },
        { name: 'gray-700', value: '#374151', class: 'bg-gray-700' },
        { name: 'gray-800', value: '#1f2937', class: 'bg-gray-800' },
        { name: 'gray-900', value: '#111827', class: 'bg-gray-900' },
      ]
    }
  ]

  return (
    <div className="space-y-8">
      {colorGroups.map((group) => (
        <div key={group.name} className="card p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">{group.name} Palette</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 lg:grid-cols-10 gap-4">
            {group.colors.map((color) => (
              <div key={color.name} className="text-center">
                <div
                  className={`${color.class} w-full h-16 rounded-lg border border-gray-200 mb-2 shadow-sm`}
                ></div>
                <div className="text-xs font-medium text-gray-700">{color.name}</div>
                <div className="text-xs text-gray-500 font-mono">{color.value}</div>
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="card p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Color Usage Guidelines</h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Primary Colors</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li><span className="font-mono bg-gray-100 px-2 py-1 rounded">teal-600</span> - Primary actions, buttons</li>
              <li><span className="font-mono bg-gray-100 px-2 py-1 rounded">teal-700</span> - Header, navigation</li>
              <li><span className="font-mono bg-gray-100 px-2 py-1 rounded">cyan-50</span> - Background, page base</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Semantic Colors</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li><span className="font-mono bg-gray-100 px-2 py-1 rounded">gray-900</span> - Primary text</li>
              <li><span className="font-mono bg-gray-100 px-2 py-1 rounded">gray-600</span> - Secondary text</li>
              <li><span className="font-mono bg-gray-100 px-2 py-1 rounded">white</span> - Card backgrounds</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ColorPalette