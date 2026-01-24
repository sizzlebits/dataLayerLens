/**
 * FilterPanel - Component for managing event filters.
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Filter, Search } from 'lucide-react';

// Common event names for suggestions
const COMMON_EVENTS = [
  'gtm.js', 'gtm.dom', 'gtm.load', 'gtm.click', 'gtm.linkClick', 'gtm.formSubmit',
  'gtm.historyChange', 'gtm.scrollDepth', 'gtm.timer', 'gtm.video',
  'page_view', 'view_item', 'view_item_list', 'select_item', 'add_to_cart',
  'remove_from_cart', 'begin_checkout', 'add_payment_info', 'add_shipping_info',
  'purchase', 'refund', 'sign_up', 'login', 'search', 'view_promotion',
  'select_promotion', 'virtualPageView', 'custom_event',
];

export interface FilterPanelProps {
  filters: string[];
  filterMode: 'include' | 'exclude';
  onAddFilter: (filter: string) => void;
  onRemoveFilter: (filter: string) => void;
  onClearFilters?: () => void;
  onSetFilterMode: (mode: 'include' | 'exclude') => void;
}

export function FilterPanel({
  filters,
  filterMode,
  onAddFilter,
  onRemoveFilter,
  onClearFilters,
  onSetFilterMode,
}: FilterPanelProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [searchValue, setSearchValue] = useState('');

  const handleAddFilter = (value: string) => {
    if (value.trim() && !filters.includes(value.trim())) {
      onAddFilter(value.trim());
    }
    setSearchValue('');
    setIsAdding(false);
  };

  const filteredSuggestions = COMMON_EVENTS.filter(
    (event) =>
      event.toLowerCase().includes(searchValue.toLowerCase()) &&
      !filters.includes(event)
  ).slice(0, 5);

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-lg p-3 border ${
        filters.length > 0
          ? filterMode === 'exclude'
            ? 'bg-dl-error/10 border-dl-error/30'
            : 'bg-dl-success/10 border-dl-success/30'
          : 'bg-dl-card border-dl-border'
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-theme-text-secondary" />
          <span className="text-sm font-medium text-theme-text">Active Filters</span>
        </div>

        {/* Filter mode toggle and clear */}
        <div className="flex items-center gap-1 text-xs">
          <button
            onClick={() => onSetFilterMode('exclude')}
            className={`px-2 py-1 rounded transition-colors ${
              filterMode === 'exclude'
                ? 'bg-dl-error/20 text-dl-error'
                : 'text-theme-text-secondary hover:text-theme-text'
            }`}
          >
            Exclude
          </button>
          <button
            onClick={() => onSetFilterMode('include')}
            className={`px-2 py-1 rounded transition-colors ${
              filterMode === 'include'
                ? 'bg-dl-success/20 text-dl-success'
                : 'text-theme-text-secondary hover:text-theme-text'
            }`}
          >
            Include
          </button>
          {filters.length > 0 && onClearFilters && (
            <button
              onClick={onClearFilters}
              className="px-2 py-1 rounded text-theme-text-secondary hover:text-theme-text hover:bg-theme-bg-hover transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Active filters */}
      {filters.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-2">
          <AnimatePresence>
            {filters.map((filter) => (
              <motion.span
                key={filter}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full ${
                  filterMode === 'exclude'
                    ? 'bg-dl-error/20 text-dl-error'
                    : 'bg-dl-success/20 text-dl-success'
                }`}
              >
                {filterMode === 'exclude' ? '-' : '+'} {filter}
                <button
                  onClick={() => onRemoveFilter(filter)}
                  className="hover:opacity-70"
                >
                  <X className="w-3 h-3" />
                </button>
              </motion.span>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Add filter UI */}
      <AnimatePresence mode="wait">
        {isAdding ? (
          <motion.div
            key="adding"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2"
          >
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-text-tertiary" />
              <input
                type="text"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && searchValue.trim()) {
                    handleAddFilter(searchValue);
                  } else if (e.key === 'Escape') {
                    setIsAdding(false);
                    setSearchValue('');
                  }
                }}
                placeholder="Type event name..."
                className="w-full bg-dl-dark border border-dl-border rounded-lg pl-10 pr-8 py-2 text-sm text-theme-text placeholder:text-theme-text-tertiary focus:border-dl-primary focus:outline-none"
                autoFocus
              />
              <button
                onClick={() => {
                  setIsAdding(false);
                  setSearchValue('');
                }}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-theme-text-secondary hover:text-theme-text"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {filteredSuggestions.length > 0 && (
              <div className="bg-dl-dark border border-dl-border rounded-lg overflow-hidden">
                {filteredSuggestions.map((event) => (
                  <button
                    key={event}
                    onClick={() => handleAddFilter(event)}
                    className="w-full flex items-center justify-between px-3 py-2 text-sm text-theme-text-secondary hover:bg-dl-border hover:text-theme-text transition-colors"
                  >
                    <span>{event}</span>
                    <Plus className="w-4 h-4 text-dl-primary" />
                  </button>
                ))}
              </div>
            )}

            {searchValue && !filteredSuggestions.some((e) => e === searchValue) && (
              <button
                onClick={() => handleAddFilter(searchValue)}
                className="w-full flex items-center justify-center gap-2 py-2 text-sm text-dl-primary hover:text-dl-accent transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add "{searchValue}"
              </button>
            )}
          </motion.div>
        ) : (
          <motion.button
            key="add-btn"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsAdding(true)}
            className="w-full flex items-center justify-center gap-2 py-2 text-sm text-theme-text-secondary hover:text-dl-primary transition-colors border border-dashed border-dl-border hover:border-dl-primary rounded-lg"
          >
            <Plus className="w-4 h-4" />
            Add Filter
          </motion.button>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
