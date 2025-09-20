import { ChevronDownIcon, useState } from 'react'

function Forms() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    breweryType: '',
    newsletter: false,
    description: ''
  })

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  return (
    <div className="space-y-8">
      {/* Basic Inputs */}
      <div className="card p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">Basic Inputs</h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="input"
                placeholder="Enter your email"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="input"
                placeholder="Enter your password"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <div className="relative">
                <input
                  type="text"
                  className="input pl-10"
                  placeholder="Search breweries..."
                />
                <svg className="absolute left-3 top-3 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Disabled Input</label>
              <input
                type="text"
                className="input opacity-50 cursor-not-allowed"
                placeholder="Disabled input"
                disabled
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Error State</label>
              <input
                type="text"
                className="input border-red-300 focus:ring-red-500 focus:border-red-500"
                placeholder="Invalid input"
              />
              <p className="text-red-600 text-xs mt-1">This field is required</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Success State</label>
              <input
                type="text"
                className="input border-green-300 focus:ring-green-500 focus:border-green-500"
                placeholder="Valid input"
                value="Valid value"
                readOnly
              />
              <p className="text-green-600 text-xs mt-1">Looks good!</p>
            </div>
          </div>
        </div>
      </div>

      {/* Select Dropdowns */}
      <div className="card p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">Select Dropdowns</h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label for="location" class="block text-sm font-medium text-gray-900 dark:text-white">Location</label>
            <div class="mt-2 grid grid-cols-1">
              <select id="location" name="location" class="input col-start-1 row-start-1 w-full appearance-none rounded-md bg-white py-1.5 pr-8 pl-3 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300  sm:text-sm/6">
                <option>United States</option>
                <option selected>Canada</option>
                <option>Mexico</option>
              </select>
              <svg viewBox="0 0 16 16" fill="currentColor" data-slot="icon" aria-hidden="true" class="pointer-events-none col-start-1 row-start-1 mr-2 size-5 self-center justify-self-end text-gray-500 sm:size-4 dark:text-gray-400">
                <path d="M4.22 6.22a.75.75 0 0 1 1.06 0L8 8.94l2.72-2.72a.75.75 0 1 1 1.06 1.06l-3.25 3.25a.75.75 0 0 1-1.06 0L4.22 7.28a.75.75 0 0 1 0-1.06Z" clip-rule="evenodd" fill-rule="evenodd" />
              </svg>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Multiple Select</label>
            <select multiple className="space-y-1 input h-24">
              <option value="ipa">IPA</option>
              <option value="stout">Stout</option>
              <option value="lager">Lager</option>
              <option value="wheat">Wheat Beer</option>
              <option value="sour">Sour Ale</option>
            </select>
          </div>
        </div>
      </div>

      {/* Checkboxes and Radio Buttons */}
      <div className="card p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">Checkboxes & Radio Buttons</h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Checkboxes</h4>
            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="newsletter"
                  checked={formData.newsletter}
                  onChange={handleChange}
                  className="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
                />
                <span className="ml-2 text-sm text-gray-700">Subscribe to newsletter</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
                />
                <span className="ml-2 text-sm text-gray-700">Accept terms and conditions</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
                  disabled
                />
                <span className="ml-2 text-sm text-gray-400">Disabled option</span>
              </label>
            </div>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Radio Buttons</h4>
            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="plan"
                  value="starter"
                  className="w-4 h-4 text-teal-600 border-gray-300 focus:ring-teal-500"
                />
                <span className="ml-2 text-sm text-gray-700">Starter Plan</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="plan"
                  value="professional"
                  className="w-4 h-4 text-teal-600 border-gray-300 focus:ring-teal-500"
                />
                <span className="ml-2 text-sm text-gray-700">Professional Plan</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="plan"
                  value="enterprise"
                  className="w-4 h-4 text-teal-600 border-gray-300 focus:ring-teal-500"
                />
                <span className="ml-2 text-sm text-gray-700">Enterprise Plan</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Textarea */}
      <div className="card p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">Textarea</h3>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={4}
            className="input resize-none"
            placeholder="Tell us about your brewery..."
          />
          <p className="text-gray-500 text-xs mt-1">Maximum 500 characters</p>
        </div>
      </div>

      {/* File Upload */}
      <div className="card p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">File Upload</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Profile Picture</label>
            <input
              type="file"
              className="input file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Drop Zone</label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-teal-400 transition-colors">
              <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <div className="mt-4">
                <p className="text-sm text-gray-600">
                  <span className="font-medium text-teal-600">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Form Layout Examples */}
      <div className="card p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">Form Layout Examples</h3>
        <div className="space-y-8">
          <div>
            <h4 className="font-medium text-gray-900 mb-4">Inline Form</h4>
            <div className="flex flex-wrap items-end gap-4">
              <div className="flex-1 min-w-48">
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input type="email" className="input" placeholder="Enter email" />
              </div>
              <div className="flex-1 min-w-32">
                <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                <select className="input">
                  <option>Admin</option>
                  <option>User</option>
                </select>
              </div>
              <button className="btn btn-primary">Add User</button>
            </div>
          </div>

          <div>
            <h4 className="font-medium text-gray-900 mb-4">Stacked Form</h4>
            <div className="max-w-md space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Brewery Name</label>
                <input type="text" className="input" placeholder="Your brewery name" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                <input type="text" className="input" placeholder="City, State" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Website</label>
                <input type="url" className="input" placeholder="https://yourbrewery.com" />
              </div>
              <div className="flex gap-2">
                <button className="btn btn-outline flex-1">Cancel</button>
                <button className="btn btn-primary flex-1">Save</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Input Groups */}
      <div className="card p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">Input Groups</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Website URL</label>
            <div className="flex">
              <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                https://
              </span>
              <input
                type="text"
                className="flex-1 input rounded-l-none"
                placeholder="yourbrewery.com"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Price</label>
            <div className="flex">
              <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                $
              </span>
              <input
                type="number"
                className="flex-1 input rounded-none"
                placeholder="0.00"
              />
              <span className="inline-flex items-center px-3 rounded-r-md border border-l-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                USD
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Forms