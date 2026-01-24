/**
 * SearchInput - Reusable search input with icon.
 */

import { Search, X } from 'lucide-react';
import { forwardRef } from 'react';

export interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
  className?: string;
  id?: string;
  'aria-label'?: string;
}

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  function SearchInput(
    {
      value,
      onChange,
      placeholder = 'Search...',
      autoFocus = false,
      className = '',
      id,
      'aria-label': ariaLabel,
    },
    ref
  ) {
    return (
      <div className={`relative ${className}`}>
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-text-tertiary"
          aria-hidden="true"
        />
        <input
          ref={ref}
          id={id}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoFocus={autoFocus}
          aria-label={ariaLabel || placeholder}
          className="w-full bg-dl-dark border border-dl-border rounded-lg pl-10 pr-8 py-2 text-sm text-theme-text placeholder:text-theme-text-tertiary focus:border-dl-primary focus:outline-none"
        />
        {value && (
          <button
            onClick={() => onChange('')}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-theme-text-secondary hover:text-theme-text"
            aria-label="Clear search"
            type="button"
          >
            <X className="w-3 h-3" aria-hidden="true" />
          </button>
        )}
      </div>
    );
  }
);
