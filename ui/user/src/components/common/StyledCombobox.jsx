import React, { useState, useRef, useEffect } from 'react'
import { ChevronDownIcon } from '@heroicons/react/20/solid'

export default function StyledCombobox({
  label,
  options = [],
  value,
  onChange,
  placeholder = "Search...",
  displayValue = (item) => item?.name || '',
  filterFunction = (items, query) => {
    return query === ''
      ? items
      : items.filter((item) =>
          item.name.toLowerCase().includes(query.toLowerCase())
        )
  },
  allowCustomValue = false,
  disabled = false,
  error = null,
  className = "",
  ...props
}) {
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const inputRef = useRef(null)
  const listRef = useRef(null)

  const filteredOptions = filterFunction(options, query)

  const handleInputChange = (event) => {
    const newQuery = event.target.value
    setQuery(newQuery)
    setIsOpen(true)
  }

  const handleOptionSelect = (option) => {
    setQuery('')
    setIsOpen(false)
    onChange(option)
    inputRef.current?.blur()
  }

  const handleKeyDown = (event) => {
    if (event.key === 'Escape') {
      setIsOpen(false)
      inputRef.current?.blur()
    } else if (event.key === 'ArrowDown') {
      event.preventDefault()
      setIsOpen(true)
    }
  }

  const handleInputBlur = () => {
    // Delay closing to allow option clicks to register
    setTimeout(() => {
      setQuery('')
      setIsOpen(false)
    }, 200)
  }

  const handleButtonClick = () => {
    if (disabled) return
    setIsOpen(!isOpen)
    if (!isOpen) {
      inputRef.current?.focus()
    }
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (listRef.current && !listRef.current.contains(event.target) &&
          inputRef.current && !inputRef.current.contains(event.target)) {
        setIsOpen(false)
        setQuery('')
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  return (
    <div className={className} {...props}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          className={`
            block w-full rounded-md py-2 pr-10 pl-3 text-sm
            bg-white border
            ${error
              ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
              : 'border-gray-300 focus:border-fermentum-500 focus:ring-fermentum-500'
            }
            ${disabled
              ? 'bg-gray-50 text-gray-500 cursor-not-allowed'
              : 'text-gray-900'
            }
            placeholder:text-gray-400
            focus:ring-2 focus:ring-offset-0
            disabled:bg-gray-50 disabled:text-gray-500
          `}
          value={isOpen ? query : displayValue(value)}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          role="combobox"
          aria-expanded={isOpen}
          aria-autocomplete="list"
        />
        <button
          type="button"
          className={`
            absolute inset-y-0 right-0 flex items-center pr-3
            ${disabled ? 'cursor-not-allowed' : 'cursor-pointer'}
          `}
          onClick={handleButtonClick}
          disabled={disabled}
          tabIndex={-1}
        >
          <ChevronDownIcon
            className={`h-5 w-5 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
            aria-hidden="true"
          />
        </button>

        {isOpen && (
          <div
            ref={listRef}
            className="
              absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md
              bg-white py-1 text-sm shadow-lg ring-1 ring-black ring-opacity-5
              transition duration-100 ease-in
            "
            role="listbox"
          >
            {/* Allow custom value creation */}
            {allowCustomValue && query.length > 0 && !filteredOptions.find(option =>
              option.name.toLowerCase() === query.toLowerCase()
            ) && (
              <button
                type="button"
                className="cursor-pointer select-none relative py-2 pl-3 pr-9 text-gray-900 hover:bg-fermentum-100 hover:text-fermentum-900 w-full text-left"
                onClick={() => handleOptionSelect({ id: null, name: query })}
                role="option"
              >
                <span className="block truncate">
                  Create "{query}"
                </span>
              </button>
            )}

            {/* Regular options */}
            {filteredOptions.length === 0 && query !== '' && !allowCustomValue ? (
              <div className="relative cursor-default select-none py-2 px-3 text-gray-700">
                No results found.
              </div>
            ) : (
              filteredOptions.map((option) => {
                const isSelected = value && (
                  (value.id && option.id && value.id === option.id) ||
                  (value.name && option.name && value.name === option.name)
                )

                return (
                  <button
                    key={option.id || option.name}
                    type="button"
                    className={`cursor-pointer select-none relative py-2 pl-3 pr-9 w-full text-left ${
                      isSelected
                        ? 'bg-fermentum-800 text-white'
                        : 'text-gray-900 hover:bg-fermentum-100 hover:text-fermentum-900'
                    }`}
                    onClick={() => handleOptionSelect(option)}
                    role="option"
                    aria-selected={isSelected}
                  >
                    <span className={`block truncate ${isSelected ? 'font-semibold' : 'font-normal'}`}>
                      {option.name}
                    </span>
                    {/* Optional: Show checkmark for selected item */}
                    {isSelected && (
                      <span className="absolute inset-y-0 right-0 flex items-center pr-3">
                        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </span>
                    )}
                  </button>
                )
              })
            )}
          </div>
        )}
      </div>

      {/* Error message */}
      {error && (
        <p className="mt-2 text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  )
}