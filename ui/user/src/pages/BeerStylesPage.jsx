import React, { useState, useEffect } from 'react'
import {
  MagnifyingGlassIcon,
  BeakerIcon,
  TagIcon,
  ExclamationTriangleIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  AdjustmentsHorizontalIcon,
  EyeIcon,
  ClockIcon,
  GlobeAmericasIcon,
  SparklesIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline'
import DashboardLayout from '../components/DashboardLayout'
import api from '../utils/api'

export default function BeerStylesPage() {
  const [styles, setStyles] = useState([])
  const [categories, setCategories] = useState([])
  const [tags, setTags] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedStyle, setSelectedStyle] = useState(null)
  const [showStyleDetails, setShowStyleDetails] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedTagCategory, setSelectedTagCategory] = useState('')
  const [abvRange, setAbvRange] = useState([0, 15])
  const [ibuRange, setIbuRange] = useState([0, 150])
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [stylesRes, categoriesRes, tagsRes] = await Promise.all([
        api.get('/recipes/styles/detailed'),
        api.get('/recipes/styles/categories'),
        api.get('/recipes/styles/tags')
      ])

      if (stylesRes.data.success) setStyles(stylesRes.data.data)
      if (categoriesRes.data.success) setCategories(categoriesRes.data.data)
      if (tagsRes.data.success) setTags(tagsRes.data.data)
    } catch (err) {
      setError('Failed to load beer styles data')
      console.error('Error loading data:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadStyleDetails = async (styleId) => {
    try {
      const response = await api.get(`/recipes/styles/${styleId}/full`)
      if (response.data.success) {
        setSelectedStyle(response.data.data)
        setShowStyleDetails(true)
      }
    } catch (err) {
      console.error('Error loading style details:', err)
    }
  }

  const filteredStyles = styles.filter(style => {
    // Search filter
    if (searchTerm && !style.styleName.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !style.bjcpNumber?.toLowerCase().includes(searchTerm.toLowerCase()) &&
        !style.description?.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false
    }

    // Category filter
    if (selectedCategory && style.category !== selectedCategory) {
      return false
    }

    // ABV filter
    if (style.abvMin !== null && style.abvMax !== null) {
      if (style.abvMax < abvRange[0] || style.abvMin > abvRange[1]) {
        return false
      }
    }

    // IBU filter
    if (style.ibuMin !== null && style.ibuMax !== null) {
      if (style.ibuMax < ibuRange[0] || style.ibuMin > ibuRange[1]) {
        return false
      }
    }

    return true
  })

  const groupedStyles = filteredStyles.reduce((acc, style) => {
    const category = style.category
    if (!acc[category]) {
      acc[category] = []
    }
    acc[category].push(style)
    return acc
  }, {})

  const getSRMColor = (srm) => {
    if (!srm) return '#FFD700'

    // SRM to approximate RGB mapping
    const srmColors = {
      1: '#FFE699', 2: '#FFD878', 3: '#FFCA5A', 4: '#FFBF42', 5: '#FBB123',
      6: '#F8A600', 7: '#F39C00', 8: '#EA8F00', 9: '#E58500', 10: '#DE7C00',
      11: '#D77200', 12: '#CF6900', 13: '#CB6200', 14: '#C35900', 15: '#BB5100',
      16: '#B54C00', 17: '#B04500', 18: '#A63E00', 19: '#A13700', 20: '#9B3200',
      25: '#8D2500', 30: '#7C1A00', 35: '#6B1300', 40: '#5D0E00'
    }

    if (srm <= 40) return srmColors[Math.round(srm)] || srmColors[40]
    return srmColors[40]
  }

  const tagCategories = tags.reduce((acc, tag) => {
    if (!acc[tag.category]) acc[tag.category] = []
    acc[tag.category].push(tag)
    return acc
  }, {})

  if (loading) {
    return (
      <DashboardLayout
        title="Beer Styles"
        subtitle="BJCP Beer Style Guide"
        currentPage="Beer Styles"
      >
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout
      title="Beer Styles"
      subtitle="BJCP Beer Style Guide - Explore characteristics, examples, and brewing guidelines"
      currentPage="Beer Styles"
    >
      <div className="space-y-6">
        {/* Header Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <BeakerIcon className="h-6 w-6 text-amber-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Total Styles</dt>
                    <dd className="text-lg font-medium text-gray-900">{styles.length}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <TagIcon className="h-6 w-6 text-blue-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Categories</dt>
                    <dd className="text-lg font-medium text-gray-900">{Object.keys(groupedStyles).length}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <SparklesIcon className="h-6 w-6 text-green-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">Style Tags</dt>
                    <dd className="text-lg font-medium text-gray-900">{tags.length}</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <DocumentTextIcon className="h-6 w-6 text-purple-400" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">BJCP 2021</dt>
                    <dd className="text-lg font-medium text-gray-900">Latest</dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="space-y-4">
            {/* Search Bar */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Search beer styles by name, BJCP number, or description..."
              />
            </div>

            {/* Filter Toggle */}
            <div className="flex items-center justify-between">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <AdjustmentsHorizontalIcon className="-ml-0.5 mr-2 h-4 w-4" />
                Filters
                {showFilters ?
                  <ChevronDownIcon className="ml-2 h-4 w-4" /> :
                  <ChevronRightIcon className="ml-2 h-4 w-4" />
                }
              </button>

              {filteredStyles.length !== styles.length && (
                <span className="text-sm text-gray-500">
                  Showing {filteredStyles.length} of {styles.length} styles
                </span>
              )}
            </div>

            {/* Filters */}
            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4 border-t">
                {/* Category Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 rounded-md"
                  >
                    <option value="">All Categories</option>
                    {Object.keys(groupedStyles).sort().map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>

                {/* ABV Range */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ABV Range: {abvRange[0]}% - {abvRange[1]}%
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="range"
                      min="0"
                      max="15"
                      step="0.5"
                      value={abvRange[0]}
                      onChange={(e) => setAbvRange([parseFloat(e.target.value), abvRange[1]])}
                      className="flex-1"
                    />
                    <input
                      type="range"
                      min="0"
                      max="15"
                      step="0.5"
                      value={abvRange[1]}
                      onChange={(e) => setAbvRange([abvRange[0], parseFloat(e.target.value)])}
                      className="flex-1"
                    />
                  </div>
                </div>

                {/* IBU Range */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    IBU Range: {ibuRange[0]} - {ibuRange[1]}
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="range"
                      min="0"
                      max="150"
                      step="5"
                      value={ibuRange[0]}
                      onChange={(e) => setIbuRange([parseInt(e.target.value), ibuRange[1]])}
                      className="flex-1"
                    />
                    <input
                      type="range"
                      min="0"
                      max="150"
                      step="5"
                      value={ibuRange[1]}
                      onChange={(e) => setIbuRange([ibuRange[0], parseInt(e.target.value)])}
                      className="flex-1"
                    />
                  </div>
                </div>

                {/* Clear Filters */}
                <div className="flex items-end">
                  <button
                    onClick={() => {
                      setSearchTerm('')
                      setSelectedCategory('')
                      setAbvRange([0, 15])
                      setIbuRange([0, 150])
                    }}
                    className="w-full px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Clear All
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Styles List by Category */}
        <div className="space-y-6">
          {Object.entries(groupedStyles).sort().map(([category, categoryStyles]) => (
            <div key={category} className="bg-white shadow rounded-lg overflow-hidden">
              <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">{category}</h3>
                <p className="text-sm text-gray-500">{categoryStyles.length} styles</p>
              </div>

              <div className="divide-y divide-gray-200">
                {categoryStyles.map((style) => (
                  <div key={style.styleId} className="p-6 hover:bg-gray-50 transition-colors duration-150">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        {/* Style Header */}
                        <div className="flex items-center space-x-3 mb-3">
                          <div className="flex-shrink-0">
                            <div
                              className="w-8 h-8 rounded-full border-2 border-gray-300"
                              style={{ backgroundColor: getSRMColor(style.srmMin) }}
                              title={`SRM: ${style.srmMin || 'N/A'} - ${style.srmMax || 'N/A'}`}
                            />
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <h4 className="text-lg font-semibold text-gray-900">{style.styleName}</h4>
                              {style.bjcpNumber && (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                  {style.bjcpNumber}
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-500">{style.category}</p>
                          </div>
                        </div>

                        {/* Description */}
                        {style.description && (
                          <p className="text-sm text-gray-600 mb-4 line-clamp-3">{style.description}</p>
                        )}

                        {/* Style Stats */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <span className="font-medium text-gray-700">ABV:</span>
                            <span className="ml-1 text-gray-600">
                              {style.abvMin || 'N/A'}% - {style.abvMax || 'N/A'}%
                            </span>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">IBU:</span>
                            <span className="ml-1 text-gray-600">
                              {style.ibuMin || 'N/A'} - {style.ibuMax || 'N/A'}
                            </span>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">SRM:</span>
                            <span className="ml-1 text-gray-600">
                              {style.srmMin || 'N/A'} - {style.srmMax || 'N/A'}
                            </span>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">OG:</span>
                            <span className="ml-1 text-gray-600">
                              {style.ogMin || 'N/A'} - {style.ogMax || 'N/A'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* View Details Button */}
                      <div className="ml-6 flex-shrink-0">
                        <button
                          onClick={() => loadStyleDetails(style.styleId)}
                          className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          <EyeIcon className="-ml-0.5 mr-2 h-4 w-4" />
                          Details
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <div className="flex">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-2 text-sm text-red-700">{error}</div>
              </div>
            </div>
          </div>
        )}

        {/* Style Details Modal */}
        {showStyleDetails && selectedStyle && (
          <StyleDetailsModal
            style={selectedStyle}
            onClose={() => setShowStyleDetails(false)}
          />
        )}
      </div>
    </DashboardLayout>
  )
}

function StyleDetailsModal({ style, onClose }) {
  const { style: styleData, characteristics, commercialExamples, tags } = style

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>

        <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full sm:p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{styleData.styleName}</h2>
              <div className="flex items-center space-x-2 mt-1">
                {styleData.bjcpNumber && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {styleData.bjcpNumber}
                  </span>
                )}
                <span className="text-sm text-gray-500">{styleData.categoryName}</span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
            >
              Close
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Description */}
              {styleData.description && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Overall Impression</h3>
                  <p className="text-gray-700">{styleData.description}</p>
                </div>
              )}

              {/* Characteristics */}
              {characteristics && characteristics.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Characteristics</h3>
                  <div className="space-y-4">
                    {characteristics.map((char, index) => (
                      <div key={index} className="border-l-4 border-blue-200 pl-4">
                        <h4 className="font-medium text-gray-900 capitalize">{char.characteristicType}</h4>
                        <p className="text-sm text-gray-600 mt-1">{char.description}</p>
                        {char.keywords && char.keywords.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {char.keywords.slice(0, 5).map((keyword, kidx) => (
                              <span key={kidx} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                                {keyword}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* History */}
              {styleData.history && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">History</h3>
                  <p className="text-gray-700">{styleData.history}</p>
                </div>
              )}

              {/* Ingredients */}
              {styleData.characteristicIngredients && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Characteristic Ingredients</h3>
                  <p className="text-gray-700">{styleData.characteristicIngredients}</p>
                </div>
              )}

              {/* Style Comparison */}
              {styleData.styleComparison && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Style Comparison</h3>
                  <p className="text-gray-700">{styleData.styleComparison}</p>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Style Guidelines */}
              <div className="rounded-lg p-4 bg-gray-50">
                <div className="">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Style Guidelines
                  </h3>
                </div>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="font-medium">ABV:</span>
                    <span>{styleData.abvMin}% - {styleData.abvMax}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">IBU:</span>
                    <span>{styleData.ibuMin} - {styleData.ibuMax}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">SRM:</span>
                    <span>{styleData.srmMin} - {styleData.srmMax}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">OG:</span>
                    <span>{styleData.ogMin} - {styleData.ogMax}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">FG:</span>
                    <span>{styleData.fgMin} - {styleData.fgMax}</span>
                  </div>
                </div>
              </div>

              {/* Tags */}
              {tags && tags.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Style Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                        style={{
                          backgroundColor: tag.color ? `${tag.color}20` : '#f3f4f6',
                          color: tag.color || '#374151',
                          borderColor: tag.color || '#d1d5db'
                        }}
                      >
                        {tag.tagName}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Commercial Examples */}
              {commercialExamples && commercialExamples.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Commercial Examples</h3>
                  <div className="space-y-2">
                    {commercialExamples.map((example, index) => (
                      <div key={index} className="text-sm">
                        <div className="font-medium text-gray-900">{example.beerName}</div>
                        {example.breweryName && (
                          <div className="texs-xs text-gray-400">{example.breweryName}</div>
                        )}
                        {example.country && (
                          <div className="text-gray-500 text-xs">{example.country}</div>
                        )}
                      </div>
                    ))}
                    {commercialExamples.length > 8 && (
                      <div className="text-xs text-gray-500 mt-2">
                        +{commercialExamples.length - 8} more examples
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}