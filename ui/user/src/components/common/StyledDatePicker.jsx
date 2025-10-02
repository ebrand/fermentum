import React, { useState } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { CalendarIcon } from '@heroicons/react/24/outline';

/**
 * StyledDatePicker - A styled date picker component using react-datepicker
 * Matches the visual style of StyledCombobox with consistent Tailwind patterns
 */
const StyledDatePicker = ({
  label,
  value,
  onChange,
  placeholder = 'Select date...',
  error,
  disabled = false,
  required = false,
  dateFormat = 'MM/dd/yyyy',
  showYearDropdown = true,
  showMonthDropdown = true,
  minDate = null,
  maxDate = null,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  // Convert string date to Date object if needed
  const selectedDate = value ? (typeof value === 'string' ? new Date(value) : value) : null;

  const handleChange = (date) => {
    if (onChange) {
      // Convert Date to ISO string for compatibility with backend
      onChange(date ? date.toISOString().split('T')[0] : null);
    }
  };

  return (
    <div className="relative">
      {label && (
        <label className={`block text-sm font-medium mb-2 ${error ? 'text-red-700' : 'text-gray-700'}`}>
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <div className="relative">
        <DatePicker
          selected={selectedDate}
          onChange={handleChange}
          onCalendarOpen={() => setIsOpen(true)}
          onCalendarClose={() => setIsOpen(false)}
          dateFormat={dateFormat}
          placeholderText={placeholder}
          disabled={disabled}
          showYearDropdown={showYearDropdown}
          showMonthDropdown={showMonthDropdown}
          dropdownMode="select"
          minDate={minDate}
          maxDate={maxDate}
          className={`
            w-full px-4 py-2.5 pr-10 rounded-lg shadow-sm
            bg-white border transition-colors
            ${error
              ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
              : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
            }
            ${disabled
              ? 'bg-gray-50 text-gray-500 cursor-not-allowed'
              : 'text-gray-900'
            }
            placeholder:text-gray-400
            focus:ring-2
            disabled:bg-gray-50 disabled:text-gray-500
          `}
          wrapperClassName="w-full"
          calendarClassName="styled-datepicker-calendar"
        />

        {/* Calendar Icon */}
        <div className={`absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none ${disabled ? 'text-gray-400' : 'text-gray-500'}`}>
          <CalendarIcon className="h-5 w-5" aria-hidden="true" />
        </div>
      </div>

      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}

      {/* Custom Styles for react-datepicker */}
      <style jsx global>{`
        .styled-datepicker-calendar {
          font-family: inherit;
          border: 1px solid #e5e7eb;
          border-radius: 0.5rem;
          box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
        }

        .react-datepicker__header {
          background-color: #f9fafb;
          border-bottom: 1px solid #e5e7eb;
          border-top-left-radius: 0.5rem;
          border-top-right-radius: 0.5rem;
          padding-top: 0.75rem;
        }

        .react-datepicker__current-month {
          font-weight: 600;
          color: #111827;
          font-size: 0.875rem;
        }

        .react-datepicker__day-name {
          color: #6b7280;
          font-size: 0.75rem;
          font-weight: 500;
          width: 2.5rem;
          line-height: 2.5rem;
        }

        .react-datepicker__day {
          width: 2.5rem;
          line-height: 2.5rem;
          font-size: 0.875rem;
          color: #111827;
          border-radius: 0.375rem;
          transition: all 0.15s ease-in-out;
        }

        .react-datepicker__day:hover {
          background-color: #dbeafe;
          color: #1e40af;
        }

        .react-datepicker__day--selected,
        .react-datepicker__day--keyboard-selected {
          background-color: #3b82f6;
          color: white;
          font-weight: 500;
        }

        .react-datepicker__day--selected:hover,
        .react-datepicker__day--keyboard-selected:hover {
          background-color: #2563eb;
        }

        .react-datepicker__day--today {
          font-weight: 600;
          color: #3b82f6;
          background-color: #eff6ff;
        }

        .react-datepicker__day--disabled {
          color: #d1d5db;
          cursor: not-allowed;
        }

        .react-datepicker__day--disabled:hover {
          background-color: transparent;
          color: #d1d5db;
        }

        .react-datepicker__day--outside-month {
          color: #9ca3af;
        }

        .react-datepicker__month {
          margin: 0.5rem;
        }

        .react-datepicker__navigation {
          top: 0.75rem;
        }

        .react-datepicker__navigation-icon::before {
          border-color: #6b7280;
          border-width: 2px 2px 0 0;
          height: 7px;
          width: 7px;
        }

        .react-datepicker__navigation:hover .react-datepicker__navigation-icon::before {
          border-color: #111827;
        }

        .react-datepicker__year-dropdown,
        .react-datepicker__month-dropdown {
          background-color: white;
          border: 1px solid #e5e7eb;
          border-radius: 0.375rem;
          box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
        }

        .react-datepicker__year-option,
        .react-datepicker__month-option {
          padding: 0.375rem 0.75rem;
          transition: background-color 0.15s ease-in-out;
        }

        .react-datepicker__year-option:hover,
        .react-datepicker__month-option:hover {
          background-color: #dbeafe;
          color: #1e40af;
        }

        .react-datepicker__year-option--selected,
        .react-datepicker__month-option--selected {
          background-color: #3b82f6;
          color: white;
        }

        .react-datepicker__year-dropdown-container--select,
        .react-datepicker__month-dropdown-container--select {
          margin: 0 0.25rem;
        }

        .react-datepicker__year-select,
        .react-datepicker__month-select {
          padding: 0.25rem 0.5rem;
          border: 1px solid #d1d5db;
          border-radius: 0.375rem;
          font-size: 0.875rem;
          color: #111827;
          background-color: white;
        }

        .react-datepicker__year-select:focus,
        .react-datepicker__month-select:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.3);
        }

        .react-datepicker__triangle {
          display: none;
        }
      `}</style>
    </div>
  );
};

export default StyledDatePicker;
