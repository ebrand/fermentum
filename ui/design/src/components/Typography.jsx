function Typography() {
  return (
    <div className="space-y-8">
      {/* Headings */}
      <div className="card p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">Headings</h3>
        <div className="space-y-4">
          <div className="flex items-center space-x-4">
            <h1 className="text-4xl font-bold text-gray-900">Heading 1</h1>
            <code className="text-sm bg-gray-100 px-2 py-1 rounded">text-4xl font-bold</code>
          </div>
          <div className="flex items-center space-x-4">
            <h2 className="text-3xl font-bold text-gray-900">Heading 2</h2>
            <code className="text-sm bg-gray-100 px-2 py-1 rounded">text-3xl font-bold</code>
          </div>
          <div className="flex items-center space-x-4">
            <h3 className="text-2xl font-semibold text-gray-900">Heading 3</h3>
            <code className="text-sm bg-gray-100 px-2 py-1 rounded">text-2xl font-semibold</code>
          </div>
          <div className="flex items-center space-x-4">
            <h4 className="text-xl font-semibold text-gray-900">Heading 4</h4>
            <code className="text-sm bg-gray-100 px-2 py-1 rounded">text-xl font-semibold</code>
          </div>
          <div className="flex items-center space-x-4">
            <h5 className="text-lg font-medium text-gray-900">Heading 5</h5>
            <code className="text-sm bg-gray-100 px-2 py-1 rounded">text-lg font-medium</code>
          </div>
          <div className="flex items-center space-x-4">
            <h6 className="text-base font-medium text-gray-900">Heading 6</h6>
            <code className="text-sm bg-gray-100 px-2 py-1 rounded">text-base font-medium</code>
          </div>
        </div>
      </div>

      {/* Body Text */}
      <div className="card p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">Body Text</h3>
        <div className="space-y-4">
          <div>
            <p className="text-lg text-gray-900 mb-2">
              Large body text - Lorem ipsum dolor sit amet, consectetur adipiscing elit.
            </p>
            <code className="text-sm bg-gray-100 px-2 py-1 rounded">text-lg text-gray-900</code>
          </div>
          <div>
            <p className="text-base text-gray-900 mb-2">
              Regular body text - Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
            </p>
            <code className="text-sm bg-gray-100 px-2 py-1 rounded">text-base text-gray-900</code>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-2">
              Small body text - Ut enim ad minim veniam, quis nostrud exercitation ullamco.
            </p>
            <code className="text-sm bg-gray-100 px-2 py-1 rounded">text-sm text-gray-600</code>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-2">
              Extra small text - Duis aute irure dolor in reprehenderit in voluptate velit esse.
            </p>
            <code className="text-sm bg-gray-100 px-2 py-1 rounded">text-xs text-gray-500</code>
          </div>
        </div>
      </div>

      {/* Special Text Styles */}
      <div className="card p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">Special Text Styles</h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <p className="font-bold text-gray-900 mb-1">Bold Text</p>
              <code className="text-sm bg-gray-100 px-2 py-1 rounded">font-bold</code>
            </div>
            <div>
              <p className="font-semibold text-gray-900 mb-1">Semibold Text</p>
              <code className="text-sm bg-gray-100 px-2 py-1 rounded">font-semibold</code>
            </div>
            <div>
              <p className="font-medium text-gray-900 mb-1">Medium Text</p>
              <code className="text-sm bg-gray-100 px-2 py-1 rounded">font-medium</code>
            </div>
            <div>
              <p className="italic text-gray-900 mb-1">Italic Text</p>
              <code className="text-sm bg-gray-100 px-2 py-1 rounded">italic</code>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <p className="uppercase tracking-wide text-sm font-medium text-teal-600 mb-1">UPPERCASE</p>
              <code className="text-sm bg-gray-100 px-2 py-1 rounded">uppercase tracking-wide</code>
            </div>
            <div>
              <p className="font-mono text-gray-900 mb-1">Monospace Font</p>
              <code className="text-sm bg-gray-100 px-2 py-1 rounded">font-mono</code>
            </div>
            <div>
              <p className="underline text-teal-600 mb-1">Underlined Link</p>
              <code className="text-sm bg-gray-100 px-2 py-1 rounded">underline text-teal-600</code>
            </div>
            <div>
              <p className="line-through text-gray-500 mb-1">Strikethrough Text</p>
              <code className="text-sm bg-gray-100 px-2 py-1 rounded">line-through</code>
            </div>
          </div>
        </div>
      </div>

      {/* Typography Scale */}
      <div className="card p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">Typography Scale</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="pb-3 font-medium text-gray-900">Size</th>
                <th className="pb-3 font-medium text-gray-900">Class</th>
                <th className="pb-3 font-medium text-gray-900">Pixels</th>
                <th className="pb-3 font-medium text-gray-900">REM</th>
                <th className="pb-3 font-medium text-gray-900">Use Case</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              <tr className="border-b border-gray-100">
                <td className="py-2 text-xs">xs</td>
                <td className="py-2 font-mono">text-xs</td>
                <td className="py-2">12px</td>
                <td className="py-2">0.75rem</td>
                <td className="py-2 text-gray-600">Captions, labels</td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="py-2 text-sm">sm</td>
                <td className="py-2 font-mono">text-sm</td>
                <td className="py-2">14px</td>
                <td className="py-2">0.875rem</td>
                <td className="py-2 text-gray-600">Small text, forms</td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="py-2 text-base">base</td>
                <td className="py-2 font-mono">text-base</td>
                <td className="py-2">16px</td>
                <td className="py-2">1rem</td>
                <td className="py-2 text-gray-600">Body text</td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="py-2 text-lg">lg</td>
                <td className="py-2 font-mono">text-lg</td>
                <td className="py-2">18px</td>
                <td className="py-2">1.125rem</td>
                <td className="py-2 text-gray-600">Large body text</td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="py-2 text-xl">xl</td>
                <td className="py-2 font-mono">text-xl</td>
                <td className="py-2">20px</td>
                <td className="py-2">1.25rem</td>
                <td className="py-2 text-gray-600">Small headings</td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="py-2 text-2xl">2xl</td>
                <td className="py-2 font-mono">text-2xl</td>
                <td className="py-2">24px</td>
                <td className="py-2">1.5rem</td>
                <td className="py-2 text-gray-600">Medium headings</td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="py-2 text-3xl">3xl</td>
                <td className="py-2 font-mono">text-3xl</td>
                <td className="py-2">30px</td>
                <td className="py-2">1.875rem</td>
                <td className="py-2 text-gray-600">Large headings</td>
              </tr>
              <tr>
                <td className="py-2 text-4xl">4xl</td>
                <td className="py-2 font-mono">text-4xl</td>
                <td className="py-2">36px</td>
                <td className="py-2">2.25rem</td>
                <td className="py-2 text-gray-600">Page titles</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default Typography