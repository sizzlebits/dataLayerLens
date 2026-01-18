/**
 * SearchInput - Reusable search input with icon.
 */

import { Search, X } from 'lucide-react';

export interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
}

export function SearchInput({
  value,
  onChange,
  placeholder = 'Search...',
  autoFocus = false,
}: SearchInputProps) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className="w-full bg-dl-dark border border-dl-border rounded-lg pl-10 pr-8 py-2 text-sm text-white placeholder:text-slate-500 focus:border-dl-primary focus:outline-none"
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </div>
  );
}
